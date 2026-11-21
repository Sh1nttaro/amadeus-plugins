# plugins-dsh — перенос Live2D / Live3D / orb в DeepSeek Harness

Сборка трёх отдельных DSH-плагинов из функций `amadeus-v2`. Плагины ставятся в
профиль DSH: `C:\Users\epevn\.dsh\profiles\desktop`.

## Статус

| Плагин | Собран | Установлен в DSH | Работает |
|---|---|---|---|
| `amadeus-live3d` | ✅ | ✅ | ✅ (проверен standalone) |
| `amadeus-orb` | ✅ | ✅ | ✅ (автопривязка фаз) |
| `amadeus-live2d` | ✅ (отказоустойчив) | ❌ | ⚠️ блокер (см. ниже) |

---

## 1. `amadeus-live3d` — 3D VRM-персонаж

**Что делает.** Плагин-инструменты для агента: загружает 3D-модель (`.glb/.gltf/.fbx/.obj/.vrm`)
в прозрачное окно поверх рабочего стола (отдельный Electron-sidecar), даёт управление
костями, жестами, эмоциями и речью.

**Инструменты (10):** `load_3d_model(path)`, `list_bones_3d`, `set_pose_3d(bone,x,y,z)`,
`reset_pose_3d`, `gesture_3d(name)`, `set_emotion_3d(emotions)`, `set_expression_3d(name)`,
`list_expressions_3d`, `sleep_3d(on)`, `talk_3d(on,text)`.

**Как работает.** Хост-половина спавнит `companion/main.js` (полный Electron через
`process.execPath`, с удалением `ELECTRON_RUN_AS_NODE` из env), читает порт из stdout
(`{"type":"ready","port":N}`), дальше управляет через HTTP `/command`.

**Установка в DSH** (уже сделана): в `package.json` профиля добавлены
`"amadeus-live3d": "1.0.0"` в `dependencies` + `dsh.profile.bundles`; сам плагин скопирован
в `node_modules\amadeus-live3d`.

**Проверка standalone** (без DSH): `cd W:\plugins-dsh\amadeus-live3d && node _test.cjs`
(спавнит sidecar + прогонит load/list_bones/gesture/set_emotion).

---

## 2. `amadeus-orb` — орб/точки состояния агента

**Что делает.** Встраивает в веб-приложение DSH анимированный орб (сфера + точки) в
шапку чата и сам подписывается на состояние агента.

**Состояния (авто):** `idle` / `thinking` / `tool` / `speaking`. Логика — в `lib/client.js`
(`driveFromSession`): подписка на `ctx.uiSession.sessionStatus` (флаг `running`), при
`running` уточняется по траектории активной сессии (`runningCalls` → `tool`,
`partial` → `speaking`, иначе `thinking`).

**Ручное управление** (для отладки): `window.amadeusOrb.set(state)`, `.setColors()`, `.setStyle()`.

**Пересборка** (после правки `lib/agent-visuals.js` или `build.cjs`):
`cd W:\plugins-dsh\amadeus-orb && node build.cjs`.

---

## 3. `amadeus-live2d` — Live2D-персонаж (БЛОКЕР)

**Что сделано.** Плагин + companion (окно персонажа/пузырь/меню, 7 инструментов:
`list_live2d_characters`, `load_live2d_model`, `play_live2d_motion`, `set_live2d_expression`,
`live2d_return_to_idle`, `list_live2d_actions`, `live2d_speak`). Отказоустойчив (HTTP-таймаут 30 с).

**Блокер.** Модель НЕ загружается в standalone-sidecar: все 19 файлов модели отдаются,
движок Cubism SDK запускается, но загрузка зависает, и event-loop главного процесса
перестаёт выполнять таймеры. Причина: движок Live2D делает **синхронную WebGL-загрузку
текстуры прямо во время загрузки модели**; в голом прозрачном окне (холодный GPU) это
блокирует рендерер → трубу протокола → главный процесс. В `amadeus-v2` работает только
потому, что параллельно крутится основное веб-приложение (тёплый GPU-композитор).
3D работает, т.к. загрузка GLB — CPU-сторона. Проверено ~12 разных фиксов (прогрев GPU,
`show:true`, `transparent:false`, `backgroundThrottling:false`, стриминг `net.fetch` и др.) — не помогло.

**Варианты (нужно решение):**
- **A)** Оставить плавающее окно → чинить sidecar (offscreen-рендер / патч движка — сложно).
- **B)** Рендерить Live2D внутри окна DSH (тёплый GPU — заработает), но не «поверх рабочего стола».
- **C)** Не мигрировать Live2D, оставить в `amadeus-v2`.

---

## Установка в DSH (общая схема)

1. Скопировать папку плагина в `C:\Users\epevn\.dsh\profiles\desktop\node_modules\`.
2. В `package.json` профиля добавить в `dependencies` (`"<имя>": "<версия>"`) и в
   `dsh.profile.bundles`.
3. **Перезапустить `DeepSeek Harness.exe`** (закрыть → открыть) — без перезапуска плагины
   не активируются.

**Откат:** оригинал `package.json` сохранён как `package.json.bak` в профиле DSH.

## Скоупы (ванильный DSH)

Плагины используют **ванильный** скоуп `@deepseek-ai/*` (не форк `@amadeus/*`):
- `amadeus-live3d`: peerDeps `@deepseek-ai/cordis ~4.0.5` + `@deepseek-ai/dsh-tools 0.2.1-rc.3`.
- `amadeus-orb`: `dsh.client.platform:"web"` + `exports "./client"`.
