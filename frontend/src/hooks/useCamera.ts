import { useEffect, useRef, useState } from "react";

interface UseCameraResult {
  videoRef: React.RefObject<HTMLVideoElement>;
  stream: MediaStream | null;
  error: string | null;
  isReady: boolean;
}

export function useCamera(): UseCameraResult {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    let mediaStream: MediaStream | null = null;

    async function startCamera() {
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          },
        });

        if (!mounted) {
          mediaStream.getTracks().forEach((t) => t.stop());
          return;
        }

        setStream(mediaStream);
        setError(null);
        setIsReady(true);
      } catch (err) {
        if (!mounted) return;
        if (
          err instanceof DOMException &&
          (err.name === "NotAllowedError" || err.name === "PermissionDeniedError")
        ) {
          setError(
            "Camera access required. Please allow camera in browser settings."
          );
        } else {
          setError("Unable to access camera. Please check your device.");
        }
        setIsReady(false);
      }
    }

    startCamera();

    return () => {
      mounted = false;
      if (mediaStream) {
        mediaStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return { videoRef, stream, error, isReady };
}
