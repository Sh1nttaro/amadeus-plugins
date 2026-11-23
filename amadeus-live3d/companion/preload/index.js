// Preload for the amadeus-live3d overlay (renderer/pet.html).
const { contextBridge, ipcRenderer } = require('electron');

function subscribe(channel, fn) {
  const handler = (_event, ...args) => fn(...args);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.off(channel, handler);
}

contextBridge.exposeInMainWorld('amadeus', {
  onCommand: (fn) => subscribe('link:command', fn),
  answer: (id, result) => ipcRenderer.send('link:answer', id, result),
  onWorld: (fn) => subscribe('pet:world', fn),
  onSettings: (fn) => subscribe('pet:settings', fn),
  settings: () => ipcRenderer.invoke('pet:settings'),
  cursor: () => ipcRenderer.invoke('pet:cursor'),
  setInteractive: (on) => ipcRenderer.send('pet:interactive', Boolean(on)),
  menu: (state) => ipcRenderer.send('pet:menu', state),
  log: (msg) => ipcRenderer.send('pet:log', String(msg)),
  synthesize: (req) => ipcRenderer.invoke('voice:synthesize', req),
  voiceListen: (wav, follow, onlyStop, session) => ipcRenderer.invoke('voice:listen', wav, !!follow, !!onlyStop, String(session || '')),
  voiceOnset: () => ipcRenderer.send('voice:onset'),
  voiceTurn: (wav) => ipcRenderer.invoke('voice:turn', wav),
  onVoiceToggle: (fn) => subscribe('voice:toggle', fn),
  patch: (p) => ipcRenderer.send('pet:patch', p),
});
