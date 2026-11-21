"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("amadeusShell", {
  /** The folder the user picks in the system dialog (a new one can be made there too), or null. */
  pickFolder: (start) => electron.ipcRenderer.invoke("app:pickFolder", start ?? "")
});
