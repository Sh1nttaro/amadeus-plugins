// Minimal preload for the amadeus-live3d companion (3D window only).
// 3d.html's bridge uses exactly two APIs: onCommand + answer.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('amadeus', {
  onCommand: (fn) => {
    ipcRenderer.on('link:command', (_event, id, command) => fn(id, command));
  },
  answer: (id, result) => {
    ipcRenderer.send('link:answer', id, result);
  },
  // minimal window controls (used by nothing yet, harmless + forward-compatible)
  move: (x, y) => ipcRenderer.send('window:move', x, y),
  bounds: () => ipcRenderer.invoke('window:bounds'),
});
