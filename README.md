# plugins-dsh — перенос Live2D / Live3D / orb в DeepSeek Harness

Сборка трёх отдельных DSH-плагинов из функций `amadeus-v2`. Плагины ставятся в
профиль DSH: `C:\Users\epevn\.dsh\profiles\desktop`.

## Статус

| Плагин | Собран | Установлен в DSH | Работает |
|---|---|---|---|
| `amadeus-live3d` | ✅ | ✅ | ✅ (проверен standalone) |
| `amadeus-orb` | ✅ | ✅ | ✅ (автопривязка фаз, вид по состояниям) |
| `amadeus-live2d` | ✅ | ✅ | ✅ (пузырь ответов, импорт моделей) |

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

## 3. `amadeus-live2d` — Live2D-персонаж

**Что делает.** Персонаж Live2D в прозрачном окне поверх рабочего стола (Electron-sidecar
`companion/`), пузырь с ответом агента (орб + точки + текст с прокруткой, автоскрытие),
голос, меню по правому клику. Инструменты агента: `list_live2d_characters`, `load_live2d_model`,
`play_live2d_motion`, `set_live2d_expression`, `live2d_return_to_idle`, `list_live2d_actions`,
`live2d_speak`.

**Настройки** (вкладка live2D): персонажи, поведение на экране, ответы агента (живой
предпросмотр настоящего пузыря), голос и звук.

### Импорт моделей

Вкладка live2D → «Персонажи» → «Добавить модель»: перетащить архив, кнопки «Архив…» / «Папка…»
или «Импорт» у архива из списка недавних загрузок (папка «Загрузки», пометка Live2D / Cubism 2 /
не модель). Импорт — `companion/importer.js`:

- архивы `.zip` (свой читатель: имена Shift_JIS / GBK / Big5 без флага UTF-8 восстанавливаются),
  `.rar` / `.7z` (через `tar.exe` Windows), вложенные архивы, папки;
- все модели Cubism 3–5 (`.model3.json` + `.moc3` + текстуры) в архиве; проверка, что файлы на месте;
- движения/эмоции, на которые не ссылается `model3.json`, подключаются автоматически;
- названия: горячие клавиши VTube Studio (`.vtube.json`) + словарь частых слов (en / ja / zh / пиньинь)
  → русские подписи; исходное имя остаётся в подсказке; «Переименовать» — свои названия,
  «Распознать названия» — перевод для уже добавленных моделей (ручные подписи сохраняются);
- превью карточки рендерится с самой модели, если в архиве нет иконки;
- повторный импорт той же модели (по хэшу `.moc3`) распознаётся как дубль;
- Cubism 2 (`.moc` / `model.json`), проекты редактора (`.cmo3`), PSD и запароленные архивы —
  понятное объяснение, что не так.

Модели лежат в `companion/models/` и в репозиторий не входят (`.gitignore`).

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
