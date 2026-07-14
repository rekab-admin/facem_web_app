import type { FaceLandmarker as FaceLandmarkerType } from "@mediapipe/tasks-vision";

const WASM_BASE_PATH = "/wasm";
const MODEL_ASSET_PATH = "/models/face_landmarker.task";

let landmarkerPromise: Promise<FaceLandmarkerType> | null = null;

/**
 * Lazily creates a single shared FaceLandmarker instance. Dynamically
 * imports @mediapipe/tasks-vision so this never executes during Next.js'
 * SSR/build pass — it only runs once a browser actually calls this.
 */
export function getFaceLandmarker(): Promise<FaceLandmarkerType> {
  if (!landmarkerPromise) {
    landmarkerPromise = createFaceLandmarker();
  }
  return landmarkerPromise;
}

async function createFaceLandmarker(): Promise<FaceLandmarkerType> {
  const { FaceLandmarker, FilesetResolver } = await import("@mediapipe/tasks-vision");
  const fileset = await FilesetResolver.forVisionTasks(WASM_BASE_PATH);

  return FaceLandmarker.createFromOptions(fileset, {
    baseOptions: {
      modelAssetPath: MODEL_ASSET_PATH,
    },
    runningMode: "VIDEO",
    numFaces: 1,
  });
}
