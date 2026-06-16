import { PoseLandmarker, FilesetResolver, NormalizedLandmark } from "@mediapipe/tasks-vision";

const POSE_CONFIG = {
  visibilityThreshold: 0.3,
  armAngleMin: 15,
  armAngleMax: 55,
  shoulderProfileMaxDiff: 0.15,
  hipProfileMaxDiff: 0.15,
  frontalMinShoulderWidth: 0.1,
  ankleShoulderRatio: 0.25,
} as const;

let initPromise: Promise<PoseLandmarker> | null = null;

async function _initPoseLandmarker() {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
  );
  
  try {
    return await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task",
        delegate: "GPU"
      },
      runningMode: "IMAGE",
      numPoses: 1
    });
  } catch (e) {
    console.warn("GPU delegate failed, falling back to CPU", e);
    return await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task",
        delegate: "CPU"
      },
      runningMode: "IMAGE",
      numPoses: 1
    });
  }
}

export function initPoseLandmarker() {
  if (!initPromise) {
    initPromise = _initPoseLandmarker();
  }
  return initPromise;
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
      const missingPoints = requiredPoints.some(idx => {
        const p = landmarks[idx];
        if (!p) return true;
        const vis = p.visibility || 0;
        console.log(`Punto ${idx} visibilidad: ${vis}`);
        return vis < POSE_CONFIG.visibilityThreshold;
      });
      
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

      console.log(`Frontal -> leftAngle: ${leftArmAngle}, rightAngle: ${rightArmAngle}`);

      if (leftArmAngle < POSE_CONFIG.armAngleMin || rightArmAngle < POSE_CONFIG.armAngleMin) {
        return { isValid: false, errorKey: "poseArmsTooClose" };
      }
      if (leftArmAngle > POSE_CONFIG.armAngleMax || rightArmAngle > POSE_CONFIG.armAngleMax) {
        return { isValid: false, errorKey: "poseArmsTooHigh" };
      }

      // Check feet width (roughly shoulder width apart)
      const shoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
      const ankleWidth = Math.abs(landmarks[27].x - landmarks[28].x);
      
      console.log(`Frontal -> shoulderWidth: ${shoulderWidth}, ankleWidth: ${ankleWidth}`);

      if (shoulderWidth < POSE_CONFIG.frontalMinShoulderWidth) {
        return { isValid: false, errorKey: "poseNotFrontal" };
      }
      
      if (ankleWidth < shoulderWidth * POSE_CONFIG.ankleShoulderRatio) {
        return { isValid: false, errorKey: "poseFeetTooClose" };
      }

      return { isValid: true };
    } else if (type === "side") {
      // Side pose validation
      const leftShoulder = landmarks[11];
      const rightShoulder = landmarks[12];
      
      // Check if shoulders or hips overlap on X axis (profile view)
      const shoulderDiffX = Math.abs(leftShoulder.x - rightShoulder.x);
      const leftHip = landmarks[23];
      const rightHip = landmarks[24];
      const hipDiffX = Math.abs(leftHip.x - rightHip.x);
      
      console.log(`Perfil -> shoulderDiffX: ${shoulderDiffX}, hipDiffX: ${hipDiffX}`);
      
      if (shoulderDiffX > POSE_CONFIG.shoulderProfileMaxDiff || hipDiffX > POSE_CONFIG.hipProfileMaxDiff) {
        return { isValid: false, errorKey: "poseNotProfile" };
      }

      // Check feet together
      const leftAnkle = landmarks[27];
      const rightAnkle = landmarks[28];
      
      if (leftAnkle && rightAnkle && (leftAnkle.visibility || 0) > POSE_CONFIG.visibilityThreshold && (rightAnkle.visibility || 0) > POSE_CONFIG.visibilityThreshold) {
        const ankleDiffX = Math.abs(leftAnkle.x - rightAnkle.x);
        console.log(`Perfil -> ankleDiffX: ${ankleDiffX}`);
        if (ankleDiffX > 0.15) {
          return { isValid: false, errorKey: "poseSideFeetApart" };
        }
      }

      return { isValid: true };
    }

    return { isValid: true };
  } catch (error: unknown) {
    console.error("====== MEDIA PIPE ERROR ======");
    console.error(error);
    if (error instanceof Error) {
      console.error(error.message);
    }
    return { isValid: false, errorKey: "errorUnknown" };
  }
}
