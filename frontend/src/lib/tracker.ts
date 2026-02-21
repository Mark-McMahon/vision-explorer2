import type { Detection } from "../types/index";

export interface RawDetection {
  label: string;
  confidence: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

type TrackState = {
  label: string;
  confidence: number;
  x: number;
  y: number;
  w: number;
  h: number;
};

export class SimpleTracker {
  nextId: number = 1;
  activeTracks: Map<number, TrackState> = new Map();

  update(detections: RawDetection[]): Detection[] {
    const result: Detection[] = [];
    const matchedTrackIds = new Set<number>();

    for (const det of detections) {
      let bestTrackId: number | null = null;
      let bestIoU = 0;

      for (const [trackId, track] of this.activeTracks) {
        if (track.label !== det.label) continue;
        const score = this.iou(det, track);
        if (score > 0.5 && score > bestIoU) {
          bestIoU = score;
          bestTrackId = trackId;
        }
      }

      if (bestTrackId !== null) {
        matchedTrackIds.add(bestTrackId);
        this.activeTracks.set(bestTrackId, {
          label: det.label,
          confidence: det.confidence,
          x: det.x,
          y: det.y,
          w: det.w,
          h: det.h,
        });
        result.push({ ...det, trackId: bestTrackId });
      } else {
        const newId = this.nextId++;
        matchedTrackIds.add(newId);
        this.activeTracks.set(newId, {
          label: det.label,
          confidence: det.confidence,
          x: det.x,
          y: det.y,
          w: det.w,
          h: det.h,
        });
        result.push({ ...det, trackId: newId });
      }
    }

    // Remove stale tracks not matched in this frame
    for (const trackId of this.activeTracks.keys()) {
      if (!matchedTrackIds.has(trackId)) {
        this.activeTracks.delete(trackId);
      }
    }

    return result;
  }

  iou(
    a: { x: number; y: number; w: number; h: number },
    b: { x: number; y: number; w: number; h: number }
  ): number {
    const ax2 = a.x + a.w;
    const ay2 = a.y + a.h;
    const bx2 = b.x + b.w;
    const by2 = b.y + b.h;

    const interX1 = Math.max(a.x, b.x);
    const interY1 = Math.max(a.y, b.y);
    const interX2 = Math.min(ax2, bx2);
    const interY2 = Math.min(ay2, by2);

    if (interX2 <= interX1 || interY2 <= interY1) return 0;

    const interArea = (interX2 - interX1) * (interY2 - interY1);
    const aArea = a.w * a.h;
    const bArea = b.w * b.h;
    const unionArea = aArea + bArea - interArea;

    return unionArea <= 0 ? 0 : interArea / unionArea;
  }
}
