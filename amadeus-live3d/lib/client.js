window.__ModuleLoader__.load({
  id: "amadeus-live3d",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
    var react = require("react");
    var jsx = react.createElement;

    var AUI_CSS = ".aui-page{--aui-accent:var(--dsw-alias-state-business-primary,#8b7cf6);--aui-line:var(--dsw-alias-border-l3,#ffffff1f);--aui-text:var(--dsw-alias-label-primary,#ededf0);--aui-muted:var(--dsw-alias-label-caption,#9a98a3);--aui-hover:var(--dsw-alias-interactive-bg-hover,#ffffff0d);--aui-bg:var(--dsw-alias-bg-base,transparent);display:flex;flex-direction:column;gap:16px;width:100%;max-width:880px;padding:4px 0 24px;color:var(--aui-text);font-size:14px}.aui-stack{display:flex;flex-direction:column;gap:16px}.aui-hero{display:flex;align-items:center;gap:16px;padding:18px 20px;border:1px solid var(--aui-line);border-radius:16px;background:radial-gradient(120% 180% at 0% 0%,color-mix(in srgb,var(--aui-accent) 16%,transparent),transparent 60%)}.aui-hero-icon{flex:none;display:flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:14px;background:color-mix(in srgb,var(--aui-accent) 18%,transparent);color:var(--aui-accent);font-weight:700;font-size:15px;letter-spacing:.02em;overflow:hidden}.aui-hero-text{display:flex;flex-direction:column;gap:3px;min-width:0}.aui-hero-title{display:flex;align-items:center;flex-wrap:wrap;gap:10px;font-size:17px;font-weight:600;line-height:24px}.aui-hero-sub{font-size:13px;line-height:18px;color:var(--aui-muted);overflow:hidden;text-overflow:ellipsis}.aui-pill{display:inline-flex;align-items:center;gap:6px;height:22px;padding:0 10px;border-radius:999px;border:1px solid var(--aui-line);font-size:12px;font-weight:500;color:var(--aui-muted)}.aui-pill-on{border-color:transparent;background:color-mix(in srgb,#3ccf8e 16%,transparent);color:#3ccf8e}.aui-pill-on::before{content:\"\";width:6px;height:6px;border-radius:50%;background:currentColor}.aui-tabs{position:sticky;top:0;z-index:2;display:flex;gap:4px;padding:4px;border:1px solid var(--aui-line);border-radius:12px;background:var(--aui-bg);overflow-x:auto;scrollbar-width:none}.aui-tab{flex:1 0 auto;height:34px;padding:0 16px;border:none;border-radius:9px;background:transparent;color:var(--aui-muted);font:inherit;font-size:13px;font-weight:500;cursor:pointer;white-space:nowrap;transition:background .15s,color .15s}.aui-tab:hover{background:var(--aui-hover);color:var(--aui-text)}.aui-tab-active,.aui-tab-active:hover{background:color-mix(in srgb,var(--aui-accent) 18%,transparent);color:var(--aui-text);font-weight:600}.aui-card{display:flex;flex-direction:column;border:1px solid var(--aui-line);border-radius:14px;overflow:hidden}.aui-card-head{padding:16px 18px 10px}.aui-card-head h3{margin:0;font-size:15px;font-weight:600;line-height:22px}.aui-card-head p{margin:2px 0 0;font-size:13px;line-height:18px;color:var(--aui-muted)}.aui-card-body{display:flex;flex-direction:column;padding:0 18px 6px}.aui-row{display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:52px;padding:10px 0;border-top:1px solid var(--aui-line)}.aui-card-body>.aui-row:first-child{border-top:none}.aui-row-disabled{opacity:.45;pointer-events:none}.aui-row-text{display:flex;flex-direction:column;gap:2px;min-width:0}.aui-row-label{font-size:14px;line-height:20px}.aui-row-hint{font-size:12px;line-height:16px;color:var(--aui-muted)}.aui-row-control{flex:none;display:flex;align-items:center;justify-content:flex-end;gap:10px;max-width:60%}.aui-switch{position:relative;display:inline-flex;cursor:pointer}.aui-switch input{position:absolute;opacity:0;width:0;height:0}.aui-switch-track{position:relative;width:40px;height:24px;border-radius:999px;background:var(--aui-line);transition:background .18s}.aui-switch-track::after{content:\"\";position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 3px #00000059;transition:transform .18s}.aui-switch input:checked+.aui-switch-track{background:var(--aui-accent)}.aui-switch input:checked+.aui-switch-track::after{transform:translateX(16px)}.aui-switch input:focus-visible+.aui-switch-track{outline:2px solid var(--aui-accent);outline-offset:2px}.aui-switch input:disabled+.aui-switch-track{opacity:.5}.aui-select{min-width:180px;max-width:100%;height:34px;padding:0 12px;border-radius:9px;border:1px solid var(--aui-line);background:var(--aui-bg);color:var(--aui-text);font:inherit;font-size:13px;cursor:pointer;text-overflow:ellipsis}.aui-select:focus{outline:none;border-color:var(--aui-accent)}.aui-select:disabled{opacity:.5;cursor:default}.aui-range{display:flex;align-items:center;gap:10px}.aui-range input{width:160px;accent-color:var(--aui-accent)}.aui-range-val{min-width:44px;text-align:right;font-variant-numeric:tabular-nums;font-size:13px;color:var(--aui-muted)}.aui-color{width:40px;height:30px;padding:2px;border:1px solid var(--aui-line);border-radius:8px;background:var(--aui-bg);cursor:pointer}.aui-seg{display:inline-flex;gap:2px;padding:3px;border:1px solid var(--aui-line);border-radius:10px}.aui-seg-btn{height:28px;padding:0 12px;border:none;border-radius:7px;background:transparent;color:var(--aui-muted);font:inherit;font-size:13px;cursor:pointer;font-variant-numeric:tabular-nums}.aui-seg-btn:hover:not(:disabled){color:var(--aui-text);background:var(--aui-hover)}.aui-seg-btn-active,.aui-seg-btn-active:hover:not(:disabled){background:var(--aui-accent);color:#fff}.aui-seg-btn:disabled{cursor:default}.aui-btn{height:34px;padding:0 14px;border-radius:9px;border:1px solid var(--aui-line);background:transparent;color:var(--aui-text);font:inherit;font-size:13px;cursor:pointer;white-space:nowrap;transition:background .15s}.aui-btn:hover{background:var(--aui-hover)}.aui-btn-primary{border-color:transparent;background:var(--aui-accent);color:#fff}.aui-btn-primary:hover{background:color-mix(in srgb,var(--aui-accent) 85%,#fff)}.aui-btn-danger{border-color:transparent;background:#f43f5e;color:#fff}.aui-btn:disabled{opacity:.5;cursor:default}.aui-inline{display:flex;align-items:center;gap:10px}.aui-level{width:120px;height:6px;border-radius:999px;background:var(--aui-line);overflow:hidden}.aui-level i{display:block;height:100%;width:0;background:var(--aui-accent);transition:width .08s linear}.aui-ptt-wrap{padding:4px 0 12px}.aui-ptt{width:100%;height:46px;border-radius:12px;border:1px dashed var(--aui-line);background:transparent;color:var(--aui-text);font:inherit;font-size:14px;cursor:pointer;user-select:none;touch-action:none;transition:background .15s}.aui-ptt:hover{background:var(--aui-hover)}.aui-ptt-on{border-style:solid;border-color:transparent;background:var(--aui-accent);color:#fff}.aui-hidden{display:none}.aui-note{margin:0 18px 14px;padding:8px 12px;border-radius:9px;background:var(--aui-hover);font-size:13px;line-height:18px;color:var(--aui-muted)}.aui-note-error{background:color-mix(in srgb,#f43f5e 12%,transparent);color:#f38f9c}.aui-choices{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;padding:6px 0 14px}.aui-choice{display:flex;flex-direction:column;align-items:flex-start;gap:4px;padding:12px;border:1px solid var(--aui-line);border-radius:12px;background:transparent;color:var(--aui-text);font:inherit;text-align:left;cursor:pointer;transition:border-color .15s,background .15s}.aui-choice:hover:not(:disabled){background:var(--aui-hover)}.aui-choice-active{border-color:var(--aui-accent);box-shadow:0 0 0 1px var(--aui-accent);background:color-mix(in srgb,var(--aui-accent) 8%,transparent)}.aui-choice:disabled{cursor:default}.aui-choice-title{font-size:14px;font-weight:600;line-height:20px}.aui-choice-sub{font-size:12px;line-height:16px;color:var(--aui-muted)}.aui-choice-art{display:flex;align-items:center;gap:10px;width:100%;height:64px;margin-bottom:6px;padding:0 12px;box-sizing:border-box;border-radius:10px;background:#1c1a24}.aui-choice-art-orb{justify-content:center}.aui-mini-orb{flex:none;display:block;width:30px;height:30px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#d9cfff,#9a83f0 45%,#5d4bb3 75%,transparent 76%);box-shadow:0 0 14px #9a83f080}.aui-choice-art-orb .aui-mini-orb{width:38px;height:38px}.aui-mini-lines{display:flex;flex-direction:column;gap:5px;flex:1}.aui-mini-lines b{display:block;height:5px;border-radius:3px;background:#ffffff38}.aui-mini-lines b:nth-child(2){width:80%}.aui-mini-lines b:nth-child(3){width:55%}.aui-split{display:grid;grid-template-columns:minmax(0,1fr) 260px;gap:20px;align-items:center;padding-bottom:12px}.aui-split-rows{display:flex;flex-direction:column}.aui-split-rows>.aui-row:first-child{border-top:none}.aui-bubble-preview{display:flex;align-items:center;justify-content:center;padding:16px;border-radius:12px;background:repeating-conic-gradient(#ffffff08 0 25%,transparent 0 50%) 0 0/16px 16px}.aui-bubble-sample{width:100%;padding:12px 14px;border-radius:16px;border:1px solid #b5a3f563;box-sizing:border-box}.aui-bubble-sample-head{display:flex;align-items:center;gap:10px;margin-bottom:8px}.aui-bubble-sample-cap{font-size:9px;font-weight:700;letter-spacing:.16em;opacity:.65}.aui-bubble-sample-status{font-size:13px;font-weight:700;color:#bf9bff}.aui-bubble-sample-text{line-height:1.45;max-height:90px;overflow:hidden}@media (max-width:640px){.aui-row{flex-direction:column;align-items:stretch;gap:8px}.aui-row-control{max-width:none;justify-content:flex-start}.aui-choices,.aui-split{grid-template-columns:1fr}.aui-range input{flex:1;width:auto}}.aui-page .amadeus-characters{padding:0}.aui-page .amadeus-characters-search,.aui-page .amadeus-characters-add{height:36px;border-radius:10px}.aui-page .amadeus-characters-grid{grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:14px}.aui-page .amadeus-character-card{border-radius:14px}.aui-card-head-row{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.aui-orb-hero{align-items:center;gap:22px}.aui-orb-stage{flex:none;display:flex;align-items:center;justify-content:center;width:150px;height:150px;border-radius:18px;background:radial-gradient(circle at 50% 45%,#ffffff0d,transparent 70%),#16151b}.aui-orb-hero .aui-hero-text{gap:8px}.aui-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}.aui-chip{display:inline-flex;align-items:center;gap:7px;height:30px;padding:0 12px;border-radius:999px;border:1px solid var(--aui-line);background:transparent;color:var(--aui-muted);font:inherit;font-size:12.5px;cursor:pointer;transition:background .15s,color .15s,border-color .15s}.aui-chip:hover{background:var(--aui-hover);color:var(--aui-text)}.aui-chip-active,.aui-chip-active:hover{border-color:var(--aui-accent);background:color-mix(in srgb,var(--aui-accent) 14%,transparent);color:var(--aui-text);font-weight:600}.aui-chip-dot{flex:none;width:9px;height:9px;border-radius:50%;box-shadow:0 0 0 2px #00000026}.aui-gradient{display:flex;width:120px;height:30px;border-radius:8px;overflow:hidden;border:1px solid var(--aui-line)}.aui-gradient>span{flex:1}.aui-toolbar{display:flex;gap:8px;align-items:center}.aui-search{flex:1;min-width:0;height:36px;padding:0 12px;border-radius:10px;border:1px solid var(--aui-line);background:var(--aui-bg);color:var(--aui-text);font:inherit;font-size:14px}.aui-search:focus{outline:none;border-color:var(--aui-accent)}@media (max-width:640px){.aui-orb-hero{flex-direction:column;align-items:flex-start}}.aui-card-pad{padding:0 18px 18px}.aui-row-text{flex:1 1 140px}.aui-split-rows .aui-row{flex-wrap:wrap;gap:8px 16px}.aui-split-rows .aui-row-control{max-width:none}.aui-range input{width:140px}.aui-split{grid-template-columns:minmax(220px,1fr) auto;align-items:start}.aui-live-preview{display:flex;flex-direction:column;align-items:center;gap:12px}.aui-live-stage{display:flex;align-items:center;justify-content:center;width:360px;max-width:100%;height:320px;border-radius:12px;background:repeating-conic-gradient(#ffffff0a 0 25%,transparent 0 50%) 0 0/16px 16px,#141318;overflow:hidden}.aui-live-frame{display:block;border:0;background:transparent;color-scheme:normal}.aui-live-phases{flex-wrap:wrap;justify-content:center}@media (max-width:900px){.aui-split{grid-template-columns:1fr}.aui-live-preview{order:-1}}.aui-note-inline{margin:0 0 12px}.aui-empty{padding:28px 12px;border:1px dashed var(--aui-line);border-radius:12px;text-align:center;font-size:13px;line-height:19px;color:var(--aui-muted)}.aui-empty-tight{margin:0 18px 18px;padding:14px}.aui-gallery-search{width:100%;box-sizing:border-box;margin-bottom:14px}.aui-gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px}.aui-model{position:relative;display:block;aspect-ratio:3/4;border-radius:14px;overflow:hidden;cursor:pointer;background:linear-gradient(160deg,color-mix(in srgb,var(--aui-accent) 14%,#1b1a21),#141318);border:1px solid var(--aui-line);outline:none;transition:transform .16s ease,box-shadow .16s ease,border-color .16s}.aui-model:hover{transform:translateY(-3px);box-shadow:0 10px 24px #00000052}.aui-model:focus-visible{box-shadow:0 0 0 2px var(--aui-accent)}.aui-model-active{border-color:var(--aui-accent);box-shadow:0 0 0 2px var(--aui-accent),0 10px 28px color-mix(in srgb,var(--aui-accent) 30%,transparent);cursor:default}.aui-model-active:hover{transform:none}.aui-model-art{position:absolute;inset:0;display:block}.aui-model-art img{width:100%;height:100%;object-fit:cover;object-position:top center;display:block;transition:transform .3s ease}.aui-model:hover .aui-model-art img{transform:scale(1.04)}.aui-model-art .amadeus-character-preview-empty{display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:44px;font-weight:700;color:#ffffff40}.aui-model-meta{position:absolute;left:0;right:0;bottom:0;display:flex;flex-direction:column;gap:2px;padding:34px 12px 11px;background:linear-gradient(to top,#000000d9,#00000080 55%,transparent);color:#fff}.aui-model-name{font-size:14px;font-weight:600;line-height:19px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.aui-model-sub{font-size:11.5px;line-height:15px;color:#ffffffb3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.aui-model-flag{position:absolute;top:8px;left:8px;display:inline-flex;align-items:center;gap:5px;height:22px;padding:0 9px;border-radius:999px;background:var(--aui-accent);color:#fff;font-size:11px;font-weight:600;box-shadow:0 2px 8px #0000004d}.aui-model-flag::before{content:\"\";width:6px;height:6px;border-radius:50%;background:#fff}.aui-model-remove{position:absolute;top:8px;right:8px;width:26px;height:26px;border:none;border-radius:8px;background:#00000080;color:#fff;font-size:17px;line-height:1;cursor:pointer;opacity:0;transition:opacity .15s,background .15s;backdrop-filter:blur(4px)}.aui-model:hover .aui-model-remove,.aui-model:focus-within .aui-model-remove{opacity:1}.aui-model-remove:hover{background:#f43f5e}.aui-model-skeleton{cursor:default;animation:aui-pulse 1.4s ease-in-out infinite}@keyframes aui-pulse{50%{opacity:.5}}.aui-active-head{display:flex;align-items:center;gap:14px;padding:16px 18px}.aui-active-thumb{flex:none;width:56px;height:56px;border-radius:12px;overflow:hidden;background:#1b1a21}.aui-active-thumb img{width:100%;height:100%;object-fit:cover;object-position:top center;display:block}.aui-active-thumb .amadeus-character-preview-empty{display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:22px;font-weight:700;color:#ffffff59}.aui-active-head .aui-hero-text{flex:1}.aui-active-name{font-size:16px;font-weight:600;line-height:22px}.aui-actions{display:flex;flex-direction:column;gap:10px;padding:0 18px 16px}.aui-action-row{display:flex;align-items:flex-start;gap:12px;padding-top:10px;border-top:1px solid var(--aui-line)}.aui-action-label{flex:none;width:96px;padding-top:6px;font-size:12px;color:var(--aui-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.aui-action-chips{display:flex;flex-wrap:wrap;gap:6px;min-width:0}.aui-action{height:28px;padding:0 11px;border-radius:999px;border:1px solid var(--aui-line);background:transparent;color:var(--aui-text);font:inherit;font-size:12.5px;cursor:pointer;white-space:nowrap;transition:background .15s,border-color .15s}.aui-action:hover:not(:disabled){border-color:var(--aui-accent);background:color-mix(in srgb,var(--aui-accent) 12%,transparent)}.aui-action-emotion{color:color-mix(in srgb,var(--aui-accent) 70%,var(--aui-text))}.aui-action:disabled{opacity:.5;cursor:default}@media (max-width:640px){.aui-action-row{flex-direction:column;gap:6px}.aui-action-label{width:auto;padding:0}}.aui-hide-range{width:140px;accent-color:var(--aui-accent)}.aui-num{display:inline-flex;align-items:center;gap:6px;font-size:13px;color:var(--aui-muted)}.aui-num input{width:64px;height:30px;padding:0 8px;box-sizing:border-box;border-radius:8px;border:1px solid var(--aui-line);background:var(--aui-bg);color:var(--aui-text);font:inherit;font-size:13px;text-align:center;font-variant-numeric:tabular-nums}.aui-num input:focus{outline:none;border-color:var(--aui-accent)}.aui-drop{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;min-height:150px;padding:20px;border:1.5px dashed color-mix(in srgb,var(--aui-accent) 45%,var(--aui-line));border-radius:14px;background:color-mix(in srgb,var(--aui-accent) 5%,transparent);text-align:center;transition:background .15s,border-color .15s}.aui-drop-over{border-color:var(--aui-accent);background:color-mix(in srgb,var(--aui-accent) 14%,transparent)}.aui-drop-busy{flex-direction:row;gap:12px;font-size:13px;color:var(--aui-muted)}.aui-drop-icon{font-size:26px;line-height:1;color:var(--aui-accent)}.aui-drop-title{font-size:15px;font-weight:600}.aui-drop-or{font-size:12px;color:var(--aui-muted)}.aui-spinner{width:18px;height:18px;border-radius:50%;border:2px solid var(--aui-line);border-top-color:var(--aui-accent);animation:aui-spin .8s linear infinite;flex:none}@keyframes aui-spin{to{transform:rotate(360deg)}}.aui-results{display:flex;flex-direction:column;gap:6px;margin-top:12px}.aui-results-group{display:flex;flex-direction:column;gap:6px}.aui-result{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 10px;padding:9px 12px;border-radius:10px;background:var(--aui-hover);font-size:13px;line-height:18px}.aui-result b{font-weight:600}.aui-result span{color:var(--aui-muted)}.aui-result-ok{background:color-mix(in srgb,#3ccf8e 12%,transparent)}.aui-result-ok b{color:#3ccf8e}.aui-result-err{background:color-mix(in srgb,#f43f5e 10%,transparent)}.aui-result-err b{color:#f38f9c}.aui-downloads{display:flex;flex-direction:column;margin-top:16px}.aui-downloads-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-bottom:8px;font-size:12px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--aui-muted)}.aui-link{border:none;background:none;padding:0;color:var(--aui-accent);font:inherit;font-size:12px;font-weight:500;text-transform:none;letter-spacing:0;cursor:pointer}.aui-link:hover{text-decoration:underline}.aui-dl{display:flex;align-items:center;gap:10px;padding:9px 0;border-top:1px solid var(--aui-line)}.aui-dl-text{display:flex;flex-direction:column;gap:1px;flex:1;min-width:0}.aui-dl-name{font-size:13.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.aui-tag{flex:none;display:inline-flex;align-items:center;height:22px;padding:0 9px;border-radius:999px;font-size:11.5px;font-weight:600;white-space:nowrap}.aui-tag-ok{background:color-mix(in srgb,#3ccf8e 15%,transparent);color:#3ccf8e}.aui-tag-warn{background:color-mix(in srgb,#f1b76b 16%,transparent);color:#f1b76b}.aui-tag-off{background:var(--aui-hover);color:var(--aui-muted)}.aui-chip-input{height:28px;width:130px;padding:0 10px;border-radius:999px;border:1px dashed var(--aui-accent);background:transparent;color:var(--aui-text);font:inherit;font-size:12.5px}.aui-chip-input:focus{outline:none;border-style:solid;background:color-mix(in srgb,var(--aui-accent) 10%,transparent)}.aui-name-input{height:32px;max-width:100%;padding:0 10px;border-radius:9px;border:1px dashed var(--aui-accent);background:transparent;color:var(--aui-text);font:inherit;font-size:16px;font-weight:600}.aui-name-input:focus{outline:none;border-style:solid}.aui-edit-hint{padding:0 18px 10px}.aui-card{background:color-mix(in srgb,var(--aui-text) 2.5%,transparent)}.aui-card-head{padding:16px 18px 8px}.aui-card-head p{font-size:12.5px;max-width:96ch}.aui-row{min-height:46px;padding:9px 0;border-top-color:color-mix(in srgb,var(--aui-line) 65%,transparent)}.aui-row-label{font-weight:500}.aui-row-hint{max-width:60ch}.aui-tabs{background:color-mix(in srgb,var(--aui-bg) 88%,transparent);backdrop-filter:blur(10px)}.aui-tab{height:32px}.aui-tab-active,.aui-tab-active:hover{background:color-mix(in srgb,var(--aui-accent) 20%,transparent);color:var(--aui-accent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--aui-accent) 40%,transparent)}.aui-hero{padding:16px 18px}.aui-hero-icon{width:52px;height:52px}.aui-hero-icon img{width:100%;height:100%;object-fit:cover;object-position:50% 8%;display:block}.aui-select{appearance:none;-webkit-appearance:none;padding-right:30px;background-image:url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath d='M2.5 4.5 6 8l3.5-3.5' fill='none' stroke='%23a3a7ad' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\");background-repeat:no-repeat;background-position:right 10px center;background-size:12px}.aui-select option{background:#1b1b1e;color:#f5f5f7}.aui-seg-btn{height:26px}.aui-chip,.aui-action{height:28px}.aui-chip:hover{border-color:color-mix(in srgb,var(--aui-accent) 50%,var(--aui-line))}.aui-tab:focus-visible,.aui-btn:focus-visible,.aui-chip:focus-visible,.aui-action:focus-visible,.aui-seg-btn:focus-visible,.aui-link:focus-visible,.aui-select:focus-visible,.aui-search:focus-visible{outline:2px solid var(--aui-accent);outline-offset:2px}.aui-btn-icon{width:30px;height:30px;padding:0;display:inline-grid;place-items:center;color:var(--aui-muted);font-size:16px}.aui-btn-icon:hover{color:#f38f9c;border-color:color-mix(in srgb,#f43f5e 45%,var(--aui-line));background:color-mix(in srgb,#f43f5e 8%,transparent)}.aui-list-tools{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:2px 0 10px}.aui-list-tools .aui-search{height:32px;font-size:13px;min-width:200px}.aui-list-tools .aui-role-chips{flex-basis:100%;margin-top:0}.aui-dense .aui-row{min-height:40px;padding:5px 0}.aui-dense .aui-select{min-width:150px;height:30px}.aui-file{display:flex;align-items:center;gap:8px;min-width:0}.aui-file b{font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.aui-ext{flex:none;padding:1px 6px;border-radius:5px;background:var(--aui-hover);color:var(--aui-muted);font-size:10.5px;font-weight:600;letter-spacing:.04em;text-transform:uppercase}button.aui-tag{border:none;font:inherit;font-size:11.5px;font-weight:600;cursor:pointer}.aui-tag-sel{box-shadow:0 0 0 1.5px var(--aui-accent)}.aui-page ::-webkit-scrollbar{width:10px;height:10px}.aui-page ::-webkit-scrollbar-thumb{background:color-mix(in srgb,var(--aui-text) 18%,transparent);border-radius:10px;border:2px solid transparent;background-clip:padding-box}";

    // ---- shared settings layout (same "aui" look as live2D / Orbs) ----
    function auiSwitch(on, onChange) {
      return jsx("label", { className: "aui-switch", children: [
        jsx("input", { key: "i", type: "checkbox", checked: !!on, onChange: onChange }),
        jsx("span", { key: "t", className: "aui-switch-track" })
      ] });
    }
    function auiRow(key, label, hint, control, disabled) {
      return jsx("div", { key: key, className: "aui-row" + (disabled ? " aui-row-disabled" : ""), children: [
        jsx("div", { key: "t", className: "aui-row-text", children: [
          jsx("div", { key: "l", className: "aui-row-label", children: label }),
          hint ? jsx("div", { key: "h", className: "aui-row-hint", children: hint }) : null
        ] }),
        jsx("div", { key: "c", className: "aui-row-control", children: control })
      ] });
    }
    function auiCard(key, title, desc, rows, footer, headExtra) {
      return jsx("section", { key: key, className: "aui-card", children: [
        jsx("header", { key: "h", className: "aui-card-head" + (headExtra ? " aui-card-head-row" : ""), children: [
          jsx("div", { key: "t", children: [jsx("h3", { key: "a", children: title }), desc ? jsx("p", { key: "b", children: desc }) : null] }),
          headExtra || null
        ] }),
        jsx("div", { key: "b", className: "aui-card-body", children: rows }),
        footer || null
      ] });
    }
    function auiRange(value, min, max, step, unit, onChange) {
      return jsx("div", { className: "aui-range", children: [
        jsx("input", { key: "r", type: "range", min: String(min), max: String(max), step: String(step), value: String(value), onChange: function (e) { onChange(Number(e.target.value)); } }),
        jsx("span", { key: "v", className: "aui-range-val", children: value + unit })
      ] });
    }
    function auiNote(note) {
      return note ? jsx("div", { className: "aui-note" + (note.error ? " aui-note-error" : ""), children: note.text }) : null;
    }
    function getJson(url) { return fetch(url).then(function (r) { return r.json(); }); }
    function postJson(url, body) { return fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body || {}) }).then(function (r) { return r.json(); }); }
    function formatSize(bytes) {
      if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + " ГБ";
      if (bytes >= 1048576) return Math.round(bytes / 1048576) + " МБ";
      return Math.max(1, Math.round(bytes / 1024)) + " КБ";
    }
    function formatAgo(ms) {
      var min = Math.round((Date.now() - ms) / 60000);
      if (min < 60) return min <= 1 ? "только что" : min + " мин назад";
      var h = Math.round(min / 60);
      return h < 24 ? h + " ч назад" : Math.round(h / 24) + " дн назад";
    }

    // Settings writes: optimistic, one request at a time, changes made meanwhile are merged.
    function mergePatch(a, b) {
      var out = {};
      [a, b].forEach(function (p) {
        if (!p) return;
        Object.keys(p).forEach(function (k) {
          var v = p[k];
          out[k] = v && typeof v === "object" && !Array.isArray(v) && out[k] && typeof out[k] === "object" ? Object.assign({}, out[k], v) : v;
        });
      });
      return out;
    }
    function useSettings() {
      var st = react.useState(null); var cfg = st[0], setCfg = st[1];
      var q = react.useRef({ busy: false, queued: null });
      var load = function () { getJson("/amadeus-live3d/settings").then(function (d) { if (d && d.ok) setCfg(d); }).catch(function () {}); };
      react.useEffect(load, []);
      var send = function (patch) {
        q.current.busy = true;
        postJson("/amadeus-live3d/settings", patch).then(function (d) { if (d && d.ok && !q.current.queued) setCfg(d); }).catch(function () {}).finally(function () {
          var next = q.current.queued; q.current.queued = null;
          if (next) send(next); else q.current.busy = false;
        });
      };
      var patch = function (p) {
        setCfg(function (prev) { return mergePatch(prev, p); });
        if (q.current.busy) q.current.queued = mergePatch(q.current.queued, p); else send(p);
      };
      return [cfg, patch, load];
    }

    // ---- import: drop zone, native pickers, recent downloads ----
    var KIND_TAG = { model: ["VRM", "aui-tag-ok"], animation: ["анимация", "aui-tag-warn"], archive: ["архив", "aui-tag-warn"] };
    function ImportPanel(props) {
      var busyState = react.useState(""); var busy = busyState[0], setBusy = busyState[1];
      var resState = react.useState(null); var results = resState[0], setResults = resState[1];
      var dragState = react.useState(false); var drag = dragState[0], setDrag = dragState[1];
      var finish = function (d) {
        if (d && d.canceled) { setBusy(""); return; }
        setResults(d && d.ok ? d.results : [{ source: "", imported: [], skipped: [], animations: [], problems: [(d && d.error) || "Не удалось импортировать."] }]);
        setBusy("");
        if (props.onImported) props.onImported(d);
      };
      var post = function (url, body, label) {
        if (busy) return;
        setBusy(label); setResults(null);
        postJson(url, body).then(finish).catch(function (e) { finish({ ok: false, error: e && e.message }); });
      };
      var upload = function (files) {
        if (busy || !files.length) return;
        setBusy("Загружаю " + (files.length > 1 ? files.length + " файла…" : "«" + files[0].name + "»…")); setResults(null);
        var all = [];
        var next = function (i) {
          if (i >= files.length) { finish({ ok: true, results: all }); return; }
          fetch("/amadeus-live3d/import-upload?name=" + encodeURIComponent(files[i].name), { method: "POST", body: files[i] }).then(function (r) { return r.json(); })
            .then(function (d) { all = all.concat(d && d.ok ? d.results : [{ source: files[i].name, imported: [], skipped: [], animations: [], problems: [(d && d.error) || "Ошибка."] }]); next(i + 1); })
            .catch(function () { all.push({ source: files[i].name, imported: [], skipped: [], animations: [], problems: ["Ошибка загрузки."] }); next(i + 1); });
        };
        next(0);
      };
      var onDrop = function (e) {
        e.preventDefault(); setDrag(false);
        var files = Array.prototype.slice.call((e.dataTransfer && e.dataTransfer.files) || []).filter(function (f) { return /\.(vrm|vrma|vmd|fbx|glb|unitypackage|anim|zip|rar|7z)$/i.test(f.name); });
        if (!files.length) { setResults([{ source: "", imported: [], skipped: [], animations: [], problems: ["Перетащите .vrm (модель), анимацию .vrma / .vmd / .fbx или архив с ними."] }]); return; }
        upload(files);
      };
      var rows = (results || []).map(function (r, i) {
        var out = [];
        (r.imported || []).forEach(function (m) { out.push(jsx("div", { key: "i" + m.id, className: "aui-result aui-result-ok", children: [jsx("b", { key: "b", children: "✓ " + m.name }), jsx("span", { key: "s", children: [m.author ? "автор: " + m.author : null, "VRM " + (m.version || "?"), m.expressions + " выражений"].filter(Boolean).join(" · ") })] })); });
        (r.animations || []).forEach(function (a, j) { out.push(jsx("div", { key: "a" + j, className: "aui-result aui-result-ok", children: [jsx("b", { key: "b", children: "✓ " + (a.clip || a.file) }), jsx("span", { key: "s", children: "анимация, роль: " + (ROLE_LABELS[a.role] || a.role) })] })); });
        (r.notes || []).forEach(function (p, j) { out.push(jsx("div", { key: "n" + j, className: "aui-result", children: [jsx("b", { key: "b", children: "ⓘ " + (r.source || "Импорт") }), jsx("span", { key: "s", children: p })] })); });
        (r.skipped || []).forEach(function (m) { out.push(jsx("div", { key: "s" + m.id, className: "aui-result", children: [jsx("b", { key: "b", children: "↺ " + m.name }), jsx("span", { key: "s", children: "уже добавлена" })] })); });
        (r.problems || []).forEach(function (p, j) { out.push(jsx("div", { key: "p" + j, className: "aui-result aui-result-err", children: [jsx("b", { key: "b", children: "✕ " + (r.source || "Импорт") }), jsx("span", { key: "s", children: p })] })); });
        return jsx("div", { key: i, className: "aui-results-group", children: out });
      });
      return jsx("section", { className: "aui-card", children: [
        jsx("header", { key: "h", className: "aui-card-head", children: [jsx("h3", { key: "a", children: "Добавить" }), jsx("p", { key: "b", children: "Модели VRM (VRoid Hub, Booth) и анимации: .vrma, MMD-моушены .vmd, .fbx (Mixamo, VRoid и др.), наборы .glb. Архивы .zip/.rar/.7z с Booth можно класть целиком. Анимации необязательны: без них персонаж двигается процедурно." })] }),
        jsx("div", { key: "b", className: "aui-card-pad", children: [
          jsx("div", { key: "drop", className: "aui-drop" + (drag ? " aui-drop-over" : "") + (busy ? " aui-drop-busy" : ""),
            onDragOver: function (e) { e.preventDefault(); if (!drag) setDrag(true); }, onDragLeave: function () { setDrag(false); }, onDrop: onDrop,
            children: busy ? [jsx("span", { key: "s", className: "aui-spinner" }), jsx("span", { key: "t", children: busy })] : [
              jsx("span", { key: "i", className: "aui-drop-icon", children: "⇩" }),
              jsx("span", { key: "t", className: "aui-drop-title", children: "Перетащите .vrm / .vrma / .vmd / .fbx / .zip" }),
              jsx("span", { key: "o", className: "aui-drop-or", children: "или" }),
              jsx("div", { key: "b", className: "aui-inline", children: [
                jsx("button", { key: "m", type: "button", className: "aui-btn aui-btn-primary", onClick: function () { post("/amadeus-live3d/import-dialog", { kind: "model" }, "Выберите модель в открывшемся окне…"); }, children: "Модель…" }),
                jsx("button", { key: "a", type: "button", className: "aui-btn", onClick: function () { post("/amadeus-live3d/import-dialog", { kind: "animation" }, "Выберите анимации в открывшемся окне…"); }, children: "Анимации…" })
              ] })
            ] }),
          results ? jsx("div", { key: "res", className: "aui-results", children: rows }) : null
        ] })
      ] });
    }

    // ---- characters ----
    // Buttons on the active character card: [kind, id, label]
    var ACTION_GROUPS = [
      ["Действия", [["action", "come", "Ко мне"], ["action", "sit", "Сесть"], ["action", "stand", "Встать"], ["action", "jump", "На окно"], ["action", "sleep", "Уснуть"], ["action", "wake", "Разбудить"]]],
      ["Жесты", [["gesture", "wave", "Помахать"], ["gesture", "nod", "Кивнуть"], ["gesture", "shake", "Покачать головой"], ["gesture", "bow", "Поклон"], ["gesture", "stretch", "Потянуться"], ["gesture", "yawn", "Зевнуть"], ["gesture", "shrug", "Пожать плечами"], ["gesture", "clap", "Похлопать"], ["gesture", "giggle", "Хихикнуть"], ["gesture", "thumbs_up", "Класс"], ["gesture", "point", "Указать"], ["gesture", "salute", "Честь"], ["gesture", "look_around", "Оглядеться"], ["gesture", "dance", "Танец"], ["gesture", "pose", "Позировать"], ["gesture", "shift", "Переминаться"], ["gesture", "tap_foot", "Постучать ногой"], ["gesture", "rock", "Покачаться"]]],
      ["Эмоции", [["emotion", "happy", "Радость"], ["emotion", "excited", "Восторг"], ["emotion", "love", "Нежность"], ["emotion", "proud", "Гордость"], ["emotion", "relaxed", "Спокойствие"], ["emotion", "thinking", "Задумчивость"], ["emotion", "surprised", "Удивление"], ["emotion", "shy", "Смущение"], ["emotion", "scared", "Испуг"], ["emotion", "sad", "Грусть"], ["emotion", "pout", "Обида"], ["emotion", "angry", "Злость"], ["emotion", "sleepy", "Сонливость"]]]
    ];
    // Any imported clip or pose (with a role) can be played from the character card.
    function ClipPicker(props) {
      var st = useSettings(); var cfg = st[0];
      var selState = react.useState(""); var sel = selState[0], setSel = selState[1];
      if (!cfg) return null;
      var list = (cfg.animations || []).filter(function (a) { return a.role && a.role !== "extra"; });
      if (!list.length) return null;
      var key = function (a) { return a.file + "#" + (a.clip || ""); };
      var label = function (a) { return (a.clip || a.file).replace(/\.(uanim\.json|vrma|vmd|fbx|glb)$/i, "").replace(/^Mew_Pose_Ver\.0 - /, "Mew ").replace(/_/g, " "); };
      var cur = list.filter(function (a) { return key(a) === sel; })[0] || list[0];
      var play = function (a) { postJson("/amadeus-live3d/command", { name: "play_clip", args: { file: a.file, clip: a.clip || "" } }).then(function (d) { if ((!d || !d.ok || (d.result && d.result.ok === false)) && props.onError) props.onError((d && d.result && d.result.error) || (d && d.error) || "Не получилось."); }); };
      var groups = ROLES.filter(function (r) { return list.some(function (a) { return a.role === r; }); });
      return jsx("div", { className: "aui-action-row", children: [
        jsx("span", { key: "l", className: "aui-action-label", children: "Анимации" }),
        jsx("div", { key: "c", className: "aui-action-chips", children: [
          jsx("select", { key: "s", className: "aui-select", value: key(cur), onChange: function (e) { setSel(e.target.value); }, children: groups.map(function (r) {
            return jsx("optgroup", { key: r, label: (ROLE_LABELS[r] || r) + " · " + list.filter(function (a) { return a.role === r; }).length, children: list.filter(function (a) { return a.role === r; }).map(function (a) { return jsx("option", { key: key(a), value: key(a), children: label(a) }); }) });
          }) }),
          jsx("button", { key: "p", type: "button", className: "aui-action", onClick: function () { play(cur); }, children: "▶ Играть" }),
          jsx("button", { key: "r", type: "button", className: "aui-action", title: "Случайный клип с той же ролью", onClick: function () { var same = list.filter(function (a) { return a.role === cur.role; }); var a = same[Math.floor(Math.random() * same.length)]; setSel(key(a)); play(a); }, children: "🎲" })
        ] })
      ] });
    }
    function CharactersTab(props) {
      var mState = react.useState(null); var data = mState[0], setData = mState[1];
      var noteState = react.useState(null); var note = noteState[0], setNote = noteState[1];
      var busyState = react.useState(""); var busy = busyState[0], setBusy = busyState[1];
      var refresh = function () { getJson("/amadeus-live3d/list").then(function (d) { setData(d && d.ok ? d : { models: [], active: "" }); if (props.onChange) props.onChange(); }).catch(function () { setData({ models: [], active: "" }); }); };
      react.useEffect(refresh, []);
      var select = function (id) {
        if (busy) return;
        setBusy(id); setNote({ text: "Загружаю модель…" });
        postJson("/amadeus-live3d/select", { id: id }).then(function (d) { setNote(d && d.ok ? null : { text: (d && d.error) || "Не удалось загрузить.", error: true }); refresh(); setTimeout(refresh, 3500); })
          .catch(function () { setNote({ text: "Не удалось загрузить.", error: true }); }).finally(function () { setBusy(""); });
      };
      var remove = function (m) {
        if (!window.confirm("Удалить модель «" + m.name + "»?")) return;
        postJson("/amadeus-live3d/remove", { id: m.id }).then(refresh);
      };
      var act = function (kind, id) {
        var body = kind === "gesture" ? { name: "gesture", args: { name: id } }
          : kind === "emotion" ? { name: "mood", args: { name: id, seconds: 8 } }
          : { name: "action", args: { action: id } };
        postJson("/amadeus-live3d/command", body).then(function (d) { if (!d || !d.ok) setNote({ text: (d && d.error) || "Не получилось.", error: true }); });
      };
      var models = (data && data.models) || [];
      var active = models.filter(function (m) { return m.id === (data && data.active); })[0];
      return jsx("div", { className: "aui-stack", children: [
        jsx(ImportPanel, { key: "imp", onImported: function (d) {
          refresh();
          var first = d && d.results && d.results.map(function (r) { return r.imported && r.imported[0]; }).filter(Boolean)[0];
          if (first && !(data && data.active)) select(first.id);
        } }),
        active ? jsx("section", { key: "act", className: "aui-card aui-active-card", children: [
          jsx("div", { key: "h", className: "aui-active-head", children: [
            jsx("span", { key: "t", className: "aui-active-thumb", children: active.preview ? jsx("img", { src: active.preview + "?v=" + (data.v || 0), alt: "" }) : null }),
            jsx("div", { key: "x", className: "aui-hero-text", children: [
              jsx("div", { key: "n", className: "aui-active-name", children: active.name }),
              jsx("div", { key: "a", className: "aui-row-hint", children: [active.author ? "автор: " + active.author : "", active.version ? "VRM " + active.version : "", active.expressions && active.expressions.length ? active.expressions.length + " выражений" : ""].filter(Boolean).join(" · ") }),
              active.license && /onlyAuthor|personal|no-redistribution|Disallow|Allow only|author/i.test(active.license) ? jsx("div", { key: "l", className: "aui-row-hint", children: "Лицензия автора: " + active.license + " — только для личного использования." }) : null
            ] })
          ] }),
          jsx("div", { key: "q", className: "aui-actions", children: ACTION_GROUPS.map(function (g) {
            return jsx("div", { key: g[0], className: "aui-action-row", children: [
              jsx("span", { key: "l", className: "aui-action-label", children: g[0] }),
              jsx("div", { key: "c", className: "aui-action-chips", children: g[1].map(function (q) {
                return jsx("button", { key: q[1], type: "button", className: "aui-action" + (q[0] === "emotion" ? " aui-action-emotion" : ""), onClick: function () { act(q[0], q[1]); }, children: q[2] });
              }) })
            ] });
          }).concat([jsx(ClipPicker, { key: "clips", onError: function (t) { setNote({ text: t, error: true }); } })]) })
        ] }) : null,
        jsx("section", { key: "list", className: "aui-card", children: [
          jsx("header", { key: "h", className: "aui-card-head aui-card-head-row", children: [
            jsx("div", { key: "t", children: [jsx("h3", { key: "a", children: "Персонажи" + (models.length ? " · " + models.length : "") }), jsx("p", { key: "b", children: "Нажмите на карточку, чтобы персонаж появился на рабочем столе." })] }),
            jsx("button", { key: "r", className: "aui-btn", type: "button", onClick: refresh, children: "Обновить" })
          ] }),
          jsx("div", { key: "b", className: "aui-card-pad", children: [
            note ? jsx("div", { key: "n", className: "aui-note aui-note-inline" + (note.error ? " aui-note-error" : ""), children: note.text }) : null,
            data === null ? jsx("div", { key: "l", className: "aui-gallery", children: [0, 1, 2].map(function (i) { return jsx("div", { key: i, className: "aui-model aui-model-skeleton" }); }) })
              : !models.length ? jsx("div", { key: "e", className: "aui-empty", children: "Моделей пока нет — добавьте .vrm в блоке выше." })
              : jsx("div", { key: "g", className: "aui-gallery", children: models.map(function (m) {
                var on = m.id === data.active;
                return jsx("div", { key: m.id, role: "button", tabIndex: 0, className: "aui-model" + (on ? " aui-model-active" : ""), title: on ? m.name + " — на экране" : "Показать " + m.name,
                  onClick: function () { if (!on) select(m.id); }, onKeyDown: function (e) { if ((e.key === "Enter" || e.key === " ") && !on) { e.preventDefault(); select(m.id); } },
                  children: [
                    jsx("span", { key: "a", className: "aui-model-art", children: m.preview ? jsx("img", { src: m.preview, alt: m.name, loading: "lazy" }) : jsx("span", { className: "amadeus-character-preview-empty", children: busy === m.id ? "…" : "3D" }) }),
                    on ? jsx("span", { key: "f", className: "aui-model-flag", children: "На экране" }) : null,
                    jsx("button", { key: "x", className: "aui-model-remove", type: "button", title: "Удалить", onClick: function (e) { e.stopPropagation(); remove(m); }, children: "×" }),
                    jsx("span", { key: "m", className: "aui-model-meta", children: [jsx("span", { key: "n", className: "aui-model-name", children: m.name }), jsx("span", { key: "s", className: "aui-model-sub", children: m.author || ("VRM " + (m.version || "")) })] })
                  ] });
              }) })
          ] })
        ] })
      ] });
    }

    // ---- behaviour ----
    function RelationRow() {
      var st = react.useState(null); var m = st[0], setM = st[1];
      var load = function (reset) { postJson("/amadeus-live3d/command", { name: "memory", args: reset ? { reset: true } : {} }).then(function (d) { if (d && d.result && d.result.ok) setM(d.result); }); };
      react.useEffect(function () { load(false); var id = setInterval(function () { load(false); }, 5000); return function () { clearInterval(id); }; }, []);
      if (!m || typeof m.bond !== "number") return null;
      var bar = function (v, cls) { return jsx("span", { className: "aui-rel-bar", children: jsx("span", { className: "aui-rel-fill " + cls, style: { width: Math.round(v * 100) + "%" } }) }); };
      return auiRow("rel", "Отношение", "Доверие растёт от поглаживаний и бережного обращения; настороженность — от падений, кручения и тычков, и сама проходит за несколько минут.", jsx("div", { className: "aui-rel", children: [
        jsx("div", { key: "b", className: "aui-rel-line", children: ["Доверие ", bar(m.bond, "aui-rel-bond"), " " + Math.round(m.bond * 100) + "%"] }),
        jsx("div", { key: "w", className: "aui-rel-line", children: ["Настороженность ", bar(m.wary, "aui-rel-wary"), " " + Math.round(m.wary * 100) + "%"] }),
        jsx("button", { key: "r", type: "button", className: "aui-link", onClick: function () { if (window.confirm("Сбросить отношение персонажа к вам?")) load(true); }, children: "Сбросить" })
      ] }));
    }
    function VoiceCard() {
      var s = useSettings(); var cfg = s[0], patch = s[1];
      var vs = react.useState([]); var winVoices = vs[0], setWinVoices = vs[1];
      react.useEffect(function () { postJson("/amadeus-live3d/command", { name: "list_voices" }).then(function (d) { if (d && d.result && d.result.voices) setWinVoices(d.result.voices); }); }, []);
      if (!cfg) return null;
      var v = cfg.voice || {};
      var on = !!v.enabled;
      var engine = v.engine || "kokoro";
      var kokoro = engine === "kokoro", edge = engine === "edge";
      var EDGE = [["ru-RU-SvetlanaNeural", "Светлана (русский)"], ["en-US-AvaMultilingualNeural", "Ava (многоязычный)"], ["en-US-EmmaMultilingualNeural", "Emma (многоязычный)"], ["ru-RU-DmitryNeural", "Дмитрий (русский, мужской)"]];
      var seg = function (key, opts, cur, fmt) { return jsx("div", { className: "aui-seg", children: opts.map(function (x) { return jsx("button", { key: x, type: "button", className: "aui-seg-btn" + (cur === x ? " aui-seg-btn-active" : ""), onClick: function () { var p = {}; p[key] = x; patch({ voice: p }); }, children: fmt(x) }); }) }); };
      var voices = cfg.voices || ["sveta", "masha", "dima"];
      var dev = cfg.voiceDevices || {};
      var winCurrent = v.voice || ((winVoices.filter(function (x) { return /^ru/i.test(x.lang); })[0] || winVoices[0] || {}).uri || "");
      var speedNow = String(v.speed != null ? v.speed : 1);
      return auiCard("voice", "Озвучка ответов", "Персонаж читает ответ агента вслух: нейроголоса Edge (онлайн) или Kokoro (локально); губы и субтитры идут в такт голосу. Если голос недоступен — голос Windows.", [
        auiRow("v-on", "Озвучивать ответы", null, auiSwitch(on, function () { patch({ voice: { enabled: !on } }); })),
        auiRow("v-mute", "Без звука", "Она говорит беззвучно: рот и субтитры двигаются, но вы её не слышите. Та же кнопка с динамиком на круге в режиме пузыря.", auiSwitch(!!v.muted, function () { patch({ voice: { muted: !v.muted } }); }), !on),
        auiRow("v-engine", "Движок", null, jsx("div", { className: "aui-seg", children: [["edge", "Edge (онлайн)"], ["kokoro", "Kokoro (как в live2D)"], ["windows", "Голоса Windows"]].map(function (m) {
          return jsx("button", { key: m[0], type: "button", className: "aui-seg-btn" + ((v.engine || "kokoro") === m[0] ? " aui-seg-btn-active" : ""), onClick: function () { patch({ voice: { engine: m[0] } }); }, children: m[1] });
        }) }), !on),
        edge ? auiRow("v-evoice", "Голос", "Нейроголоса Microsoft: живая интонация. Нужен интернет, текст ответа уходит в Microsoft.", jsx("select", { className: "aui-select", value: v.edgeVoice || "ru-RU-SvetlanaNeural", onChange: function (e) { patch({ voice: { edgeVoice: e.target.value } }); }, children: EDGE.map(function (x) { return jsx("option", { key: x[0], value: x[0], children: x[1] }); }) }), !on) : null,
        edge ? auiRow("v-erate", "Темп", null, seg("edgeRate", [-10, 0, 10, 20], v.edgeRate == null ? 10 : v.edgeRate, function (x) { return (x > 0 ? "+" : "") + x + "%"; }), !on) : null,
        edge ? auiRow("v-epitch", "Высота голоса", null, seg("edgePitch", [0, 8, 15, 25], v.edgePitch == null ? 15 : v.edgePitch, function (x) { return x === 0 ? "обычная" : "+" + x; }), !on) : null,
        edge ? null : kokoro ? auiRow("v-kvoice", "Голос", null, jsx("select", { className: "aui-select", value: v.kokoroVoice || "sveta", onChange: function (e) { patch({ voice: { kokoroVoice: e.target.value } }); }, children: voices.map(function (n) { return jsx("option", { key: n, value: n, children: n }); }) }), !on)
          : auiRow("v-voice", "Голос", winVoices.length ? null : "Голоса Windows не найдены.", jsx("select", { className: "aui-select", value: winCurrent, onChange: function (e) { patch({ voice: { voice: e.target.value } }); }, children: winVoices.map(function (x) { return jsx("option", { key: x.uri, value: x.uri, children: x.name.replace(/^Microsoft /, "") }); }) }), !on),
        edge ? null : kokoro ? auiRow("v-speed", "Скорость речи", null, jsx("div", { className: "aui-seg", children: ["0.75", "1", "1.25", "1.5"].map(function (x) {
          return jsx("button", { key: x, type: "button", className: "aui-seg-btn" + (speedNow === x ? " aui-seg-btn-active" : ""), onClick: function () { patch({ voice: { speed: Number(x) } }); }, children: x + "×" });
        }) }), !on)
          : auiRow("v-rate", "Скорость", null, auiRange(v.rate || 1, 0.5, 2, 0.05, "×", function (x) { patch({ voice: { rate: x } }); }), !on),
        kokoro || edge ? null : auiRow("v-pitch", "Высота", null, auiRange(v.pitch || 1.05, 0.5, 2, 0.05, "", function (x) { patch({ voice: { pitch: x } }); }), !on),
        auiRow("v-vol", "Громкость", null, auiRange(dev.outputVolume == null ? 70 : dev.outputVolume, 0, 100, 5, "%", function (x) { patch({ voiceDevices: { outputVolume: x } }); }), !on),
        auiRow("v-react", "Озвучивать реакции", "Фразы на касания тоже звучат вслух.", auiSwitch(v.reactions !== false, function () { patch({ voice: { reactions: v.reactions === false } }); }), !on),
        auiRow("v-test", "Проверить", kokoro ? "Первый запуск Kokoro занимает несколько секунд." : null, jsx("button", { type: "button", className: "aui-btn", onClick: function () { postJson("/amadeus-live3d/command", { name: "say", args: { text: "Привет! Так звучит мой голос." } }); }, children: "▶ Сказать фразу" }), !on)
      ]);
    }
    function MicCard() {
      var s = useSettings(); var cfg = s[0], patch = s[1];
      var devState = react.useState({ inputs: [], outputs: [] }); var dev = devState[0], setDev = devState[1];
      var noteState = react.useState(null); var note = noteState[0], setNote = noteState[1];
      var levelState = react.useState(0); var level = levelState[0], setLevel = levelState[1];
      var recState = react.useState(false); var recording = recState[0], setRecording = recState[1];
      var refs = react.useRef({ stream: null, ctx: null, analyser: null, raf: 0, recorder: null, chunks: [], file: null, micOn: false });
      var loadDevices = function () {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
        navigator.mediaDevices.enumerateDevices().then(function (list) { setDev({ inputs: list.filter(function (d) { return d.kind === "audioinput"; }), outputs: list.filter(function (d) { return d.kind === "audiooutput"; }) }); }).catch(function () {});
      };
      react.useEffect(function () {
        loadDevices();
        if (navigator.mediaDevices && navigator.mediaDevices.addEventListener) navigator.mediaDevices.addEventListener("devicechange", loadDevices);
        return function () { var r = refs.current; if (r.stream) r.stream.getTracks().forEach(function (t) { t.stop(); }); if (r.ctx) r.ctx.close(); if (r.raf) cancelAnimationFrame(r.raf); };
      }, []);
      if (!cfg) return null;
      var vd = cfg.voiceDevices || {};
      var stopMic = function () {
        var r = refs.current; r.micOn = false;
        if (r.raf) { cancelAnimationFrame(r.raf); r.raf = 0; }
        if (r.stream) { r.stream.getTracks().forEach(function (t) { t.stop(); }); r.stream = null; }
        if (r.ctx) { r.ctx.close(); r.ctx = null; }
        setLevel(0);
      };
      var startMic = function () {
        navigator.mediaDevices.getUserMedia({ audio: vd.inputDeviceId ? { deviceId: { exact: vd.inputDeviceId } } : true }).then(function (stream) {
          var r = refs.current; r.stream = stream; r.ctx = new AudioContext();
          var src = r.ctx.createMediaStreamSource(stream); r.analyser = r.ctx.createAnalyser(); r.analyser.fftSize = 512; src.connect(r.analyser); r.micOn = true;
          var data = new Uint8Array(r.analyser.frequencyBinCount);
          var loop = function () { if (!r.micOn) return; r.analyser.getByteFrequencyData(data); var sum = 0; for (var i = 0; i < data.length; i++) sum += data[i]; setLevel(Math.min(1, (sum / data.length) / 128)); r.raf = requestAnimationFrame(loop); };
          loop(); loadDevices();
        }).catch(function (e) { setNote({ text: "Нет доступа к микрофону: " + (e && e.name), error: true }); });
      };
      var startRecording = function () {
        navigator.mediaDevices.getUserMedia({ audio: vd.inputDeviceId ? { deviceId: { exact: vd.inputDeviceId } } : true }).then(function (stream) {
          var r = refs.current; r.stream = stream;
          var mime = MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
          var rec = new MediaRecorder(stream, { mimeType: mime }); r.recorder = rec; r.chunks = [];
          rec.ondataavailable = function (e) { if (e.data && e.data.size) r.chunks.push(e.data); };
          rec.onstop = function () {
            var fr = new FileReader();
            fr.onload = function () {
              var url = String(fr.result || ""), b64 = url.slice(url.indexOf(",") + 1);
              setNote({ text: "Распознаю…" });
              postJson("/amadeus-live3d/transcribe", { data: b64, type: mime.split(";")[0], filename: "audio.webm" }).then(function (d) {
                if (d && d.ok && d.text) { setNote({ text: "Распознано: " + d.text }); injectChat(d.text); } else setNote({ text: (d && d.error) || "Не удалось распознать.", error: true });
              }).catch(function () { setNote({ text: "Ошибка распознавания.", error: true }); }).finally(function () { stopMic(); setRecording(false); });
            };
            fr.readAsDataURL(new Blob(r.chunks, { type: mime }));
          };
          rec.start(); setRecording(true); setNote({ text: "Говорите… (отпустите, чтобы отправить)" });
        }).catch(function (e) { setNote({ text: "Нет доступа к микрофону: " + (e && e.name), error: true }); });
      };
      var stopRecording = function () { var r = refs.current; if (r.recorder && r.recorder.state !== "inactive") r.recorder.stop(); };
      var importVoice = function (file) {
        if (!file) return;
        if (!/\.bin$/i.test(file.name)) { setNote({ text: "Нужен файл .bin (стиль голоса Kokoro).", error: true }); return; }
        var name = file.name.replace(/\.bin$/i, "").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40);
        var fr = new FileReader();
        fr.onload = function () {
          var url = String(fr.result || ""), b64 = url.slice(url.indexOf(",") + 1);
          setNote({ text: "Загружаю голос «" + name + "»…" });
          postJson("/amadeus-live3d/voice-import", { name: name, data: b64 }).then(function (d) {
            if (d && d.ok) { setNote({ text: "Голос добавлен: " + d.name }); patch({}); } else setNote({ text: (d && d.error) || "Не удалось добавить голос.", error: true });
          });
        };
        fr.readAsDataURL(file);
      };
      var deviceSelect = function (kind, list, fallback) {
        var key = kind === "input" ? "inputDeviceId" : "outputDeviceId";
        return jsx("select", { className: "aui-select", value: vd[key] || "", onChange: function (e) { var p = {}; p[key] = e.target.value; patch({ voiceDevices: p }); }, children: [jsx("option", { key: "", value: "", children: "По умолчанию" })].concat(list.filter(function (d) { return d.deviceId && d.deviceId !== "default"; }).map(function (d, i) { return jsx("option", { key: d.deviceId + ":" + i, value: d.deviceId, children: d.label || (fallback + " " + (i + 1)) }); })) });
      };
      var ls = cfg.listen || {};
      var wakeTitle = (ls.wake || "алиса").replace(/^./, function (c) { return c.toUpperCase(); });
      return jsx("div", { className: "aui-stack", children: [
        auiCard("listen", "Обращение «" + wakeTitle + "»", "Микрофон слушает постоянно. Фраза с её именем («" + wakeTitle + ", почему не собирается?») сама уходит агенту в открытый чат DSH — вместе с тем, что у вас на экране. Без имени ничего не отправляется. Распознаёт провайдер DSH (LiteLLM Whisper), без него — локальный whisper.", [
          auiRow("listen-on", "Слушать всегда", "Пока она говорит, микрофон не слушает, чтобы не услышать саму себя. Включается и в меню по правому клику.", auiSwitch(!!ls.enabled, function () { patch({ listen: { enabled: !ls.enabled } }); })),
          auiRow("listen-wake", "Имя", "Слово, на которое она откликается.", jsx("input", { className: "aui-select", type: "text", defaultValue: ls.wake || "алиса", key: ls.wake || "алиса", style: { width: 140 }, onBlur: function (e) { var v = e.target.value.trim(); if (v && v !== ls.wake) patch({ listen: { wake: v } }); }, onKeyDown: function (e) { if (e.key === "Enter") e.target.blur(); } }), !ls.enabled),
          auiRow("listen-screen", "Что на экране", "Добавлять к фразе заголовок и текст активного окна (код, ошибка в терминале, страница). Окна с паролями, банками и приватные вкладки не читаются.", auiSwitch(ls.screen !== false, function () { patch({ listen: { screen: ls.screen === false } }); }), !ls.enabled),
          auiRow("listen-follow", "Продолжать разговор", "8 секунд после её ответа можно говорить без имени.", auiSwitch(ls.follow !== false, function () { patch({ listen: { follow: ls.follow === false } }); }), !ls.enabled)
        ]),
        auiCard("mic", "Микрофон и динамик", "Голосовое сообщение агенту: правый клик по персонажу → «Микрофон» (ещё раз — отправить) или режим рации ниже. Речь распознаётся и вставляется в поле ввода.", [
          auiRow("in", "Микрофон", null, deviceSelect("input", dev.inputs, "Микрофон")),
          auiRow("out", "Динамик", "Куда звучит голос персонажа.", deviceSelect("output", dev.outputs, "Динамик")),
          auiRow("test", "Проверка микрофона", "Скажите что-нибудь — полоска покажет уровень.", jsx("div", { className: "aui-inline", children: [
            jsx("div", { key: "l", className: "aui-level", children: jsx("i", { style: { width: Math.round(level * 100) + "%" } }) }),
            jsx("button", { key: "b", className: "aui-btn" + (refs.current.micOn ? " aui-btn-danger" : ""), type: "button", onClick: function () { if (refs.current.micOn) stopMic(); else startMic(); }, children: refs.current.micOn ? "Стоп" : "Проверить" })
          ] })),
          auiRow("radio", "Режим рации", "Удерживайте кнопку, пока говорите.", auiSwitch(!!cfg.radio, function () { patch({ radio: !cfg.radio }); })),
          cfg.radio ? jsx("div", { key: "ptt", className: "aui-ptt-wrap", children: jsx("button", { className: "aui-ptt" + (recording ? " aui-ptt-on" : ""), type: "button",
            onPointerDown: function (e) { e.preventDefault(); startRecording(); }, onPointerUp: function () { stopRecording(); }, onPointerLeave: function () { if (recording) stopRecording(); },
            children: recording ? "Говорю… отпустите, чтобы отправить" : "Нажмите и говорите" }) }) : null
        ], auiNote(note)),
        auiCard("voices", "Голоса", "Свои стили голоса Kokoro (.bin) появятся в списке голосов — общие с live2D.", [
          auiRow("import", "Добавить голос", null, jsx("div", { className: "aui-inline", children: [
            jsx("button", { key: "b", className: "aui-btn", type: "button", onClick: function () { if (refs.current.file) refs.current.file.click(); }, children: "Загрузить .bin" }),
            jsx("input", { key: "i", className: "aui-hidden", type: "file", accept: ".bin", ref: function (el) { refs.current.file = el; }, onChange: function (e) { importVoice(e.target.files && e.target.files[0]); e.target.value = ""; } })
          ] }))
        ])
      ] });
    }
    function injectChat(text, send) {
      if (!text) return;
      var el = document.querySelector("textarea") || document.querySelector("[contenteditable=\"true\"]") || document.querySelector("[role=\"textbox\"]");
      if (!el) return;
      el.focus();
      if (el.tagName === "TEXTAREA") {
        var setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value");
        if (setter && setter.set) setter.set.call(el, text); else el.value = text;
        el.dispatchEvent(new Event("input", { bubbles: true }));
      } else { el.textContent = text; el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text })); }
      if (send) setTimeout(function () { submitChat(el); }, 120);
    }
    /** Send the composer: its send button when there is one, Enter otherwise. */
    function submitChat(el) {
      var scope = (el.closest && (el.closest("form") || el.closest("[class*=composer]") || el.closest("[class*=Composer]") || el.closest("[class*=input]"))) || document;
      var btns = Array.prototype.slice.call(scope.querySelectorAll("button"));
      var btn = btns.find(function (b) { var l = ((b.getAttribute("aria-label") || "") + " " + (b.getAttribute("title") || "") + " " + (b.textContent || "")).toLowerCase(); return !b.disabled && /send|отправ|submit/.test(l); })
        || (scope !== document && scope.querySelector("button[type=submit]:not([disabled])"));
      if (btn) { btn.click(); return; }
      var opts = { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true, cancelable: true };
      el.dispatchEvent(new KeyboardEvent("keydown", opts)); el.dispatchEvent(new KeyboardEvent("keypress", opts)); el.dispatchEvent(new KeyboardEvent("keyup", opts));
    }

    // ---- the companion's own chat: Workspace "live3D", one chat per character (named after her)
    var companionChat = { ctx: null, remote: null, ui: null, pending: null, sid: "", model: "" };
    function clog(msg) { try { postJson("/amadeus-live3d/client-log", { msg: String(msg) }); } catch (e) {} }
    function chatRemote() { var r = companionChat.remote; return r && r.session && r.workspace ? r : null; }
    function ensureCompanionChat() {
      if (companionChat.pending) return companionChat.pending;
      companionChat.pending = (async function () {
        var remote = chatRemote();
        if (!remote) { clog("no remote: " + (companionChat.remote ? Object.keys(companionChat.remote).join(",") : "not injected")); return ""; }
        var info = await fetch("/amadeus-live3d/companion-chat").then(function (r) { return r.json(); });
        if (!info || !info.ok || !info.model) return "";
        var ws = await remote.workspace.create({ path: info.path });
        if (!ws || !ws.ok) { clog("workspace: " + JSON.stringify(ws && ws.error)); return ""; }
        var wsId = ws.value.workspace.workspaceId || ws.value.workspace.id;
        if (wsId !== info.workspaceId) await postJson("/amadeus-live3d/companion-chat", { workspaceId: wsId });
        var sid = info.sessions[info.model.id] || "";
        if (!sid) {
          var s = await remote.session.create({ workspaceId: wsId });
          if (!s || !s.ok) { clog("session: " + JSON.stringify(s && s.error)); return ""; }
          sid = s.value.sessionId;
          await remote.session.rename({ sessionId: sid, title: info.model.name });
          await postJson("/amadeus-live3d/companion-chat", { modelId: info.model.id, sessionId: sid });
        }
        companionChat.sid = sid; companionChat.model = info.model.id;
        return sid;
      })().catch(function (e) { clog("chat error: " + (e && (e.stack || e.message) || e)); return ""; }).finally(function () { setTimeout(function () { companionChat.pending = null; }, 0); });
      return companionChat.pending;
    }
    /** A voice phrase into her chat (opened on screen); false when that is not possible. */
    async function sendToCompanionChat(text, retried) {
      var sid = await ensureCompanionChat();
      var remote = chatRemote();
      if (!sid || !remote) return false;
      var tz = "UTC"; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch (e) {}
      var rid = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);
      var r = await remote.session.prompt({ requestId: rid, sessionId: sid, mode: "queue", content: [{ type: "text", text: text }], clientTimeZone: tz });
      if (!r || !r.ok) {
        clog("prompt: " + JSON.stringify(r && r.error));
        if (!retried) { await postJson("/amadeus-live3d/companion-chat", { modelId: companionChat.model, sessionId: "" }); companionChat.sid = ""; return sendToCompanionChat(text, true); }   // the chat was deleted: a new one
        return false;
      }
      try { var ui = companionChat.ui; if (ui && ui.openSession) ui.openSession(sid); } catch (e) {}
      return true;
    }
    var chatPolling = false;
    function pollChatMessage() {
      if (chatPolling) return;
      chatPolling = true;
      setInterval(function () {
        fetch("/amadeus-live3d/chat-message").then(function (r) { return r.json(); }).then(function (d) { if (!d || !d.ok || !d.text) return; if (d.send) sendToCompanionChat(d.text).then(function (ok) { if (!ok) injectChat(d.text, true); }); else injectChat(d.text, false); }).catch(function () {});
      }, 1500);
    }
    function BehaviorTab() {
      var s = useSettings(); var cfg = s[0], patch = s[1];
      if (!cfg) return jsx("div", { className: "aui-row-hint", children: "Загрузка…" });
      var b = cfg.behaviors || {};
      var selfLife = (cfg.control || "agent") === "self";
      var sw = function (key, label, hint) { var own = key === "walk" || key === "climb" || key === "sleep"; return auiRow(key, label, hint, auiSwitch(b[key] !== false, function () { var p = {}; p[key] = b[key] === false; patch({ behaviors: p }); }), cfg.hidden || (own && !selfLife)); };
      return jsx("div", { className: "aui-stack", children: [
        auiCard("screen", "На экране", null, [
          auiRow("shown", "Показывать персонажа", "Живёт поверх окон в нижней части экрана.", auiSwitch(!cfg.hidden, function () { patch({ hidden: !cfg.hidden }); })),
          auiRow("portrait", "Режим пузыря", "Голова и плечи в круглом окошке в углу экрана — как «watch & play» в Kyndred. Кольцо можно перетаскивать, колесо мыши над ним меняет размер.", auiSwitch(!!(cfg.portrait || {}).enabled, function () { patch({ portrait: { enabled: !(cfg.portrait || {}).enabled } }); }), cfg.hidden),
          auiRow("portrait-size", "Размер пузыря", null, auiRange((cfg.portrait || {}).size || 220, 120, 520, 10, " px", function (v) { patch({ portrait: { size: v } }); }), cfg.hidden),
          auiRow("portrait-auto", "Пузырь в полноэкранных играх", "Вместо того чтобы прятаться, персонаж уменьшается в пузырь в углу, пока открыта игра или видео на весь экран.", auiSwitch((cfg.portrait || {}).auto !== false, function () { patch({ portrait: { auto: (cfg.portrait || {}).auto === false } }); }), cfg.hidden || (cfg.behaviors || {}).hideFullscreen === false),
          auiRow("height", "Рост", "Высота персонажа на экране.", auiRange(cfg.height || 340, 180, 700, 10, " px", function (v) { patch({ height: v }); }), cfg.hidden),
          auiRow("shade", "Тени на одежде", "У моделей VRoid тени одежды сиреневые — изнанка плаща и складки светятся на тёмном фоне. «Нейтральные» делают их серыми той же яркости.", jsx("div", { className: "aui-seg", children: [["neutral", "Нейтральные"], ["author", "Как у автора"]].map(function (q) {
            return jsx("button", { key: q[0], type: "button", className: "aui-seg-btn" + ((cfg.shadeTint || "neutral") === q[0] ? " aui-seg-btn-active" : ""), onClick: function () { patch({ shadeTint: q[0] }); }, children: q[1] });
          }) })),
          auiRow("shadow", "Тень под ногами", "Мягкая тень на полу или на краю окна — персонаж «стоит», а не висит в воздухе.", auiSwitch((cfg.look || {}).shadow !== false, function () { patch({ look: { shadow: (cfg.look || {}).shadow === false } }); }), cfg.hidden),
          auiRow("rim", "Контурный свет", "Лёгкая подсветка по краю силуэта, отделяет персонажа от фона.", auiSwitch((cfg.look || {}).rim !== false, function () { patch({ look: { rim: (cfg.look || {}).rim === false } }); }), cfg.hidden),
          auiRow("symbols", "Символы эмоций", "Искорки, сердечки, капелька, «венка», «Zz» у головы — по настроению.", auiSwitch((cfg.look || {}).symbols !== false, function () { patch({ look: { symbols: (cfg.look || {}).symbols === false } }); }), cfg.hidden),
          auiRow("quality", "Качество картинки", "Выше — чётче края, волосы и глаза, но больше нагрузка на видеокарту.", jsx("div", { className: "aui-seg", children: [["normal", "Обычное"], ["high", "Высокое"], ["ultra", "Ультра"]].map(function (q) {
            return jsx("button", { key: q[0], type: "button", className: "aui-seg-btn" + ((cfg.quality || "high") === q[0] ? " aui-seg-btn-active" : ""), onClick: function () { patch({ quality: q[0] }); }, children: q[1] });
          }) }), cfg.hidden)
        ]),
        auiCard("life", "Жизнь", "Кто решает, что она делает: агент (по разговору, через свои инструменты) или она сама (гуляет, лазает по окнам, засыпает). Кнопки в карточке персонажа — для проверки действий, жестов, эмоций и поз.", [
          auiRow("control", "Кто управляет", (cfg.control || "agent") === "agent" ? "Между ответами агента она спокойно стоит: дышит, моргает, следит за курсором, отвечает на касания." : "Она живёт сама: гуляет, садится, засыпает, реагирует на то, чем вы заняты.", jsx("div", { className: "aui-seg", children: [["agent", "Агент"], ["self", "Сама"]].map(function (m) {
            return jsx("button", { key: m[0], type: "button", className: "aui-seg-btn" + ((cfg.control || "agent") === m[0] ? " aui-seg-btn-active" : ""), onClick: function () { patch({ control: m[0] }); }, children: m[1] });
          }) }), cfg.hidden),
          sw("walk", "Гулять", "Ходит по панели задач и по краям окон."),
          sw("climb", "Залезать на окна", "Запрыгивает на верхний край окон и сидит, болтая ногами."),
          sw("sleep", "Засыпать", "Спит, когда вы не трогаете компьютер несколько минут; просыпается, когда вы вернётесь."),
          sw("cursor", "Следить за курсором", "Поворачивает голову и глаза к мыши."),
          sw("physics", "Физика", "Можно схватить и бросить — упадёт и приземлится."),
          sw("hideFullscreen", "Прятаться в полноэкранных приложениях", "Игры и видео на весь экран не перекрываются.")
        ]),
        auiCard("touch", "Касания", "Погладить по голове, «бупнуть» в нос, ткнуть, схватить, покрутить, уронить — на всё своя реакция. Персонаж запоминает, как с ним обращаются.", [
          auiRow("t-on", "Реакции на касания", null, auiSwitch((cfg.touch || {}).enabled !== false, function () { patch({ touch: { enabled: (cfg.touch || {}).enabled === false } }); }), cfg.hidden),
          auiRow("t-lines", "Фразы в пузыре", "Короткие реплики: «Мур…», «Ой!», «Хватит!» (озвучиваются, если включён голос).", auiSwitch((cfg.touch || {}).lines !== false, function () { patch({ touch: { lines: (cfg.touch || {}).lines === false } }); }), cfg.hidden || (cfg.touch || {}).enabled === false),
          jsx(RelationRow, { key: "rel" })
        ]),
        auiCard("how", "Как общаться", null, [
          jsx("div", { key: "h", className: "aui-howto", children: [
            jsx("div", { key: "1" }, "🖱 ", jsx("b", null, "Схватить"), " — зажмите левую кнопку на персонаже и тяните; отпустите с размаху — полетит."),
            jsx("div", { key: "2" }, "✋ ", jsx("b", null, "Погладить"), " — поводите курсором по голове туда-сюда."),
            jsx("div", { key: "3" }, "👆 ", jsx("b", null, "Клик"), " — по носу хихикнет, по макушке довольна, по телу или ногам удивится; спящего разбудит. Если тыкать слишком часто — отмахнётся и обидится."),
            jsx("div", { key: "3b" }, "🌀 ", jsx("b", null, "Покрутить или потрясти"), " на весу — закружится голова; уронить с высоты — обидится."),
            jsx("div", { key: "4" }, "☰ ", jsx("b", null, "Правый клик"), " — меню: сесть, уснуть, потанцевать, позвать к курсору."),
            jsx("div", { key: "5" }, "💬 ", jsx("b", null, "Агент"), " — когда агент думает, персонаж задумывается; работает с инструментами — «печатает»; отвечает — говорит с пузырём.")
          ] })
        ])
      ] });
    }

    // ---- animations ----
    var ROLES = ["idle", "walk", "sit", "sit_edge", "sleep", "wave", "dance", "stretch", "think", "happy", "sad", "angry", "surprised", "jump", "fall", "land", "held", "talk", "typing", "pose", "extra"];
    var ROLE_LABELS = { idle: "Стоит", walk: "Ходьба", sit: "Сидит", sit_edge: "Сидит на краю", sleep: "Спит", wave: "Машет", dance: "Танец", stretch: "Потягивается", think: "Думает", happy: "Радость", sad: "Грусть", angry: "Злость", surprised: "Удивление", jump: "Прыжок", fall: "Падение", land: "Приземление", held: "Её держат", talk: "Говорит", pose: "Поза", typing: "Печатает", extra: "Без роли" };
    function AnimationsTab() {
      var s = useSettings(); var cfg = s[0], reload = s[2];
      var noteState = react.useState(null); var note = noteState[0], setNote = noteState[1];
      var showAllState = react.useState(false); var showAll = showAllState[0], setShowAll = showAllState[1];
      var qState = react.useState(""); var q = qState[0], setQ = qState[1];
      var roleState = react.useState(""); var roleFilter = roleState[0], setRoleFilter = roleState[1];
      if (!cfg) return jsx("div", { className: "aui-row-hint", children: "Загрузка…" });   // hooks above: same count on every render
      var anims = cfg.animations || [];
      var assign = function (a, role) { postJson("/amadeus-live3d/animations/assign", { file: a.file, clip: a.clip, role: role }).then(function (d) { if (d && d.ok) reload(); else setNote({ text: (d && d.error) || "Ошибка.", error: true }); }); };
      var remove = function (a) { if (window.confirm(a.clip ? "Удалить весь набор " + a.file + " (все его клипы)?" : "Удалить анимацию " + a.file + "?")) postJson("/amadeus-live3d/animations/assign", { file: a.file, remove: true }).then(reload); };
      var needle = q.trim().toLowerCase();
      var visible = anims.filter(function (a) { return (showAll || roleFilter === "extra" || a.role !== "extra") && (!roleFilter || a.role === roleFilter) && (!needle || ((a.clip || "") + " " + a.file).toLowerCase().indexOf(needle) >= 0); });
      var hidden = anims.filter(function (a) { return a.role === "extra"; }).length;
      var fileLabel = function (name) { var m = /^(.*?)(\.(uanim\.json|vrma|vmd|fbx|glb|gltf|bvh|anim))$/i.exec(name); var base = (m ? m[1] : name).replace(/_/g, " "); return jsx("span", { className: "aui-file", title: name, children: [jsx("b", { key: "n", children: base }), m ? jsx("span", { key: "e", className: "aui-ext", children: m[3].replace(/^uanim\.json$/i, "unity") }) : null] }); };
      var covered = {};
      anims.forEach(function (a) { covered[a.role] = true; });
      return jsx("div", { className: "aui-stack", children: [
        jsx(ImportPanel, { key: "imp", onImported: reload }),
        auiCard("list", "Анимации" + (anims.length ? " · " + anims.length : ""), "Каждой анимации — роль: когда её играть. Роль угадывается по имени файла, её можно поменять. Для ролей без анимации персонаж двигается процедурно.", [
          anims.length ? jsx("div", { key: "tools", className: "aui-list-tools", children: [
            anims.length > 8 ? jsx("input", { key: "q", className: "aui-search", type: "search", placeholder: "Найти анимацию…", value: q, onChange: function (e) { setQ(e.target.value); } }) : null,
            roleFilter ? jsx("button", { key: "clr", type: "button", className: "aui-link", onClick: function () { setRoleFilter(""); }, children: "Все роли" }) : null,
            jsx("div", { key: "cov", className: "aui-chips aui-role-chips", children: ROLES.filter(function (r) { return r !== "extra"; }).map(function (r) { return jsx("button", { key: r, type: "button", title: covered[r] ? "Показать только эту роль" : "Для этой роли анимации нет — персонаж двигается процедурно", className: "aui-tag " + (covered[r] ? "aui-tag-ok" : "aui-tag-off") + (roleFilter === r ? " aui-tag-sel" : ""), onClick: function () { setRoleFilter(roleFilter === r ? "" : r); }, children: ROLE_LABELS[r] }); }) })
          ] }) : null,
          jsx("div", { key: "list", className: "aui-dense", children: visible.length ? visible.map(function (a) {
            return auiRow(a.file + "#" + (a.clip || ""), a.clip ? fileLabel(a.clip) : fileLabel(a.file), a.clip ? "из набора " + a.file : null, jsx("div", { className: "aui-inline", children: [
              jsx("select", { key: "s", className: "aui-select", value: a.role, onChange: function (e) { assign(a, e.target.value); }, children: ROLES.map(function (r) { return jsx("option", { key: r, value: r, children: ROLE_LABELS[r] }); }) }),
              jsx("button", { key: "x", type: "button", className: "aui-btn aui-btn-icon", title: a.clip ? "Удалить весь набор" : "Удалить", "aria-label": "Удалить", onClick: function () { remove(a); }, children: "×" })
            ] }));
          }) : jsx("div", { key: "e", className: "aui-empty aui-empty-tight", children: anims.length ? "Ничего не нашлось." : "Анимаций пока нет." }) }),
          (hidden || showAll) && !roleFilter ? jsx("button", { key: "more", type: "button", className: "aui-link aui-more", onClick: function () { setShowAll(!showAll); }, children: showAll ? "Скрыть клипы без роли" : "Показать клипы без роли (" + hidden + ")" }) : null,
        ], auiNote(note)),
        auiCard("where", "Где взять анимации", null, [
          jsx("div", { key: "h", className: "aui-howto", children: [
            jsx("div", { key: "1" }, jsx("b", null, "VRoid (VRMA)"), " — официальные бесплатные анимации .vrma на Booth (страница VRoid Project): скачайте и перетащите сюда."),
            jsx("div", { key: "2" }, jsx("b", null, "Mixamo (FBX)"), " — mixamo.com, бесплатно с аккаунтом Adobe: выберите анимацию, Download → FBX, «Without Skin». Плагин сам перенесёт её на VRM-скелет."),
            jsx("div", { key: "0" }, jsx("b", null, "Quaternius Universal Animation Library"), " — бесплатный CC0-набор (quaternius.itch.io): перетащите UAL1_Standard.glb, плагин сам разложит клипы по ролям (стоит, говорит, ходит, сидит, танцует)."),
            jsx("div", { key: "4" }, jsx("b", null, "MMD (.vmd)"), " — танцы и моушены с Booth (раздел 3D Motion & Animation) и Nico: перетащите .vmd или весь архив. Ноги ставятся по IK, мимика остаётся своей; по умолчанию роль «танец»."),
            jsx("div", { key: "5" }, jsx("b", null, "Позы Unity (.unitypackage / .anim)"), " — наборы поз для VRChat/Unity с Booth (гуманоидные .anim): перетащите .unitypackage или архив. Каждая поза получает роль «поза», и персонаж иногда позирует сам или по кнопке «Позировать»."),
            jsx("div", { key: "3" }, "Название файла или клипа подсказывает роль: idle, walk, sit, sleep, wave, dance, stretch, think…")
          ] })
        ])
      ] });
    }

    // ---- answers (speech bubble) ----
    function AnswersTab() {
      var s = useSettings(); var cfg = s[0], patch = s[1];
      if (!cfg) return jsx("div", { className: "aui-row-hint", children: "Загрузка…" });
      var sb = cfg.speechBubble || {};
      var on = sb.enabled !== false;
      var hide = typeof sb.hideAfter === "number" ? sb.hideAfter : 10;
      return jsx("div", { className: "aui-stack", children: [jsx(VoiceCard, { key: "voice" }), jsx(MicCard, { key: "mic" }), auiCard("answers", "Ответы агента", "Пузырь у головы персонажа: орб, точки и текст ответа (тот же, что у live2D). Цвета орба по состояниям — во вкладке Orbs.", [
        auiRow("on", "Показывать ответы", null, auiSwitch(on, function () { patch({ speechBubble: { enabled: !on } }); })),
        auiRow("mode", "Вид", null, jsx("div", { className: "aui-seg", children: [["bubble", "Пузырь с текстом"], ["subtitles", "Субтитры"], ["orb", "Только орб и точки"]].map(function (m) {
          return jsx("button", { key: m[0], type: "button", className: "aui-seg-btn" + ((sb.mode || "bubble") === m[0] ? " aui-seg-btn-active" : ""), onClick: function () { patch({ speechBubble: { mode: m[0] } }); }, children: m[1] });
        }) }), !on),
        sb.mode === "subtitles" ? jsx("div", { key: "subs-hint", className: "aui-row-hint aui-howto-pad", children: "Субтитры — как в Kyndred: одна-две строки у персонажа, слова появляются вместе с голосом (или в темпе чтения), пока агент думает — точки. Полный ответ остаётся в чате." }) : null,
        auiRow("hide", "Скрывать через", hide > 0 ? hide + " с после ответа" : "до следующего ответа", auiRange(hide, 0, 120, 1, " с", function (v) { patch({ speechBubble: { hideAfter: v } }); }), !on),
        auiRow("font", "Размер текста", null, auiRange(sb.fontSize || 14, 10, 32, 1, " px", function (v) { patch({ speechBubble: { fontSize: v } }); }), !on || sb.mode === "orb"),
        auiRow("bg", "Фон", null, jsx("input", { className: "aui-color", type: "color", value: sb.backgroundColor || "#211e2a", onChange: function (e) { patch({ speechBubble: { backgroundColor: e.target.value } }); } }), !on || sb.mode === "orb"),
        auiRow("fg", "Цвет текста", null, jsx("input", { className: "aui-color", type: "color", value: sb.fontColor || "#f5f3fa", onChange: function (e) { patch({ speechBubble: { fontColor: e.target.value } }); } }), !on || sb.mode === "orb")
      ])] });
    }

    var TABS = [["characters", "Персонажи"], ["behavior", "Поведение"], ["animations", "Анимации"], ["answers", "Ответы агента"]];
    function Live3DPage() {
      var tabState = react.useState(function () { try { var t = window.localStorage.getItem("amadeus-live3d-tab"); if (t && TABS.some(function (x) { return x[0] === t; })) return t; } catch (e) {} return "characters"; });
      var tab = tabState[0], setTab = tabState[1];
      var stState = react.useState(null); var status = stState[0], setStatus = stState[1];
      var loadStatus = function () {
        Promise.all([getJson("/amadeus-live3d/list").catch(function () { return {}; }), postJson("/amadeus-live3d/command", { name: "status" }).catch(function () { return {}; })]).then(function (r) {
          var list = r[0] || {}, st = (r[1] && r[1].result) || null;
          var m = (list.models || []).filter(function (x) { return x.id === list.active; })[0];
          setStatus({ name: m ? m.name : "", preview: m && m.preview ? m.preview : (m ? "/amadeus-live3d/preview/" + encodeURIComponent(m.id) : ""), state: st });
        });
      };
      react.useEffect(function () { loadStatus(); var t = setInterval(loadStatus, 5000); return function () { clearInterval(t); }; }, []);
      var STATE_RU = { idle: "стоит", walk: "гуляет", sit_edge: "сидит на окне", sit_floor: "сидит", sleep: "спит", sleep_sit: "дремлет", held: "у вас в руках", fall: "падает", jump: "прыгает", land: "приземляется", crouch: "готовится прыгнуть", react: "смотрит на вас" };
      var st = status && status.state;
      var pill = !status ? null : !status.name ? jsx("span", { className: "aui-pill", children: "Модель не выбрана" })
        : st ? jsx("span", { className: "aui-pill" + (st.sleeping ? "" : " aui-pill-on"), children: STATE_RU[st.state] || st.state }) : jsx("span", { className: "aui-pill", children: "запускается…" });
      var pickTab = function (id) { setTab(id); try { window.localStorage.setItem("amadeus-live3d-tab", id); } catch (e) {} };
      var body = tab === "characters" ? jsx(CharactersTab, { onChange: loadStatus }) : tab === "behavior" ? jsx(BehaviorTab, {}) : tab === "animations" ? jsx(AnimationsTab, {}) : jsx(AnswersTab, {});
      return jsx("div", { className: "aui-page", children: [
        jsx("div", { key: "hero", className: "aui-hero", children: [
          jsx("div", { key: "i", className: "aui-hero-icon", children: status && status.preview ? jsx("img", { src: status.preview, alt: "", onError: function (e) { e.target.style.display = "none"; } }) : "3D" }),
          jsx("div", { key: "t", className: "aui-hero-text", children: [
            jsx("div", { key: "a", className: "aui-hero-title", children: [status && status.name ? status.name : "3D-компаньон", pill] }),
            jsx("div", { key: "b", className: "aui-hero-sub", children: st && typeof st.energy === "number" ? "Энергия " + Math.round((st.energy || 0) * 100) + "% · настроение " + Math.round((st.joy || 0) * 100) + "%" + (st.surface && st.surface !== "floor" && st.surface !== "air" ? " · на окне «" + String(st.surface).slice(0, 40) + "»" : "") : "Живой VRM-персонаж на рабочем столе: гуляет, сидит на окнах, засыпает и отвечает вместе с агентом." })
          ] })
        ] }),
        jsx("nav", { key: "tabs", className: "aui-tabs", role: "tablist", children: TABS.map(function (t) {
          return jsx("button", { key: t[0], type: "button", role: "tab", "aria-selected": tab === t[0], className: "aui-tab" + (tab === t[0] ? " aui-tab-active" : ""), onClick: function () { pickTab(t[0]); }, children: t[1] });
        }) }),
        jsx("div", { key: "body" }, body)
      ] });
    }

    var inject = ["slots"];
    function apply(ctx) {
      if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=\"amadeus-live3d\"]") === null) {
        var tag = document.createElement("style");
        tag.dataset.pluginCss = "amadeus-live3d";
        tag.textContent = AUI_CSS + ".aui-howto{display:flex;flex-direction:column;gap:8px;padding:4px 0 14px;font-size:13px;line-height:19px;color:var(--aui-muted)}.aui-howto b{color:var(--aui-text)}.aui-role-chips{padding:12px 0 14px}.aui-more{align-self:flex-start;margin:10px 0 2px}.aui-howto-pad{padding:4px 16px 8px}.aui-rel{display:flex;flex-direction:column;gap:6px;align-items:flex-end;font-size:12px;color:var(--aui-muted)}.aui-rel-line{display:flex;align-items:center;gap:8px}.aui-rel-bar{display:inline-block;width:120px;height:6px;border-radius:3px;background:var(--aui-hover);overflow:hidden}.aui-rel-fill{display:block;height:100%;border-radius:3px}.aui-rel-bond{background:#e47ba8}.aui-rel-wary{background:#e0a64a}.amadeus-character-preview-empty{display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:40px;font-weight:700;color:#ffffff40}";
        document.head.appendChild(tag);
      }
      companionChat.ctx = ctx;
      pollChatMessage();                                         // speech recognised by the companion goes into the message box
      try { ctx.inject(["remote", "remote.session", "remote.workspace"], function (c) { companionChat.remote = c.remote; setTimeout(function () { ensureCompanionChat(); }, 4000); }); } catch (e) { clog("inject remote: " + e); }   // her Workspace and chat appear in the sidebar
      try { ctx.inject(["uiWorkspace"], function (c) { companionChat.ui = c.uiWorkspace; }); } catch (e) { clog("inject uiWorkspace: " + e); }
      ctx.slots.inject("settings.section", function () {
        return ctx.slots.register({ name: "settings.section", id: "models3d", order: 92, label: function () { return "live3D"; } }, Live3DPage);
      });
    }
    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  }
});
