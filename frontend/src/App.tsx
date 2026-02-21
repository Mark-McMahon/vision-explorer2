import { useEffect, useState } from "react";
import { CameraFeed } from "./components/CameraFeed";
import { BoundingBoxCanvas } from "./components/BoundingBoxCanvas";
import OverlayLayer from "./components/OverlayLayer";
import { useCamera } from "./hooks/useCamera";
import { useYOLO } from "./hooks/useYOLO";
import { useTracking } from "./hooks/useTracking";
import { useStore } from "./store/useStore";

function App() {
  const { videoRef, stream, error, isReady } = useCamera();
  const { detections, isModelLoaded, error: yoloError } = useYOLO(videoRef);
  const trackedObjects = useTracking(detections);
  const setTrackedObjects = useStore((s) => s.setTrackedObjects);

  const [videoDims, setVideoDims] = useState({ width: 1280, height: 720 });

  // Sync tracked objects into Zustand store each frame
  useEffect(() => {
    setTrackedObjects(trackedObjects);
  }, [trackedObjects, setTrackedObjects]);

  // Capture video intrinsic dimensions when metadata loads
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    function handleMetadata() {
      if (video) {
        setVideoDims({ width: video.videoWidth, height: video.videoHeight });
      }
    }

    video.addEventListener("loadedmetadata", handleMetadata);
    return () => video.removeEventListener("loadedmetadata", handleMetadata);
  }, [videoRef, isReady]);

  return (
    <div className="w-screen h-screen bg-black overflow-hidden relative">
      {/* Layer 1: Camera feed */}
      <CameraFeed videoRef={videoRef} stream={stream} error={error} isReady={isReady} />

      {/* Layer 2: Bounding box canvas */}
      {isModelLoaded && (
        <BoundingBoxCanvas
          detections={detections}
          videoWidth={videoDims.width}
          videoHeight={videoDims.height}
        />
      )}

      {/* Layer 3: Overlay pills */}
      <OverlayLayer />

      {/* YOLO model error banner */}
      {yoloError && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-red-900/80 text-white text-xs font-mono px-4 py-2 text-center">
          {yoloError}
        </div>
      )}
    </div>
  );
}

export default App;
