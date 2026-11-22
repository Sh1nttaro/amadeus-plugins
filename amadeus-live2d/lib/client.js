window.__ModuleLoader__.load({
  id: "amadeus-live2d",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
    var react = require("react");
    var jsx = react.createElement;

    var CSS = ".amadeus-characters{flex-direction:column;gap:12px;width:100%;display:flex;padding:8px 0}.amadeus-characters-toolbar{display:flex;gap:8px;align-items:center}.amadeus-characters-search{flex:1;min-width:0;box-sizing:border-box;height:34px;padding:0 12px;border-radius:8px;border:1px solid var(--dsw-alias-border-l3);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:14px}.amadeus-characters-search:focus{outline:none;border-color:var(--dsw-alias-state-business-primary)}.amadeus-characters-add{flex:none;height:34px;padding:0 14px;border-radius:8px;border:1px solid transparent;background:var(--dsw-alias-state-business-primary);color:#fff;font:inherit;font-size:14px;cursor:pointer}.amadeus-characters-add:disabled{opacity:.5;cursor:default}.amadeus-characters-note{font-size:13px;line-height:18px;color:var(--dsw-alias-label-caption)}.amadeus-characters-note-error{color:var(--dsw-alias-state-danger,var(--dsw-alias-label-caption))}.amadeus-characters-empty{font-size:14px;line-height:20px;color:var(--dsw-alias-label-tertiary);padding:16px 0}.amadeus-characters-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}.amadeus-character-card{position:relative;box-sizing:border-box;display:flex;flex-direction:column;border-radius:12px;border:1px solid var(--dsw-alias-border-l3);background:transparent;overflow:hidden;cursor:pointer;padding:0;text-align:left;font:inherit;color:var(--dsw-alias-label-primary);transition:border-color .12s,background .12s}.amadeus-character-card:hover{background:var(--dsw-alias-interactive-bg-hover)}.amadeus-character-card-active{border-color:var(--dsw-alias-state-business-primary);box-shadow:0 0 0 1px var(--dsw-alias-state-business-primary)}.amadeus-character-preview{position:relative;display:block;width:100%;aspect-ratio:1;background:linear-gradient(135deg,var(--dsw-alias-interactive-bg-hover),var(--dsw-alias-bg-base));overflow:hidden}.amadeus-character-preview img{width:100%;height:100%;object-fit:cover;display:block}.amadeus-character-preview-empty{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:42px;font-weight:600;color:var(--dsw-alias-label-caption)}.amadeus-character-badge{position:absolute;top:8px;right:8px;min-width:22px;height:22px;padding:0 5px;border-radius:11px;background:var(--dsw-alias-state-business-primary);color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700}.amadeus-character-remove{position:absolute;top:8px;left:8px;width:24px;height:24px;border-radius:6px;border:none;background:rgba(0,0,0,.45);color:#fff;font-size:16px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .12s}.amadeus-character-card:hover .amadeus-character-remove{opacity:1}.amadeus-character-remove:hover{background:rgba(0,0,0,.65)}.amadeus-character-body{display:flex;flex-direction:column;gap:2px;padding:10px 12px 12px}.amadeus-character-name{font-size:14px;line-height:20px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.amadeus-character-summary{font-size:12px;line-height:16px;color:var(--dsw-alias-label-tertiary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.amadeus-interface{display:flex;flex-direction:column;gap:16px;width:100%;padding:4px 0}.amadeus-interface-card{display:flex;flex-direction:column;gap:14px;border:1px solid var(--dsw-alias-border-l3);border-radius:18px;padding:18px}.amadeus-interface-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.amadeus-interface-head h3{margin:0;font-size:15px;font-weight:600;line-height:22px}.amadeus-interface-head p{margin:2px 0 0;font-size:13px;line-height:18px;color:var(--dsw-alias-label-caption)}.amadeus-interface-reset{flex:none;height:32px;padding:0 14px;border-radius:999px;border:1px solid var(--dsw-alias-border-l3);background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;cursor:pointer;transition:background .14s}.amadeus-interface-reset:hover{background:var(--dsw-alias-interactive-bg-hover)}.amadeus-interface-hero{display:flex;align-items:center;gap:24px;padding:22px;border:1px solid var(--dsw-alias-border-l3);border-radius:18px;background:radial-gradient(130% 160% at 18% 0%,var(--dsw-alias-interactive-bg-hover,#ffffff08),transparent 55%)}.amadeus-interface-preview{flex:none;width:148px;height:148px;display:flex;align-items:center;justify-content:center}.amadeus-interface-hero-side{flex:1;min-width:0;display:flex;flex-direction:column;gap:12px}.amadeus-interface-hero-title{font-size:15px;font-weight:600;line-height:22px}.amadeus-interface-hero-sub{font-size:13px;line-height:18px;color:var(--dsw-alias-label-tertiary)}.amadeus-interface-states{display:flex;flex-wrap:wrap;gap:8px}.amadeus-interface-state-chip{display:inline-flex;align-items:center;gap:8px;height:34px;padding:0 14px;border-radius:999px;border:1px solid var(--dsw-alias-border-l3);background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:13px;cursor:pointer;transition:border-color .14s,color .14s,background .14s}.amadeus-interface-state-chip:hover{background:var(--dsw-alias-interactive-bg-hover)}.amadeus-interface-state-chip-active{border-color:var(--dsw-alias-state-business-primary);background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary);font-weight:600}.amadeus-interface-state-chip-dot{flex:none;width:10px;height:10px;border-radius:50%}.amadeus-interface-editor{display:flex;flex-direction:column;gap:16px;padding:18px;border:1px solid var(--dsw-alias-border-l3);border-radius:18px}.amadeus-interface-editor-head{display:flex;justify-content:space-between;align-items:center;gap:12px}.amadeus-interface-editor-title{font-size:15px;font-weight:600;line-height:22px}.amadeus-interface-fields{display:flex;flex-direction:column;gap:14px}.amadeus-interface-field{display:flex;align-items:center;gap:14px;min-width:0}.amadeus-interface-field-label{flex:none;width:88px;font-size:13px;line-height:18px;color:var(--dsw-alias-label-secondary)}.amadeus-interface-field-control{flex:1;min-width:0}.amadeus-interface-field-control select{width:100%;box-sizing:border-box;height:38px;padding:0 14px;border-radius:10px;border:1px solid var(--dsw-alias-border-l3);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:14px}.amadeus-interface-field-control select:focus{outline:none;border-color:var(--dsw-alias-state-business-primary)}.amadeus-interface-colorfield{display:flex;align-items:center;gap:10px}.amadeus-interface-gradient{flex:1;min-width:0;height:38px;border-radius:10px;border:1px solid var(--dsw-alias-border-l2);overflow:hidden;display:flex}.amadeus-interface-gradient>span{flex:1}.amadeus-interface-colorfield input[type=color]{flex:none;width:42px;height:38px;padding:2px;border:1px solid var(--dsw-alias-border-l3);border-radius:10px;background:var(--dsw-alias-bg-base);cursor:pointer}.amadeus-interface-swatches{display:flex;flex-wrap:wrap;gap:10px;align-items:center}.amadeus-interface-accent-swatch{width:38px;height:38px;border-radius:50%;border:2px solid transparent;cursor:pointer;padding:0;display:inline-flex;align-items:center;justify-content:center;color:#151517;font-size:16px;font-weight:700;transition:transform .12s}.amadeus-interface-accent-swatch:hover{transform:scale(1.1)}.amadeus-interface-accent-swatch-active{border-color:var(--dsw-alias-label-primary)}.amadeus-interface-color{display:flex;align-items:center;gap:10px;font-size:13px;color:var(--dsw-alias-label-primary)}.amadeus-interface-color input[type=color]{width:42px;height:32px;padding:2px;border:1px solid var(--dsw-alias-border-l3);border-radius:8px;background:var(--dsw-alias-bg-base);cursor:pointer}.amadeus-interface-select{display:flex;align-items:center;gap:10px;font-size:13px;color:var(--dsw-alias-label-primary)}.amadeus-interface-select select{flex:1;min-width:0;box-sizing:border-box;height:38px;padding:0 14px;border-radius:10px;border:1px solid var(--dsw-alias-border-l3);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:14px}";
    var ACTIONS_CSS = ".amadeus-character-actions{display:flex;flex-direction:column;gap:6px;padding:10px 12px;border-top:1px solid var(--dsw-alias-border-l3)}.amadeus-character-actions-title{font-size:11px;line-height:14px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--dsw-alias-label-caption)}.amadeus-character-actions-grid{display:flex;flex-wrap:wrap;gap:6px}.amadeus-character-action{height:26px;padding:0 10px;border-radius:7px;border:1px solid var(--dsw-alias-border-l3);background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;line-height:24px;cursor:pointer;white-space:nowrap}.amadeus-character-action:hover{border-color:var(--dsw-alias-state-business-primary)}.amadeus-character-action-emotion{color:var(--dsw-alias-state-business-primary)}.amadeus-character-action-reset{border-color:transparent;background:var(--dsw-alias-state-business-primary);color:#fff}.amadeus-character-actions-empty{font-size:12px;line-height:16px;color:var(--dsw-alias-label-tertiary)}.amadeus-interface-themes{flex-wrap:wrap}.amadeus-interface-theme{display:flex;flex-direction:column;align-items:center;gap:4px}.amadeus-interface-theme-swatch{position:relative;width:44px;height:44px;border-radius:10px;border:2px solid var(--dsw-alias-border-l3);cursor:pointer;padding:0;overflow:hidden;flex:none}.amadeus-interface-theme-swatch-active{border-color:var(--dsw-alias-state-business-primary);box-shadow:0 0 0 1px var(--dsw-alias-state-business-primary)}.amadeus-interface-theme-swatch span{position:absolute;right:5px;bottom:5px;width:12px;height:12px;border-radius:50%;display:block;box-shadow:0 0 0 1px #00000040}.amadeus-interface-theme-name{font-size:11px;line-height:14px;color:var(--dsw-alias-label-caption)}.amadeus-interface-palette-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.amadeus-interface-font-size{display:flex;align-items:center;gap:12px;padding:12px 16px;border-top:1px solid var(--dsw-alias-border-l3)}.amadeus-interface-font-size>span{flex:none;font-size:13px;color:var(--dsw-alias-label-primary)}.amadeus-interface-font-size input[type=range]{flex:1;min-width:0;accent-color:var(--dsw-alias-state-business-primary,#7aaaff)}.amadeus-interface-font-size input[type=number]{flex:none;width:56px;height:32px;padding:0 8px;border-radius:8px;border:1px solid var(--dsw-alias-border-l3);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:14px;text-align:center}";
    var AUI_CSS = ".aui-page{--aui-accent:var(--dsw-alias-state-business-primary,#8b7cf6);--aui-line:var(--dsw-alias-border-l3,#ffffff1f);--aui-text:var(--dsw-alias-label-primary,#ededf0);--aui-muted:var(--dsw-alias-label-caption,#9a98a3);--aui-hover:var(--dsw-alias-interactive-bg-hover,#ffffff0d);--aui-bg:var(--dsw-alias-bg-base,transparent);display:flex;flex-direction:column;gap:16px;width:100%;max-width:880px;padding:4px 0 24px;color:var(--aui-text);font-size:14px}.aui-stack{display:flex;flex-direction:column;gap:16px}.aui-hero{display:flex;align-items:center;gap:16px;padding:18px 20px;border:1px solid var(--aui-line);border-radius:16px;background:radial-gradient(120% 180% at 0% 0%,color-mix(in srgb,var(--aui-accent) 16%,transparent),transparent 60%)}.aui-hero-icon{flex:none;display:flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:14px;background:color-mix(in srgb,var(--aui-accent) 18%,transparent);color:var(--aui-accent);font-weight:700;font-size:15px;letter-spacing:.02em;overflow:hidden}.aui-hero-text{display:flex;flex-direction:column;gap:3px;min-width:0}.aui-hero-title{display:flex;align-items:center;flex-wrap:wrap;gap:10px;font-size:17px;font-weight:600;line-height:24px}.aui-hero-sub{font-size:13px;line-height:18px;color:var(--aui-muted);overflow:hidden;text-overflow:ellipsis}.aui-pill{display:inline-flex;align-items:center;gap:6px;height:22px;padding:0 10px;border-radius:999px;border:1px solid var(--aui-line);font-size:12px;font-weight:500;color:var(--aui-muted)}.aui-pill-on{border-color:transparent;background:color-mix(in srgb,#3ccf8e 16%,transparent);color:#3ccf8e}.aui-pill-on::before{content:\"\";width:6px;height:6px;border-radius:50%;background:currentColor}.aui-tabs{position:sticky;top:0;z-index:2;display:flex;gap:4px;padding:4px;border:1px solid var(--aui-line);border-radius:12px;background:var(--aui-bg);overflow-x:auto;scrollbar-width:none}.aui-tab{flex:1 0 auto;height:34px;padding:0 16px;border:none;border-radius:9px;background:transparent;color:var(--aui-muted);font:inherit;font-size:13px;font-weight:500;cursor:pointer;white-space:nowrap;transition:background .15s,color .15s}.aui-tab:hover{background:var(--aui-hover);color:var(--aui-text)}.aui-tab-active,.aui-tab-active:hover{background:color-mix(in srgb,var(--aui-accent) 18%,transparent);color:var(--aui-text);font-weight:600}.aui-card{display:flex;flex-direction:column;border:1px solid var(--aui-line);border-radius:14px;overflow:hidden}.aui-card-head{padding:16px 18px 10px}.aui-card-head h3{margin:0;font-size:15px;font-weight:600;line-height:22px}.aui-card-head p{margin:2px 0 0;font-size:13px;line-height:18px;color:var(--aui-muted)}.aui-card-body{display:flex;flex-direction:column;padding:0 18px 6px}.aui-row{display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:52px;padding:10px 0;border-top:1px solid var(--aui-line)}.aui-card-body>.aui-row:first-child{border-top:none}.aui-row-disabled{opacity:.45;pointer-events:none}.aui-row-text{display:flex;flex-direction:column;gap:2px;min-width:0}.aui-row-label{font-size:14px;line-height:20px}.aui-row-hint{font-size:12px;line-height:16px;color:var(--aui-muted)}.aui-row-control{flex:none;display:flex;align-items:center;justify-content:flex-end;gap:10px;max-width:60%}.aui-switch{position:relative;display:inline-flex;cursor:pointer}.aui-switch input{position:absolute;opacity:0;width:0;height:0}.aui-switch-track{position:relative;width:40px;height:24px;border-radius:999px;background:var(--aui-line);transition:background .18s}.aui-switch-track::after{content:\"\";position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 3px #00000059;transition:transform .18s}.aui-switch input:checked+.aui-switch-track{background:var(--aui-accent)}.aui-switch input:checked+.aui-switch-track::after{transform:translateX(16px)}.aui-switch input:focus-visible+.aui-switch-track{outline:2px solid var(--aui-accent);outline-offset:2px}.aui-switch input:disabled+.aui-switch-track{opacity:.5}.aui-select{min-width:180px;max-width:100%;height:34px;padding:0 12px;border-radius:9px;border:1px solid var(--aui-line);background:var(--aui-bg);color:var(--aui-text);font:inherit;font-size:13px;cursor:pointer;text-overflow:ellipsis}.aui-select:focus{outline:none;border-color:var(--aui-accent)}.aui-select:disabled{opacity:.5;cursor:default}.aui-range{display:flex;align-items:center;gap:10px}.aui-range input{width:160px;accent-color:var(--aui-accent)}.aui-range-val{min-width:44px;text-align:right;font-variant-numeric:tabular-nums;font-size:13px;color:var(--aui-muted)}.aui-color{width:40px;height:30px;padding:2px;border:1px solid var(--aui-line);border-radius:8px;background:var(--aui-bg);cursor:pointer}.aui-seg{display:inline-flex;gap:2px;padding:3px;border:1px solid var(--aui-line);border-radius:10px}.aui-seg-btn{height:28px;padding:0 12px;border:none;border-radius:7px;background:transparent;color:var(--aui-muted);font:inherit;font-size:13px;cursor:pointer;font-variant-numeric:tabular-nums}.aui-seg-btn:hover:not(:disabled){color:var(--aui-text);background:var(--aui-hover)}.aui-seg-btn-active,.aui-seg-btn-active:hover:not(:disabled){background:var(--aui-accent);color:#fff}.aui-seg-btn:disabled{cursor:default}.aui-btn{height:34px;padding:0 14px;border-radius:9px;border:1px solid var(--aui-line);background:transparent;color:var(--aui-text);font:inherit;font-size:13px;cursor:pointer;white-space:nowrap;transition:background .15s}.aui-btn:hover{background:var(--aui-hover)}.aui-btn-primary{border-color:transparent;background:var(--aui-accent);color:#fff}.aui-btn-primary:hover{background:color-mix(in srgb,var(--aui-accent) 85%,#fff)}.aui-btn-danger{border-color:transparent;background:#f43f5e;color:#fff}.aui-btn:disabled{opacity:.5;cursor:default}.aui-inline{display:flex;align-items:center;gap:10px}.aui-level{width:120px;height:6px;border-radius:999px;background:var(--aui-line);overflow:hidden}.aui-level i{display:block;height:100%;width:0;background:var(--aui-accent);transition:width .08s linear}.aui-ptt-wrap{padding:4px 0 12px}.aui-ptt{width:100%;height:46px;border-radius:12px;border:1px dashed var(--aui-line);background:transparent;color:var(--aui-text);font:inherit;font-size:14px;cursor:pointer;user-select:none;touch-action:none;transition:background .15s}.aui-ptt:hover{background:var(--aui-hover)}.aui-ptt-on{border-style:solid;border-color:transparent;background:var(--aui-accent);color:#fff}.aui-hidden{display:none}.aui-note{margin:0 18px 14px;padding:8px 12px;border-radius:9px;background:var(--aui-hover);font-size:13px;line-height:18px;color:var(--aui-muted)}.aui-note-error{background:color-mix(in srgb,#f43f5e 12%,transparent);color:#f38f9c}.aui-choices{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;padding:6px 0 14px}.aui-choice{display:flex;flex-direction:column;align-items:flex-start;gap:4px;padding:12px;border:1px solid var(--aui-line);border-radius:12px;background:transparent;color:var(--aui-text);font:inherit;text-align:left;cursor:pointer;transition:border-color .15s,background .15s}.aui-choice:hover:not(:disabled){background:var(--aui-hover)}.aui-choice-active{border-color:var(--aui-accent);box-shadow:0 0 0 1px var(--aui-accent);background:color-mix(in srgb,var(--aui-accent) 8%,transparent)}.aui-choice:disabled{cursor:default}.aui-choice-title{font-size:14px;font-weight:600;line-height:20px}.aui-choice-sub{font-size:12px;line-height:16px;color:var(--aui-muted)}.aui-choice-art{display:flex;align-items:center;gap:10px;width:100%;height:64px;margin-bottom:6px;padding:0 12px;box-sizing:border-box;border-radius:10px;background:#1c1a24}.aui-choice-art-orb{justify-content:center}.aui-mini-orb{flex:none;display:block;width:30px;height:30px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#d9cfff,#9a83f0 45%,#5d4bb3 75%,transparent 76%);box-shadow:0 0 14px #9a83f080}.aui-choice-art-orb .aui-mini-orb{width:38px;height:38px}.aui-mini-lines{display:flex;flex-direction:column;gap:5px;flex:1}.aui-mini-lines b{display:block;height:5px;border-radius:3px;background:#ffffff38}.aui-mini-lines b:nth-child(2){width:80%}.aui-mini-lines b:nth-child(3){width:55%}.aui-split{display:grid;grid-template-columns:minmax(0,1fr) 260px;gap:20px;align-items:center;padding-bottom:12px}.aui-split-rows{display:flex;flex-direction:column}.aui-split-rows>.aui-row:first-child{border-top:none}.aui-bubble-preview{display:flex;align-items:center;justify-content:center;padding:16px;border-radius:12px;background:repeating-conic-gradient(#ffffff08 0 25%,transparent 0 50%) 0 0/16px 16px}.aui-bubble-sample{width:100%;padding:12px 14px;border-radius:16px;border:1px solid #b5a3f563;box-sizing:border-box}.aui-bubble-sample-head{display:flex;align-items:center;gap:10px;margin-bottom:8px}.aui-bubble-sample-cap{font-size:9px;font-weight:700;letter-spacing:.16em;opacity:.65}.aui-bubble-sample-status{font-size:13px;font-weight:700;color:#bf9bff}.aui-bubble-sample-text{line-height:1.45;max-height:90px;overflow:hidden}@media (max-width:640px){.aui-row{flex-direction:column;align-items:stretch;gap:8px}.aui-row-control{max-width:none;justify-content:flex-start}.aui-choices,.aui-split{grid-template-columns:1fr}.aui-range input{flex:1;width:auto}}.aui-page .amadeus-characters{padding:0}.aui-page .amadeus-characters-search,.aui-page .amadeus-characters-add{height:36px;border-radius:10px}.aui-page .amadeus-characters-grid{grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:14px}.aui-page .amadeus-character-card{border-radius:14px}.aui-card-head-row{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.aui-orb-hero{align-items:center;gap:22px}.aui-orb-stage{flex:none;display:flex;align-items:center;justify-content:center;width:150px;height:150px;border-radius:18px;background:radial-gradient(circle at 50% 45%,#ffffff0d,transparent 70%),#16151b}.aui-orb-hero .aui-hero-text{gap:8px}.aui-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}.aui-chip{display:inline-flex;align-items:center;gap:7px;height:30px;padding:0 12px;border-radius:999px;border:1px solid var(--aui-line);background:transparent;color:var(--aui-muted);font:inherit;font-size:12.5px;cursor:pointer;transition:background .15s,color .15s,border-color .15s}.aui-chip:hover{background:var(--aui-hover);color:var(--aui-text)}.aui-chip-active,.aui-chip-active:hover{border-color:var(--aui-accent);background:color-mix(in srgb,var(--aui-accent) 14%,transparent);color:var(--aui-text);font-weight:600}.aui-chip-dot{flex:none;width:9px;height:9px;border-radius:50%;box-shadow:0 0 0 2px #00000026}.aui-gradient{display:flex;width:120px;height:30px;border-radius:8px;overflow:hidden;border:1px solid var(--aui-line)}.aui-gradient>span{flex:1}.aui-toolbar{display:flex;gap:8px;align-items:center}.aui-search{flex:1;min-width:0;height:36px;padding:0 12px;border-radius:10px;border:1px solid var(--aui-line);background:var(--aui-bg);color:var(--aui-text);font:inherit;font-size:14px}.aui-search:focus{outline:none;border-color:var(--aui-accent)}@media (max-width:640px){.aui-orb-hero{flex-direction:column;align-items:flex-start}}.aui-card-pad{padding:0 18px 18px}.aui-row-text{flex:1 1 140px}.aui-split-rows .aui-row{flex-wrap:wrap;gap:8px 16px}.aui-split-rows .aui-row-control{max-width:none}.aui-range input{width:140px}.aui-split{grid-template-columns:minmax(220px,1fr) auto;align-items:start}.aui-live-preview{display:flex;flex-direction:column;align-items:center;gap:12px}.aui-live-stage{display:flex;align-items:center;justify-content:center;width:360px;max-width:100%;height:320px;border-radius:12px;background:repeating-conic-gradient(#ffffff0a 0 25%,transparent 0 50%) 0 0/16px 16px,#141318;overflow:hidden}.aui-live-frame{display:block;border:0;background:transparent;color-scheme:normal}.aui-live-phases{flex-wrap:wrap;justify-content:center}@media (max-width:900px){.aui-split{grid-template-columns:1fr}.aui-live-preview{order:-1}}.aui-note-inline{margin:0 0 12px}.aui-empty{padding:28px 12px;border:1px dashed var(--aui-line);border-radius:12px;text-align:center;font-size:13px;line-height:19px;color:var(--aui-muted)}.aui-empty-tight{margin:0 18px 18px;padding:14px}.aui-gallery-search{width:100%;box-sizing:border-box;margin-bottom:14px}.aui-gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px}.aui-model{position:relative;display:block;aspect-ratio:3/4;border-radius:14px;overflow:hidden;cursor:pointer;background:linear-gradient(160deg,color-mix(in srgb,var(--aui-accent) 14%,#1b1a21),#141318);border:1px solid var(--aui-line);outline:none;transition:transform .16s ease,box-shadow .16s ease,border-color .16s}.aui-model:hover{transform:translateY(-3px);box-shadow:0 10px 24px #00000052}.aui-model:focus-visible{box-shadow:0 0 0 2px var(--aui-accent)}.aui-model-active{border-color:var(--aui-accent);box-shadow:0 0 0 2px var(--aui-accent),0 10px 28px color-mix(in srgb,var(--aui-accent) 30%,transparent);cursor:default}.aui-model-active:hover{transform:none}.aui-model-art{position:absolute;inset:0;display:block}.aui-model-art img{width:100%;height:100%;object-fit:cover;object-position:top center;display:block;transition:transform .3s ease}.aui-model:hover .aui-model-art img{transform:scale(1.04)}.aui-model-art .amadeus-character-preview-empty{display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:44px;font-weight:700;color:#ffffff40}.aui-model-meta{position:absolute;left:0;right:0;bottom:0;display:flex;flex-direction:column;gap:2px;padding:34px 12px 11px;background:linear-gradient(to top,#000000d9,#00000080 55%,transparent);color:#fff}.aui-model-name{font-size:14px;font-weight:600;line-height:19px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.aui-model-sub{font-size:11.5px;line-height:15px;color:#ffffffb3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.aui-model-flag{position:absolute;top:8px;left:8px;display:inline-flex;align-items:center;gap:5px;height:22px;padding:0 9px;border-radius:999px;background:var(--aui-accent);color:#fff;font-size:11px;font-weight:600;box-shadow:0 2px 8px #0000004d}.aui-model-flag::before{content:\"\";width:6px;height:6px;border-radius:50%;background:#fff}.aui-model-remove{position:absolute;top:8px;right:8px;width:26px;height:26px;border:none;border-radius:8px;background:#00000080;color:#fff;font-size:17px;line-height:1;cursor:pointer;opacity:0;transition:opacity .15s,background .15s;backdrop-filter:blur(4px)}.aui-model:hover .aui-model-remove,.aui-model:focus-within .aui-model-remove{opacity:1}.aui-model-remove:hover{background:#f43f5e}.aui-model-skeleton{cursor:default;animation:aui-pulse 1.4s ease-in-out infinite}@keyframes aui-pulse{50%{opacity:.5}}.aui-active-head{display:flex;align-items:center;flex-wrap:wrap;gap:12px 14px;padding:16px 18px}.aui-active-head .aui-hero-text{flex:1 1 200px}.aui-active-thumb{flex:none;width:56px;height:56px;border-radius:12px;overflow:hidden;background:#1b1a21}.aui-active-thumb img{width:100%;height:100%;object-fit:cover;object-position:top center;display:block}.aui-active-thumb .amadeus-character-preview-empty{display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:22px;font-weight:700;color:#ffffff59}.aui-active-head .aui-hero-text{flex:1}.aui-active-name{font-size:16px;font-weight:600;line-height:22px}.aui-actions{display:flex;flex-direction:column;gap:10px;padding:0 18px 16px}.aui-action-row{display:flex;align-items:flex-start;gap:12px;padding-top:10px;border-top:1px solid var(--aui-line)}.aui-action-label{flex:none;width:96px;padding-top:6px;font-size:12px;color:var(--aui-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.aui-action-chips{display:flex;flex-wrap:wrap;gap:6px;min-width:0}.aui-action{height:28px;padding:0 11px;border-radius:999px;border:1px solid var(--aui-line);background:transparent;color:var(--aui-text);font:inherit;font-size:12.5px;cursor:pointer;white-space:nowrap;transition:background .15s,border-color .15s}.aui-action:hover:not(:disabled){border-color:var(--aui-accent);background:color-mix(in srgb,var(--aui-accent) 12%,transparent)}.aui-action-emotion{color:color-mix(in srgb,var(--aui-accent) 70%,var(--aui-text))}.aui-action:disabled{opacity:.5;cursor:default}@media (max-width:640px){.aui-action-row{flex-direction:column;gap:6px}.aui-action-label{width:auto;padding:0}}.aui-hide-range{width:140px;accent-color:var(--aui-accent)}.aui-num{display:inline-flex;align-items:center;gap:6px;font-size:13px;color:var(--aui-muted)}.aui-num input{width:64px;height:30px;padding:0 8px;box-sizing:border-box;border-radius:8px;border:1px solid var(--aui-line);background:var(--aui-bg);color:var(--aui-text);font:inherit;font-size:13px;text-align:center;font-variant-numeric:tabular-nums}.aui-num input:focus{outline:none;border-color:var(--aui-accent)}.aui-drop{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;min-height:150px;padding:20px;border:1.5px dashed color-mix(in srgb,var(--aui-accent) 45%,var(--aui-line));border-radius:14px;background:color-mix(in srgb,var(--aui-accent) 5%,transparent);text-align:center;transition:background .15s,border-color .15s}.aui-drop-over{border-color:var(--aui-accent);background:color-mix(in srgb,var(--aui-accent) 14%,transparent)}.aui-drop-busy{flex-direction:row;gap:12px;font-size:13px;color:var(--aui-muted)}.aui-drop-icon{font-size:26px;line-height:1;color:var(--aui-accent)}.aui-drop-title{font-size:15px;font-weight:600}.aui-drop-or{font-size:12px;color:var(--aui-muted)}.aui-spinner{width:18px;height:18px;border-radius:50%;border:2px solid var(--aui-line);border-top-color:var(--aui-accent);animation:aui-spin .8s linear infinite;flex:none}@keyframes aui-spin{to{transform:rotate(360deg)}}.aui-results{display:flex;flex-direction:column;gap:6px;margin-top:12px}.aui-results-group{display:flex;flex-direction:column;gap:6px}.aui-result{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 10px;padding:9px 12px;border-radius:10px;background:var(--aui-hover);font-size:13px;line-height:18px}.aui-result b{font-weight:600}.aui-result span{color:var(--aui-muted)}.aui-result-ok{background:color-mix(in srgb,#3ccf8e 12%,transparent)}.aui-result-ok b{color:#3ccf8e}.aui-result-err{background:color-mix(in srgb,#f43f5e 10%,transparent)}.aui-result-err b{color:#f38f9c}.aui-downloads{display:flex;flex-direction:column;margin-top:16px}.aui-downloads-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-bottom:8px;font-size:12px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--aui-muted)}.aui-link{border:none;background:none;padding:0;color:var(--aui-accent);font:inherit;font-size:12px;font-weight:500;text-transform:none;letter-spacing:0;cursor:pointer}.aui-link:hover{text-decoration:underline}.aui-dl{display:flex;align-items:center;gap:10px;padding:9px 0;border-top:1px solid var(--aui-line)}.aui-dl-text{display:flex;flex-direction:column;gap:1px;flex:1;min-width:0}.aui-dl-name{font-size:13.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.aui-tag{flex:none;display:inline-flex;align-items:center;height:22px;padding:0 9px;border-radius:999px;font-size:11.5px;font-weight:600;white-space:nowrap}.aui-tag-ok{background:color-mix(in srgb,#3ccf8e 15%,transparent);color:#3ccf8e}.aui-tag-warn{background:color-mix(in srgb,#f1b76b 16%,transparent);color:#f1b76b}.aui-tag-off{background:var(--aui-hover);color:var(--aui-muted)}.aui-chip-input{height:28px;width:130px;padding:0 10px;border-radius:999px;border:1px dashed var(--aui-accent);background:transparent;color:var(--aui-text);font:inherit;font-size:12.5px}.aui-chip-input:focus{outline:none;border-style:solid;background:color-mix(in srgb,var(--aui-accent) 10%,transparent)}.aui-name-input{height:32px;max-width:100%;padding:0 10px;border-radius:9px;border:1px dashed var(--aui-accent);background:transparent;color:var(--aui-text);font:inherit;font-size:16px;font-weight:600}.aui-name-input:focus{outline:none;border-style:solid}.aui-edit-hint{padding:0 18px 10px}";

function plural(count, forms) {
			var tens = count % 100;
			var ones = count % 10;
			return forms[tens > 10 && tens < 20 ? 2 : ones === 1 ? 0 : ones >= 2 && ones <= 4 ? 1 : 2];
		}

		function summary(model) {
			var motions = Number(model.motions) || 0;
			var expressions = Number(model.expressions) || 0;
			var parts = [];
			if (motions > 0) parts.push(motions + " " + plural(motions, ["движение", "движения", "движений"]));
			if (expressions > 0) parts.push(expressions + " " + plural(expressions, ["эмоция", "эмоции", "эмоций"]));
			if (parts.length === 0 && model.description) return model.description;
			return parts.join(" · ") || "Live2D";
		}

		function Preview(props) {
			var failedState = react.useState(false);
			var failed = failedState[0];
			var setFailed = failedState[1];
			var src = props.src;
			react.useEffect(function () { setFailed(false); }, [src]);
			if (!src || failed) {
				return jsx("span", { className: "amadeus-character-preview-empty", children: String(props.alt || "?").charAt(0).toUpperCase() });
			}
			return jsx("img", { src: src, alt: props.alt, loading: "lazy", onError: function () { setFailed(true); } });
		}

		// Motions (by group) and emotions of the model on screen, as rows of chips.
		// In edit mode every chip becomes a field: the label is saved on blur / Enter.
		function renderActionGroups(model, runAction, busy, edit) {
			var actions = model.actions || { motions: [], expressions: [] };
			var rows = [];
			var chip = function (key, label, original, cls, onRun, onRename) {
				if (edit) {
					return jsx("input", { key: key + "|" + label, className: "aui-chip-input", defaultValue: label, title: original ? "Исходное имя: " + original : "", placeholder: original || "",
						onKeyDown: function (e) { if (e.key === "Enter") e.target.blur(); if (e.key === "Escape") { e.target.value = label; e.target.blur(); } },
						onBlur: function (e) { var v = e.target.value.trim(); if (v && v !== label) onRename(v); else e.target.value = label; } });
				}
				return jsx("button", { key: key, type: "button", disabled: busy, className: cls, title: original && original !== label ? original : "", onClick: onRun, children: label });
			};
			(actions.motions || []).forEach(function (group) {
				var items = group.items || [];
				if (!items.length) return;
				rows.push(jsx("div", { key: "m-" + group.key, className: "aui-action-row", children: [
					jsx("span", { key: "l", className: "aui-action-label", children: group.label || "Движения" }),
					jsx("div", { key: "c", className: "aui-action-chips", children: items.map(function (item) {
						return chip(item.index, item.label, item.original, "aui-action",
							function () { runAction({ action: "play_motion", group: group.key, index: item.index }); },
							function (v) { edit.rename({ kind: "motion", group: group.key, index: item.index, label: v }); });
					}) })
				] }));
			});
			var expressions = actions.expressions || [];
			if (expressions.length) {
				rows.push(jsx("div", { key: "e", className: "aui-action-row", children: [
					jsx("span", { key: "l", className: "aui-action-label", children: "Эмоции" }),
					jsx("div", { key: "c", className: "aui-action-chips", children: expressions.map(function (expr) {
						return chip(expr.name, expr.label, expr.original, "aui-action aui-action-emotion",
							function () { runAction({ action: "set_expression", name: expr.name }); },
							function (v) { edit.rename({ kind: "expression", key: expr.name, label: v }); });
					}) })
				] }));
			}
			if (!rows.length) return jsx("div", { className: "aui-empty aui-empty-tight", children: "У этой модели нет готовых движений и эмоций — она будет дышать и следить за курсором. Так бывает у моделей для VTube Studio, рассчитанных на трекинг лица." });
			return jsx("div", { className: "aui-actions", children: rows });
		}

		function formatSize(bytes) {
			if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + " ГБ";
			if (bytes >= 1048576) return Math.round(bytes / 1048576) + " МБ";
			return Math.max(1, Math.round(bytes / 1024)) + " КБ";
		}
		function formatAgo(ms) {
			var min = Math.round((Date.now() - ms) / 60000);
			if (min < 60) return min <= 1 ? "только что" : min + " мин назад";
			var h = Math.round(min / 60);
			if (h < 24) return h + " ч назад";
			return Math.round(h / 24) + " дн назад";
		}
		var KIND_TAG = { live2d: ["Live2D", "aui-tag-ok"], cubism2: ["Cubism 2", "aui-tag-warn"], none: ["не модель", "aui-tag-off"], unknown: ["?", "aui-tag-off"] };

		/** "Add a model": drag-and-drop and native pickers. */
		function ImportPanel(props) {
			var busyState = react.useState(""); var busy = busyState[0], setBusy = busyState[1];
			var resultsState = react.useState(null); var results = resultsState[0], setResults = resultsState[1];
			var dragState = react.useState(false); var drag = dragState[0], setDrag = dragState[1];
			var finish = function (d) {
				if (d && d.canceled) { setBusy(""); return; }
				setResults(d && d.ok ? d.results : [{ source: "", imported: [], skipped: [], problems: [(d && d.error) || "Не удалось импортировать."] }]);
				setBusy("");
				if (props.onImported) props.onImported();
			};
			var fail = function (e) { finish({ ok: false, error: (e && e.message) || "Ошибка импорта." }); };
			var post = function (url, body, label) {
				if (busy) return;
				setBusy(label); setResults(null);
				fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body || {}) }).then(function (r) { return r.json(); }).then(finish).catch(fail);
			};
			var uploadFiles = function (files) {
				if (busy || !files.length) return;
				setBusy("Загружаю и импортирую " + (files.length > 1 ? files.length + " архива…" : "«" + files[0].name + "»…"));
				setResults(null);
				var all = [];
				var next = function (i) {
					if (i >= files.length) { finish({ ok: true, results: all }); return; }
					fetch("/amadeus-live2d/import-upload?name=" + encodeURIComponent(files[i].name), { method: "POST", body: files[i] })
						.then(function (r) { return r.json(); })
						.then(function (d) { all = all.concat(d && d.ok ? d.results : [{ source: files[i].name, imported: [], skipped: [], problems: [(d && d.error) || "Ошибка."] }]); next(i + 1); })
						.catch(function (e) { all.push({ source: files[i].name, imported: [], skipped: [], problems: [(e && e.message) || "Ошибка."] }); next(i + 1); });
				};
				next(0);
			};
			var onDrop = function (e) {
				e.preventDefault(); setDrag(false);
				var files = Array.prototype.slice.call((e.dataTransfer && e.dataTransfer.files) || []);
				var archives = files.filter(function (f) { return /\.(zip|rar|7z)$/i.test(f.name); });
				if (!archives.length) { setResults([{ source: "", imported: [], skipped: [], problems: ["Перетащите архив .zip, .rar или .7z. Папку добавьте кнопкой «Папка…»."] }]); return; }
				uploadFiles(archives);
			};
			var resultRows = (results || []).map(function (r, i) {
				var rows = [];
				r.imported.forEach(function (m) {
					rows.push(jsx("div", { key: "i" + m.id, className: "aui-result aui-result-ok", children: [
						jsx("b", { children: "✓ " + m.name }),
						jsx("span", { children: [m.expressions + " эмоц.", m.motions + " движ.", m.preview === false ? "без превью" : "превью готово"].join(" · ") })
					] }));
				});
				r.skipped.forEach(function (m) {
					rows.push(jsx("div", { key: "s" + m.id, className: "aui-result", children: [jsx("b", { children: "↺ " + m.name }), jsx("span", { children: "уже добавлена" })] }));
				});
				r.problems.forEach(function (p, j) {
					rows.push(jsx("div", { key: "p" + j, className: "aui-result aui-result-err", children: [jsx("b", { children: "✕ " + (r.source || "Импорт") }), jsx("span", { children: p })] }));
				});
				return jsx("div", { key: i, className: "aui-results-group", children: rows });
			});
			return jsx("section", { className: "aui-card", children: [
				jsx("header", { key: "h", className: "aui-card-head", children: [
					jsx("h3", { children: "Добавить модель" }),
					jsx("p", { children: "Скачайте модель (например, с Booth) и перетащите архив сюда. Поддерживаются Live2D Cubism 3–5 (.model3.json + .moc3), в том числе модели для VTube Studio." })
				] }),
				jsx("div", { key: "b", className: "aui-card-pad", children: [
					jsx("div", {
						key: "drop",
						className: "aui-drop" + (drag ? " aui-drop-over" : "") + (busy ? " aui-drop-busy" : ""),
						onDragOver: function (e) { e.preventDefault(); if (!drag) setDrag(true); },
						onDragLeave: function () { setDrag(false); },
						onDrop: onDrop,
						children: busy ? [jsx("span", { key: "s", className: "aui-spinner" }), jsx("span", { key: "t", children: busy })] : [
							jsx("span", { key: "i", className: "aui-drop-icon", children: "⇩" }),
							jsx("span", { key: "t", className: "aui-drop-title", children: "Перетащите .zip / .rar / .7z" }),
							jsx("span", { key: "o", className: "aui-drop-or", children: "или" }),
							jsx("div", { key: "btns", className: "aui-inline", children: [
								jsx("button", { key: "a", type: "button", className: "aui-btn aui-btn-primary", onClick: function () { post("/amadeus-live2d/import-dialog", { kind: "archive" }, "Выберите архив в открывшемся окне…"); }, children: "Архив…" }),
								jsx("button", { key: "f", type: "button", className: "aui-btn", onClick: function () { post("/amadeus-live2d/import-dialog", { kind: "folder" }, "Выберите папку в открывшемся окне…"); }, children: "Папка…" })
							] })
						]
					}),
					results ? jsx("div", { key: "res", className: "aui-results", children: resultRows }) : null
				] })
			] });
		}

		function CharactersSection(props) {
			var modelsState = react.useState([]);
			var models = modelsState[0];
			var setModels = modelsState[1];
			var activeState = react.useState("");
			var activeId = activeState[0];
			var setActiveId = activeState[1];
			var loadedState = react.useState(false);
			var loaded = loadedState[0];
			var setLoaded = loadedState[1];
			var busyState = react.useState(false);
			var busy = busyState[0];
			var setBusy = busyState[1];
			var searchState = react.useState("");
			var search = searchState[0];
			var setSearch = searchState[1];
			var noteState = react.useState(null);
			var note = noteState[0];
			var setNote = noteState[1];
			var editingState = react.useState(false);
			var editing = editingState[0], setEditing = editingState[1];

			var refresh = react.useCallback(function () {
				var api = window.amadeusCharacters;
				if (!api) return;
				Promise.all([api.list(), api.active()]).then(function (result) {
					setModels(Array.isArray(result[0]) ? result[0] : []);
					setActiveId(typeof result[1] === "string" ? result[1] : "");
					setLoaded(true);
				}).catch(function () {
					setLoaded(true);
				});
			}, []);

			react.useEffect(function () {
				refresh();
			}, [refresh]);

			var select = function (id) {
				var api = window.amadeusCharacters;
				if (!api || busy) return;
				setBusy(true);
				setActiveId(id);
				setNote({ text: "Загружаю модель…" });
				api.select(id).then(function (next) {
					setActiveId(typeof next === "string" ? next : id); setNote(null); if (props && props.onSelect) props.onSelect();
				}).catch(function () { setActiveId(""); setNote({ text: "Не удалось загрузить модель.", error: true }); }).finally(function () {
					setBusy(false);
				});
			};

			var removeModel = function (id) {
				var api = window.amadeusCharacters;
				if (!api || busy) return;
				if (!window.confirm("Удалить этого персонажа?")) return;
				setBusy(true);
				setNote(null);
				api.remove(id).then(function (result) {
					if (result && result.ok) {
						setNote({ text: "Персонаж удалён." });
						refresh();
					} else {
						setNote({ text: (result && result.error) || "Не удалось удалить персонажа.", error: true });
					}
				}).catch(function () {
					setNote({ text: "Не удалось удалить персонажа.", error: true });
				}).finally(function () {
					setBusy(false);
				});
			};

			var runAction = function (payload) {
				var api = window.amadeusCharacters;
				if (!api || !api.action || busy) return;
				setBusy(true);
				setNote(null);
				api.action(payload).then(function (result) {
					if (result && result.ok) setNote({ text: result.label || "Готово." });
					else setNote({ text: (result && result.error) || "Не удалось выполнить действие.", error: true });
				}).catch(function () {
					setNote({ text: "Не удалось выполнить действие.", error: true });
				}).finally(function () {
					setBusy(false);
				});
			};

			var query = search.trim().toLowerCase();
			var shown = query ? models.filter(function (model) {
				return String(model.name || "").toLowerCase().indexOf(query) !== -1;
			}) : models;

			if (!loaded) {
				return jsx("div", { className: "aui-gallery", children: [0, 1, 2, 3].map(function (i) { return jsx("div", { key: i, className: "aui-model aui-model-skeleton" }); }) });
			}

			var activeModel = models.filter(function (m) { return m.id === activeId; })[0] || null;
			var edit = editing && activeModel ? { rename: function (patch) {
				fetch("/amadeus-live2d/rename", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(Object.assign({ id: activeModel.id }, patch)) })
					.then(function (r) { return r.json(); })
					.then(function (d) { if (d && d.ok) refresh(); else setNote({ text: (d && d.error) || "Не удалось переименовать.", error: true }); })
					.catch(function () { setNote({ text: "Не удалось переименовать.", error: true }); });
			} } : null;
			return jsx("div", { className: "aui-stack", children: [
				jsx(ImportPanel, { key: "import", onImported: refresh }),
				activeModel ? jsx("section", { key: "active", className: "aui-card aui-active-card", children: [
					jsx("div", { className: "aui-active-head", children: [
						jsx("span", { className: "aui-active-thumb", children: jsx(Preview, { src: activeModel.preview, alt: activeModel.name }) }),
						jsx("div", { className: "aui-hero-text", children: [
							edit ? jsx("input", { key: "n|" + activeModel.name, className: "aui-name-input", defaultValue: activeModel.name,
								onKeyDown: function (e) { if (e.key === "Enter") e.target.blur(); },
								onBlur: function (e) { var v = e.target.value.trim(); if (v && v !== activeModel.name) edit.rename({ kind: "model", label: v }); } })
								: jsx("div", { className: "aui-active-name", children: activeModel.name }),
							jsx("div", { className: "aui-row-hint", children: summary(activeModel) })
						] }),
						jsx("button", { className: "aui-btn" + (editing ? " aui-btn-primary" : ""), type: "button", title: "Дать эмоциям и движениям свои названия", onClick: function () { setEditing(!editing); }, children: editing ? "Готово" : "Переименовать" }),
						editing ? null : jsx("button", { className: "aui-btn", type: "button", disabled: busy, onClick: function () { runAction({ action: "return_to_idle" }); }, children: "В исходное" })
					] }),
					editing ? jsx("div", { className: "aui-row-hint aui-edit-hint", children: "Нажмите на название, исправьте и нажмите Enter. Исходное имя из файла видно в подсказке." }) : null,
					renderActionGroups(activeModel, runAction, busy, edit)
				] }) : null,
				jsx("section", { key: "list", className: "aui-card", children: [
					jsx("header", { className: "aui-card-head aui-card-head-row", children: [
						jsx("div", { children: [
							jsx("h3", { children: "Персонажи" + (models.length ? " · " + models.length : "") }),
							jsx("p", { children: "Нажмите на карточку, чтобы показать персонажа на рабочем столе." })
						] }),
						jsx("button", { className: "aui-btn", type: "button", disabled: busy, onClick: refresh, children: "Обновить" })
					] }),
					jsx("div", { className: "aui-card-pad", children: [
						models.length > 6 ? jsx("input", { key: "search", className: "aui-search aui-gallery-search", type: "search", placeholder: "Найти персонажа…", value: search, onChange: function (event) { setSearch(event.target.value); } }) : null,
						note ? jsx("div", { key: "note", className: "aui-note aui-note-inline" + (note.error ? " aui-note-error" : ""), children: note.text }) : null,
						shown.length === 0 ? jsx("div", { key: "empty", className: "aui-empty", children: models.length === 0 ? "Персонажей пока нет — добавьте модель в блоке выше." : "Ничего не найдено." }) : jsx("div", { key: "grid", className: "aui-gallery", children: shown.map(function (model) {
							var active = model.id === activeId;
							return jsx("div", {
								key: model.id,
								role: "button",
								tabIndex: 0,
								"aria-pressed": active,
								title: active ? model.name + " — на экране" : "Показать " + model.name,
								className: "aui-model" + (active ? " aui-model-active" : ""),
								onClick: function () { if (!active) select(model.id); },
								onKeyDown: function (event) { if ((event.key === "Enter" || event.key === " ") && !active) { event.preventDefault(); select(model.id); } },
								children: [
									jsx("span", { className: "aui-model-art", children: jsx(Preview, { src: model.preview, alt: model.name }) }),
									active ? jsx("span", { className: "aui-model-flag", children: "На экране" }) : null,
									jsx("button", { className: "aui-model-remove", type: "button", title: "Удалить персонажа", "aria-label": "Удалить " + model.name, onClick: function (event) { event.stopPropagation(); removeModel(model.id); }, children: "×" }),
									jsx("span", { className: "aui-model-meta", children: [
										jsx("span", { className: "aui-model-name", children: model.name }),
										jsx("span", { className: "aui-model-sub", children: summary(model) })
									] })
								]
							});
						}) })
					] })
				] })
			] });
		}

// ---- Shared settings layout (same "aui" look as the Orbs / live3D tabs) ----
function auiSwitch(on, disabled, onChange) {
  return jsx("label", { className: "aui-switch", children: [
    jsx("input", { type: "checkbox", checked: !!on, disabled: disabled, onChange: onChange }),
    jsx("span", { className: "aui-switch-track" })
  ] });
}
function auiRow(key, label, hint, control, disabled) {
  return jsx("div", { key: key, className: "aui-row" + (disabled ? " aui-row-disabled" : ""), children: [
    jsx("div", { className: "aui-row-text", children: [
      jsx("div", { className: "aui-row-label", children: label }),
      hint ? jsx("div", { className: "aui-row-hint", children: hint }) : null
    ] }),
    jsx("div", { className: "aui-row-control", children: control })
  ] });
}
function auiCard(key, title, desc, rows, footer) {
  return jsx("section", { key: key, className: "aui-card", children: [
    jsx("header", { className: "aui-card-head", children: [
      jsx("h3", { children: title }),
      desc ? jsx("p", { children: desc }) : null
    ] }),
    jsx("div", { className: "aui-card-body", children: rows }),
    footer || null
  ] });
}
function auiRange(value, min, max, step, unit, disabled, onChange) {
  return jsx("div", { className: "aui-range", children: [
    jsx("input", { type: "range", min: String(min), max: String(max), step: String(step), value: String(value), disabled: disabled, onChange: function (e) { onChange(Number(e.target.value)); } }),
    jsx("span", { className: "aui-range-val", children: value + unit })
  ] });
}
function auiNote(note) {
  return note ? jsx("div", { className: "aui-note" + (note.error ? " aui-note-error" : ""), children: note.text }) : null;
}

var DEFAULT_SPEECH_BUBBLE = { enabled: true, mode: "bubble", backgroundColor: "#211e2a", opacity: 0.94, fontColor: "#f5f3fa", fontSize: 14, hideAfter: 10 };
function settingsFrom(d) {
  return { hidden: d.hidden, behaviors: d.behaviors || {}, voiceReplies: d.voiceReplies || {}, voices: d.voices || ["sveta", "masha", "dima"], speechBubble: d.speechBubble || DEFAULT_SPEECH_BUBBLE };
}

// Settings writes: the UI updates at once, requests go one at a time and any
// changes made meanwhile (e.g. dragging a slider) are merged into the next one.
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
function usePatchQueue(onOk, onError) {
  var st = react.useRef({ inFlight: false, queued: null });
  var cbs = react.useRef(null);
  cbs.current = { onOk: onOk, onError: onError };
  var send = function (patch) {
    var s = st.current;
    s.inFlight = true;
    fetch("/amadeus-live2d/settings", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(patch) })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (!(d && d.ok)) cbs.current.onError((d && d.error) || "Не удалось применить.");
        else if (!s.queued) cbs.current.onOk(d);
      })
      .catch(function (e) { cbs.current.onError((e && e.message) || "Ошибка."); })
      .finally(function () {
        var next = s.queued;
        s.queued = null;
        if (next) send(next); else s.inFlight = false;
      });
  };
  return function (patch) {
    var s = st.current;
    if (s.inFlight) s.queued = mergePatch(s.queued, patch);
    else send(patch);
  };
}

var PREVIEW_PHASES = [
  ["thinking", "Думает", { text: "", final: false, phase: "thinking", status: "Думаю…" }],
  ["tool", "Инструмент", { text: "", final: false, phase: "tool", status: "bash" }],
  ["answer", "Отвечает", { text: "Так будет выглядеть ответ агента рядом с персонажем. Пока ответ приходит, пузырь сам листает вниз, а длинный текст можно прокрутить колесом мыши — например, чтобы перечитать начало.", final: false, phase: "answer", status: "" }],
  ["done", "Готово", { text: "Ответ готов. Наведите курсор на пузырь — он не исчезнет, пока вы читаете.", final: true, phase: "answer", status: "" }]
];
/** The real companion bubble (bubble.html served by the host) driven over postMessage. */
function BubblePreview(props) {
  var frameRef = react.useRef(null);
  var readyState = react.useState(false);
  var ready = readyState[0], setReady = readyState[1];
  var phaseState = react.useState("answer");
  var phase = phaseState[0], setPhase = phaseState[1];
  react.useEffect(function () {
    var onMessage = function (e) {
      var frame = frameRef.current;
      if (frame && e.source === frame.contentWindow && e.data && e.data.source === "amadeus-bubble-preview" && e.data.ready) setReady(true);
    };
    window.addEventListener("message", onMessage);
    return function () { window.removeEventListener("message", onMessage); };
  }, []);
  var styleKey = JSON.stringify(props.style);
  react.useEffect(function () {
    var frame = frameRef.current;
    if (!ready || !frame || !frame.contentWindow) return;
    var sample = PREVIEW_PHASES.filter(function (p) { return p[0] === phase; })[0][2];
    frame.contentWindow.postMessage({ source: "amadeus-bubble-preview", side: "right", speech: Object.assign({}, sample, { style: props.style }) }, "*");
  }, [ready, phase, styleKey]);
  var orbOnly = props.style.mode === "orb";
  return jsx("div", { className: "aui-live-preview", children: [
    jsx("div", { className: "aui-live-stage", children: jsx("iframe", {
      ref: frameRef,
      title: "Предпросмотр пузыря",
      src: "/amadeus-live2d/bubble-preview/",
      className: "aui-live-frame",
      style: orbOnly ? { width: "200px", height: "200px" } : { width: "330px", height: "300px" }
    }) }),
    jsx("div", { className: "aui-seg aui-live-phases", children: PREVIEW_PHASES.map(function (p) {
      return jsx("button", { key: p[0], type: "button", className: "aui-seg-btn" + (phase === p[0] ? " aui-seg-btn-active" : ""), onClick: function () { setPhase(p[0]); }, children: p[1] });
    }) })
  ] });
}

/** One settings area of the companion (props.part: "screen" | "answers" | "voice"). */
function CharacterSettingsBar(props) {
  var part = props.part;
  var cfgState = react.useState({ hidden: false, behaviors: {}, voiceReplies: {}, voices: ["sveta", "masha", "dima"], speechBubble: DEFAULT_SPEECH_BUBBLE });
  var cfg = cfgState[0], setCfg = cfgState[1];
  var noteState = react.useState(null);
  var note = noteState[0], setNote = noteState[1];
  var busy = false;
  react.useEffect(function () {
    var alive = true;
    fetch("/amadeus-live2d/settings").then(function (r) { return r.json(); }).then(function (d) {
      if (alive && d && d.ok) setCfg(settingsFrom(d));
    }).catch(function () {});
    return function () { alive = false; };
  }, []);
  var push = usePatchQueue(function (d) {
    setCfg(settingsFrom(d));
    if (props.onChange) props.onChange(d);
  }, function (text) { setNote({ text: text, error: true }); });
  var applyPatch = function (patch) {
    setNote(null);
    setCfg(function (prev) { return mergePatch(prev, patch); });
    push(patch);
  };
  var b = cfg.behaviors || {};
  var vr = cfg.voiceReplies || {};
  var sb = cfg.speechBubble || DEFAULT_SPEECH_BUBBLE;
  var voices = cfg.voices || ["sveta", "masha", "dima"];

  if (part === "screen") {
    return auiCard("behavior", "Поведение", "Как персонаж ведёт себя на рабочем столе.", [
      auiRow("shown", "Показывать персонажа", "Окно с моделью поверх всех окон.", auiSwitch(!cfg.hidden, busy, function () { applyPatch({ hidden: !cfg.hidden }); })),
      auiRow("wander", "Гулять по экрану", "Сам перемещается по рабочему столу.", auiSwitch(b.wander !== false, busy, function () { applyPatch({ behaviors: { wander: b.wander === false } }); }), cfg.hidden),
      auiRow("perch", "Садиться на окна", "Может устроиться на верхнем краю окна.", auiSwitch(b.perch !== false, busy, function () { applyPatch({ behaviors: { perch: b.perch === false } }); }), cfg.hidden),
      auiRow("cursor", "Следить за курсором", "Поворачивает голову и взгляд за мышью.", auiSwitch(b.cursor !== false, busy, function () { applyPatch({ behaviors: { cursor: b.cursor === false } }); }), cfg.hidden)
    ], auiNote(note));
  }

  if (part === "voice") {
    return auiCard("voice-replies", "Озвучка ответов", "Персонаж читает готовый ответ агента вслух.", [
      auiRow("enabled", "Озвучивать ответы", null, auiSwitch(!!vr.enabled, busy, function () { applyPatch({ voiceReplies: { enabled: !vr.enabled } }); })),
      auiRow("engine", "Движок", null, jsx("div", { className: "aui-seg", children: [["edge", "Edge (онлайн)"], ["kokoro", "Kokoro (локально)"]].map(function (m) {
        return jsx("button", { key: m[0], type: "button", disabled: busy || !vr.enabled, className: "aui-seg-btn" + ((vr.engine || "edge") === m[0] ? " aui-seg-btn-active" : ""), onClick: function () { applyPatch({ voiceReplies: { engine: m[0] } }); }, children: m[1] });
      }) }), !vr.enabled),
      (vr.engine || "edge") === "edge" ? auiRow("evoice", "Голос", "Нейроголоса Microsoft: живая интонация. Нужен интернет, текст ответа уходит в Microsoft. Без интернета — Kokoro.", jsx("select", { className: "aui-select", disabled: busy || !vr.enabled, value: vr.edgeVoice || "ru-RU-SvetlanaNeural", onChange: function (e) { applyPatch({ voiceReplies: { edgeVoice: e.target.value } }); }, children: [["ru-RU-SvetlanaNeural", "Светлана (русский)"], ["en-US-AvaMultilingualNeural", "Ava (многоязычный)"], ["en-US-EmmaMultilingualNeural", "Emma (многоязычный)"], ["ru-RU-DmitryNeural", "Дмитрий (русский, мужской)"]].map(function (x) { return jsx("option", { key: x[0], value: x[0], children: x[1] }); }) }), !vr.enabled) : null,
      (vr.engine || "edge") === "edge" ? auiRow("erate", "Темп", null, jsx("div", { className: "aui-seg", children: [-10, 0, 10, 20].map(function (x) {
        var cur = vr.edgeRate == null ? 10 : vr.edgeRate;
        return jsx("button", { key: x, type: "button", disabled: busy || !vr.enabled, className: "aui-seg-btn" + (cur === x ? " aui-seg-btn-active" : ""), onClick: function () { applyPatch({ voiceReplies: { edgeRate: x } }); }, children: (x > 0 ? "+" : "") + x + "%" });
      }) }), !vr.enabled) : null,
      (vr.engine || "edge") === "edge" ? auiRow("epitch", "Высота голоса", null, jsx("div", { className: "aui-seg", children: [0, 8, 15, 25].map(function (x) {
        var cur = vr.edgePitch == null ? 15 : vr.edgePitch;
        return jsx("button", { key: x, type: "button", disabled: busy || !vr.enabled, className: "aui-seg-btn" + (cur === x ? " aui-seg-btn-active" : ""), onClick: function () { applyPatch({ voiceReplies: { edgePitch: x } }); }, children: x === 0 ? "обычная" : "+" + x });
      }) }), !vr.enabled) : null,
      (vr.engine || "edge") === "edge" ? null : auiRow("voice", "Голос", null, jsx("select", { className: "aui-select", disabled: busy || !vr.enabled, value: vr.voice || "sveta", onChange: function (e) { applyPatch({ voiceReplies: { voice: e.target.value } }); }, children: voices.map(function (v) { return jsx("option", { key: v, value: v, children: v }); }) }), !vr.enabled),
      (vr.engine || "edge") === "edge" ? null : auiRow("speed", "Скорость речи", null, jsx("div", { className: "aui-seg", children: ["0.75", "1", "1.25", "1.5"].map(function (s) {
        var active = String(vr.speed != null ? vr.speed : 1) === s;
        return jsx("button", { key: s, type: "button", disabled: busy || !vr.enabled, className: "aui-seg-btn" + (active ? " aui-seg-btn-active" : ""), onClick: function () { applyPatch({ voiceReplies: { speed: Number(s) } }); }, children: s + "×" });
      }) }), !vr.enabled)
    ], auiNote(note));
  }

  // part === "answers"
  var on = sb.enabled !== false;
  var orbOnly = sb.mode === "orb";
  var opacity = Math.round((sb.opacity != null ? sb.opacity : 0.94) * 100);
  var fontSize = sb.fontSize || 14;
  var hideAfter = typeof sb.hideAfter === "number" ? sb.hideAfter : 10;
  var modeCard = function (mode, title, sub) {
    var active = (mode === "orb") === orbOnly;
    return jsx("button", { key: mode, type: "button", disabled: busy || !on, className: "aui-choice" + (active ? " aui-choice-active" : ""), onClick: function () { applyPatch({ speechBubble: { mode: mode } }); }, children: [
      jsx("span", { className: "aui-choice-art aui-choice-art-" + mode, children: [
        jsx("i", { className: "aui-mini-orb" }),
        mode === "bubble" ? jsx("span", { className: "aui-mini-lines", children: [jsx("b", {}), jsx("b", {}), jsx("b", {})] }) : null
      ] }),
      jsx("span", { className: "aui-choice-title", children: title }),
      jsx("span", { className: "aui-choice-sub", children: sub })
    ] });
  };
  var previewStyle = { fontFamily: "Segoe UI", fontSize: fontSize, fontColor: sb.fontColor, backgroundColor: sb.backgroundColor, opacity: opacity / 100, mode: orbOnly ? "orb" : "bubble", orb: sb.orb || {} };
  return jsx("div", { className: "aui-stack", children: [
    auiCard("answers", "Ответы агента", "Что показывать рядом с персонажем, пока агент думает и отвечает.", [
      auiRow("enabled", "Показывать ответы", "Пузырь появляется у головы персонажа.", auiSwitch(on, busy, function () { applyPatch({ speechBubble: { enabled: !on } }); })),
      auiRow("hide", "Скрывать через", hideAfter > 0 ? "Готовый ответ исчезнет через " + hideAfter + " с (пока курсор на пузыре — не исчезнет)." : "Ответ остаётся до следующего ответа агента.", jsx("div", { className: "aui-inline", children: [
        jsx("input", { key: "r", className: "aui-hide-range", type: "range", min: "0", max: "120", step: "1", value: String(Math.min(120, hideAfter)), onChange: function (e) { applyPatch({ speechBubble: { hideAfter: Number(e.target.value) } }); } }),
        jsx("label", { key: "n", className: "aui-num", children: [
          jsx("input", { type: "number", min: "0", max: "600", step: "1", value: String(hideAfter), onChange: function (e) { var v = Number(e.target.value); if (isFinite(v)) applyPatch({ speechBubble: { hideAfter: Math.min(600, Math.max(0, Math.round(v))) } }); } }),
          jsx("span", { children: "с" })
        ] })
      ] }), !on),
      jsx("div", { key: "modes", className: "aui-choices" + (on ? "" : " aui-row-disabled"), children: [
        modeCard("bubble", "Пузырь с текстом", "Орб, точки и текст ответа с прокруткой"),
        modeCard("orb", "Только орб и точки", "Компактно, без текста")
      ] })
    ], auiNote(note)),
    on ? auiCard("preview", "Предпросмотр", "Это настоящий пузырь — ровно так он выглядит рядом с персонажем. Цвета и вид орба по состояниям настраиваются во вкладке Orbs.", [
      jsx("div", { key: "split", className: "aui-split", children: [
        orbOnly ? jsx("div", { className: "aui-split-rows", children: jsx("div", { className: "aui-row-hint", children: "В режиме «Только орб и точки» текст не показывается — только состояние агента." }) }) : jsx("div", { className: "aui-split-rows", children: [
          auiRow("bg", "Фон", null, jsx("input", { className: "aui-color", type: "color", value: sb.backgroundColor || "#211e2a", onChange: function (e) { applyPatch({ speechBubble: { backgroundColor: e.target.value } }); } })),
          auiRow("fg", "Цвет текста", null, jsx("input", { className: "aui-color", type: "color", value: sb.fontColor || "#f5f3fa", onChange: function (e) { applyPatch({ speechBubble: { fontColor: e.target.value } }); } })),
          auiRow("opacity", "Непрозрачность фона", null, auiRange(opacity, 30, 100, 5, "%", false, function (v) { applyPatch({ speechBubble: { opacity: v / 100 } }); })),
          auiRow("font", "Размер текста", null, auiRange(fontSize, 10, 32, 1, "px", false, function (v) { applyPatch({ speechBubble: { fontSize: v } }); }))
        ] }),
        jsx(BubblePreview, { style: previewStyle })
      ] })
    ]) : null
  ] });
}

var LIVE2D_TABS = [["characters", "Персонажи"], ["screen", "На экране"], ["answers", "Ответы агента"], ["voice", "Голос и звук"]];
function Live2DPage() {
  var tabState = react.useState(function () {
    try { var saved = window.localStorage.getItem("amadeus-live2d-tab"); if (saved && LIVE2D_TABS.some(function (t) { return t[0] === saved; })) return saved; } catch (e) {}
    return "characters";
  });
  var tab = tabState[0], setTab = tabState[1];
  var statusState = react.useState({ active: "", hidden: false, loaded: false });
  var status = statusState[0], setStatus = statusState[1];
  var refreshStatus = function () {
    Promise.all([
      fetch("/amadeus-live2d/active").then(function (r) { return r.json(); }).catch(function () { return {}; }),
      fetch("/amadeus-live2d/settings").then(function (r) { return r.json(); }).catch(function () { return {}; }),
      fetch("/amadeus-live2d/list").then(function (r) { return r.json(); }).catch(function () { return {}; })
    ]).then(function (res) {
      var id = (res[0] && res[0].active) || "";
      var model = ((res[2] && res[2].models) || []).filter(function (m) { return m.id === id; })[0];
      setStatus({ active: id, name: model ? model.name : id, hidden: !!(res[1] && res[1].hidden), loaded: true });
    });
  };
  react.useEffect(refreshStatus, []);
  var pick = function (id) { setTab(id); try { window.localStorage.setItem("amadeus-live2d-tab", id); } catch (e) {} };
  var pill = !status.loaded ? null : !status.active
    ? jsx("span", { className: "aui-pill", children: "Модель не выбрана" })
    : status.hidden ? jsx("span", { className: "aui-pill", children: "Скрыт" })
    : jsx("span", { className: "aui-pill aui-pill-on", children: "На экране" });
  var body;
  if (tab === "characters") body = jsx(CharactersSection, { onSelect: refreshStatus });
  else if (tab === "screen") body = jsx("div", { className: "aui-stack", children: [jsx(CharacterSettingsBar, { key: "b", part: "screen", onChange: refreshStatus }), jsx(AudioControlsSection, { key: "s", part: "scale" })] });
  else if (tab === "answers") body = jsx(CharacterSettingsBar, { part: "answers" });
  else body = jsx("div", { className: "aui-stack", children: [jsx(CharacterSettingsBar, { key: "v", part: "voice" }), jsx(AudioControlsSection, { key: "m", part: "voice" })] });
  return jsx("div", { className: "aui-page", children: [
    jsx("div", { className: "aui-hero", children: [
      jsx("div", { className: "aui-hero-icon", children: "2D" }),
      jsx("div", { className: "aui-hero-text", children: [
        jsx("div", { className: "aui-hero-title", children: ["Live2D-персонаж", pill] }),
        jsx("div", { className: "aui-hero-sub", children: status.active ? "Активная модель: " + (status.name || status.active) : "Выберите персонажа во вкладке «Персонажи»." })
      ] })
    ] }),
    jsx("nav", { className: "aui-tabs", role: "tablist", children: LIVE2D_TABS.map(function (t) {
      return jsx("button", { key: t[0], type: "button", role: "tab", "aria-selected": tab === t[0], className: "aui-tab" + (tab === t[0] ? " aui-tab-active" : ""), onClick: function () { pick(t[0]); }, children: t[1] });
    }) }),
    body
  ] });
}
function AudioControlsSection(props) {
  var cfgState = react.useState({ modelScale: 1, radioEnabled: false, voiceDevices: {}, voices: ["sveta", "masha", "dima"] });
  var cfg = cfgState[0], setCfg = cfgState[1];
  var devState = react.useState({ inputs: [], outputs: [] });
  var dev = devState[0], setDev = devState[1];
  var noteState = react.useState(null);
  var note = noteState[0], setNote = noteState[1];
  var busy = false;
  var levelState = react.useState(0);
  var level = levelState[0], setLevel = levelState[1];
  var recState = react.useState(false);
  var recording = recState[0], setRecording = recState[1];
  var refs = react.useRef({ stream: null, audioCtx: null, analyser: null, raf: 0, recorder: null, chunks: [], fileInput: null, micOn: false });

  var loadCfg = function () {
    fetch("/amadeus-live2d/settings").then(function (r) { return r.json(); }).then(function (d) {
      if (d && d.ok) setCfg({ modelScale: d.modelScale != null ? d.modelScale : 1, radioEnabled: !!(d.hotkeys && d.hotkeys.radioEnabled), voiceDevices: d.voiceDevices || {}, voices: d.voices || ["sveta", "masha", "dima"] });
    }).catch(function () {});
  };
  var loadDevices = function () {
    if (navigator.mediaDevices && typeof navigator.mediaDevices.enumerateDevices === "function") {
      navigator.mediaDevices.enumerateDevices().then(function (list) {
        setDev({ inputs: list.filter(function (d) { return d.kind === "audioinput"; }), outputs: list.filter(function (d) { return d.kind === "audiooutput"; }) });
      }).catch(function () {});
    }
  };
  react.useEffect(function () {
    loadCfg(); loadDevices();
    if (navigator.mediaDevices && typeof navigator.mediaDevices.addEventListener === "function") {
      navigator.mediaDevices.addEventListener("devicechange", loadDevices);
    }
    return function () {
      var r = refs.current;
      if (r.stream) r.stream.getTracks().forEach(function (t) { t.stop(); });
      if (r.audioCtx) r.audioCtx.close();
      if (r.raf) cancelAnimationFrame(r.raf);
    };
  }, []);

  var push = usePatchQueue(function (d) {
    setCfg(function (prev) { return { modelScale: d.modelScale != null ? d.modelScale : 1, radioEnabled: !!(d.hotkeys && d.hotkeys.radioEnabled), voiceDevices: d.voiceDevices || {}, voices: d.voices || prev.voices }; });
  }, function (text) { setNote({ text: text, error: true }); });
  var applyPatch = function (patch) {
    setNote(null);
    setCfg(function (prev) {
      var next = mergePatch(prev, patch);
      if (patch.scale != null) next.modelScale = patch.scale;
      if (patch.radioEnabled != null) next.radioEnabled = patch.radioEnabled;
      return next;
    });
    push(patch);
  };

  var stopMic = function () {
    var r = refs.current;
    r.micOn = false;
    if (r.raf) { cancelAnimationFrame(r.raf); r.raf = 0; }
    if (r.stream) { r.stream.getTracks().forEach(function (t) { t.stop(); }); r.stream = null; }
    if (r.audioCtx) { r.audioCtx.close(); r.audioCtx = null; }
    r.analyser = null;
    setLevel(0);
  };
  var startMic = function () {
    var inputId = cfg.voiceDevices && cfg.voiceDevices.inputDeviceId;
    navigator.mediaDevices.getUserMedia({ audio: inputId ? { deviceId: { exact: inputId } } : true }).then(function (stream) {
      var r = refs.current;
      r.stream = stream;
      var AudioCtx = window.AudioContext || window.webkitAudioContext;
      r.audioCtx = new AudioCtx();
      var src = r.audioCtx.createMediaStreamSource(stream);
      r.analyser = r.audioCtx.createAnalyser();
      r.analyser.fftSize = 512;
      src.connect(r.analyser);
      r.micOn = true;
      var data = new Uint8Array(r.analyser.frequencyBinCount);
      var loop = function () {
        if (!r.analyser || !r.micOn) return;
        r.analyser.getByteFrequencyData(data);
        var sum = 0; for (var i = 0; i < data.length; i++) sum += data[i];
        setLevel(Math.min(1, (sum / data.length) / 128));
        r.raf = requestAnimationFrame(loop);
      };
      loop();
    }).catch(function (e) { setNote({ text: "Нет доступа к микрофону: " + (e && e.name), error: true }); });
  };
  var toggleMicTest = function () { if (refs.current.micOn) stopMic(); else startMic(); };

  var startRecording = function () {
    var inputId = cfg.voiceDevices && cfg.voiceDevices.inputDeviceId;
    navigator.mediaDevices.getUserMedia({ audio: inputId ? { deviceId: { exact: inputId } } : true }).then(function (stream) {
      var r = refs.current;
      r.stream = stream;
      if (typeof MediaRecorder === "undefined") { setNote({ text: "MediaRecorder недоступен.", error: true }); return; }
      var mime = "audio/webm";
      if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) mime = "audio/webm;codecs=opus";
      var rec = new MediaRecorder(stream, { mimeType: mime });
      r.recorder = rec; r.chunks = [];
      rec.ondataavailable = function (e) { if (e.data && e.data.size) r.chunks.push(e.data); };
      rec.onstop = function () {
        var blob = new Blob(r.chunks, { type: mime });
        var fr = new FileReader();
        fr.onload = function () {
          var dataUrl = String(fr.result || "");
          var b64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
          fetch("/amadeus-live2d/transcribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ data: b64, type: mime.split(";")[0], filename: "audio.webm" }) })
            .then(function (x) { return x.json(); })
            .then(function (d) {
              if (d && d.ok && d.text) { setNote({ text: "Распознано: " + d.text }); injectChat(d.text); }
              else setNote({ text: (d && d.error) || "Не удалось распознать.", error: true });
            })
            .catch(function () { setNote({ text: "Ошибка распознавания.", error: true }); })
            .finally(function () { stopMic(); setRecording(false); });
        };
        fr.readAsDataURL(blob);
      };
      rec.start();
      setRecording(true);
      setNote({ text: "Говорите… (отпустите, чтобы отправить)" });
    }).catch(function (e) { setNote({ text: "Нет доступа к микрофону: " + (e && e.name), error: true }); });
  };
  var stopRecording = function () { var r = refs.current; if (r.recorder && r.recorder.state !== "inactive") r.recorder.stop(); };

  var importVoice = function (file) {
    if (!file) return;
    if (!/\.bin$/i.test(file.name)) { setNote({ text: "Нужен файл .bin (стиль голоса Kokoro).", error: true }); return; }
    var name = file.name.replace(/\.bin$/i, "").toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 40);
    var fr = new FileReader();
    fr.onload = function () {
      var dataUrl = String(fr.result || "");
      var b64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
      setNote({ text: "Загружаю голос \"" + name + "\"…" });
      fetch("/amadeus-live2d/voice-import", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: name, data: b64 }) })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d && d.ok) { setNote({ text: "Голос добавлен: " + d.name }); loadCfg(); }
          else setNote({ text: (d && d.error) || "Не удалось добавить голос.", error: true });
        })
        .catch(function () { setNote({ text: "Ошибка загрузки голоса.", error: true }); });
    };
    fr.readAsDataURL(file);
  };

  var scalePct = Math.round((cfg.modelScale != null ? cfg.modelScale : 1) * 100);
  if (props && props.part === "scale") {
    return auiCard("scale", "Размер", null, [
      auiRow("scale", "Масштаб персонажа", "100% — исходный размер модели.", auiRange(scalePct, 50, 200, 5, "%", busy, function (v) { applyPatch({ scale: v / 100 }); }))
    ], auiNote(note));
  }
  var deviceSelect = function (kind, list, fallback) {
    var key = kind === "input" ? "inputDeviceId" : "outputDeviceId";
    return jsx("select", { className: "aui-select", value: (cfg.voiceDevices && cfg.voiceDevices[key]) || "", onChange: function (e) { var p = {}; p[key] = e.target.value; applyPatch({ voiceDevices: p }); }, children: [
      jsx("option", { key: "", value: "", children: "По умолчанию" })
    ].concat(list.filter(function (d) { return d.deviceId && d.deviceId !== "default"; }).map(function (d, i) { return jsx("option", { key: d.deviceId + ":" + i, value: d.deviceId, children: d.label || (fallback + " " + (i + 1)) }); })) });
  };
  return jsx("div", { className: "aui-stack", children: [
    auiCard("mic", "Микрофон и динамик", "Голосовые сообщения агенту.", [
      auiRow("in", "Микрофон", null, deviceSelect("input", dev.inputs, "Микрофон")),
      auiRow("out", "Динамик", null, deviceSelect("output", dev.outputs, "Динамик")),
      auiRow("test", "Проверка микрофона", "Скажите что-нибудь — полоска покажет уровень.", jsx("div", { className: "aui-inline", children: [
        jsx("div", { className: "aui-level", children: jsx("i", { style: { width: Math.round(level * 100) + "%" } }) }),
        jsx("button", { className: "aui-btn" + (refs.current.micOn ? " aui-btn-danger" : ""), type: "button", onClick: toggleMicTest, children: refs.current.micOn ? "Стоп" : "Проверить" })
      ] })),
      auiRow("radio", "Режим рации", "Удерживайте кнопку, пока говорите.", auiSwitch(!!cfg.radioEnabled, busy, function () { applyPatch({ radioEnabled: !cfg.radioEnabled }); })),
      cfg.radioEnabled ? jsx("div", { key: "ptt", className: "aui-ptt-wrap", children: jsx("button", { className: "aui-ptt" + (recording ? " aui-ptt-on" : ""), type: "button",
        onPointerDown: function (e) { e.preventDefault(); startRecording(); },
        onPointerUp: function () { stopRecording(); },
        onPointerLeave: function () { if (recording) stopRecording(); },
        children: recording ? "Говорю… отпустите, чтобы отправить" : "Нажмите и говорите" }) }) : null
    ], auiNote(note)),
    auiCard("voices", "Голоса", "Свои стили голоса Kokoro (.bin) появятся в списке голосов.", [
      auiRow("import", "Добавить голос", null, jsx("div", { className: "aui-inline", children: [
        jsx("button", { className: "aui-btn", type: "button", onClick: function () { refs.current.fileInput && refs.current.fileInput.click(); }, children: "Загрузить .bin" }),
        jsx("input", { className: "aui-hidden", type: "file", accept: ".bin", ref: function (el) { refs.current.fileInput = el; }, onChange: function (e) { importVoice(e.target.files && e.target.files[0]); e.target.value = ""; } })
      ] }))
    ])
  ] });
}
function injectChat(text) {
  if (!text) return;
  var el = document.querySelector("textarea") || document.querySelector("[contenteditable=\"true\"]") || document.querySelector("[role=\"textbox\"]");
  if (!el) return;
  el.focus();
  if (el.tagName === "TEXTAREA") { el.value = text; el.dispatchEvent(new Event("input", { bubbles: true })); }
  else { el.textContent = text; el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text })); }
}

// ---- the companion's own chat: Workspace "live2D", one chat per character (named after her)
var companionChat = { remote: null, ui: null, pending: null, sid: "", model: "" };
function clog(msg) { try { fetch("/amadeus-live2d/client-log", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ msg: String(msg) }) }); } catch (e) {} }
function chatPost(body) { return fetch("/amadeus-live2d/companion-chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).then(function (r) { return r.json(); }); }
function chatRemote() { var r = companionChat.remote; return r && r.session && r.workspace ? r : null; }
function ensureCompanionChat() {
  if (companionChat.pending) return companionChat.pending;
  companionChat.pending = (async function () {
    var remote = chatRemote();
    if (!remote) { clog("no remote"); return ""; }
    var info = await fetch("/amadeus-live2d/companion-chat").then(function (r) { return r.json(); });
    if (!info || !info.ok || !info.model) return "";
    var ws = await remote.workspace.create({ path: info.path });
    if (!ws || !ws.ok) { clog("workspace: " + JSON.stringify(ws && ws.error)); return ""; }
    var wsId = ws.value.workspace.workspaceId || ws.value.workspace.id;
    if (wsId !== info.workspaceId) await chatPost({ workspaceId: wsId });
    var sid = info.sessions[info.model.id] || "";
    if (!sid) {
      var s = await remote.session.create({ workspaceId: wsId });
      if (!s || !s.ok) { clog("session: " + JSON.stringify(s && s.error)); return ""; }
      sid = s.value.sessionId;
      await remote.session.rename({ sessionId: sid, title: info.model.name });
      await chatPost({ modelId: info.model.id, sessionId: sid });
    }
    companionChat.sid = sid; companionChat.model = info.model.id;
    return sid;
  })().catch(function (e) { clog("chat error: " + (e && (e.stack || e.message) || e)); return ""; }).finally(function () { setTimeout(function () { companionChat.pending = null; }, 0); });
  return companionChat.pending;
}
/** A message into her chat (opened on screen); false when that is not possible. */
async function sendToCompanionChat(text, retried) {
  var sid = await ensureCompanionChat();
  var remote = chatRemote();
  if (!sid || !remote) return false;
  var tz = "UTC"; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch (e) {}
  var rid = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);
  var r = await remote.session.prompt({ requestId: rid, sessionId: sid, mode: "queue", content: [{ type: "text", text: text }], clientTimeZone: tz });
  if (!r || !r.ok) {
    clog("prompt: " + JSON.stringify(r && r.error));
    if (!retried) { await chatPost({ modelId: companionChat.model, sessionId: "" }); companionChat.sid = ""; return sendToCompanionChat(text, true); }   // the chat was deleted: a new one
    return false;
  }
  try { var ui = companionChat.ui; if (ui && ui.openSession) ui.openSession(sid); } catch (e) {}
  return true;
}
function pollChatMessage() {
  setInterval(function () {
    fetch("/amadeus-live2d/chat-message").then(function (r) { return r.json(); }).then(function (d) {
      if (!d || !d.ok || !d.text) return;
      sendToCompanionChat(d.text).then(function (ok) { if (!ok && typeof injectChat === "function") injectChat(d.text); });
    }).catch(function () {});
  }, 1500);
}
function wireSpeech(ctx) {
  var uiSession = ctx && ctx.uiSession;
  var uiConversation = ctx && ctx.uiConversation;
  if (!uiSession || !uiSession.sessionStatus) return;
  var status = uiSession.sessionStatus;
  var lastPartial = '';
  var lastSentFinal = '';
  var wasRunning = false;
  var subscribed = {};
  var trajectorySnapshot = function () {
    try {
      if (!uiConversation || typeof uiConversation.binding !== "function") return null;
      var binding = uiSession.current && uiSession.current.value;
      var sessionId = (binding && binding.props && binding.props.sessionId) || (binding && binding.key);
      if (!sessionId) return null;
      var target = uiConversation.binding(sessionId).target("trajectory");
      if (!target || typeof target.getSnapshot !== "function") return null;
      // The trajectory source is lazy: it stays empty until someone subscribes.
      if (!subscribed[sessionId] && typeof target.subscribe === "function") {
        subscribed[sessionId] = true;
        try { target.subscribe(function () { tick(); }); } catch (e) {}
      }
      return target.getSnapshot() || null;
    } catch (e) { return null; }
  };
  // What the client could see when a turn ended without text (shows up in /amadeus-live2d/speak-log).
  var diagnose = function () {
    var d = {};
    try {
      var binding = uiSession.current && uiSession.current.value;
      d.binding = binding ? Object.keys(binding).slice(0, 12) : null;
      d.props = binding && binding.props ? Object.keys(binding.props).slice(0, 12) : null;
      d.sessionId = (binding && binding.props && binding.props.sessionId) || (binding && binding.key) || null;
      var snap = trajectorySnapshot();
      d.snap = snap ? Object.keys(snap).slice(0, 12) : null;
      var nodes = snap && snap.eventNodes;
      d.nodes = nodes && typeof nodes.length === "number" ? nodes.length : null;
      if (d.nodes) d.tail = Array.prototype.slice.call(nodes, -4).map(function (n) {
        return n ? n.kind + ":" + (Array.isArray(n.blocks) ? n.blocks.map(function (b) { return b && b.kind; }).join("|") : Object.keys(n).slice(0, 8).join(",")) : "null";
      });
    } catch (e) { d.error = String(e && e.message || e); }
    return d;
  };
  var textBlocks = function (blocks) {
    if (!Array.isArray(blocks)) return "";
    var parts = [];
    blocks.forEach(function (b) { if (b && b.kind === "text" && typeof b.text === "string" && b.text !== "") parts.push(b.text); });
    return parts.length ? parts.join("\n\n") : "";
  };
  var readFinal = function () {
    var snap = trajectorySnapshot();
    if (!snap || !Array.isArray(snap.eventNodes)) return "";
    for (var i = snap.eventNodes.length - 1; i >= 0; i--) {
      var node = snap.eventNodes[i];
      if (!node || node.kind !== "assistant") continue;
      var t = textBlocks(node.blocks);
      if (t) return t;
    }
    return "";
  };
  var post = function (body) {
    fetch("/amadeus-live2d/speak", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }).catch(function () {});
  };
  var toolName = function (calls) {
    var c = calls && calls[calls.length - 1];
    var n = c && (c.name || c.toolName || (c.call && c.call.name) || (c.tool && c.tool.name));
    return typeof n === "string" && n ? n : "Инструмент";
  };
  // Phase for the bubble's orb + dots (same mapping as amadeus-orb's driveFromSession):
  // runningCalls -> tool, partial text -> answer, otherwise thinking.
  var lastKey = "";
  var tick = function () {
    var running = false;
    try {
      var snap = status.getSnapshot();
      if (snap && typeof snap.forEach === "function") {
        snap.forEach(function (row) { if (row && row.running === true) running = true; });
      }
    } catch (e) {}
    if (running) {
      var traj = trajectorySnapshot();
      var calls = traj && traj.runningCalls;
      var streaming = traj && traj.partial ? textBlocks(traj.partial.blocks) : "";
      var body;
      if (calls && calls.length > 0) body = { text: "", final: false, phase: "tool", status: toolName(calls) };
      else if (streaming) body = { text: streaming, final: false, phase: "answer", status: "" };
      else body = { text: "", final: false, phase: "thinking", status: "Думаю…" };
      if (streaming) lastPartial = streaming;
      var key = body.phase + "\u0000" + body.status + "\u0000" + body.text;
      if (key !== lastKey) { lastKey = key; post(body); }
    } else if (wasRunning) {
      var done = lastPartial || readFinal();
      if (done && done !== lastSentFinal) {
        lastSentFinal = done;
        post({ text: done, final: true, phase: "answer", status: "" });
      } else {
        // stopped without an answer — clear a bubble stuck in thinking/tool
        post({ text: "", final: true, phase: "idle", status: "" });
        if (!done) post({ text: "", final: true, phase: "idle", status: "", diag: diagnose() });
      }
      lastPartial = "";
      lastKey = "";
    }
    wasRunning = running;
  };
  try { if (typeof status.subscribe === "function") status.subscribe(tick); } catch (e) {}
  tick();
  setInterval(tick, 250);
}
function makeApi(base) {
  function req(p, opts) {
    return fetch(base + p, opts).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }
  function post(p, body) {
    return req(p, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body || {}) });
  }
  return {
    list: function () { return req('/list').then(function (r) { return r.models || []; }); },
    active: function () { return req('/active').then(function (r) { return r.active || ''; }); },
    select: function (id) { return post('/select', { id: id }).then(function (r) { return r.id || id; }); },
    remove: function (id) { return post('/remove', { id: id }); },
    action: function (payload) { return post('/command', payload); },
  };
}

    var inject = ["slots", "uiSession", "uiConversation"];
    function apply(ctx) {
      window.amadeusCharacters = makeApi("/amadeus-live2d");
      var __speechRun = function () { pollChatMessage(); wireSpeech(ctx); };
      if (typeof document !== "undefined" && document.readyState === "loading") { document.addEventListener("DOMContentLoaded", __speechRun); } else { __speechRun(); }
      if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=\"amadeus-live2d\"]") === null) {
        var tag = document.createElement("style");
        tag.dataset.pluginCss = "amadeus-live2d";
        tag.textContent = CSS + ACTIONS_CSS + AUI_CSS + ".amadeus-character-card{transition:transform .15s ease,box-shadow .15s ease}.amadeus-character-card:hover{transform:translateY(-2px);box-shadow:0 8px 18px rgba(0,0,0,.14)}.amadeus-character-preview{border-radius:10px;overflow:hidden}.amadeus-character-action{transition:transform .12s ease}.amadeus-character-action:hover{transform:translateY(-1px)}.amadeus-character-settings{display:flex;flex-direction:column;gap:10px;margin:0 0 14px;padding:14px 16px;border:1px solid var(--dsw-alias-border-l3);border-radius:12px;background:var(--dsw-alias-bg-base)}.amadeus-cs-head{display:flex;flex-wrap:wrap;align-items:center;gap:10px 16px}.amadeus-cs-title{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--dsw-alias-label-caption)}.amadeus-cs-row{display:flex;flex-wrap:wrap;gap:8px 18px;align-items:center}.amadeus-cs-sep{width:1px;height:20px;background:var(--dsw-alias-border-l3);flex:none}.amadeus-cs-toggle{display:inline-flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;user-select:none;white-space:nowrap;color:var(--dsw-alias-label-primary)}.amadeus-cs-toggle input{position:absolute;opacity:0;width:0;height:0}.amadeus-cs-switch{width:38px;height:22px;border-radius:999px;background:var(--dsw-alias-border-l3);transition:background .18s ease;position:relative;flex:none}.amadeus-cs-switch::after{content:\"\";position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:var(--dsw-alias-bg-base);transition:transform .18s ease;box-shadow:0 1px 3px rgba(0,0,0,.35)}.amadeus-cs-toggle input:checked + .amadeus-cs-switch{background:var(--dsw-alias-state-business-primary)}.amadeus-cs-toggle input:checked + .amadeus-cs-switch::after{transform:translateX(16px)}.amadeus-cs-toggle input:disabled + .amadeus-cs-switch{opacity:.5}.amadeus-cs-select{appearance:none;padding:5px 26px 5px 10px;border-radius:8px;border:1px solid var(--dsw-alias-border-l3);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:12px;cursor:pointer}.amadeus-cs-select:disabled{opacity:.5;cursor:default}.amadeus-cs-note{margin-left:auto;font-size:12px;color:var(--dsw-alias-label-caption)}.amadeus-cs-note-error{color:#f38f9c}.amadeus-cs-tool{display:inline-flex;flex-wrap:wrap;align-items:center;gap:10px 14px}.amadeus-cs-color{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--dsw-alias-label-primary)}.amadeus-cs-color input[type=color]{width:30px;height:22px;padding:0;border:1px solid var(--dsw-alias-border-l3);border-radius:6px;background:transparent;cursor:pointer}.amadeus-cs-range{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--dsw-alias-label-primary)}.amadeus-cs-range input[type=range]{width:110px;accent-color:var(--dsw-alias-state-business-primary)}.amadeus-audio{display:flex;flex-direction:column;gap:10px;margin:0 0 14px;padding:14px 16px;border:1px solid var(--dsw-alias-border-l3);border-radius:12px;background:var(--dsw-alias-bg-base)}.amadeus-audio-row{display:flex;flex-wrap:wrap;gap:8px 16px;align-items:center}.amadeus-audio-title{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--dsw-alias-label-caption)}.amadeus-audio-label{font-size:12px;color:var(--dsw-alias-label-caption);min-width:64px}.amadeus-audio-scale{flex:1;min-width:120px;accent-color:var(--dsw-alias-state-business-primary)}.amadeus-audio-val{font-size:12px;color:var(--dsw-alias-label-primary);min-width:42px;text-align:right}.amadeus-audio-btn{padding:6px 12px;border-radius:8px;border:1px solid var(--dsw-alias-border-l3);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:12px;cursor:pointer}.amadeus-audio-btn:hover{background:var(--dsw-alias-interactive-bg-hover)}.amadeus-audio-btn.recording{background:#f43146;color:#fff;border-color:transparent}.amadeus-audio-level{flex:1;min-width:100px;height:6px;border-radius:999px;background:var(--dsw-alias-border-l3);overflow:hidden}.amadeus-audio-level i{display:block;height:100%;width:0;background:var(--dsw-alias-state-business-primary);transition:width .08s linear}.amadeus-audio-file{display:none}.amadeus-audio-note{font-size:12px;color:var(--dsw-alias-label-caption)}.amadeus-audio-note-error{color:#f38f9c}.amadeus-ptt{min-width:140px;padding:12px 18px;border-radius:999px;border:1px solid var(--dsw-alias-border-l3);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:13px;cursor:pointer;user-select:none;touch-action:none}.amadeus-ptt:active,.amadeus-ptt.recording{background:var(--dsw-alias-state-business-primary);color:#fff}";
        document.head.appendChild(tag);
      }
      try { ctx.inject(["remote", "remote.session", "remote.workspace"], function (c) { companionChat.remote = c.remote; setTimeout(function () { ensureCompanionChat(); }, 4000); }); } catch (e) { clog("inject remote: " + e); }   // her Workspace and chat appear in the sidebar
      try { ctx.inject(["uiWorkspace"], function (c) { companionChat.ui = c.uiWorkspace; }); } catch (e) { clog("inject uiWorkspace: " + e); }
      ctx.slots.inject("settings.section", function () {
        return ctx.slots.register({ name: "settings.section", id: "live2d", order: 88, label: function () { return "live2D"; } }, Live2DPage);
      });
    }
    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  }
});
