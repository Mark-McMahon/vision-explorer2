import { useEffect } from "react";
import type { RefObject } from "react";

interface CameraFeedProps {
  videoRef: RefObject<HTMLVideoElement>;
  stream: MediaStream | null;
  error: string | null;
  isReady: boolean;
}

export function CameraFeed({ videoRef, stream, error, isReady }: CameraFeedProps) {
  useEffect(() => {
    if (videoRef.current && stream && isReady) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, isReady, videoRef]);

  if (error) {
    return (
      <div className="absolute inset-0 bg-black flex items-center justify-center z-10">
        <p className="text-white text-center px-8 text-sm font-mono">{error}</p>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className="absolute inset-0 w-full h-full object-cover z-10"
    />
  );
}
