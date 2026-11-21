const api = window.amadeus;
const menu = document.getElementById("menu");
const composer = document.getElementById("composer");
const sizer = document.getElementById("sizer");
const text = document.getElementById("text");
const send = document.getElementById("send");
const hint = document.getElementById("hint");
const attach = document.getElementById("attach");
const attachmentsList = document.getElementById("attachments");
const queueHead = document.getElementById("queue-head");
const queueToggle = document.getElementById("queue-enabled");
const queueList = document.getElementById("queue");
const scale = document.getElementById("scale");
const scaleValue = document.getElementById("scale-value");
const status = document.getElementById("status");
const chatStatus = document.getElementById("chat-status");
const closeButton = document.getElementById("close");
const radial = document.querySelector(".radial");
const icons = document.getElementById("icons");
const CENTER = { x: -180, y: 146 };
const ICON_RADIUS = 240;
const SPAN = 14;
function startAngle(index) {
  return -32 + index * 16 + 1;
}
function arcPoint(radius, degrees) {
  const radians = degrees * Math.PI / 180;
  return [CENTER.x + radius * Math.cos(radians), CENTER.y + radius * Math.sin(radians)];
}
function segmentPath(index, growth2) {
  const start = startAngle(index) - growth2 * 0.35;
  const span = SPAN + growth2 * 0.7;
  const outer = 260 + growth2 * 4;
  const inner = 220 - growth2 * 4;
  const [ox1, oy1] = arcPoint(outer, start);
  const [ox2, oy2] = arcPoint(outer, start + span);
  const [ix2, iy2] = arcPoint(inner, start + span);
  const [ix1, iy1] = arcPoint(inner, start);
  return `M ${ox1} ${oy1} A ${outer} ${outer} 0 0 1 ${ox2} ${oy2} L ${ix2} ${iy2} A ${inner} ${inner} 0 0 0 ${ix1} ${iy1} Z`;
}
function gear() {
  const points = [];
  for (let index = 0; index < 32; index += 1) {
    const angle = Math.PI * 2 * index / 32;
    const radius = index % 4 === 1 || index % 4 === 2 ? 11 : 8.5;
    points.push(`${(Math.cos(angle) * radius).toFixed(2)} ${(Math.sin(angle) * radius).toFixed(2)}`);
  }
  return `M ${points.join(" L ")} Z`;
}
const MIC_X = [-8, -4, 0, 4, 8];
const MIC_WEIGHT = [0.4, 0.75, 1, 0.7, 0.4];
function micBars(amplitude) {
  return MIC_X.map((x, index) => {
    const height = amplitude > 0 ? 4 + 17 * amplitude * MIC_WEIGHT[index] : 4 + 10 * MIC_WEIGHT[index];
    return `M ${x} ${(-height / 2).toFixed(2)} V ${(height / 2).toFixed(2)}`;
  }).join(" ");
}
const ICONS = {
  0: '<path d="M -9 -8 H 9 Q 11 -8 11 -6 V 5 Q 11 7 9 7 H -3 L -8 11 V 7 Q -11 7 -11 4 V -6 Q -11 -8 -9 -8 Z"/><circle class="point" cx="-5" cy="0" r="0.9"/><circle class="point" cx="0" cy="0" r="0.9"/><circle class="point" cx="5" cy="0" r="0.9"/>',
  1: `<g class="mic-idle"><path d="${micBars(0)}"/><path class="muted" d="M -10 11 L 10 -11"/></g><g class="mic-active"><path d="${micBars(0)}"/><circle class="dot" cx="13" cy="-13" r="2.5"/></g>`,
  2: `<path d="${gear()}"/><circle cx="0" cy="0" r="3.5"/>`,
  3: '<path d="M -3 3 L -10 10 M -4 10 L -10 10 M -10 4 L -10 10 M 3 -3 L 10 -10 M 4 -10 L 10 -10 M 10 -4 L 10 -10"/>'
};
const segments = Array.from(document.querySelectorAll(".segment"));
const iconsByIndex = segments.map((_, index) => {
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.setAttribute("class", "icon");
  group.innerHTML = ICONS[index] ?? "";
  icons.appendChild(group);
  return group;
});
const growth = segments.map(() => 0);
const animations = /* @__PURE__ */ new Map();
let animationFrame = 0;
const micBarsPath = iconsByIndex[1].querySelector(".mic-active path");
api.onMenuLevel((level) => {
  if (!micBarsPath || !radial.classList.contains("recording")) return;
  micBarsPath.setAttribute("d", micBars(Math.min(1, Math.sqrt(Math.max(0, level)) * 2.5)));
});
function iconTransform(index, value) {
  const [x, y] = arcPoint(ICON_RADIUS, startAngle(index) + SPAN / 2);
  const size = 0.8 + value * 0.06;
  return `translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${size.toFixed(3)})`;
}
function setGrowth(index, value) {
  growth[index] = value;
  segments[index].setAttribute("d", segmentPath(index, value));
  iconsByIndex[index].setAttribute("transform", iconTransform(index, value));
}
function animateGrowth(index, target) {
  animations.set(index, { from: growth[index] ?? 0, to: target, started: performance.now() });
  if (!animationFrame) animationFrame = requestAnimationFrame(step);
}
function step(now) {
  let active = false;
  for (const [index, state] of animations) {
    const progress = Math.min(1, (now - state.started) / 150);
    const eased = 1 - (1 - progress) ** 3;
    setGrowth(index, state.from + (state.to - state.from) * eased);
    if (progress < 1) active = true;
    else animations.delete(index);
  }
  animationFrame = active ? requestAnimationFrame(step) : 0;
}
segments.forEach((segment, index) => {
  setGrowth(index, 0);
  segment.addEventListener("mouseenter", () => animateGrowth(index, 1));
  segment.addEventListener("mouseleave", () => animateGrowth(index, 0));
  segment.addEventListener("focus", () => animateGrowth(index, 1));
  segment.addEventListener("blur", () => animateGrowth(index, 0));
  segment.addEventListener("click", () => activate(index));
  segment.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activate(index);
    }
  });
});
function activate(index) {
  if (index === 0) open(composer.hidden ? "chat" : null);
  else if (index === 3) open(sizer.hidden ? "size" : null);
  else if (index === 1) api.menuAction("microphone");
  else api.menuAction("settings");
}
function open(panel) {
  composer.hidden = panel !== "chat";
  sizer.hidden = panel !== "size";
  segments[0].classList.toggle("selected", panel === "chat");
  segments[3].classList.toggle("selected", panel === "size");
  if (panel === "chat") {
    text.focus();
    startPolling();
  } else {
    stopPolling();
  }
  resize();
}
function resize() {
  requestAnimationFrame(() => {
    const rect = menu.getBoundingClientRect();
    api.menuSize(Math.ceil(rect.width), Math.ceil(rect.height));
  });
}
function say(message, error = false) {
  chatStatus.textContent = message || "Файлы можно перетащить сюда";
  chatStatus.classList.toggle("error", error);
  resize();
}
function note(message) {
  status.textContent = message;
  status.hidden = !message;
  resize();
}
function updateShape() {
  const base = radial.getBoundingClientRect();
  const rects = [];
  const add = (left, top, right, bottom) => {
    rects.push({
      x: Math.floor(left) - 2,
      y: Math.floor(top) - 2,
      width: Math.ceil(right - left) + 4,
      height: Math.ceil(bottom - top) + 4
    });
  };
  for (let index = 0; index < segments.length; index += 1) {
    const start = startAngle(index);
    for (let offset = 0; offset < SPAN; offset += 3) {
      const from = start + offset;
      const to = Math.min(start + SPAN, from + 3);
      const points = [arcPoint(220, from), arcPoint(260, from), arcPoint(220, to), arcPoint(260, to)];
      const xs = points.map((point) => base.left + point[0]);
      const ys = points.map((point) => base.top + point[1]);
      add(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys));
    }
  }
  for (const element of [closeButton, status, composer, sizer]) {
    if (element.hidden) continue;
    const box = element.getBoundingClientRect();
    if (!box.width || !box.height) continue;
    add(box.left, box.top, box.right, box.bottom);
  }
  api.menuShape(rects);
}
api.onMenuResized(() => updateShape());
let attachments = [];
function renderAttachments() {
  attachmentsList.hidden = attachments.length === 0;
  attachmentsList.replaceChildren();
  for (const attachment of attachments) {
    const row = document.createElement("li");
    row.className = "attachment";
    const name = document.createElement("span");
    name.textContent = attachment.name;
    name.title = attachment.name;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.title = `Убрать ${attachment.name}`;
    remove.setAttribute("aria-label", remove.title);
    remove.innerHTML = '<svg viewBox="-8 -8 16 16" aria-hidden="true"><path d="M -5 -5 L 5 5 M -5 5 L 5 -5"/></svg>';
    remove.addEventListener("click", () => void removeAttachment(attachment));
    row.append(name, remove);
    attachmentsList.append(row);
  }
  attach.disabled = attachments.length >= 5;
  resize();
}
async function uploadFiles(list) {
  const chosen = Array.from(list);
  if (!chosen.length) return;
  if (attachments.length + chosen.length > 5) {
    say("Можно прикрепить не больше 5 файлов.", true);
    return;
  }
  say("Загружаю файлы…");
  const payload = await Promise.all(chosen.map(async (file) => ({ name: file.name, data: await file.arrayBuffer() })));
  const result = await api.menuUpload(payload);
  if (!result.ok) {
    say(result.error ?? "Не удалось прикрепить файлы.", true);
    return;
  }
  attachments = [...attachments, ...result.files];
  renderAttachments();
  say("Файлы прикреплены");
}
async function removeAttachment(attachment) {
  attachments = attachments.filter((item) => item.id !== attachment.id);
  renderAttachments();
  const result = await api.menuDeleteFile(attachment.id);
  if (!result.ok) say(result.error ?? "Не удалось убрать файл.", true);
}
attach.addEventListener("click", () => void pickFiles());
async function pickFiles() {
  if (attach.disabled) return;
  say("Выбираю файлы…");
  const result = await api.menuPick();
  if (!result.ok) {
    say(result.error ?? "Не удалось прикрепить файлы.", true);
    return;
  }
  if (!result.files.length) {
    say("");
    return;
  }
  attachments = [...attachments, ...result.files].slice(0, 5);
  renderAttachments();
  say("Файлы прикреплены");
}
composer.addEventListener("dragover", (event) => {
  if (!event.dataTransfer?.types.includes("Files")) return;
  event.preventDefault();
  event.dataTransfer.dropEffect = "copy";
});
composer.addEventListener("drop", (event) => {
  if (!event.dataTransfer?.files.length) return;
  event.preventDefault();
  void uploadFiles(event.dataTransfer.files);
});
let queue = { items: [], enabled: true, busy: false, nativeSteer: false };
let queueTimer = 0;
let queueSignature = "";
let editing = null;
function startPolling() {
  stopPolling();
  void refreshQueue();
  queueTimer = window.setInterval(() => {
    void refreshQueue();
  }, 1500);
}
function stopPolling() {
  if (!queueTimer) return;
  window.clearInterval(queueTimer);
  queueTimer = 0;
}
async function refreshQueue() {
  const result = await api.menuQueue();
  if (!result.ok || !result.queue) return;
  queue = result.queue;
  renderQueue();
}
function smallButton(label, action) {
  const element = document.createElement("button");
  element.type = "button";
  element.textContent = label;
  element.addEventListener("click", action);
  return element;
}
function renderQueue() {
  const signature = JSON.stringify([queue.items.map((item) => [item.id, item.text, item.status, item.error]), queue.enabled, queue.nativeSteer, editing]);
  if (signature === queueSignature) {
    updateHint();
    return;
  }
  queueSignature = signature;
  const items = queue.items;
  queueHead.hidden = items.length === 0;
  queueList.hidden = items.length === 0;
  queueToggle.checked = queue.enabled;
  queueList.replaceChildren();
  for (const item of items) {
    const row = document.createElement("div");
    row.className = "queue-row";
    if (editing === item.id) {
      const editor = document.createElement("textarea");
      editor.className = "queue-editor";
      editor.value = item.text;
      const actions2 = document.createElement("div");
      actions2.className = "queue-actions";
      const save = smallButton("Сохранить", () => void saveQueued(item.id, editor.value));
      const cancel = smallButton("Отмена", () => {
        editing = null;
        renderQueue();
      });
      actions2.append(save, cancel);
      row.append(editor, actions2);
      queueList.append(row);
      editor.focus();
      continue;
    }
    const label = document.createElement("span");
    label.className = "queue-text";
    label.textContent = item.text || `Вложения: ${item.attachmentIds.length}`;
    label.title = item.text;
    const actions = document.createElement("div");
    actions.className = "queue-actions";
    const busyRow = item.status === "sending";
    const steer = smallButton("Скорректировать", () => void queueAction(item.id, "steer"));
    steer.title = queue.nativeSteer ? "Передать уточнение текущему запуску Codex" : "Остановить текущий ответ и продолжить с уточнением";
    const edit = smallButton("Изменить", () => {
      editing = item.id;
      renderQueue();
    });
    const remove = smallButton("Удалить", () => void queueAction(item.id, "delete"));
    for (const button of [steer, edit, remove]) button.disabled = busyRow;
    actions.append(steer, edit, remove);
    row.append(label, actions);
    if (item.error) {
      const error = document.createElement("span");
      error.className = "queue-note";
      error.textContent = item.error;
      row.append(error);
    }
    queueList.append(row);
  }
  updateHint();
  if (!composer.hidden) resize();
}
function updateHint() {
  const busy = queue.busy || queue.items.length > 0;
  hint.innerHTML = !busy ? "Enter — отправить<br>Shift+Enter — новая строка" : queue.enabled ? "Enter — в очередь<br>Ctrl+Enter — скорректировать" : "Enter — скорректировать<br>Shift+Enter — новая строка";
  send.title = busy ? queue.enabled ? "Поставить в очередь" : "Скорректировать текущий ответ" : "Отправить сообщение";
  send.setAttribute("aria-label", send.title);
}
async function queueAction(id, action) {
  const result = await api.menuQueueAction(id, action);
  if (!result.ok) {
    say(result.error ?? "Не удалось изменить очередь.", true);
    return;
  }
  await refreshQueue();
}
async function saveQueued(id, value) {
  if (!value.trim()) {
    say("Пустое сообщение.", true);
    return;
  }
  const result = await api.menuQueueAction(id, "save", value.trim());
  if (!result.ok) {
    say(result.error ?? "Не удалось изменить сообщение.", true);
    return;
  }
  editing = null;
  await refreshQueue();
}
queueToggle.addEventListener("change", () => {
  void api.menuQueueEnabled(queueToggle.checked).then((result) => {
    if (!result.ok) say(result.error ?? "Не удалось сохранить настройку.", true);
    else void refreshQueue();
  });
});
async function submit(steer = false) {
  const value = text.value.trim();
  if (send.disabled || !value && !attachments.length) return;
  send.disabled = true;
  say("");
  const result = await api.menuSend(value, attachments.map((item) => item.id), steer);
  send.disabled = false;
  if (!result.ok) {
    say(result.error ?? "Не удалось отправить сообщение.", true);
    return;
  }
  text.value = "";
  attachments = [];
  renderAttachments();
  say("Отправлено — ответ появится рядом с персонажем.");
  void refreshQueue();
  window.setTimeout(() => api.menuAction("close"), 900);
}
send.addEventListener("click", () => void submit());
text.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" || event.isComposing) return;
  if (event.ctrlKey) {
    event.preventDefault();
    void submit(true);
    return;
  }
  if (event.shiftKey) return;
  event.preventDefault();
  const busy = queue.busy || queue.items.length > 0;
  void submit(busy && !queue.enabled);
});
let scaleTimer = 0;
function paintScale() {
  const value = Number(scale.value);
  scaleValue.textContent = `${value}%`;
  scale.style.setProperty("--fill", `${(value - 50) / 150 * 100}%`);
}
scale.addEventListener("input", () => {
  paintScale();
  api.menuScalePreview(Number(scale.value) / 100);
  window.clearTimeout(scaleTimer);
  scaleTimer = window.setTimeout(() => {
    void api.menuScale(Number(scale.value) / 100).then((result) => {
      if (!result.ok) note(result.error ?? "Не удалось сохранить размер.");
    });
  }, 300);
});
closeButton.addEventListener("click", () => api.menuAction("close"));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") api.menuAction("close");
});
window.addEventListener("blur", () => stopPolling());
api.onMenuOpen((state) => {
  open(null);
  editing = null;
  say("");
  note("");
  scale.value = String(Math.round(state.scale * 100));
  paintScale();
  segments[1].classList.toggle("selected", state.recording);
  radial.classList.toggle("recording", state.recording);
  if (micBarsPath) micBarsPath.setAttribute("d", micBars(0));
  const label = state.recording ? "Остановить и отправить запись" : "Включить микрофон";
  segments[1].setAttribute("aria-label", label);
  const title = segments[1].querySelector("title");
  if (title) title.textContent = label;
  note(state.recording ? "Слушаю… Нажми ещё раз,\nчтобы отправить запись" : "");
  resize();
});
paintScale();
updateHint();
renderAttachments();
