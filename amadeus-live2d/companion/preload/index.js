"use strict";
const electron = require("electron");
function subscribe(channel, listener) {
  const handler = (_event, ...args) => listener(...args);
  electron.ipcRenderer.on(channel, handler);
  return () => electron.ipcRenderer.off(channel, handler);
}
const api = {
  modelUrl: (modelId) => electron.ipcRenderer.invoke("model:url", modelId),
  uploadPreview: (modelId, png) => electron.ipcRenderer.invoke("preview:upload", modelId, png),
  hasPreview: (modelId) => electron.ipcRenderer.invoke("preview:exists", modelId),
  voiceTurn: (wav) => electron.ipcRenderer.invoke("voice:turn", wav),
  nextSpeech: (epoch) => electron.ipcRenderer.invoke("voice:next", epoch),
  hushSpeech: () => electron.ipcRenderer.send("voice:hush"),
  onVoiceKick: (listener) => subscribe("voice:kick", listener),
  onVoiceStop: (listener) => subscribe("voice:stop", listener),
  gpuLost: () => electron.ipcRenderer.send("gpu:lost"),
  onAudio: (listener) => subscribe("link:audio", listener),
  answerAudio: (id, answer) => electron.ipcRenderer.send("audio:answer", id, answer),
  voiceRecording: (recording) => electron.ipcRenderer.send("voice:recording", recording),
  onVoiceToggle: (listener) => subscribe("voice:toggle", listener),
  openMenu: (x, y) => electron.ipcRenderer.send("menu:open", x, y),
  menuAction: (action) => electron.ipcRenderer.send("menu:action", action),
  menuSend: (text) => electron.ipcRenderer.invoke("menu:send", text),
  voiceLevel: (level) => electron.ipcRenderer.send("voice:level", level),
  onBubbleSide: (listener) => subscribe("bubble:side", listener),
  onMenuLevel: (listener) => subscribe("menu:level", listener),
  onMenuOpen: (listener) => subscribe("menu:opened", listener),
  onMenuRecording: (listener) => subscribe("menu:recording", listener),
  displays: () => electron.ipcRenderer.invoke("screen:displays"),
  cursor: () => electron.ipcRenderer.invoke("screen:cursor"),
  bounds: () => electron.ipcRenderer.invoke("window:bounds"),
  move: (x, y) => electron.ipcRenderer.send("window:move", x, y),
  resize: (width, height) => electron.ipcRenderer.send("window:resize", width, height),
  setVisible: (visible) => electron.ipcRenderer.send("window:visible", visible),
  setInteractive: (interactive) => electron.ipcRenderer.send("window:interactive", interactive),
  windows: () => electron.ipcRenderer.invoke("desktop:windows"),
  windowBounds: (hwnd) => electron.ipcRenderer.invoke("desktop:windowBounds", hwnd),
  perch: (hwnd) => electron.ipcRenderer.invoke("desktop:perch", hwnd),
  speak: (speech) => electron.ipcRenderer.send("bubble:speak", speech),
  bubbleInteractive: (interactive) => electron.ipcRenderer.send("bubble:interactive", Boolean(interactive)),
  answer: (id, result) => electron.ipcRenderer.send("link:answer", id, result),
  settings: () => electron.ipcRenderer.invoke("link:settings-get"),
  onHelper: (listener) => subscribe("helper:event", listener),
  onDisplays: (listener) => subscribe("screen:displays", listener),
  onBehavior: (listener) => subscribe("behavior:toggle", listener),
  onSettings: (listener) => subscribe("link:settings", listener),
  onCommand: (listener) => subscribe("link:command", listener),
  onSpeech: (listener) => subscribe("bubble:speech", listener)
};
electron.contextBridge.exposeInMainWorld("amadeus", api);
