#!/usr/bin/env node
// Populates public/wasm/ and public/models/ with the binary assets MediaPipe's
// FaceLandmarker needs at runtime. These aren't published on npm (wasm ships
// inside the package but the model file doesn't), so this is a one-time setup
// step — re-run it after bumping @mediapipe/tasks-vision, or if the model
// file needs to move to a newer MediaPipe model version.
//
// See docs/COMPUTER_VISION.md for what each asset is and why it's self-hosted
// instead of fetched from Google's CDN at runtime.

import { cp, mkdir } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";

const ROOT = path.dirname(fileURLToPath(import.meta.url)) + "/..";
const WASM_SRC = path.join(ROOT, "node_modules/@mediapipe/tasks-vision/wasm");
const WASM_DEST = path.join(ROOT, "public/wasm");
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task";
const MODEL_DEST = path.join(ROOT, "public/models/face_landmarker.task");

async function copyWasm() {
  await mkdir(WASM_DEST, { recursive: true });
  await cp(WASM_SRC, WASM_DEST, { recursive: true });
  console.log(`Copied WASM runtime -> ${path.relative(ROOT, WASM_DEST)}`);
}

async function downloadModel() {
  await mkdir(path.dirname(MODEL_DEST), { recursive: true });
  const response = await fetch(MODEL_URL);
  if (!response.ok || !response.body) {
    throw new Error(`Failed to download model: ${response.status} ${response.statusText}`);
  }
  await pipeline(response.body, createWriteStream(MODEL_DEST));
  console.log(`Downloaded face_landmarker.task -> ${path.relative(ROOT, MODEL_DEST)}`);
}

await copyWasm();
await downloadModel();
