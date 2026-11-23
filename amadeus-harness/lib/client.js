window.__ModuleLoader__.load({
  id: "amadeus-harness",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
    var react = require("react");
    var jsx = react.createElement;
    var reactDom = null;
    try { reactDom = require("react-dom"); } catch (e) { reactDom = null; }

    var AUI_CSS = ".aui-page{--aui-accent:var(--dsw-alias-state-business-primary,#8b7cf6);--aui-line:var(--dsw-alias-border-l3,#ffffff1f);--aui-text:var(--dsw-alias-label-primary,#ededf0);--aui-muted:var(--dsw-alias-label-caption,#9a98a3);--aui-hover:var(--dsw-alias-interactive-bg-hover,#ffffff0d);--aui-bg:var(--dsw-alias-bg-base,transparent);display:flex;flex-direction:column;gap:16px;width:100%;max-width:880px;padding:4px 0 24px;color:var(--aui-text);font-size:14px}.aui-stack{display:flex;flex-direction:column;gap:16px}.aui-hero{display:flex;align-items:center;gap:16px;padding:18px 20px;border:1px solid var(--aui-line);border-radius:16px;background:radial-gradient(120% 180% at 0% 0%,color-mix(in srgb,var(--aui-accent) 16%,transparent),transparent 60%)}.aui-hero-icon{flex:none;display:flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:14px;background:color-mix(in srgb,var(--aui-accent) 18%,transparent);color:var(--aui-accent);font-weight:700;font-size:15px;letter-spacing:.02em;overflow:hidden}.aui-hero-text{display:flex;flex-direction:column;gap:3px;min-width:0}.aui-hero-title{display:flex;align-items:center;flex-wrap:wrap;gap:10px;font-size:17px;font-weight:600;line-height:24px}.aui-hero-sub{font-size:13px;line-height:18px;color:var(--aui-muted);overflow:hidden;text-overflow:ellipsis}.aui-pill{display:inline-flex;align-items:center;gap:6px;height:22px;padding:0 10px;border-radius:999px;border:1px solid var(--aui-line);font-size:12px;font-weight:500;color:var(--aui-muted)}.aui-pill-on{border-color:transparent;background:color-mix(in srgb,#3ccf8e 16%,transparent);color:#3ccf8e}.aui-pill-on::before{content:\"\";width:6px;height:6px;border-radius:50%;background:currentColor}.aui-tabs{position:sticky;top:0;z-index:2;display:flex;gap:4px;padding:4px;border:1px solid var(--aui-line);border-radius:12px;background:var(--aui-bg);overflow-x:auto;scrollbar-width:none}.aui-tab{flex:1 0 auto;height:34px;padding:0 16px;border:none;border-radius:9px;background:transparent;color:var(--aui-muted);font:inherit;font-size:13px;font-weight:500;cursor:pointer;white-space:nowrap;transition:background .15s,color .15s}.aui-tab:hover{background:var(--aui-hover);color:var(--aui-text)}.aui-tab-active,.aui-tab-active:hover{background:color-mix(in srgb,var(--aui-accent) 18%,transparent);color:var(--aui-text);font-weight:600}.aui-card{display:flex;flex-direction:column;border:1px solid var(--aui-line);border-radius:14px;overflow:hidden}.aui-card-head{padding:16px 18px 10px}.aui-card-head h3{margin:0;font-size:15px;font-weight:600;line-height:22px}.aui-card-head p{margin:2px 0 0;font-size:13px;line-height:18px;color:var(--aui-muted)}.aui-card-body{display:flex;flex-direction:column;padding:0 18px 6px}.aui-row{display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:52px;padding:10px 0;border-top:1px solid var(--aui-line)}.aui-card-body>.aui-row:first-child{border-top:none}.aui-row-disabled{opacity:.45;pointer-events:none}.aui-row-text{display:flex;flex-direction:column;gap:2px;min-width:0}.aui-row-label{font-size:14px;line-height:20px}.aui-row-hint{font-size:12px;line-height:16px;color:var(--aui-muted)}.aui-row-control{flex:none;display:flex;align-items:center;justify-content:flex-end;gap:10px;max-width:60%}.aui-switch{position:relative;display:inline-flex;cursor:pointer}.aui-switch input{position:absolute;opacity:0;width:0;height:0}.aui-switch-track{position:relative;width:40px;height:24px;border-radius:999px;background:var(--aui-line);transition:background .18s}.aui-switch-track::after{content:\"\";position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 3px #00000059;transition:transform .18s}.aui-switch input:checked+.aui-switch-track{background:var(--aui-accent)}.aui-switch input:checked+.aui-switch-track::after{transform:translateX(16px)}.aui-switch input:focus-visible+.aui-switch-track{outline:2px solid var(--aui-accent);outline-offset:2px}.aui-switch input:disabled+.aui-switch-track{opacity:.5}.aui-select{min-width:180px;max-width:100%;height:34px;padding:0 12px;border-radius:9px;border:1px solid var(--aui-line);background:var(--aui-bg);color:var(--aui-text);font:inherit;font-size:13px;cursor:pointer;text-overflow:ellipsis}.aui-select:focus{outline:none;border-color:var(--aui-accent)}.aui-select:disabled{opacity:.5;cursor:default}.aui-range{display:flex;align-items:center;gap:10px}.aui-range input{width:160px;accent-color:var(--aui-accent)}.aui-range-val{min-width:44px;text-align:right;font-variant-numeric:tabular-nums;font-size:13px;color:var(--aui-muted)}.aui-color{width:40px;height:30px;padding:2px;border:1px solid var(--aui-line);border-radius:8px;background:var(--aui-bg);cursor:pointer}.aui-seg{display:inline-flex;gap:2px;padding:3px;border:1px solid var(--aui-line);border-radius:10px}.aui-seg-btn{height:28px;padding:0 12px;border:none;border-radius:7px;background:transparent;color:var(--aui-muted);font:inherit;font-size:13px;cursor:pointer;font-variant-numeric:tabular-nums}.aui-seg-btn:hover:not(:disabled){color:var(--aui-text);background:var(--aui-hover)}.aui-seg-btn-active,.aui-seg-btn-active:hover:not(:disabled){background:var(--aui-accent);color:#fff}.aui-seg-btn:disabled{cursor:default}.aui-btn{height:34px;padding:0 14px;border-radius:9px;border:1px solid var(--aui-line);background:transparent;color:var(--aui-text);font:inherit;font-size:13px;cursor:pointer;white-space:nowrap;transition:background .15s}.aui-btn:hover{background:var(--aui-hover)}.aui-btn-primary{border-color:transparent;background:var(--aui-accent);color:#fff}.aui-btn-primary:hover{background:color-mix(in srgb,var(--aui-accent) 85%,#fff)}.aui-btn-danger{border-color:transparent;background:#f43f5e;color:#fff}.aui-btn:disabled{opacity:.5;cursor:default}.aui-inline{display:flex;align-items:center;gap:10px}.aui-level{width:120px;height:6px;border-radius:999px;background:var(--aui-line);overflow:hidden}.aui-level i{display:block;height:100%;width:0;background:var(--aui-accent);transition:width .08s linear}.aui-ptt-wrap{padding:4px 0 12px}.aui-ptt{width:100%;height:46px;border-radius:12px;border:1px dashed var(--aui-line);background:transparent;color:var(--aui-text);font:inherit;font-size:14px;cursor:pointer;user-select:none;touch-action:none;transition:background .15s}.aui-ptt:hover{background:var(--aui-hover)}.aui-ptt-on{border-style:solid;border-color:transparent;background:var(--aui-accent);color:#fff}.aui-hidden{display:none}.aui-note{margin:0 18px 14px;padding:8px 12px;border-radius:9px;background:var(--aui-hover);font-size:13px;line-height:18px;color:var(--aui-muted)}.aui-note-error{background:color-mix(in srgb,#f43f5e 12%,transparent);color:#f38f9c}.aui-choices{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;padding:6px 0 14px}.aui-choice{display:flex;flex-direction:column;align-items:flex-start;gap:4px;padding:12px;border:1px solid var(--aui-line);border-radius:12px;background:transparent;color:var(--aui-text);font:inherit;text-align:left;cursor:pointer;transition:border-color .15s,background .15s}.aui-choice:hover:not(:disabled){background:var(--aui-hover)}.aui-choice-active{border-color:var(--aui-accent);box-shadow:0 0 0 1px var(--aui-accent);background:color-mix(in srgb,var(--aui-accent) 8%,transparent)}.aui-choice:disabled{cursor:default}.aui-choice-title{font-size:14px;font-weight:600;line-height:20px}.aui-choice-sub{font-size:12px;line-height:16px;color:var(--aui-muted)}.aui-choice-art{display:flex;align-items:center;gap:10px;width:100%;height:64px;margin-bottom:6px;padding:0 12px;box-sizing:border-box;border-radius:10px;background:#1c1a24}.aui-choice-art-orb{justify-content:center}.aui-mini-orb{flex:none;display:block;width:30px;height:30px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#d9cfff,#9a83f0 45%,#5d4bb3 75%,transparent 76%);box-shadow:0 0 14px #9a83f080}.aui-choice-art-orb .aui-mini-orb{width:38px;height:38px}.aui-mini-lines{display:flex;flex-direction:column;gap:5px;flex:1}.aui-mini-lines b{display:block;height:5px;border-radius:3px;background:#ffffff38}.aui-mini-lines b:nth-child(2){width:80%}.aui-mini-lines b:nth-child(3){width:55%}.aui-split{display:grid;grid-template-columns:minmax(0,1fr) 260px;gap:20px;align-items:center;padding-bottom:12px}.aui-split-rows{display:flex;flex-direction:column}.aui-split-rows>.aui-row:first-child{border-top:none}.aui-bubble-preview{display:flex;align-items:center;justify-content:center;padding:16px;border-radius:12px;background:repeating-conic-gradient(#ffffff08 0 25%,transparent 0 50%) 0 0/16px 16px}.aui-bubble-sample{width:100%;padding:12px 14px;border-radius:16px;border:1px solid #b5a3f563;box-sizing:border-box}.aui-bubble-sample-head{display:flex;align-items:center;gap:10px;margin-bottom:8px}.aui-bubble-sample-cap{font-size:9px;font-weight:700;letter-spacing:.16em;opacity:.65}.aui-bubble-sample-status{font-size:13px;font-weight:700;color:#bf9bff}.aui-bubble-sample-text{line-height:1.45;max-height:90px;overflow:hidden}@media (max-width:640px){.aui-row{flex-direction:column;align-items:stretch;gap:8px}.aui-row-control{max-width:none;justify-content:flex-start}.aui-choices,.aui-split{grid-template-columns:1fr}.aui-range input{flex:1;width:auto}}.aui-page .amadeus-characters{padding:0}.aui-page .amadeus-characters-search,.aui-page .amadeus-characters-add{height:36px;border-radius:10px}.aui-page .amadeus-characters-grid{grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:14px}.aui-page .amadeus-character-card{border-radius:14px}.aui-card-head-row{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.aui-orb-hero{align-items:center;gap:22px}.aui-orb-stage{flex:none;display:flex;align-items:center;justify-content:center;width:150px;height:150px;border-radius:18px;background:radial-gradient(circle at 50% 45%,#ffffff0d,transparent 70%),#16151b}.aui-orb-hero .aui-hero-text{gap:8px}.aui-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}.aui-chip{display:inline-flex;align-items:center;gap:7px;height:30px;padding:0 12px;border-radius:999px;border:1px solid var(--aui-line);background:transparent;color:var(--aui-muted);font:inherit;font-size:12.5px;cursor:pointer;transition:background .15s,color .15s,border-color .15s}.aui-chip:hover{background:var(--aui-hover);color:var(--aui-text)}.aui-chip-active,.aui-chip-active:hover{border-color:var(--aui-accent);background:color-mix(in srgb,var(--aui-accent) 14%,transparent);color:var(--aui-text);font-weight:600}.aui-chip-dot{flex:none;width:9px;height:9px;border-radius:50%;box-shadow:0 0 0 2px #00000026}.aui-gradient{display:flex;width:120px;height:30px;border-radius:8px;overflow:hidden;border:1px solid var(--aui-line)}.aui-gradient>span{flex:1}.aui-toolbar{display:flex;gap:8px;align-items:center}.aui-search{flex:1;min-width:0;height:36px;padding:0 12px;border-radius:10px;border:1px solid var(--aui-line);background:var(--aui-bg);color:var(--aui-text);font:inherit;font-size:14px}.aui-search:focus{outline:none;border-color:var(--aui-accent)}@media (max-width:640px){.aui-orb-hero{flex-direction:column;align-items:flex-start}}.aui-card-pad{padding:0 18px 18px}.aui-row-text{flex:1 1 140px}.aui-split-rows .aui-row{flex-wrap:wrap;gap:8px 16px}.aui-split-rows .aui-row-control{max-width:none}.aui-range input{width:140px}.aui-split{grid-template-columns:minmax(220px,1fr) auto;align-items:start}.aui-live-preview{display:flex;flex-direction:column;align-items:center;gap:12px}.aui-live-stage{display:flex;align-items:center;justify-content:center;width:360px;max-width:100%;height:320px;border-radius:12px;background:repeating-conic-gradient(#ffffff0a 0 25%,transparent 0 50%) 0 0/16px 16px,#141318;overflow:hidden}.aui-live-frame{display:block;border:0;background:transparent;color-scheme:normal}.aui-live-phases{flex-wrap:wrap;justify-content:center}@media (max-width:900px){.aui-split{grid-template-columns:1fr}.aui-live-preview{order:-1}}.aui-note-inline{margin:0 0 12px}.aui-empty{padding:28px 12px;border:1px dashed var(--aui-line);border-radius:12px;text-align:center;font-size:13px;line-height:19px;color:var(--aui-muted)}.aui-empty-tight{margin:0 18px 18px;padding:14px}.aui-gallery-search{width:100%;box-sizing:border-box;margin-bottom:14px}.aui-gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px}.aui-model{position:relative;display:block;aspect-ratio:3/4;border-radius:14px;overflow:hidden;cursor:pointer;background:linear-gradient(160deg,color-mix(in srgb,var(--aui-accent) 14%,#1b1a21),#141318);border:1px solid var(--aui-line);outline:none;transition:transform .16s ease,box-shadow .16s ease,border-color .16s}.aui-model:hover{transform:translateY(-3px);box-shadow:0 10px 24px #00000052}.aui-model:focus-visible{box-shadow:0 0 0 2px var(--aui-accent)}.aui-model-active{border-color:var(--aui-accent);box-shadow:0 0 0 2px var(--aui-accent),0 10px 28px color-mix(in srgb,var(--aui-accent) 30%,transparent);cursor:default}.aui-model-active:hover{transform:none}.aui-model-art{position:absolute;inset:0;display:block}.aui-model-art img{width:100%;height:100%;object-fit:cover;object-position:top center;display:block;transition:transform .3s ease}.aui-model:hover .aui-model-art img{transform:scale(1.04)}.aui-model-art .amadeus-character-preview-empty{display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:44px;font-weight:700;color:#ffffff40}.aui-model-meta{position:absolute;left:0;right:0;bottom:0;display:flex;flex-direction:column;gap:2px;padding:34px 12px 11px;background:linear-gradient(to top,#000000d9,#00000080 55%,transparent);color:#fff}.aui-model-name{font-size:14px;font-weight:600;line-height:19px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.aui-model-sub{font-size:11.5px;line-height:15px;color:#ffffffb3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.aui-model-flag{position:absolute;top:8px;left:8px;display:inline-flex;align-items:center;gap:5px;height:22px;padding:0 9px;border-radius:999px;background:var(--aui-accent);color:#fff;font-size:11px;font-weight:600;box-shadow:0 2px 8px #0000004d}.aui-model-flag::before{content:\"\";width:6px;height:6px;border-radius:50%;background:#fff}.aui-model-remove{position:absolute;top:8px;right:8px;width:26px;height:26px;border:none;border-radius:8px;background:#00000080;color:#fff;font-size:17px;line-height:1;cursor:pointer;opacity:0;transition:opacity .15s,background .15s;backdrop-filter:blur(4px)}.aui-model:hover .aui-model-remove,.aui-model:focus-within .aui-model-remove{opacity:1}.aui-model-remove:hover{background:#f43f5e}.aui-model-skeleton{cursor:default;animation:aui-pulse 1.4s ease-in-out infinite}@keyframes aui-pulse{50%{opacity:.5}}.aui-active-head{display:flex;align-items:center;gap:14px;padding:16px 18px}.aui-active-thumb{flex:none;width:56px;height:56px;border-radius:12px;overflow:hidden;background:#1b1a21}.aui-active-thumb img{width:100%;height:100%;object-fit:cover;object-position:top center;display:block}.aui-active-thumb .amadeus-character-preview-empty{display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:22px;font-weight:700;color:#ffffff59}.aui-active-head .aui-hero-text{flex:1}.aui-active-name{font-size:16px;font-weight:600;line-height:22px}.aui-actions{display:flex;flex-direction:column;gap:10px;padding:0 18px 16px}.aui-action-row{display:flex;align-items:flex-start;gap:12px;padding-top:10px;border-top:1px solid var(--aui-line)}.aui-action-label{flex:none;width:96px;padding-top:6px;font-size:12px;color:var(--aui-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.aui-action-chips{display:flex;flex-wrap:wrap;gap:6px;min-width:0}.aui-action{height:28px;padding:0 11px;border-radius:999px;border:1px solid var(--aui-line);background:transparent;color:var(--aui-text);font:inherit;font-size:12.5px;cursor:pointer;white-space:nowrap;transition:background .15s,border-color .15s}.aui-action:hover:not(:disabled){border-color:var(--aui-accent);background:color-mix(in srgb,var(--aui-accent) 12%,transparent)}.aui-action-emotion{color:color-mix(in srgb,var(--aui-accent) 70%,var(--aui-text))}.aui-action:disabled{opacity:.5;cursor:default}@media (max-width:640px){.aui-action-row{flex-direction:column;gap:6px}.aui-action-label{width:auto;padding:0}}.aui-hide-range{width:140px;accent-color:var(--aui-accent)}.aui-num{display:inline-flex;align-items:center;gap:6px;font-size:13px;color:var(--aui-muted)}.aui-num input{width:64px;height:30px;padding:0 8px;box-sizing:border-box;border-radius:8px;border:1px solid var(--aui-line);background:var(--aui-bg);color:var(--aui-text);font:inherit;font-size:13px;text-align:center;font-variant-numeric:tabular-nums}.aui-num input:focus{outline:none;border-color:var(--aui-accent)}.aui-drop{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;min-height:150px;padding:20px;border:1.5px dashed color-mix(in srgb,var(--aui-accent) 45%,var(--aui-line));border-radius:14px;background:color-mix(in srgb,var(--aui-accent) 5%,transparent);text-align:center;transition:background .15s,border-color .15s}.aui-drop-over{border-color:var(--aui-accent);background:color-mix(in srgb,var(--aui-accent) 14%,transparent)}.aui-drop-busy{flex-direction:row;gap:12px;font-size:13px;color:var(--aui-muted)}.aui-drop-icon{font-size:26px;line-height:1;color:var(--aui-accent)}.aui-drop-title{font-size:15px;font-weight:600}.aui-drop-or{font-size:12px;color:var(--aui-muted)}.aui-spinner{width:18px;height:18px;border-radius:50%;border:2px solid var(--aui-line);border-top-color:var(--aui-accent);animation:aui-spin .8s linear infinite;flex:none}@keyframes aui-spin{to{transform:rotate(360deg)}}.aui-results{display:flex;flex-direction:column;gap:6px;margin-top:12px}.aui-results-group{display:flex;flex-direction:column;gap:6px}.aui-result{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 10px;padding:9px 12px;border-radius:10px;background:var(--aui-hover);font-size:13px;line-height:18px}.aui-result b{font-weight:600}.aui-result span{color:var(--aui-muted)}.aui-result-ok{background:color-mix(in srgb,#3ccf8e 12%,transparent)}.aui-result-ok b{color:#3ccf8e}.aui-result-err{background:color-mix(in srgb,#f43f5e 10%,transparent)}.aui-result-err b{color:#f38f9c}.aui-downloads{display:flex;flex-direction:column;margin-top:16px}.aui-downloads-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-bottom:8px;font-size:12px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--aui-muted)}.aui-link{border:none;background:none;padding:0;color:var(--aui-accent);font:inherit;font-size:12px;font-weight:500;text-transform:none;letter-spacing:0;cursor:pointer}.aui-link:hover{text-decoration:underline}.aui-dl{display:flex;align-items:center;gap:10px;padding:9px 0;border-top:1px solid var(--aui-line)}.aui-dl-text{display:flex;flex-direction:column;gap:1px;flex:1;min-width:0}.aui-dl-name{font-size:13.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.aui-tag{flex:none;display:inline-flex;align-items:center;height:22px;padding:0 9px;border-radius:999px;font-size:11.5px;font-weight:600;white-space:nowrap}.aui-tag-ok{background:color-mix(in srgb,#3ccf8e 15%,transparent);color:#3ccf8e}.aui-tag-warn{background:color-mix(in srgb,#f1b76b 16%,transparent);color:#f1b76b}.aui-tag-off{background:var(--aui-hover);color:var(--aui-muted)}.aui-chip-input{height:28px;width:130px;padding:0 10px;border-radius:999px;border:1px dashed var(--aui-accent);background:transparent;color:var(--aui-text);font:inherit;font-size:12.5px}.aui-chip-input:focus{outline:none;border-style:solid;background:color-mix(in srgb,var(--aui-accent) 10%,transparent)}.aui-name-input{height:32px;max-width:100%;padding:0 10px;border-radius:9px;border:1px dashed var(--aui-accent);background:transparent;color:var(--aui-text);font:inherit;font-size:16px;font-weight:600}.aui-name-input:focus{outline:none;border-style:solid}.aui-edit-hint{padding:0 18px 10px}.aui-card{background:color-mix(in srgb,var(--aui-text) 2.5%,transparent)}.aui-card-head{padding:16px 18px 8px}.aui-card-head p{font-size:12.5px;max-width:96ch}.aui-row{min-height:46px;padding:9px 0;border-top-color:color-mix(in srgb,var(--aui-line) 65%,transparent)}.aui-row-label{font-weight:500}.aui-row-hint{max-width:60ch}.aui-tabs{background:color-mix(in srgb,var(--aui-bg) 88%,transparent);backdrop-filter:blur(10px)}.aui-tab{height:32px}.aui-tab-active,.aui-tab-active:hover{background:color-mix(in srgb,var(--aui-accent) 20%,transparent);color:var(--aui-accent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--aui-accent) 40%,transparent)}.aui-hero{padding:16px 18px}.aui-hero-icon{width:52px;height:52px}.aui-hero-icon img{width:100%;height:100%;object-fit:cover;object-position:50% 8%;display:block}.aui-select{appearance:none;-webkit-appearance:none;padding-right:30px;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath d='M2.5 4.5 6 8l3.5-3.5' fill='none' stroke='%23a3a7ad' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\");background-repeat:no-repeat;background-position:right 10px center;background-size:12px}.aui-select option{background:#1b1b1e;color:#f5f5f7}.aui-seg-btn{height:26px}.aui-chip,.aui-action{height:28px}.aui-chip:hover{border-color:color-mix(in srgb,var(--aui-accent) 50%,var(--aui-line))}.aui-tab:focus-visible,.aui-btn:focus-visible,.aui-chip:focus-visible,.aui-action:focus-visible,.aui-seg-btn:focus-visible,.aui-link:focus-visible,.aui-select:focus-visible,.aui-search:focus-visible{outline:2px solid var(--aui-accent);outline-offset:2px}.aui-btn-icon{width:30px;height:30px;padding:0;display:inline-grid;place-items:center;color:var(--aui-muted);font-size:16px}.aui-btn-icon:hover{color:#f38f9c;border-color:color-mix(in srgb,#f43f5e 45%,var(--aui-line));background:color-mix(in srgb,#f43f5e 8%,transparent)}.aui-list-tools{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:2px 0 10px}.aui-list-tools .aui-search{height:32px;font-size:13px;min-width:200px}.aui-list-tools .aui-role-chips{flex-basis:100%;margin-top:0}.aui-dense .aui-row{min-height:40px;padding:5px 0}.aui-dense .aui-select{min-width:150px;height:30px}.aui-file{display:flex;align-items:center;gap:8px;min-width:0}.aui-file b{font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.aui-ext{flex:none;padding:1px 6px;border-radius:5px;background:var(--aui-hover);color:var(--aui-muted);font-size:10.5px;font-weight:600;letter-spacing:.04em;text-transform:uppercase}button.aui-tag{border:none;font:inherit;font-size:11.5px;font-weight:600;cursor:pointer}.aui-tag-sel{box-shadow:0 0 0 1.5px var(--aui-accent)}.aui-page ::-webkit-scrollbar{width:10px;height:10px}.aui-page ::-webkit-scrollbar-thumb{background:color-mix(in srgb,var(--aui-text) 18%,transparent);border-radius:10px;border:2px solid transparent;background-clip:padding-box}";
    var HX_CSS = ".hx-card{display:flex;flex-direction:column;border:1px solid var(--aui-line);border-radius:14px;overflow:hidden;background:color-mix(in srgb,var(--aui-text) 2.5%,transparent)}"
      + ".hx-head{display:flex;align-items:center;flex-wrap:wrap;gap:8px 10px;padding:14px 16px 6px}"
      + ".hx-title{font-size:15px;font-weight:600;line-height:22px}"
      + ".hx-badge{display:inline-flex;align-items:center;height:20px;padding:0 8px;border-radius:6px;border:1px solid var(--aui-line);font-size:11.5px;color:var(--aui-muted)}"
      + ".hx-badge-ok{color:#3ccf8e;border-color:color-mix(in srgb,#3ccf8e 40%,transparent)}.hx-badge-new{color:#f1b76b;border-color:color-mix(in srgb,#f1b76b 45%,transparent)}"
      + ".hx-foot{display:flex;flex-wrap:wrap;align-items:center;gap:10px 16px;padding:6px 16px 14px}"
      + ".hx-status{flex:1 1 240px;display:flex;align-items:center;gap:8px;min-width:0;font-size:13px;line-height:18px;color:var(--aui-muted)}"
      + ".hx-status-ok{color:#3ccf8e}.hx-status-new{color:#f1b76b}.hx-status-err{color:#f38f9c}"
      + ".hx-btns{display:flex;flex-wrap:wrap;gap:8px;margin-left:auto}"
      + ".hx-log{margin:0 16px 14px;padding:8px 10px;border-radius:10px;background:var(--aui-hover);font:12px/17px ui-monospace,Consolas,monospace;color:var(--aui-muted);max-height:120px;overflow:auto;white-space:pre-wrap}"
      + ".hx-spin{width:14px;height:14px;border-radius:50%;border:2px solid var(--aui-line);border-top-color:var(--aui-accent);animation:aui-spin .8s linear infinite;flex:none}"
      + ".hx-how{margin:0;padding:0 0 0 18px;font-size:13px;line-height:20px;color:var(--aui-muted)}.hx-how b{color:var(--aui-text)}"
      // the picker in the composer (it sits in DSH's own tool row, so it follows DSH's tokens)
      + ".hxp-btn{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 10px;border-radius:8px;border:1px solid var(--dsw-alias-border-l3,rgba(255,255,255,.16));background:transparent;color:var(--dsw-alias-label-secondary,#cfd3d6);font:inherit;font-size:13px;line-height:1;cursor:pointer;white-space:nowrap;outline:none}"
      + ".hxp-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.08));color:var(--dsw-alias-label-primary,#f9fafb)}.hxp-btn:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#7aaaff);outline-offset:1px}.hxp-btn:disabled{opacity:.5;cursor:default}"
      + ".hxp-on{color:var(--dsw-alias-state-business-primary,#7aaaff);border-color:color-mix(in srgb,var(--dsw-alias-state-business-primary,#7aaaff) 55%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-business-primary,#7aaaff) 12%,transparent)}"
      + ".hxp-ico{width:14px;height:14px;flex:none}.hxp-chev{width:10px;height:10px;flex:none;opacity:.7}"
      + ".hxp-menu{position:fixed;z-index:2147483000;min-width:150px;padding:4px;border-radius:10px;border:1px solid var(--dsw-alias-border-l3,rgba(255,255,255,.16));background:var(--dsw-alias-bg-base,#1b1b1d);box-shadow:0 12px 32px rgba(0,0,0,.45);color:var(--dsw-alias-label-primary,#f9fafb);font-size:13px}"
      + ".hxp-item{display:flex;align-items:center;gap:12px;width:100%;padding:6px 10px;border:0;border-radius:8px;background:transparent;color:inherit;font:inherit;text-align:left;cursor:pointer}"
      + ".hxp-item:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.08))}"
      + ".hxp-item{justify-content:space-between}"
      + ".hxp-check{margin-left:auto;width:14px;height:14px;color:var(--dsw-alias-state-business-primary,#7aaaff)}"

    function auiRow(key, label, hint, control, disabled) {
      return jsx("div", { key: key, className: "aui-row" + (disabled ? " aui-row-disabled" : ""), children: [
        jsx("div", { key: "t", className: "aui-row-text", children: [
          jsx("div", { key: "l", className: "aui-row-label", children: label }),
          hint ? jsx("div", { key: "h", className: "aui-row-hint", children: hint }) : null
        ] }),
        jsx("div", { key: "c", className: "aui-row-control", children: control })
      ] });
    }

    // ---- host half (guarded: custom header + JSON) ----
    function host(method, url, body) {
      var init = { method: method, headers: { "x-amadeus-harness": "1" } };
      if (method === "POST") { init.headers["content-type"] = "application/json"; init.body = JSON.stringify(body || {}); }
      return fetch(url, init).then(function (r) { return r.json(); });
    }
    function clog(msg) { try { host("POST", "/amadeus-harness/log", { msg: String(msg) }).catch(function () {}); } catch (e) {} }

    var api = { remote: null, listeners: [], synced: false };
    function remoteReady() { return !!(api.remote && api.remote.settings); }
    function notifyRemote() { api.listeners.slice().forEach(function (f) { try { f(); } catch (e) {} }); }

    // The addresses of the provider connections (llm-pi-ai) go to the host: it needs them to reach the
    // chat's model when a harness carries a turn. Keys never leave DSH's store; only their names do.
    var NS = "llm-pi-ai";
    function syncConnections() {
      if (!remoteReady()) return Promise.resolve();
      return api.remote.settings.describe().then(function (d) {
        if (!d || !d.ok) return;
        var ns = (d.value.namespaces || []).filter(function (n) { return n.ns === NS; })[0];
        var provs = (ns && ns.value && ns.value.providers) || {}, table = {};
        Object.keys(provs).forEach(function (id) { var p = provs[id]; if (p.baseURL) table[id] = { baseURL: p.baseURL, apiKeyEnv: p.apiKeyEnv || "", api: p.api || "" }; });
        return host("POST", "/amadeus-harness/connections", { providers: table }).then(function (r) { if (!api.synced) { api.synced = true; clog("connections synced: " + (r && r.count)); } });
      }).catch(function (e) { clog("connections: " + (e && e.message || e)); });
    }

    // ================================================================= the Harnesses page
    function HarnessCard(p) {
      var h = p.harness;
      var s = react.useState({ phase: "idle", check: null, error: "", log: [] });
      var f = s[0], setF = s[1];
      var upd = function (patch) { setF(function (prev) { return Object.assign({}, prev, patch); }); };
      var timer = react.useRef(null);
      react.useEffect(function () { return function () { if (timer.current) clearInterval(timer.current); }; }, []);

      var check = function () {
        upd({ phase: "checking", error: "", check: null });
        host("POST", "/amadeus-harness/check", { id: h.id }).then(function (r) {
          if (!r.ok) { upd({ phase: "idle", error: r.error || "Не удалось проверить." }); return; }
          upd({ phase: "idle", check: r });
        }).catch(function (e) { upd({ phase: "idle", error: "Нет связи с реестром: " + (e && e.message || e) }); });
      };
      var poll = function () {
        host("GET", "/amadeus-harness/install").then(function (r) {
          var job = r && r.jobs && r.jobs[h.id];
          if (!job) return;
          if (job.running) { upd({ log: job.log || [] }); return; }
          clearInterval(timer.current); timer.current = null;
          if (job.error) upd({ phase: "idle", error: job.error, log: [] });
          else { upd({ phase: "idle", check: { ok: true, installed: job.version, latest: job.version, updateAvailable: false, justInstalled: true }, log: [] }); p.onChanged(); }
        }).catch(function () {});
      };
      var install = function () {
        upd({ phase: "installing", error: "", log: [] });
        host("POST", "/amadeus-harness/install", { id: h.id }).then(function (r) {
          if (!r.ok) { upd({ phase: "idle", error: r.error || "Не удалось начать установку." }); return; }
          if (timer.current) clearInterval(timer.current);
          timer.current = setInterval(poll, 1500); poll();
        }).catch(function (e) { upd({ phase: "idle", error: String(e && e.message || e) }); });
      };

      var c = f.check, busy = f.phase !== "idle";
      var status = "", tone = "";
      if (f.error) { status = f.error; tone = "err"; }
      else if (f.phase === "installing") status = "Устанавливаю… это может занять несколько минут: программа весит сотни мегабайт.";
      else if (f.phase === "checking") status = "Проверяю реестр npm…";
      else if (c && c.justInstalled) { status = "Установлена версия " + c.installed + ". Новые запуски пойдут на ней."; tone = "ok"; }
      else if (c && c.updateAvailable) { status = "Доступна версия " + c.latest + " (сейчас " + c.installed + ")."; tone = "new"; }
      else if (c) { status = "Это последняя версия."; tone = "ok"; }
      else if (!h.installed) status = "Не установлен. Плагин скачает его сам (npm) в свою папку.";

      var buttons = [];
      if (!h.installed) buttons.push(jsx("button", { key: "i", type: "button", className: "aui-btn aui-btn-primary", disabled: busy, onClick: install, children: "Установить" }));
      else {
        if (c && c.updateAvailable) buttons.push(jsx("button", { key: "i", type: "button", className: "aui-btn aui-btn-primary", disabled: busy, onClick: install, children: "Установить " + c.latest }));
        buttons.push(jsx("button", { key: "c", type: "button", className: "aui-btn", disabled: busy, onClick: check, children: "Проверить обновления" }));
      }

      return jsx("section", { className: "hx-card", children: [
        jsx("div", { key: "h", className: "hx-head", children: [
          jsx("span", { key: "n", className: "hx-title" }, h.name),
          h.installed ? jsx("span", { key: "v", className: "hx-badge hx-badge-ok" }, h.version ? "версия " + h.version : "версия неизвестна") : jsx("span", { key: "v", className: "hx-badge" }, "не установлен"),
          c && c.updateAvailable ? jsx("span", { key: "u", className: "hx-badge hx-badge-new" }, "есть обновление " + c.latest) : null
        ] }),
        jsx("div", { key: "f", className: "hx-foot", children: [
          jsx("span", { key: "s", className: "hx-status" + (tone ? " hx-status-" + tone : "") }, f.phase === "installing" ? [jsx("span", { key: "sp", className: "hx-spin" }), jsx("span", { key: "t" }, status)] : status),
          jsx("span", { key: "b", className: "hx-btns" }, buttons)
        ] }),
        f.phase === "installing" && f.log.length ? jsx("pre", { key: "l", className: "hx-log" }, f.log.join("\n")) : null
      ].filter(Boolean) });
    }

    function HarnessPage() {
      var st = react.useState({ loaded: false, error: "", harnesses: [] });
      var state = st[0], setState = st[1];
      var load = function () {
        host("GET", "/amadeus-harness/state").then(function (r) {
          if (!r.ok) throw new Error(r.error || "нет ответа");
          setState({ loaded: true, error: "", harnesses: r.harnesses });
        }).catch(function (e) { setState({ loaded: true, error: "Не удалось связаться с плагином: " + (e && e.message || e), harnesses: [] }); });
      };
      react.useEffect(function () { load(); }, []);
      var installed = state.harnesses.filter(function (h) { return h.installed; });
      var sub = !state.loaded ? "Читаю состояние…" : state.error ? state.error : installed.length ? "Установлено: " + installed.map(function (h) { return h.name + (h.version ? " " + h.version : ""); }).join(" · ") : "Харнесы ещё не установлены";
      return jsx("div", { className: "aui-page", children: [
        jsx("div", { key: "hero", className: "aui-hero", children: [
          jsx("div", { key: "i", className: "aui-hero-icon" }, "AI"),
          jsx("div", { key: "t", className: "aui-hero-text", children: [
            jsx("div", { key: "a", className: "aui-hero-title" }, "Харнесы агента"),
            jsx("div", { key: "b", className: "aui-hero-sub", title: sub }, sub)
          ] })
        ] }),
        jsx("section", { key: "how", className: "aui-card", children: [
          jsx("header", { key: "h", className: "aui-card-head" }, jsx("div", null, [jsx("h3", { key: "a" }, "Как пользоваться"), jsx("p", { key: "b" }, "Исполнителя выбирают в самом чате, настроек тут больше нет.")])),
          jsx("div", { key: "b", className: "aui-card-body", style: { padding: "0 18px 16px" } }, jsx("ol", { className: "hx-how" }, [
            jsx("li", { key: 1 }, "Установите нужные харнесы ниже (нужны Node.js и npm)."),
            jsx("li", { key: 2 }, ["В поле ввода слева от модели нажмите ", jsx("b", { key: "b" }, "«DSH»"), " и выберите харнес."]),
            jsx("li", { key: 3 }, "Работает та модель, что выбрана в чате (через её подключение), в папке чата и с правами, которые стоят в чате («Workspace Write» и т. п.).")
          ]))
        ] }),
        state.loaded && state.error ? jsx("div", { key: "err", className: "aui-note aui-note-error", style: { margin: 0 } }, state.error) : null,
        state.harnesses.map(function (h) { return jsx(HarnessCard, { key: h.id, harness: h, onChanged: load }); })
      ].filter(Boolean) });
    }

    // ================================================================= the picker in the composer
    function Icon(p) {
      return jsx("svg", { className: p.className, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }, p.children);
    }
    var ICON_CHIP = jsx(Icon, { className: "hxp-ico" }, [jsx("rect", { key: "a", x: "3.5", y: "3.5", width: "9", height: "9", rx: "2" }), jsx("path", { key: "b", d: "M6 1.5v2M10 1.5v2M6 12.5v2M10 12.5v2M1.5 6h2M1.5 10h2M12.5 6h2M12.5 10h2" })]);
    var ICON_CHEV = jsx(Icon, { className: "hxp-chev" }, jsx("path", { d: "M4 10l4-4 4 4" }));
    var ICON_CHECK = jsx(Icon, { className: "hxp-check" }, jsx("path", { d: "M3.5 8.5l3 3 6-7" }));

    function HarnessPicker(props) {
      var sid = props.sessionId, locked = !!props.locked;
      var s = react.useState({ harness: "", list: [], ready: false });
      var state = s[0], setState = s[1];
      var openState = react.useState(false); var open = openState[0], setOpen = openState[1];
      var btn = react.useRef(null);
      var rectState = react.useState(null); var rect = rectState[0], setRect = rectState[1];
      // the chat's own permission preset ("workspace-write" …) is what the harness is held to
      var perm = typeof props.useProjection === "function" ? props.useProjection("permissions") : null;
      var preset = perm && perm.currentValue ? perm.currentValue : "";

      react.useEffect(function () {
        if (!sid) return;
        var dead = false;
        if (!api.propsLogged) { api.propsLogged = true; clog("picker mounted; props: " + Object.keys(props).join(",") + "; permission=" + preset); }
        Promise.all([host("POST", "/amadeus-harness/session", { sessionId: sid }), host("GET", "/amadeus-harness/state")]).then(function (r) {
          if (dead) return;
          var list = (r[1] && r[1].harnesses || []).filter(function (h) { return h.installed; });
          setState({ harness: (r[0] && r[0].harness) || "", list: list, ready: true });
        }).catch(function () {});
        syncConnections();
        return function () { dead = true; };
      }, [sid]);
      react.useEffect(function () {
        if (sid && state.harness && preset) host("POST", "/amadeus-harness/session", { sessionId: sid, permission: preset }).catch(function () {});
      }, [sid, state.harness, preset]);
      react.useEffect(function () {
        if (!open) return;
        var close = function (e) { if (e.type === "keydown" ? e.key === "Escape" : !(e.target && e.target.closest && e.target.closest(".hxp-menu, .hxp-btn"))) setOpen(false); };
        document.addEventListener("mousedown", close); document.addEventListener("keydown", close); window.addEventListener("resize", close);
        return function () { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); window.removeEventListener("resize", close); };
      }, [open]);

      if (!sid || !state.ready || !state.list.length) return null;
      var current = state.list.filter(function (h) { return h.id === state.harness; })[0];
      var choose = function (id) {
        setOpen(false);
        setState(function (prev) { return Object.assign({}, prev, { harness: id }); });
        host("POST", "/amadeus-harness/session", { sessionId: sid, harness: id, permission: preset || undefined }).catch(function () {});
      };
      var toggle = function () {
        if (locked) return;
        if (!open && btn.current) { var r = btn.current.getBoundingClientRect(); setRect({ left: r.left, bottom: window.innerHeight - r.top + 6 }); }
        setOpen(!open);
      };
      var item = function (id, label) {
        return jsx("button", { key: id || "dsh", type: "button", role: "menuitemradio", "aria-checked": state.harness === id, className: "hxp-item", onClick: function () { choose(id); }, children: [
          jsx("span", { key: "t" }, label),
          state.harness === id ? ICON_CHECK : null
        ] });
      };
      var menu = open && rect ? jsx("div", { className: "hxp-menu", style: { left: Math.max(8, rect.left), bottom: rect.bottom }, role: "menu", children: [item("", "DSH")].concat(state.list.map(function (h) { return item(h.id, h.name); })) }) : null;
      var portal = menu && reactDom && reactDom.createPortal ? reactDom.createPortal(menu, document.body) : menu;
      return jsx(react.Fragment, null, [
        jsx("button", { key: "b", ref: btn, type: "button", className: "hxp-btn" + (current ? " hxp-on" : ""), disabled: locked, "aria-haspopup": "menu", "aria-expanded": open, title: locked ? "Исполнитель нельзя менять, пока агент работает" : "Исполнитель чата. Модель, папка и права берутся из этого чата.", onClick: toggle, children: [jsx("span", { key: "l" }, current ? current.name : "DSH"), ICON_CHEV] }),
        portal
      ]);
    }

    // ---- registration ----
    var inject = ["slots"];
    function apply(ctx) {
      if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=\"amadeus-harness\"]") === null) {
        var tag = document.createElement("style");
        tag.dataset.pluginCss = "amadeus-harness";
        tag.textContent = AUI_CSS + HX_CSS;
        document.head.appendChild(tag);
      }
      try {
        ctx.inject(["remote", "remote.settings"], function (c) {
          api.remote = c.remote; notifyRemote();
          syncConnections();
          if (!api.timer) api.timer = setInterval(syncConnections, 60000);
        });
      } catch (e) { clog("inject remote: " + e); }
      ctx.slots.inject("settings.section", function () {
        return ctx.slots.register({ name: "settings.section", id: "harness", order: 87, label: function () { return "Харнесы"; } }, HarnessPage);
      });
      ctx.slots.inject("conversation.input.left", function () {
        return ctx.slots.register({ name: "conversation.input.left", id: "amadeus-harness", order: 40, inject: function (sessionId) { return { sessionId: sessionId }; } }, HarnessPicker);
      });
    }
    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  }
});
