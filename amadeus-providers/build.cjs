// Builds lib/client.js from lib/client.src.js: the shared "aui" settings CSS is taken from the
// amadeus-live3d client, so every Amadeus settings page looks the same.
'use strict';
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'lib', 'client.src.js');
const OUT = path.join(__dirname, 'lib', 'client.js');
const AUI_SOURCE = path.join(__dirname, '..', 'amadeus-live3d', 'lib', 'client.js');

const live3d = fs.readFileSync(AUI_SOURCE, 'utf8');
const m = live3d.match(/var AUI_CSS = (".*?");\n/s);
if (!m) throw new Error('AUI_CSS not found in ' + AUI_SOURCE);

const out = fs.readFileSync(SRC, 'utf8').replace('__AUI_CSS__', () => m[1]);
fs.writeFileSync(OUT, out);
console.log('built', OUT, out.length, 'bytes');
