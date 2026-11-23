# amadeus-live3d — 3D desktop companion plugin for DeepSeek Harness

A DeepSeek Harness (DSH) plugin that puts a **floating 3D VRM/glTF anime character on the
desktop**, driven by agent tools (load a model, rotate bones, play gestures, blend emotions,
lip-sync). It is a clean-room port of the amadeus-v2 "Live3D" feature.

## Architecture

DSH plugins run in the desktop-host child process, which is **Node-mode Electron** — it
cannot create `BrowserWindow`s. So this plugin ships a small **Electron sidecar**:

```
amadeus-live3d/
├─ lib/index.js            DSH plugin: spawns the sidecar + registers agent tools
├─ companion/              standalone Electron app (the sidecar)
│  ├─ main.js              creates the transparent always-on-top 3D window + HTTP control server
│  ├─ package.json
│  ├─ preload/index.js     exposes window.amadeus.onCommand / .answer to the renderer
│  └─ renderer/
│     ├─ 3d.html           3D engine: blend-tree animation (breath/speech/gesture/sleep/emotion),
│     │                    phoneme lip-sync, continuous emotion vector, toon shading + outline
│     └─ three/            three.js r0.160 + GLTF/FBX/OBJ loaders (vendored, MIT)
```

The plugin spawns `process.execPath <companionDir>` (full Electron), reads the control port
from stdout, then drives the character over `http://127.0.0.1:<port>/command`.

## Features (ported from amadeus-v2)

- 12 gestures: wave, nod, shake, point, bow, stretch, clap, thumbs_up, salute, dance, shrug, look_around
- Continuous emotion vector (happy/angry/sad/surprised/relaxed/neutral) with matching body + mouth
- Phoneme/viseme lip-sync (`talk_3d`)
- Idle breathing, blink, sleep mode (auto-sleeps after ~8s idle, auto-wakes)
- Full-body bone control (`set_pose_3d` / `list_bones_3d` / `reset_pose_3d`)
- Toon cel-shading (MToon-style) + dark silhouette outline + ACES tonemapping + hemisphere "fake IBL"
- Supported models: **.vrm / .glb / .gltf / .fbx / .obj** (VRM 1.0 = glTF 2.0, humanoid skeleton preserved)

## Agent tools

`load_3d_model`, `list_bones_3d`, `set_pose_3d`, `reset_pose_3d`, `gesture_3d`, `set_emotion_3d`,
`set_expression_3d`, `list_expressions_3d`, `sleep_3d`, `talk_3d`.

## Install

Link the plugin into the DSH profile (`~/.dsh/profiles/<profile>`): `plugins/amadeus-live3d` and
`node_modules/amadeus-live3d` as junctions to this folder, and in the profile's `package.json`:

```json
{
  "dependencies": { "amadeus-live3d": "link:./plugins/amadeus-live3d" },
  "dsh": { "profile": { "bundles": ["…", "amadeus-live3d"] } }
}
```

Then install the runtime (once per machine, shared with amadeus-live2d) and restart DeepSeek
Harness. The plugin spawns the companion on first use.

```powershell
powershell -ExecutionPolicy Bypass -File .\setup\install-runtime.ps1 -Check   # what is there / missing
powershell -ExecutionPolicy Bypass -File .\setup\install-runtime.ps1          # install what is missing (needs uv)
```

See the repository [README](../README.md) for the full install into DSH.

## Runtime folder

The plugin carries only code (including the Kokoro server in `companion/speech`). Everything
heavy lives in one shared folder, `W:\amadeus-runtime` by default (set `AMADEUS_RUNTIME` to move it):

| Path | What |
|---|---|
| `electron\electron.exe` | standalone Electron for the companion window |
| `python\tts` | Edge voices (edge-tts) + Silero (PyTorch CPU) |
| `python\kokoro` | Kokoro-ru (onnxruntime, RUAccent, espeak) |
| `python\stt` | local speech recognition (faster-whisper) |
| `models\silero\v5_6_ru.pt` | Silero Russian voices |
| `models\speech\kokoro-ru`, `models\speech\ruaccent` | Kokoro-ru model, voices, espeak data; stress model |
| `models\whisper` | faster-whisper "small" (downloaded on first local recognition) |

## Notes / limits

- **No models are bundled** (they are copyrighted; the user imports their own — the same
  import flow amadeus-v2 already had).
- The companion needs a standalone Electron (`<runtime>\electron`): the DSH binary itself exits
  at once because of its single-instance lock.
- Live2D is a separate plugin (proprietary Cubism SDK, handled independently); this plugin is
  3D-only and fully open-source (three.js, MIT).
