@AGENTS.md

# FaceM

A web app for the South African domestic market that measures facial points/dimensions — pupillary distance, face width, bridge width, temple length, face length, forehead width, jaw width — for **eyewear and mask fitting**, and recommends both a frame size and a face shape (Oval/Round/Square/Triangular/Heart/Diamond/Oblong). Facial landmarks (including pupils and iris boundaries) are detected automatically and live from the user's webcam via MediaPipe Face Landmarker; real-world scale is derived automatically from iris diameter (a consistent anatomical constant), with no physical calibration object required. The live camera view only displays the two pupil points to keep it uncluttered — every other landmark is still detected and measured, just not drawn on screen until the detail page's correction view. Everything runs entirely client-side.

There is **no backend yet**. State lives in the browser (Zustand + `localStorage`), and the data layer is written to look exactly like a future REST API so wiring up a real backend later is a swap, not a rewrite. See "The mock-service seam" below.

## Tech stack

- Next.js 16 (App Router) + TypeScript, Tailwind CSS + shadcn/ui
- Zustand for state (`src/store/measurementsStore.ts`)
- MediaPipe Face Landmarker (`@mediapipe/tasks-vision`) for real-time facial/pupil/iris landmark detection and iris-diameter-based scale estimation — see **`docs/COMPUTER_VISION.md`** for the full pipeline, landmark index mapping, and scale math. Read that before touching anything under `src/lib/vision/`.
- Vitest + React Testing Library
- Docker (multi-stage, Next.js standalone output) + Kubernetes manifests (`k8s/`) + GitHub Actions CI/CD (`.github/workflows/ci.yml`)

## Directory map

```
src/
  app/
    page.tsx                    Dashboard
    measurements/
      new/page.tsx               New Measurement: live capture
      [id]/page.tsx               Result detail: overlay, dimensions, manual point correction
      page.tsx                    History: search + delete
  components/
    LiveCameraCapture.tsx        Camera + live MediaPipe detection loop, auto iris-based scale, live measurements HUD
    FaceCanvasOverlay.tsx        Static image + draggable point overlay (detail page correction)
    ConsentGate.tsx              Copyright/privacy acknowledgement screen shown before New Measurement (no persistence — every visit)
    MeasurementTable.tsx, MeasurementCard.tsx, HistoryList.tsx, AppNav.tsx, ProcessingSpinner.tsx
    ui/                          shadcn/ui primitives
  lib/
    types.ts                     Measurement, FacialPoint, CreateMeasurementInput, etc.
    geometry.ts                  Shared distance() helper
    mockData.ts                  computeDimensions(), recommendFrameSize(), determineFaceShape(), seed/demo data generators
    api/measurements.ts          Mock REST service layer (the backend seam — see below)
    vision/                      MediaPipe integration — see docs/COMPUTER_VISION.md
  store/
    measurementsStore.ts         Zustand store wrapping the mock API
  hooks/
    useElementSize.ts            Shared ResizeObserver hook for canvas-overlay sizing
scripts/
  fetch-mediapipe-assets.mjs     One-time setup: populates public/wasm/ and public/models/
public/
  wasm/, models/                 Self-hosted MediaPipe WASM runtime + model (see docs/COMPUTER_VISION.md)
k8s/                             Kubernetes manifests for the frontend container
.github/workflows/ci.yml         Lint/typecheck/test/build, then build+push image to GHCR on main
docs/
  COMPUTER_VISION.md             MediaPipe pipeline deep-dive
```

## The mock-service seam

`src/lib/api/measurements.ts` exposes `listMeasurements`, `getMeasurement`, `createMeasurement`, `updateMeasurementPoints`, `deleteMeasurement` — all `async`, all shaped like fetch wrappers. Today they read/write an in-memory array persisted to `localStorage`, simulating a server. When a real backend exists, only this file's *internals* change (to real `fetch()` calls); nothing that calls into `useMeasurementsStore` needs to change.

`createMeasurement()` accepts optional `points`/`mmPerUnit` on its input. When `LiveCameraCapture` supplies real detected points + iris-derived scale, those are used directly. When they're absent, it falls back to `generatePoints()`/`randomMmPerUnit()` from `mockData.ts` — which is what `createSeedMeasurements()` still uses to populate dashboard/history demo data. Those mock generators are **not dead code** even though the live capture UI no longer calls them directly.

## Dev workflow

```
npm run dev         # start the app (needs a real webcam for the capture flow)
npm run lint
npm run typecheck
npm run test         # vitest run
npm run build         # next build; also what CI runs before the Docker stage
node scripts/fetch-mediapipe-assets.mjs   # one-time / after bumping @mediapipe/tasks-vision
```

## How to extend

- **Add a new measured dimension**: add the field to `MeasurementDimensions` in `types.ts`, compute it in `computeDimensions()` (`mockData.ts`) using `distance()` from `geometry.ts`, and add a row to `ROWS` in `MeasurementTable.tsx`.
- **Add/adjust a detected landmark point**: edit `LANDMARK_INDEX` in `src/lib/vision/landmarkMapping.ts` — read the mirroring explanation in `docs/COMPUTER_VISION.md` first, it's easy to get backwards. If it should also be drawn on the live camera view (currently only the pupils are), adjust the `visiblePoints` filter in `LiveCameraCapture.tsx`.
- **Change frame-size thresholds**: `recommendFrameSize()` in `mockData.ts`.
- **Change face-shape classification thresholds**: `determineFaceShape()` and its constants (`OBLONG_LENGTH_RATIO` etc.) in `mockData.ts` — see `docs/COMPUTER_VISION.md`'s "Face shape classification" section for the reasoning.
- **CI/CD**: `.github/workflows/ci.yml` runs lint/typecheck/test/build on every PR; on `main` it also builds and pushes a Docker image to `ghcr.io/<repo>`. `k8s/deployment.yaml` has an `OWNER/REPO` placeholder in its image reference that needs updating for a real deploy.

## Known limitations (by design, for now)

- No backend — everything is client-side and local to the browser.
- Real-world scale is derived from an assumed average iris diameter (~11.7mm ± 0.5mm population variance), not a measured reference object — an inherent accuracy ceiling, and less accurate for faces significantly off-axis from the camera. See `docs/COMPUTER_VISION.md`'s "Known limitations" for detail.
- Face-shape classification uses heuristic width-ratio thresholds, not empirically tuned against real users yet, and can't distinguish jaw angle/curvature (e.g. Round vs. Square) from width alone — see `docs/COMPUTER_VISION.md`'s "Face shape classification" section.
- `ConsentGate.tsx` shows a placeholder copyright/privacy notice (not reviewed by legal counsel) that must be acknowledged before every New Measurement capture — a step toward POPIA-awareness, not full compliance tooling. Real personal data handling, retention, and consent-record-keeping still need proper legal review once a backend exists.
