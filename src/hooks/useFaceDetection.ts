import { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

interface UseFaceApiDetectionProps {
  videoElement: HTMLVideoElement | null;
  isEnabled: boolean;
  onViolation: () => void;
}

export const useFaceDetection = ({
  videoElement,
  isEnabled,
  onViolation,
}: UseFaceApiDetectionProps) => {
  const [faceCount, setFaceCount] = useState(0);
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const baselineDescriptorRef = useRef<Float32Array | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load models once
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = "/models";
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        setIsModelsLoaded(true);
        console.log("Face-api.js models loaded successfully");
      } catch (error) {
        console.error("Failed to load face-api.js models:", error);
      }
    };

    loadModels();
  }, []);

  // Start periodic detection when enabled
  useEffect(() => {
    if (!videoElement || !isEnabled || !isModelsLoaded || !baselineDescriptorRef.current) {
      return;
    }

    const detectFaces = async () => {
      try {
        if (!videoElement || videoElement.readyState < 3) return;

        const detections = await faceapi
          .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptors();

        setFaceCount(detections.length);

        if (detections.length > 1) {
          onViolation();
        } else if (detections.length === 1 && baselineDescriptorRef.current) {
          const distance = faceapi.euclideanDistance(
            baselineDescriptorRef.current,
            detections[0].descriptor
          );

          console.log("Face distance:", distance);

          if (distance > 0.6) {
            console.warn("Different person detected!");
            onViolation();
          }
        }
      } catch (error) {
        console.error("Face detection error:", error);
      }
    };

    // Run detection every 3 seconds
    detectionIntervalRef.current = setInterval(detectFaces, 3000);

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current);
      }
    };
  }, [videoElement, isEnabled, isModelsLoaded, onViolation]);

  // Capture baseline face descriptor
  const captureBaseline = async (): Promise<number> => {
    if (!videoElement) {
      throw new Error("Video element not available");
    }

    if (!isModelsLoaded) {
      throw new Error("Face detection models not loaded yet");
    }

    // Wait for video to be ready
    if (videoElement.readyState < 3) {
      await new Promise((resolve) => {
        const checkReady = setInterval(() => {
          if (videoElement.readyState >= 3) {
            clearInterval(checkReady);
            resolve(true);
          }
        }, 100);
      });
    }

    try {
      const detection = await faceapi
        .detectSingleFace(videoElement, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        return 0; // No face detected
      }

      // Store baseline descriptor
      baselineDescriptorRef.current = detection.descriptor;
      console.log("Baseline face captured successfully");

      return 1; // One face detected
    } catch (error) {
      console.error("Baseline capture error:", error);
      throw new Error("Failed to capture baseline face");
    }
  };

  // Get current face count without baseline comparison
  const getCurrentFaceCount = async (): Promise<number> => {
    if (!videoElement || !isModelsLoaded) {
      return 0;
    }

    try {
      const detections = await faceapi.detectAllFaces(
        videoElement,
        new faceapi.TinyFaceDetectorOptions()
      );

      return detections.length;
    } catch (error) {
      console.error("Face count error:", error);
      return 0;
    }
  };

  return {
    faceCount,
    isModelsLoaded,
    captureBaseline,
    getCurrentFaceCount,
  };
};
