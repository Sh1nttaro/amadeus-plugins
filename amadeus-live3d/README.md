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

Add to the DSH profile (`~/.dsh/profiles/<profile>/package.json`):

```json
{
  "dependencies": { "amadeus-live3d": "file:W:/plugins-dsh/amadeus-live3d" }
}
```

Then restart DeepSeek Harness. The plugin spawns the companion on first use.

## Notes / limits

- **No models are bundled** (they are copyrighted; the user imports their own — the same
  import flow amadeus-v2 already had).
- The companion reuses the DSH app's own Electron binary (`process.execPath`), so no separate
  Electron download is needed.
- Live2D is a separate plugin (proprietary Cubism SDK, handled independently); this plugin is
  3D-only and fully open-source (three.js, MIT).
