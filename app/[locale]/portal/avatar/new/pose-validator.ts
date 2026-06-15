import { PoseLandmarker, FilesetResolver, NormalizedLandmark } from "@mediapipe/tasks-vision";

let poseLandmarker: PoseLandmarker | null = null;

export async function initPoseLandmarker() {
  if (poseLandmarker) return poseLandmarker;

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );
  
  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: "/models/pose_landmarker_lite.task",
      delegate: "GPU"
    },
    runningMode: "IMAGE",
    numPoses: 1
  });

  return poseLandmarker;
}

// Function to calculate angle between 3 points
function calculateAngle(a: NormalizedLandmark, b: NormalizedLandmark, c: NormalizedLandmark) {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs(radians * 180.0 / Math.PI);
  if (angle > 180.0) {
    angle = 360 - angle;
  }
  return angle;
}

export type PoseValidationResult = {
  isValid: boolean;
  errorKey?: string;
};

export async function validatePose(imageElement: HTMLImageElement, type: "front" | "side"): Promise<PoseValidationResult> {
  try {
    const landmarker = await initPoseLandmarker();
    const results = landmarker.detect(imageElement);

    if (!results.landmarks || results.landmarks.length === 0) {
      return { isValid: false, errorKey: "poseNoBody" };
    }

    const landmarks = results.landmarks[0]; // First detected person

    // Indices for Pose Landmarker
    // 11, 12: left/right shoulder
    // 13, 14: left/right elbow
    // 15, 16: left/right wrist
    // 23, 24: left/right hip
    // 25, 26: left/right knee
    // 27, 28: left/right ankle

    if (type === "front") {
      // Check full body visibility (shoulders to ankles)
      const requiredPoints = [11, 12, 23, 24, 27, 28]; // shoulders, hips, ankles
      const missingPoints = requiredPoints.some(idx => !landmarks[idx] || (landmarks[idx].visibility || 0) < 0.5);
      
      if (missingPoints) {
        return { isValid: false, errorKey: "poseMissingParts" };
      }

      // Check A-Pose (Arms separated ~15-50 degrees)
      const leftShoulder = landmarks[11];
      const leftElbow = landmarks[13];
      const leftHip = landmarks[23];
      
      const rightShoulder = landmarks[12];
      const rightElbow = landmarks[14];
      const rightHip = landmarks[24];

      const leftArmAngle = calculateAngle(leftHip, leftShoulder, leftElbow);
      const rightArmAngle = calculateAngle(rightHip, rightShoulder, rightElbow);

      if (leftArmAngle < 15 || rightArmAngle < 15) {
        return { isValid: false, errorKey: "poseArmsTooClose" };
      }
      if (leftArmAngle > 55 || rightArmAngle > 55) {
        return { isValid: false, errorKey: "poseArmsTooHigh" };
      }

      // Check feet width (roughly shoulder width apart)
      const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
      const ankleWidth = Math.abs(landmarks[27].x - landmarks[28].x);
      
      if (ankleWidth < shoulderWidth * 0.3) {
        return { isValid: false, errorKey: "poseFeetTooClose" };
      }

      return { isValid: true };
    } else if (type === "side") {
      // Side pose validation
      const leftShoulder = landmarks[11];
      const rightShoulder = landmarks[12];
      
      // Check if shoulders overlap on X axis (profile view)
      const shoulderDiffX = Math.abs(leftShoulder.x - rightShoulder.x);
      
      if (shoulderDiffX > 0.18) {
        return { isValid: false, errorKey: "poseNotProfile" };
      }

      // Check feet together
      const leftAnkle = landmarks[27];
      const rightAnkle = landmarks[28];
      
      if (leftAnkle && rightAnkle && (leftAnkle.visibility || 0) > 0.5 && (rightAnkle.visibility || 0) > 0.5) {
        const ankleDiffX = Math.abs(leftAnkle.x - rightAnkle.x);
        if (ankleDiffX > 0.15) {
          return { isValid: false, errorKey: "poseSideFeetApart" };
        }
      }

      return { isValid: true };
    }

    return { isValid: true };
  } catch (error) {
    console.error("Error running pose validation:", error);
    // If there's an internal error with ML, allow upload to not block user
    return { isValid: true };
  }
}
