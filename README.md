# amadeus-plugins — плагины для DeepSeek Harness

Пять плагинов для [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (DSH):

| Плагин | Что делает | Нужна папка runtime |
|---|---|---|
| [`amadeus-live3d`](amadeus-live3d/README.md) | 3D-персонаж (VRM) на рабочем столе: жесты, эмоции, озвучка ответов, голосовое управление «Алиса, …» | да |
| `amadeus-live2d` | Live2D-персонаж на рабочем столе, пузырь с ответом агента, озвучка | да |
| `amadeus-orb` | анимированный орб состояния агента в шапке чата | нет |
| [`amadeus-providers`](amadeus-providers/README.md) | свои провайдеры моделей (OpenAI-/Anthropic-/Gemini-совместимые) | нет |
| [`amadeus-harness`](amadeus-harness/README.md) | Claude Code и Codex как исполнители чата | нет |

Плагины несут только код. Всё тяжёлое — Electron для окон персонажей, окружения Python, модели
голоса и распознавания речи (~5 ГБ) — ставится одним скриптом в общую папку runtime
(по умолчанию `W:\amadeus-runtime`). В git она не входит.

---

## Установка

Нужно: Windows 10/11, установленный DeepSeek Harness, `git`. Для live2D / live3D ещё
[`uv`](https://docs.astral.sh/uv/) и ~6 ГБ на диске.

Команды ниже — для PowerShell. В примерах репозиторий клонируется в `W:\plugins-dsh`, а профиль
DSH называется `desktop`; если у вас иначе — поправьте две переменные в шаге 3.

### 1. Клонировать

```powershell
git clone https://github.com/Sh1nttaro/amadeus-plugins.git W:\plugins-dsh
```

### 2. Поставить runtime (только для live2D и live3D)

```powershell
winget install astral-sh.uv
```

Откройте новое окно PowerShell (чтобы появился `uv`) и запустите (`-ExecutionPolicy Bypass` —
только для этого запуска: по умолчанию Windows не выполняет скрипты `.ps1`):

```powershell
powershell -ExecutionPolicy Bypass -File W:\plugins-dsh\amadeus-live3d\setup\install-runtime.ps1
```

Скрипт скачивает и ставит в `W:\amadeus-runtime` (~2–3 ГБ загрузок):

| Папка | Что |
|---|---|
| `electron\` | отдельный Electron для окна персонажа (DSH сам не может его открыть) |
| `python\tts` | голоса Edge (онлайн) и Silero (локально, PyTorch для процессора) |
| `python\kokoro` | голос Kokoro-ru (локально) |
| `python\stt` | локальное распознавание речи (faster-whisper) |
| `models\silero`, `models\speech` | модели Silero и Kokoro-ru |
| `models\whisper` | Whisper small — скачается сам при первом локальном распознавании |

Уже установленное скрипт пропускает, так что его можно запускать повторно. Посмотреть, чего
не хватает, ничего не скачивая:

```powershell
powershell -ExecutionPolicy Bypass -File W:\plugins-dsh\amadeus-live3d\setup\install-runtime.ps1 -Check
```

**Нет диска W:?** Поставьте runtime в другую папку и сообщите её плагинам через переменную
окружения пользователя `AMADEUS_RUNTIME` (задать до запуска DSH):

```powershell
powershell -ExecutionPolicy Bypass -File W:\plugins-dsh\amadeus-live3d\setup\install-runtime.ps1 -Runtime D:\amadeus-runtime
```

```powershell
[Environment]::SetEnvironmentVariable('AMADEUS_RUNTIME', 'D:\amadeus-runtime', 'User')
```

### 3. Подключить плагины к DSH

Закройте DeepSeek Harness (и из трея). Плагин подключается в профиле DSH так: папка
`plugins\<имя>` — ссылка (junction) на папку из клона, `node_modules\<имя>` — ссылка на неё, а в
`package.json` профиля плагин записан в `dependencies` и в `dsh.profile.bundles`. Так `git pull`
сразу обновляет плагины, ничего копировать не нужно.

```powershell
$repo = 'W:\plugins-dsh'
$profileDir = "$env:USERPROFILE\.dsh\profiles\desktop"
$plugins = 'amadeus-live3d', 'amadeus-live2d', 'amadeus-orb', 'amadeus-providers', 'amadeus-harness'

New-Item -ItemType Directory -Force "$profileDir\plugins", "$profileDir\node_modules" | Out-Null
foreach ($p in $plugins) {
  if (Test-Path "$profileDir\plugins\$p") { Write-Warning "plugins\$p уже есть — сначала уберите его (см. ниже)"; continue }
  New-Item -ItemType Junction -Path "$profileDir\plugins\$p" -Target "$repo\$p" | Out-Null
  if (-not (Test-Path "$profileDir\node_modules\$p")) {
    New-Item -ItemType Junction -Path "$profileDir\node_modules\$p" -Target "$profileDir\plugins\$p" | Out-Null
  }
}
```

Затем в `%USERPROFILE%\.dsh\profiles\desktop\package.json` добавьте плагины в оба места
(остальное содержимое файла не трогайте; сделайте копию файла перед правкой):

```json
{
  "dependencies": {
    "amadeus-live3d": "link:./plugins/amadeus-live3d",
    "amadeus-live2d": "link:./plugins/amadeus-live2d",
    "amadeus-orb": "link:./plugins/amadeus-orb",
    "amadeus-providers": "link:./plugins/amadeus-providers",
    "amadeus-harness": "link:./plugins/amadeus-harness"
  },
  "dsh": {
    "profile": {
      "bundles": ["…то, что уже было…", "amadeus-live3d", "amadeus-live2d", "amadeus-orb", "amadeus-providers", "amadeus-harness"]
    }
  }
}
```

Нужны не все плагины — подключите только нужные (и в ссылках, и в `package.json`).

**Если плагины уже стояли копиями** в `plugins\<имя>`: переименуйте старую папку (например в
`plugins\<имя>.old`), создайте ссылку командами выше и перенесите из старой папки своё: модели
`companion\models\`, анимации `companion\animations\` (live3D), настройки `companion\settings.json`.

### 4. Запустить и проверить

Запустите DeepSeek Harness. Должно получиться:

- **live3D / live2D** — в настройках DSH появляются вкладки персонажей; после импорта модели
  персонаж появляется на рабочем столе. Модели в репозиторий не входят (у них свои лицензии):
  `.vrm` / `.glb` для 3D, архивы Cubism 3–5 для Live2D — через «Добавить модель».
- **Озвучка** (live3D: настройки → «Озвучка ответов») — «▶ Сказать фразу» звучит голосом
  Silero.
- **orb** — орб в шапке чата меняется: думает / вызывает инструмент / отвечает.
- **providers / harness** — страница «Провайдеры» в настройках и харнесы в выборе модели чата.

## Обновление

```powershell
git -C W:\plugins-dsh pull
```

Затем перезапустите DSH. Если в обновлении менялся состав runtime — ещё раз запустите
`install-runtime.ps1` (он доставит только недостающее).

---

## Голос и микрофон (live3D)

- **Озвучка ответов** по предложениям, пока агент ещё пишет; новый вопрос прерывает старый ответ.
  Движки (бесплатные; модели Silero — [только для некоммерческого использования](https://github.com/snakers4/silero-models/blob/master/LICENSE), CC BY-NC):
  **Silero** (локально, по умолчанию; голоса Ксения, Бая, Айдар, Евгений), **Edge** (онлайн,
  нейроголоса Microsoft), **Kokoro** (локально). Код, JSON и таблицы вслух не читаются; числа,
  годы, проценты и английские слова — читаются словами.
- **«Алиса, …»** — фраза с именем персонажа уходит агенту (кнопка микрофона на круге в режиме
  пузыря или настройка «Слушать»). Имя меняется в настройках.
- **«Алиса, стоп»** — ровно эта фраза (имя и «стоп») заставляет её замолчать и прерывает работу
  агента, в том числе посреди её речи. Другие слова («хватит», «тихо», «стоп» без имени) ничего не
  останавливают. Отменяется чат, который она читает; если она молчит — её собственный чат или
  последний работающий.
- **Распознавание речи** — локально (Whisper small). Быстрее на своём OpenAI-совместимом сервере:
  настройки → «Слушать» → «Свой сервер распознавания»; туда уходят запись голоса и ключ
  `LITELLM_API_KEY` из DSH. Без адреса ничего никуда не отправляется.

## Частые проблемы

| Что | Почему / что делать |
|---|---|
| Персонаж не появляется | нет Electron в runtime → `install-runtime.ps1 -Check` |
| Нет голоса | нет окружения или модели → `-Check`; Edge нужен интернет |
| Голос Edge «Светлана» иногда молчит | нестабильна на стороне Microsoft; выберите другой голос |
| Runtime не на `W:` | задайте `AMADEUS_RUNTIME` (шаг 2) и перезапустите DSH |
| Плагин не появился в DSH | проверьте ссылки в `plugins\` и `node_modules\` и обе записи в `package.json`; перезапустите DSH полностью (из трея тоже) |

---

## Плагины подробнее

### `amadeus-live3d` — 3D-персонаж

Прозрачное окно поверх рабочего стола (отдельный Electron-процесс `companion/`), управляется
агентом через инструменты: `load_3d_model`, `list_bones_3d`, `set_pose_3d`, `reset_pose_3d`,
`gesture_3d`, `set_emotion_3d`, `set_expression_3d`, `list_expressions_3d`, `sleep_3d`, `talk_3d`.
Модели `.vrm / .glb / .gltf / .fbx / .obj`, анимации `.vrma / .vmd / .fbx`. Режим пузыря
(круглый портрет в углу), субтитры, реакции на касания. Подробнее —
[`amadeus-live3d/README.md`](amadeus-live3d/README.md).

### `amadeus-live2d` — Live2D-персонаж

Персонаж Live2D в прозрачном окне (`companion/`), пузырь с ответом агента (орб + точки + текст с
прокруткой, автоскрытие), голос, меню по правому клику. Инструменты агента:
`list_live2d_characters`, `load_live2d_model`, `play_live2d_motion`, `set_live2d_expression`,
`live2d_return_to_idle`, `list_live2d_actions`, `live2d_speak`.

Импорт моделей: вкладка live2D → «Персонажи» → «Добавить модель» (архив, папка или файл из
«Загрузок»). Поддерживаются `.zip` (в том числе имена в Shift_JIS / GBK / Big5), `.rar` / `.7z`,
вложенные архивы и папки; все модели Cubism 3–5 в архиве; неподключённые движения и эмоции
подключаются сами; названия из VTube Studio и словаря переводятся на русский; превью рендерится с
модели; повторный импорт распознаётся как дубль. Cubism 2, проекты редактора, PSD и запароленные
архивы — с понятным объяснением.

### `amadeus-orb` — орб состояния агента

Анимированный орб в шапке чата, сам подписывается на состояние агента: `idle` / `thinking` /
`tool` / `speaking`. Для отладки: `window.amadeusOrb.set(state)`, `.setColors()`, `.setStyle()`.
Пересборка после правки `lib/agent-visuals.js`: `node amadeus-orb/build.cjs`.

### `amadeus-providers` и `amadeus-harness`

См. [`amadeus-providers/README.md`](amadeus-providers/README.md) и
[`amadeus-harness/README.md`](amadeus-harness/README.md).

## Источники моделей и анимаций

Сами модели и анимации в репозиторий **не входят** (они защищены авторским правом; папки `models/` и
`animations/` в `.gitignore`). Ниже: что использовалось при разработке и откуда оно взято. Где источник
в файлах не записан, так и сказано. Условия использования смотрите на странице источника.

**Live2D-модели** (импортированы из архивов через «Добавить модель»)

| Модель | Автор / источник |
|---|---|
| Komi | <https://shiranui-bzw-live2d.carrd.co/> (страница из READ_ME модели; модель для VTube Studio) |
| Фрирен | архив `Frieren.zip`; скорее всего оттуда же, откуда остальные (см. ниже) |
| March 7th, Kamiya Hakuko, TUBASA 014, 白发天使, 11月椿, 八千代辉夜姬, 长离, 云汐 | бесплатные модели с BOOTH, ссылки в архивах нет |

Основной источник бесплатных Live2D-моделей (а также 3D-моделей и анимаций): BOOTH, поиск <https://booth.pm/en/search/free%20live2d>.

Среда отрисовки Live2D — **Live2D Cubism Core** (`live2dcubismcore.min.js`, проприетарная, по лицензии
Live2D Inc.) и открытые обёртки вокруг неё.

**3D-модели**

| Модель | Автор / источник |
|---|---|
| Captain (`.vrm`, VRM 1.0) | VRoid Hub: <https://hub.vroid.com/en/characters/5372173277651989086/models/6729427563433839515>; лицензия из метаданных: только автор, личное некоммерческое использование, без перераспространения |

**3D-анимации** (лежат в `amadeus-live3d/companion/animations/`)

| Файлы | Откуда |
|---|---|
| `VRMA_01` … `VRMA_06` (`.vrma`) | «VRMアニメーション7種セット» (VRoid Project), бесплатно: <https://vroid.booth.pm/items/5512385>; описание формата: <https://vrm.dev/en/vrma/> |
| `Idle_*_MIXAMO_*.fbx` (разговор, оглядывание, музыка и т.п.) | Mixamo (Adobe): <https://www.mixamo.com> (нужен бесплатный аккаунт Adobe; скачивать как FBX); `Jump`, `Walking`, `Falling_*`, `Idle_Bored` лежат рядом, источник у них не записан |
| `UAL1_Standard.glb` | Universal Animation Library (Standard, CC0): <https://quaternius.itch.io/universal-animation-library>, страница пака: <https://quaternius.com/packs/universalanimationlibrary.html> |
| `Rig_Medium_General / MovementBasic / Simulation.glb` | KayKit Character Animations (CC0): <https://kaylousberg.itch.io/kaykit-character-animations> (набор Rig_Medium; точные имена файлов в пакете не проверены) |
| `foxsay`, `jikan`, `neko`, `shakeit`, `tokino`, `test_motion` (`.vmd`) | танцы в формате MMD, ссылка не записана |
| `Mew_Pose_Ver.0 - St*.uanim.json` | позы из Unity (`.anim`), конвертированные в json; ссылка не записана |

Ссылки на Quaternius, KayKit и VRoid Project подобраны по именам файлов и проверены поиском; лицензию
смотрите в самом скачанном пакете. Где ссылки нет, источник в файлах не записан.

**Где искать дальше (каталоги, откуда можно пополнять свои папки):**

- Live2D: <https://booth.pm> (поиск «Live2D モデル»), <https://nizima.com>; модели для VTube Studio — на страницах, откуда их скачивают.
- VRM-модели: <https://hub.vroid.com> (VRoid Hub, условия у каждой модели свои), <https://booth.pm> (поиск «VRM»).
- Анимации: <https://www.mixamo.com>, <https://quaternius.com/packs.html>, <https://kaylousberg.itch.io>, образцы `.vrma` на BOOTH выше.

**Библиотеки внутри плагинов:** three.js (MIT), @pixiv/three-vrm и three-vrm-animation (MIT, pixiv Inc.,
текст лицензии в `amadeus-live3d/companion/renderer/vendor/three-vrm.LICENSE`).

## Для разработчиков

- Тесты live3D: `node --test amadeus-live3d/test/voice.test.mjs` и
  `python -m unittest discover amadeus-live3d/test`.
- `build-clients.cjs` пересобирает `lib/client.js` live2D / live3D из исходников amadeus-v2 —
  нужен только тому, у кого есть его исходники; плагинам для работы не нужен.
- Тесты live2D: `node --test amadeus-live2d/test/live2d.test.mjs`.
- live2D рисует на видеокарте; если она дважды подвела (зависла при загрузке модели, теряет картинку),
  сам переходит на программный рендер (до двух ядер процессора). `AMADEUS_LIVE2D_SWIFTSHADER=1` —
  всегда программный, `=0` — всегда видеокарта; `companion/gpu.json` можно удалить, чтобы попробовать снова.
- Плагины используют скоуп `@deepseek-ai/*` ванильного DSH (`cordis`, `dsh-tools` — peer-зависимости,
  их даёт сам DSH); своих npm-зависимостей у плагинов нет.
