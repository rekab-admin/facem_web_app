# Computer Vision Pipeline

How FaceM turns a live webcam feed into millimeter facial measurements using [MediaPipe Face Landmarker](https://ai.google.dev/edge/mediapipe/solutions/vision/face_landmarker) for face, pupil, and iris detection, entirely client-side in the browser. Read this before touching anything under `src/lib/vision/` or `src/components/LiveCameraCapture.tsx`.

## Where detection happens

Everything runs in the user's browser via WebAssembly — no image or video frame is ever sent to a server. This was a deliberate choice while the project has no backend yet (see `CLAUDE.md`), and it also means no camera data leaves the device even after a backend exists, unless we explicitly change that later.

## Asset pipeline

MediaPipe's model weights and WASM runtime aren't published on npm in a form Next.js can just import — they're binary assets we self-host under `public/`:

| Path | What it is | Size |
|---|---|---|
| `public/models/face_landmarker.task` | The face landmark detection model (float16) | ~3.7MB |
| `public/wasm/*` | The MediaPipe WASM runtime (SIMD, non-SIMD, and module variants — the loader picks whichever the browser supports) | ~33MB |

We host these ourselves instead of pointing at Google's CDN at runtime so the app doesn't have a hard runtime dependency on `storage.googleapis.com` being reachable, and so the exact model version is pinned in git rather than drifting under `.../latest/...`.

**Setup / re-run**: `node scripts/fetch-mediapipe-assets.mjs` copies `node_modules/@mediapipe/tasks-vision/wasm/*` into `public/wasm/` and downloads the model file into `public/models/`. Re-run it whenever `@mediapipe/tasks-vision` is upgraded, or if you intentionally move to a different MediaPipe model version (edit `MODEL_URL` in the script first).

`src/lib/vision/faceLandmarker.ts` points `FilesetResolver.forVisionTasks("/wasm")` and `modelAssetPath: "/models/face_landmarker.task"` at these self-hosted paths.

## The pipeline, end to end

1. **`src/lib/vision/faceLandmarker.ts`** — lazily creates a single shared `FaceLandmarker` instance (`getFaceLandmarker()`), dynamically `import()`-ing `@mediapipe/tasks-vision` so it never loads during Next.js's SSR/build pass. `runningMode: "VIDEO"`, `numFaces: 1`, iris refinement enabled (this is what gives us the 468-477 iris landmarks used for both pupil points and scale estimation).
2. **`src/components/LiveCameraCapture.tsx`** — the UI. A simple step machine: `loading` → `positioning` (or `camera-error` on failure). There is no separate calibration step — face detection, pupil/landmark extraction, and scale estimation all happen automatically, every frame, as soon as the camera and model are ready. **The live canvas only draws dots for the two pupils** — every other point (nose bridge, forehead, temples, jaw, chin) is still detected and feeds the HUD panel and the stored measurement, it's just not rendered on the live view, to avoid a cluttered-looking overlay. `src/components/FaceCanvasOverlay.tsx` (the detail-page point-correction view) is unaffected and still shows/allows dragging every point.
3. **`src/lib/vision/landmarkMapping.ts`** — `mapLandmarksToFacialPoints()` picks 12 named points out of MediaPipe's 478-point result. `estimateMmPerUnitFromIris()` derives real-world scale from the same per-frame result — see below. Face, pupil, and scale detection are fully automatic — this is not something the user does manually.
4. **`src/lib/mockData.ts`**'s `computeDimensions()` turns points + `mmPerUnit` into the `MeasurementDimensions` shown live in `LiveCameraCapture`'s bottom-right HUD panel (pupillary distance, face width, bridge width, temple length only) and in full on the detail page — the same function used for mock/seed data, so real and mock measurements go through identical math. `determineFaceShape()` then classifies the resulting dimensions into a face shape — see "Face shape classification" below.

## Landmark index mapping — read this carefully

MediaPipe names its landmarks from the **subject's own anatomical left/right** (the same convention as `left_shoulder` in MediaPipe's pose landmarks). Our `FacialPoint` ids (`leftPupil`, `rightPupil`, etc.) mean something different: **which side of the displayed image the point appears on**, matching the existing mock layout in `mockData.ts` and how the captured photo is shown (a plain, unmirrored `<img>`) on the detail page.

A camera faces the subject like a photographer would. In that raw, unmirrored frame, the subject's anatomical *right* eye appears on the *left* side of the image — same as in any ordinary photo of someone facing you. **We do not mirror the live camera preview** (deliberately — see "Why no mirrored preview" below), so this raw-frame relationship is exactly what ends up stored.

| Our `FacialPoint.id` | MediaPipe index | MediaPipe's own name | Why it's the opposite-sounding index |
|---|---|---|---|
| `leftPupil` | 473 | right iris center | subject's right eye lands on the image's left side |
| `rightPupil` | 468 | left iris center | subject's left eye lands on the image's right side |
| `noseBridgeLeft` | 133 | right eye inner corner | same mirroring |
| `noseBridgeRight` | 362 | left eye inner corner | same mirroring |
| `foreheadLeft` | 54 | face-oval loop, same chain as `leftTemple` | same mirroring |
| `foreheadRight` | 284 | face-oval loop, same chain as `rightTemple` | same mirroring |
| `leftTemple` | 234 | right cheek (face-oval extreme) | same mirroring |
| `rightTemple` | 454 | left cheek (face-oval extreme) | same mirroring |
| `jawLeft` | 172 | face-oval loop, same chain as `leftTemple` | same mirroring |
| `jawRight` | 397 | face-oval loop, same chain as `rightTemple` | same mirroring |
| `faceTop` | 10 | forehead / top of face-oval | midline point, no left/right ambiguity |
| `chin` | 152 | chin / jaw midpoint | midline point, no left/right ambiguity |

468/473 (iris centers) and 152/10 (chin/forehead-top) are extremely well-established MediaPipe indices, straight from its official documentation. 234/454 (cheek/face-oval extremes), 133/362 (eye inner corners), and the new 54/284 (forehead) and 172/397 (jaw) pairs are common, stable community-referenced indices but not "officially named" landmarks the way the iris/chin/forehead-top points are — if a live test ever shows a point clearly on the wrong side of the face, **the fix is to swap the two indices in this table**, not to add ad-hoc coordinate flipping elsewhere in the code. The forehead/jaw pair especially should be double-checked against a real face during implementation; they're picked from MediaPipe's official `FACEMESH_FACE_OVAL` loop for topological consistency with `leftTemple`/`rightTemple`, but (like the existing entries) haven't been empirically verified against live camera output.

**Nose bridge width is an approximation.** MediaPipe has no landmark literally named "nose bridge edge," so we use the eye-inner-corner points as a stable, visually-reasonable proxy. Same spirit as `templeLengthMm` in `computeDimensions()`, which was already an approximation in the mock data.

### Why no mirrored preview

Most webcam apps (Zoom, FaceTime) mirror the self-view so it feels like looking in a mirror. We deliberately don't:

- MediaPipe always reads the raw, unmirrored frame from the `<video>` element regardless of any CSS transform applied to it for display.
- If we mirrored the `<video>` for display but kept raw coordinates for the mapping table, the on-screen point overlay would be reflected the wrong way relative to what the user sees — a subtle, easy-to-miss bug.
- Keeping raw camera space as the *only* coordinate space in play (used for live preview, the point overlay, the captured freeze-frame image, and everything stored on the `Measurement`) avoids an entire class of flip bugs at the cost of the preview feeling slightly less "mirror-like." A mirrored preview could be reintroduced later as a pure CSS transform applied to *both* the video and canvas together (so nothing needs coordinate math), but that's out of scope for now.

## Scale: turning pixels into millimeters

A single 2D camera frame has no inherent scale — MediaPipe gives accurate *relative* geometry, not real-world size. Instead of requiring a physical reference object (a card, passport, or ruler) held up to the camera, we use a built-in anatomical constant: **adult horizontal visible iris diameter (HVID) is remarkably consistent across the population, averaging ~11.7mm ± 0.5mm.** This is the same technique used by AR eyewear try-on apps to derive scale from a face alone.

`src/lib/vision/landmarkMapping.ts`'s `estimateMmPerUnitFromIris(landmarks)`:

1. MediaPipe's iris refinement (enabled via `refine_landmarks`, see `faceLandmarker.ts`) emits, alongside each pupil center (468/473), 4 boundary points forming a ring around it (469-472 around 468, 474-477 around 473).
2. For each eye, average the center-to-ring distance across all 4 ring points to get an iris radius, then double it for a diameter — averaging over 4 points smooths out minor per-frame landmark jitter and in-plane head rotation.
3. Average the two eyes' diameters together.
4. `mmPerUnit = IRIS_DIAMETER_MM / averageDiameter` — the same `constant / normalizedDistance` shape as any other scale-from-known-length calculation.

This runs **every frame**, alongside `mapLandmarksToFacialPoints()`, in `LiveCameraCapture`'s live detection loop — there's no separate calibration step, no user action, and no locked-in-once value. `mmPerUnit` updates continuously as long as a face is detected, and whatever it is at the moment of `handleCapture()` is what gets stored on the `Measurement`.

### Known limitations

- **Population variance**: real iris diameter varies ±0.5mm or so across adults (and iris diameter in children differs from the adult average used here), which is an inherent accuracy ceiling on any measurement derived from it — the same category of error a manually-placed calibration marker used to introduce, just from a different source.
- **Off-axis foreshortening**: the ring-point averaging assumes the iris is roughly facing the camera. A face turned significantly away from frontal will foreshorten the iris in one axis, understating the diameter and skewing `mmPerUnit` — the oval positioning guide in `LiveCameraCapture` encourages a consistent, roughly-frontal head position for this reason (in addition to keeping the whole face in frame).
- **No manual override**: unlike the old calibration flow, there's currently no way for a user to correct or fine-tune the derived scale if they suspect it's off for a particular capture.

### Future work

- Detect and warn when the face is significantly off-axis (yaw/pitch) instead of relying solely on the oval-fit heuristic, since off-axis frames are exactly where iris-based scale estimation degrades.
- Move detection server-side once a backend exists, if there's a reason to (e.g. a higher-accuracy model too large to ship to the browser).
- Consider a per-customer manual scale correction/override, informed by comparing against a known measurement, for cases where the population-average assumption noticeably misses.

## Face shape classification

`src/lib/mockData.ts`'s `determineFaceShape(dimensions)` classifies a face into one of 7 shapes — Oval, Round, Square, Triangular, Heart, Diamond, Oblong — based on facial proportions. This is often described as "facial symmetry," but the actual technique (the same one real face-shape/eyewear-fitting tools use) is comparing **width ratios** between forehead, cheekbone, and jaw plus overall face length — not left-right mirror deviation. There's no separate numeric symmetry score; only the resulting category is stored/shown, in the same place `recommendedFrameSize` already is (`Measurement.faceShape`, computed once at capture/edit time, shown as a badge on the card, history table, and detail page — deliberately **not** added to the live HUD, to keep the live view uncluttered).

Inputs, all already part of `MeasurementDimensions`:
- `faceWidthMm` — cheekbone width (`leftTemple` ↔ `rightTemple`), the reference every ratio below is relative to.
- `faceLengthMm` — `faceTop` ↔ `chin`.
- `foreheadWidthMm` — `foreheadLeft` ↔ `foreheadRight`.
- `jawWidthMm` — `jawLeft` ↔ `jawRight`.

`determineFaceShape()` computes `lengthRatio`, `foreheadRatio`, and `jawRatio` (each divided by `faceWidthMm`) and runs them through an ordered set of rules (first match wins) — see the threshold constants (`OBLONG_LENGTH_RATIO`, `OVAL_LENGTH_RATIO`, `WIDE_RATIO`, `NARROW_RATIO`, `SQUARE_JAW_RATIO`) at the top of `mockData.ts`.

### Known limitations

- **Heuristic defaults**: the threshold constants are reasonable starting points from common face-shape heuristics, not empirically tuned against this app's actual users — expect to adjust them once there's real capture data to check against, the same spirit as `facePosition.ts`'s `GOOD_FIT_MIN`/`GOOD_FIT_MAX`.
- **Round vs. Square is an approximation**: both are "short" faces (low `lengthRatio`) with fairly similar forehead/cheekbone/jaw widths; the only signal distinguishing them here is `jawRatio` (near-equal-to-cheekbone width → Square, notably narrower → Round). A more robust distinction would measure actual jaw *angle*/curvature, which isn't currently derived from any detected landmark.
- **New landmark indices are unverified**: `foreheadLeft`/`foreheadRight`/`jawLeft`/`jawRight` (see the landmark table above) haven't been checked against a live face yet — verify during testing and swap indices if a point lands somewhere unexpected.
- **Assumes a roughly-frontal face**, same as iris-based scale estimation above — an off-axis head pose will skew width measurements unevenly and can misclassify the shape.

## Testing

`src/lib/vision/landmarkMapping.test.ts` and `src/lib/vision/facePosition.test.ts` cover everything vision-related that can run without a browser — including `estimateMmPerUnitFromIris()` against synthetic ring-landmark fixtures. `src/lib/mockData.test.ts` covers `computeDimensions()` and `determineFaceShape()`, including one fixture per face-shape category. Camera access, `getUserMedia`, and the MediaPipe WASM runtime don't run in `jsdom`, so `LiveCameraCapture` itself has no automated test — verify it by running `npm run dev` and walking through the flow in an actual browser with camera access.
