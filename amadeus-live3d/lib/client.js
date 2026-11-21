window.__ModuleLoader__.load({
  id: "amadeus-live3d",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
    var react = require("react");
    var jsx = react.createElement;

    var CSS = ".amadeus-characters{flex-direction:column;gap:12px;width:100%;display:flex;padding:8px 0}.amadeus-characters-toolbar{display:flex;gap:8px;align-items:center}.amadeus-characters-search{flex:1;min-width:0;box-sizing:border-box;height:34px;padding:0 12px;border-radius:8px;border:1px solid var(--dsw-alias-border-l3);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:14px}.amadeus-characters-search:focus{outline:none;border-color:var(--dsw-alias-state-business-primary)}.amadeus-characters-add{flex:none;height:34px;padding:0 14px;border-radius:8px;border:1px solid transparent;background:var(--dsw-alias-state-business-primary);color:#fff;font:inherit;font-size:14px;cursor:pointer}.amadeus-characters-add:disabled{opacity:.5;cursor:default}.amadeus-characters-note{font-size:13px;line-height:18px;color:var(--dsw-alias-label-caption)}.amadeus-characters-note-error{color:var(--dsw-alias-state-danger,var(--dsw-alias-label-caption))}.amadeus-characters-empty{font-size:14px;line-height:20px;color:var(--dsw-alias-label-tertiary);padding:16px 0}.amadeus-characters-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}.amadeus-character-card{position:relative;box-sizing:border-box;display:flex;flex-direction:column;border-radius:12px;border:1px solid var(--dsw-alias-border-l3);background:transparent;overflow:hidden;cursor:pointer;padding:0;text-align:left;font:inherit;color:var(--dsw-alias-label-primary);transition:border-color .12s,background .12s}.amadeus-character-card:hover{background:var(--dsw-alias-interactive-bg-hover)}.amadeus-character-card-active{border-color:var(--dsw-alias-state-business-primary);box-shadow:0 0 0 1px var(--dsw-alias-state-business-primary)}.amadeus-character-preview{position:relative;display:block;width:100%;aspect-ratio:1;background:linear-gradient(135deg,var(--dsw-alias-interactive-bg-hover),var(--dsw-alias-bg-base));overflow:hidden}.amadeus-character-preview img{width:100%;height:100%;object-fit:cover;display:block}.amadeus-character-preview-empty{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:42px;font-weight:600;color:var(--dsw-alias-label-caption)}.amadeus-character-badge{position:absolute;top:8px;right:8px;min-width:22px;height:22px;padding:0 5px;border-radius:11px;background:var(--dsw-alias-state-business-primary);color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700}.amadeus-character-remove{position:absolute;top:8px;left:8px;width:24px;height:24px;border-radius:6px;border:none;background:rgba(0,0,0,.45);color:#fff;font-size:16px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .12s}.amadeus-character-card:hover .amadeus-character-remove{opacity:1}.amadeus-character-remove:hover{background:rgba(0,0,0,.65)}.amadeus-character-body{display:flex;flex-direction:column;gap:2px;padding:10px 12px 12px}.amadeus-character-name{font-size:14px;line-height:20px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.amadeus-character-summary{font-size:12px;line-height:16px;color:var(--dsw-alias-label-tertiary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.amadeus-interface{display:flex;flex-direction:column;gap:16px;width:100%;padding:4px 0}.amadeus-interface-card{display:flex;flex-direction:column;gap:14px;border:1px solid var(--dsw-alias-border-l3);border-radius:18px;padding:18px}.amadeus-interface-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px}.amadeus-interface-head h3{margin:0;font-size:15px;font-weight:600;line-height:22px}.amadeus-interface-head p{margin:2px 0 0;font-size:13px;line-height:18px;color:var(--dsw-alias-label-caption)}.amadeus-interface-reset{flex:none;height:32px;padding:0 14px;border-radius:999px;border:1px solid var(--dsw-alias-border-l3);background:transparent;color:var(--dsw-alias-label-primary);font:inherit;font-size:13px;cursor:pointer;transition:background .14s}.amadeus-interface-reset:hover{background:var(--dsw-alias-interactive-bg-hover)}.amadeus-interface-hero{display:flex;align-items:center;gap:24px;padding:22px;border:1px solid var(--dsw-alias-border-l3);border-radius:18px;background:radial-gradient(130% 160% at 18% 0%,var(--dsw-alias-interactive-bg-hover,#ffffff08),transparent 55%)}.amadeus-interface-preview{flex:none;width:148px;height:148px;display:flex;align-items:center;justify-content:center}.amadeus-interface-hero-side{flex:1;min-width:0;display:flex;flex-direction:column;gap:12px}.amadeus-interface-hero-title{font-size:15px;font-weight:600;line-height:22px}.amadeus-interface-hero-sub{font-size:13px;line-height:18px;color:var(--dsw-alias-label-tertiary)}.amadeus-interface-states{display:flex;flex-wrap:wrap;gap:8px}.amadeus-interface-state-chip{display:inline-flex;align-items:center;gap:8px;height:34px;padding:0 14px;border-radius:999px;border:1px solid var(--dsw-alias-border-l3);background:transparent;color:var(--dsw-alias-label-secondary);font:inherit;font-size:13px;cursor:pointer;transition:border-color .14s,color .14s,background .14s}.amadeus-interface-state-chip:hover{background:var(--dsw-alias-interactive-bg-hover)}.amadeus-interface-state-chip-active{border-color:var(--dsw-alias-state-business-primary);background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary);font-weight:600}.amadeus-interface-state-chip-dot{flex:none;width:10px;height:10px;border-radius:50%}.amadeus-interface-editor{display:flex;flex-direction:column;gap:16px;padding:18px;border:1px solid var(--dsw-alias-border-l3);border-radius:18px}.amadeus-interface-editor-head{display:flex;justify-content:space-between;align-items:center;gap:12px}.amadeus-interface-editor-title{font-size:15px;font-weight:600;line-height:22px}.amadeus-interface-fields{display:flex;flex-direction:column;gap:14px}.amadeus-interface-field{display:flex;align-items:center;gap:14px;min-width:0}.amadeus-interface-field-label{flex:none;width:88px;font-size:13px;line-height:18px;color:var(--dsw-alias-label-secondary)}.amadeus-interface-field-control{flex:1;min-width:0}.amadeus-interface-field-control select{width:100%;box-sizing:border-box;height:38px;padding:0 14px;border-radius:10px;border:1px solid var(--dsw-alias-border-l3);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:14px}.amadeus-interface-field-control select:focus{outline:none;border-color:var(--dsw-alias-state-business-primary)}.amadeus-interface-colorfield{display:flex;align-items:center;gap:10px}.amadeus-interface-gradient{flex:1;min-width:0;height:38px;border-radius:10px;border:1px solid var(--dsw-alias-border-l2);overflow:hidden;display:flex}.amadeus-interface-gradient>span{flex:1}.amadeus-interface-colorfield input[type=color]{flex:none;width:42px;height:38px;padding:2px;border:1px solid var(--dsw-alias-border-l3);border-radius:10px;background:var(--dsw-alias-bg-base);cursor:pointer}.amadeus-interface-swatches{display:flex;flex-wrap:wrap;gap:10px;align-items:center}.amadeus-interface-accent-swatch{width:38px;height:38px;border-radius:50%;border:2px solid transparent;cursor:pointer;padding:0;display:inline-flex;align-items:center;justify-content:center;color:#151517;font-size:16px;font-weight:700;transition:transform .12s}.amadeus-interface-accent-swatch:hover{transform:scale(1.1)}.amadeus-interface-accent-swatch-active{border-color:var(--dsw-alias-label-primary)}.amadeus-interface-color{display:flex;align-items:center;gap:10px;font-size:13px;color:var(--dsw-alias-label-primary)}.amadeus-interface-color input[type=color]{width:42px;height:32px;padding:2px;border:1px solid var(--dsw-alias-border-l3);border-radius:8px;background:var(--dsw-alias-bg-base);cursor:pointer}.amadeus-interface-select{display:flex;align-items:center;gap:10px;font-size:13px;color:var(--dsw-alias-label-primary)}.amadeus-interface-select select{flex:1;min-width:0;box-sizing:border-box;height:38px;padding:0 14px;border-radius:10px;border:1px solid var(--dsw-alias-border-l3);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:14px}";
    var ACTIONS_CSS = ".amadeus-character-actions{display:flex;flex-direction:column;gap:6px;padding:10px 12px;border-top:1px solid var(--dsw-alias-border-l3)}.amadeus-character-actions-title{font-size:11px;line-height:14px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--dsw-alias-label-caption)}.amadeus-character-actions-grid{display:flex;flex-wrap:wrap;gap:6px}.amadeus-character-action{height:26px;padding:0 10px;border-radius:7px;border:1px solid var(--dsw-alias-border-l3);background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary);font:inherit;font-size:12px;line-height:24px;cursor:pointer;white-space:nowrap}.amadeus-character-action:hover{border-color:var(--dsw-alias-state-business-primary)}.amadeus-character-action-emotion{color:var(--dsw-alias-state-business-primary)}.amadeus-character-action-reset{border-color:transparent;background:var(--dsw-alias-state-business-primary);color:#fff}.amadeus-character-actions-empty{font-size:12px;line-height:16px;color:var(--dsw-alias-label-tertiary)}.amadeus-interface-themes{flex-wrap:wrap}.amadeus-interface-theme{display:flex;flex-direction:column;align-items:center;gap:4px}.amadeus-interface-theme-swatch{position:relative;width:44px;height:44px;border-radius:10px;border:2px solid var(--dsw-alias-border-l3);cursor:pointer;padding:0;overflow:hidden;flex:none}.amadeus-interface-theme-swatch-active{border-color:var(--dsw-alias-state-business-primary);box-shadow:0 0 0 1px var(--dsw-alias-state-business-primary)}.amadeus-interface-theme-swatch span{position:absolute;right:5px;bottom:5px;width:12px;height:12px;border-radius:50%;display:block;box-shadow:0 0 0 1px #00000040}.amadeus-interface-theme-name{font-size:11px;line-height:14px;color:var(--dsw-alias-label-caption)}.amadeus-interface-palette-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.amadeus-interface-font-size{display:flex;align-items:center;gap:12px;padding:12px 16px;border-top:1px solid var(--dsw-alias-border-l3)}.amadeus-interface-font-size>span{flex:none;font-size:13px;color:var(--dsw-alias-label-primary)}.amadeus-interface-font-size input[type=range]{flex:1;min-width:0;accent-color:var(--dsw-alias-state-business-primary,#7aaaff)}.amadeus-interface-font-size input[type=number]{flex:none;width:56px;height:32px;padding:0 8px;border-radius:8px;border:1px solid var(--dsw-alias-border-l3);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font:inherit;font-size:14px;text-align:center}";
    var AUI_CSS = ".aui-page{--aui-accent:var(--dsw-alias-state-business-primary,#8b7cf6);--aui-line:var(--dsw-alias-border-l3,#ffffff1f);--aui-text:var(--dsw-alias-label-primary,#ededf0);--aui-muted:var(--dsw-alias-label-caption,#9a98a3);--aui-hover:var(--dsw-alias-interactive-bg-hover,#ffffff0d);--aui-bg:var(--dsw-alias-bg-base,transparent);display:flex;flex-direction:column;gap:16px;width:100%;max-width:880px;padding:4px 0 24px;color:var(--aui-text);font-size:14px}.aui-stack{display:flex;flex-direction:column;gap:16px}.aui-hero{display:flex;align-items:center;gap:16px;padding:18px 20px;border:1px solid var(--aui-line);border-radius:16px;background:radial-gradient(120% 180% at 0% 0%,color-mix(in srgb,var(--aui-accent) 16%,transparent),transparent 60%)}.aui-hero-icon{flex:none;display:flex;align-items:center;justify-content:center;width:48px;height:48px;border-radius:14px;background:color-mix(in srgb,var(--aui-accent) 18%,transparent);color:var(--aui-accent);font-weight:700;font-size:15px;letter-spacing:.02em;overflow:hidden}.aui-hero-text{display:flex;flex-direction:column;gap:3px;min-width:0}.aui-hero-title{display:flex;align-items:center;flex-wrap:wrap;gap:10px;font-size:17px;font-weight:600;line-height:24px}.aui-hero-sub{font-size:13px;line-height:18px;color:var(--aui-muted);overflow:hidden;text-overflow:ellipsis}.aui-pill{display:inline-flex;align-items:center;gap:6px;height:22px;padding:0 10px;border-radius:999px;border:1px solid var(--aui-line);font-size:12px;font-weight:500;color:var(--aui-muted)}.aui-pill-on{border-color:transparent;background:color-mix(in srgb,#3ccf8e 16%,transparent);color:#3ccf8e}.aui-pill-on::before{content:\"\";width:6px;height:6px;border-radius:50%;background:currentColor}.aui-tabs{position:sticky;top:0;z-index:2;display:flex;gap:4px;padding:4px;border:1px solid var(--aui-line);border-radius:12px;background:var(--aui-bg);overflow-x:auto;scrollbar-width:none}.aui-tab{flex:1 0 auto;height:34px;padding:0 16px;border:none;border-radius:9px;background:transparent;color:var(--aui-muted);font:inherit;font-size:13px;font-weight:500;cursor:pointer;white-space:nowrap;transition:background .15s,color .15s}.aui-tab:hover{background:var(--aui-hover);color:var(--aui-text)}.aui-tab-active,.aui-tab-active:hover{background:color-mix(in srgb,var(--aui-accent) 18%,transparent);color:var(--aui-text);font-weight:600}.aui-card{display:flex;flex-direction:column;border:1px solid var(--aui-line);border-radius:14px;overflow:hidden}.aui-card-head{padding:16px 18px 10px}.aui-card-head h3{margin:0;font-size:15px;font-weight:600;line-height:22px}.aui-card-head p{margin:2px 0 0;font-size:13px;line-height:18px;color:var(--aui-muted)}.aui-card-body{display:flex;flex-direction:column;padding:0 18px 6px}.aui-row{display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:52px;padding:10px 0;border-top:1px solid var(--aui-line)}.aui-card-body>.aui-row:first-child{border-top:none}.aui-row-disabled{opacity:.45;pointer-events:none}.aui-row-text{display:flex;flex-direction:column;gap:2px;min-width:0}.aui-row-label{font-size:14px;line-height:20px}.aui-row-hint{font-size:12px;line-height:16px;color:var(--aui-muted)}.aui-row-control{flex:none;display:flex;align-items:center;justify-content:flex-end;gap:10px;max-width:60%}.aui-switch{position:relative;display:inline-flex;cursor:pointer}.aui-switch input{position:absolute;opacity:0;width:0;height:0}.aui-switch-track{position:relative;width:40px;height:24px;border-radius:999px;background:var(--aui-line);transition:background .18s}.aui-switch-track::after{content:\"\";position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;box-shadow:0 1px 3px #00000059;transition:transform .18s}.aui-switch input:checked+.aui-switch-track{background:var(--aui-accent)}.aui-switch input:checked+.aui-switch-track::after{transform:translateX(16px)}.aui-switch input:focus-visible+.aui-switch-track{outline:2px solid var(--aui-accent);outline-offset:2px}.aui-switch input:disabled+.aui-switch-track{opacity:.5}.aui-select{min-width:180px;max-width:100%;height:34px;padding:0 12px;border-radius:9px;border:1px solid var(--aui-line);background:var(--aui-bg);color:var(--aui-text);font:inherit;font-size:13px;cursor:pointer;text-overflow:ellipsis}.aui-select:focus{outline:none;border-color:var(--aui-accent)}.aui-select:disabled{opacity:.5;cursor:default}.aui-range{display:flex;align-items:center;gap:10px}.aui-range input{width:160px;accent-color:var(--aui-accent)}.aui-range-val{min-width:44px;text-align:right;font-variant-numeric:tabular-nums;font-size:13px;color:var(--aui-muted)}.aui-color{width:40px;height:30px;padding:2px;border:1px solid var(--aui-line);border-radius:8px;background:var(--aui-bg);cursor:pointer}.aui-seg{display:inline-flex;gap:2px;padding:3px;border:1px solid var(--aui-line);border-radius:10px}.aui-seg-btn{height:28px;padding:0 12px;border:none;border-radius:7px;background:transparent;color:var(--aui-muted);font:inherit;font-size:13px;cursor:pointer;font-variant-numeric:tabular-nums}.aui-seg-btn:hover:not(:disabled){color:var(--aui-text);background:var(--aui-hover)}.aui-seg-btn-active,.aui-seg-btn-active:hover:not(:disabled){background:var(--aui-accent);color:#fff}.aui-seg-btn:disabled{cursor:default}.aui-btn{height:34px;padding:0 14px;border-radius:9px;border:1px solid var(--aui-line);background:transparent;color:var(--aui-text);font:inherit;font-size:13px;cursor:pointer;white-space:nowrap;transition:background .15s}.aui-btn:hover{background:var(--aui-hover)}.aui-btn-primary{border-color:transparent;background:var(--aui-accent);color:#fff}.aui-btn-primary:hover{background:color-mix(in srgb,var(--aui-accent) 85%,#fff)}.aui-btn-danger{border-color:transparent;background:#f43f5e;color:#fff}.aui-btn:disabled{opacity:.5;cursor:default}.aui-inline{display:flex;align-items:center;gap:10px}.aui-level{width:120px;height:6px;border-radius:999px;background:var(--aui-line);overflow:hidden}.aui-level i{display:block;height:100%;width:0;background:var(--aui-accent);transition:width .08s linear}.aui-ptt-wrap{padding:4px 0 12px}.aui-ptt{width:100%;height:46px;border-radius:12px;border:1px dashed var(--aui-line);background:transparent;color:var(--aui-text);font:inherit;font-size:14px;cursor:pointer;user-select:none;touch-action:none;transition:background .15s}.aui-ptt:hover{background:var(--aui-hover)}.aui-ptt-on{border-style:solid;border-color:transparent;background:var(--aui-accent);color:#fff}.aui-hidden{display:none}.aui-note{margin:0 18px 14px;padding:8px 12px;border-radius:9px;background:var(--aui-hover);font-size:13px;line-height:18px;color:var(--aui-muted)}.aui-note-error{background:color-mix(in srgb,#f43f5e 12%,transparent);color:#f38f9c}.aui-choices{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;padding:6px 0 14px}.aui-choice{display:flex;flex-direction:column;align-items:flex-start;gap:4px;padding:12px;border:1px solid var(--aui-line);border-radius:12px;background:transparent;color:var(--aui-text);font:inherit;text-align:left;cursor:pointer;transition:border-color .15s,background .15s}.aui-choice:hover:not(:disabled){background:var(--aui-hover)}.aui-choice-active{border-color:var(--aui-accent);box-shadow:0 0 0 1px var(--aui-accent);background:color-mix(in srgb,var(--aui-accent) 8%,transparent)}.aui-choice:disabled{cursor:default}.aui-choice-title{font-size:14px;font-weight:600;line-height:20px}.aui-choice-sub{font-size:12px;line-height:16px;color:var(--aui-muted)}.aui-choice-art{display:flex;align-items:center;gap:10px;width:100%;height:64px;margin-bottom:6px;padding:0 12px;box-sizing:border-box;border-radius:10px;background:#1c1a24}.aui-choice-art-orb{justify-content:center}.aui-mini-orb{flex:none;display:block;width:30px;height:30px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#d9cfff,#9a83f0 45%,#5d4bb3 75%,transparent 76%);box-shadow:0 0 14px #9a83f080}.aui-choice-art-orb .aui-mini-orb{width:38px;height:38px}.aui-mini-lines{display:flex;flex-direction:column;gap:5px;flex:1}.aui-mini-lines b{display:block;height:5px;border-radius:3px;background:#ffffff38}.aui-mini-lines b:nth-child(2){width:80%}.aui-mini-lines b:nth-child(3){width:55%}.aui-split{display:grid;grid-template-columns:minmax(0,1fr) 260px;gap:20px;align-items:center;padding-bottom:12px}.aui-split-rows{display:flex;flex-direction:column}.aui-split-rows>.aui-row:first-child{border-top:none}.aui-bubble-preview{display:flex;align-items:center;justify-content:center;padding:16px;border-radius:12px;background:repeating-conic-gradient(#ffffff08 0 25%,transparent 0 50%) 0 0/16px 16px}.aui-bubble-sample{width:100%;padding:12px 14px;border-radius:16px;border:1px solid #b5a3f563;box-sizing:border-box}.aui-bubble-sample-head{display:flex;align-items:center;gap:10px;margin-bottom:8px}.aui-bubble-sample-cap{font-size:9px;font-weight:700;letter-spacing:.16em;opacity:.65}.aui-bubble-sample-status{font-size:13px;font-weight:700;color:#bf9bff}.aui-bubble-sample-text{line-height:1.45;max-height:90px;overflow:hidden}@media (max-width:640px){.aui-row{flex-direction:column;align-items:stretch;gap:8px}.aui-row-control{max-width:none;justify-content:flex-start}.aui-choices,.aui-split{grid-template-columns:1fr}.aui-range input{flex:1;width:auto}}.aui-page .amadeus-characters{padding:0}.aui-page .amadeus-characters-search,.aui-page .amadeus-characters-add{height:36px;border-radius:10px}.aui-page .amadeus-characters-grid{grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:14px}.aui-page .amadeus-character-card{border-radius:14px}.aui-card-head-row{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.aui-orb-hero{align-items:center;gap:22px}.aui-orb-stage{flex:none;display:flex;align-items:center;justify-content:center;width:150px;height:150px;border-radius:18px;background:radial-gradient(circle at 50% 45%,#ffffff0d,transparent 70%),#16151b}.aui-orb-hero .aui-hero-text{gap:8px}.aui-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}.aui-chip{display:inline-flex;align-items:center;gap:7px;height:30px;padding:0 12px;border-radius:999px;border:1px solid var(--aui-line);background:transparent;color:var(--aui-muted);font:inherit;font-size:12.5px;cursor:pointer;transition:background .15s,color .15s,border-color .15s}.aui-chip:hover{background:var(--aui-hover);color:var(--aui-text)}.aui-chip-active,.aui-chip-active:hover{border-color:var(--aui-accent);background:color-mix(in srgb,var(--aui-accent) 14%,transparent);color:var(--aui-text);font-weight:600}.aui-chip-dot{flex:none;width:9px;height:9px;border-radius:50%;box-shadow:0 0 0 2px #00000026}.aui-gradient{display:flex;width:120px;height:30px;border-radius:8px;overflow:hidden;border:1px solid var(--aui-line)}.aui-gradient>span{flex:1}.aui-toolbar{display:flex;gap:8px;align-items:center}.aui-search{flex:1;min-width:0;height:36px;padding:0 12px;border-radius:10px;border:1px solid var(--aui-line);background:var(--aui-bg);color:var(--aui-text);font:inherit;font-size:14px}.aui-search:focus{outline:none;border-color:var(--aui-accent)}@media (max-width:640px){.aui-orb-hero{flex-direction:column;align-items:flex-start}}.aui-card-pad{padding:0 18px 18px}.aui-row-text{flex:1 1 140px}.aui-split-rows .aui-row{flex-wrap:wrap;gap:8px 16px}.aui-split-rows .aui-row-control{max-width:none}.aui-range input{width:140px}.aui-split{grid-template-columns:minmax(220px,1fr) auto;align-items:start}.aui-live-preview{display:flex;flex-direction:column;align-items:center;gap:12px}.aui-live-stage{display:flex;align-items:center;justify-content:center;width:360px;max-width:100%;height:320px;border-radius:12px;background:repeating-conic-gradient(#ffffff0a 0 25%,transparent 0 50%) 0 0/16px 16px,#141318;overflow:hidden}.aui-live-frame{display:block;border:0;background:transparent;color-scheme:normal}.aui-live-phases{flex-wrap:wrap;justify-content:center}@media (max-width:900px){.aui-split{grid-template-columns:1fr}.aui-live-preview{order:-1}}.aui-note-inline{margin:0 0 12px}.aui-empty{padding:28px 12px;border:1px dashed var(--aui-line);border-radius:12px;text-align:center;font-size:13px;line-height:19px;color:var(--aui-muted)}.aui-empty-tight{margin:0 18px 18px;padding:14px}.aui-gallery-search{width:100%;box-sizing:border-box;margin-bottom:14px}.aui-gallery{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px}.aui-model{position:relative;display:block;aspect-ratio:3/4;border-radius:14px;overflow:hidden;cursor:pointer;background:linear-gradient(160deg,color-mix(in srgb,var(--aui-accent) 14%,#1b1a21),#141318);border:1px solid var(--aui-line);outline:none;transition:transform .16s ease,box-shadow .16s ease,border-color .16s}.aui-model:hover{transform:translateY(-3px);box-shadow:0 10px 24px #00000052}.aui-model:focus-visible{box-shadow:0 0 0 2px var(--aui-accent)}.aui-model-active{border-color:var(--aui-accent);box-shadow:0 0 0 2px var(--aui-accent),0 10px 28px color-mix(in srgb,var(--aui-accent) 30%,transparent);cursor:default}.aui-model-active:hover{transform:none}.aui-model-art{position:absolute;inset:0;display:block}.aui-model-art img{width:100%;height:100%;object-fit:cover;object-position:top center;display:block;transition:transform .3s ease}.aui-model:hover .aui-model-art img{transform:scale(1.04)}.aui-model-art .amadeus-character-preview-empty{display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:44px;font-weight:700;color:#ffffff40}.aui-model-meta{position:absolute;left:0;right:0;bottom:0;display:flex;flex-direction:column;gap:2px;padding:34px 12px 11px;background:linear-gradient(to top,#000000d9,#00000080 55%,transparent);color:#fff}.aui-model-name{font-size:14px;font-weight:600;line-height:19px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.aui-model-sub{font-size:11.5px;line-height:15px;color:#ffffffb3;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.aui-model-flag{position:absolute;top:8px;left:8px;display:inline-flex;align-items:center;gap:5px;height:22px;padding:0 9px;border-radius:999px;background:var(--aui-accent);color:#fff;font-size:11px;font-weight:600;box-shadow:0 2px 8px #0000004d}.aui-model-flag::before{content:\"\";width:6px;height:6px;border-radius:50%;background:#fff}.aui-model-remove{position:absolute;top:8px;right:8px;width:26px;height:26px;border:none;border-radius:8px;background:#00000080;color:#fff;font-size:17px;line-height:1;cursor:pointer;opacity:0;transition:opacity .15s,background .15s;backdrop-filter:blur(4px)}.aui-model:hover .aui-model-remove,.aui-model:focus-within .aui-model-remove{opacity:1}.aui-model-remove:hover{background:#f43f5e}.aui-model-skeleton{cursor:default;animation:aui-pulse 1.4s ease-in-out infinite}@keyframes aui-pulse{50%{opacity:.5}}.aui-active-head{display:flex;align-items:center;gap:14px;padding:16px 18px}.aui-active-thumb{flex:none;width:56px;height:56px;border-radius:12px;overflow:hidden;background:#1b1a21}.aui-active-thumb img{width:100%;height:100%;object-fit:cover;object-position:top center;display:block}.aui-active-thumb .amadeus-character-preview-empty{display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:22px;font-weight:700;color:#ffffff59}.aui-active-head .aui-hero-text{flex:1}.aui-active-name{font-size:16px;font-weight:600;line-height:22px}.aui-actions{display:flex;flex-direction:column;gap:10px;padding:0 18px 16px}.aui-action-row{display:flex;align-items:flex-start;gap:12px;padding-top:10px;border-top:1px solid var(--aui-line)}.aui-action-label{flex:none;width:96px;padding-top:6px;font-size:12px;color:var(--aui-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.aui-action-chips{display:flex;flex-wrap:wrap;gap:6px;min-width:0}.aui-action{height:28px;padding:0 11px;border-radius:999px;border:1px solid var(--aui-line);background:transparent;color:var(--aui-text);font:inherit;font-size:12.5px;cursor:pointer;white-space:nowrap;transition:background .15s,border-color .15s}.aui-action:hover:not(:disabled){border-color:var(--aui-accent);background:color-mix(in srgb,var(--aui-accent) 12%,transparent)}.aui-action-emotion{color:color-mix(in srgb,var(--aui-accent) 70%,var(--aui-text))}.aui-action:disabled{opacity:.5;cursor:default}@media (max-width:640px){.aui-action-row{flex-direction:column;gap:6px}.aui-action-label{width:auto;padding:0}}.aui-hide-range{width:140px;accent-color:var(--aui-accent)}.aui-num{display:inline-flex;align-items:center;gap:6px;font-size:13px;color:var(--aui-muted)}.aui-num input{width:64px;height:30px;padding:0 8px;box-sizing:border-box;border-radius:8px;border:1px solid var(--aui-line);background:var(--aui-bg);color:var(--aui-text);font:inherit;font-size:13px;text-align:center;font-variant-numeric:tabular-nums}.aui-num input:focus{outline:none;border-color:var(--aui-accent)}.aui-drop{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;min-height:150px;padding:20px;border:1.5px dashed color-mix(in srgb,var(--aui-accent) 45%,var(--aui-line));border-radius:14px;background:color-mix(in srgb,var(--aui-accent) 5%,transparent);text-align:center;transition:background .15s,border-color .15s}.aui-drop-over{border-color:var(--aui-accent);background:color-mix(in srgb,var(--aui-accent) 14%,transparent)}.aui-drop-busy{flex-direction:row;gap:12px;font-size:13px;color:var(--aui-muted)}.aui-drop-icon{font-size:26px;line-height:1;color:var(--aui-accent)}.aui-drop-title{font-size:15px;font-weight:600}.aui-drop-or{font-size:12px;color:var(--aui-muted)}.aui-spinner{width:18px;height:18px;border-radius:50%;border:2px solid var(--aui-line);border-top-color:var(--aui-accent);animation:aui-spin .8s linear infinite;flex:none}@keyframes aui-spin{to{transform:rotate(360deg)}}.aui-results{display:flex;flex-direction:column;gap:6px;margin-top:12px}.aui-results-group{display:flex;flex-direction:column;gap:6px}.aui-result{display:flex;flex-wrap:wrap;align-items:baseline;gap:4px 10px;padding:9px 12px;border-radius:10px;background:var(--aui-hover);font-size:13px;line-height:18px}.aui-result b{font-weight:600}.aui-result span{color:var(--aui-muted)}.aui-result-ok{background:color-mix(in srgb,#3ccf8e 12%,transparent)}.aui-result-ok b{color:#3ccf8e}.aui-result-err{background:color-mix(in srgb,#f43f5e 10%,transparent)}.aui-result-err b{color:#f38f9c}.aui-downloads{display:flex;flex-direction:column;margin-top:16px}.aui-downloads-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-bottom:8px;font-size:12px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--aui-muted)}.aui-link{border:none;background:none;padding:0;color:var(--aui-accent);font:inherit;font-size:12px;font-weight:500;text-transform:none;letter-spacing:0;cursor:pointer}.aui-link:hover{text-decoration:underline}.aui-dl{display:flex;align-items:center;gap:10px;padding:9px 0;border-top:1px solid var(--aui-line)}.aui-dl-text{display:flex;flex-direction:column;gap:1px;flex:1;min-width:0}.aui-dl-name{font-size:13.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.aui-tag{flex:none;display:inline-flex;align-items:center;height:22px;padding:0 9px;border-radius:999px;font-size:11.5px;font-weight:600;white-space:nowrap}.aui-tag-ok{background:color-mix(in srgb,#3ccf8e 15%,transparent);color:#3ccf8e}.aui-tag-warn{background:color-mix(in srgb,#f1b76b 16%,transparent);color:#f1b76b}.aui-tag-off{background:var(--aui-hover);color:var(--aui-muted)}.aui-chip-input{height:28px;width:130px;padding:0 10px;border-radius:999px;border:1px dashed var(--aui-accent);background:transparent;color:var(--aui-text);font:inherit;font-size:12.5px}.aui-chip-input:focus{outline:none;border-style:solid;background:color-mix(in srgb,var(--aui-accent) 10%,transparent)}.aui-name-input{height:32px;max-width:100%;padding:0 10px;border-radius:9px;border:1px dashed var(--aui-accent);background:transparent;color:var(--aui-text);font:inherit;font-size:16px;font-weight:600}.aui-name-input:focus{outline:none;border-style:solid}.aui-edit-hint{padding:0 18px 10px}";

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

		function renderCharacterActions(model, runAction) {
			var actions = model.actions || { motions: [], expressions: [] };
			var groups = actions.motions || [];
			var expressions = actions.expressions || [];
			var buttons = [];
			groups.forEach(function (group) {
				(group.items || []).forEach(function (item) {
					buttons.push(jsx("button", {
						key: "motion-" + group.key + "-" + item.index,
						className: "amadeus-character-action",
						type: "button",
						title: (group.label || "Движение") + " · " + item.label,
						onClick: function () { runAction({ action: "play_motion", group: group.key, index: item.index }); },
						children: item.label
					}));
				});
			});
			expressions.forEach(function (expr) {
				buttons.push(jsx("button", {
					key: "expr-" + expr.name,
					className: "amadeus-character-action amadeus-character-action-emotion",
					type: "button",
					title: "Эмоция · " + expr.label,
					onClick: function () { runAction({ action: "set_expression", name: expr.name }); },
					children: expr.label
				}));
			});
			if (buttons.length === 0) {
				return jsx("div", { className: "amadeus-character-actions", onClick: function (event) { event.stopPropagation(); }, children: jsx("span", { className: "amadeus-character-actions-empty", children: "Для этого персонажа движений нет." }) });
			}
			buttons.push(jsx("button", {
				key: "reset",
				className: "amadeus-character-action amadeus-character-action-reset",
				type: "button",
				onClick: function () { runAction({ action: "return_to_idle" }); },
				children: "В исходное"
			}));
			return jsx("div", { className: "amadeus-character-actions", onClick: function (event) { event.stopPropagation(); }, children: [
				jsx("span", { className: "amadeus-character-actions-title", children: "Действия" }),
				jsx("div", { className: "amadeus-character-actions-grid", children: buttons })
			] });
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

		function CharactersSection() {
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
					setActiveId(typeof next === "string" ? next : id); setNote(null);
				}).catch(function () { setActiveId(""); setNote({ text: "Не удалось загрузить модель.", error: true }); }).finally(function () {
					setBusy(false);
				});
			};

			var applyImportResult = function (result) {
				if (result && result.ok) {
					var count = Array.isArray(result.models) ? result.models.length : 0;
					var text = count > 1 ? ("Добавлено персонажей: " + count + ".") : "Персонаж добавлен.";
					if (Array.isArray(result.errors) && result.errors.length) text += " " + result.errors.join(" ");
					setNote({ text: text });
					refresh();
				} else {
					setNote({ text: (result && result.error) || "Не удалось добавить персонажа.", error: true });
				}
			};

			var importModel = function () {
				var api = window.amadeusCharacters;
				if (!api || busy) return;
				setBusy(true);
				setNote(null);
				api.import().then(applyImportResult).catch(function () {
					setNote({ text: "Не удалось добавить персонажа.", error: true });
				}).finally(function () {
					setBusy(false);
				});
			};

			var importFolderModel = function () {
				var api = window.amadeusCharacters;
				if (!api || !api.importFolder || busy) return;
				setBusy(true);
				setNote(null);
				api.importFolder().then(applyImportResult).catch(function () {
					setNote({ text: "Не удалось добавить персонажа.", error: true });
				}).finally(function () {
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
				return jsx("div", { className: "amadeus-characters", children: jsx("div", { className: "amadeus-characters-empty", children: "Персонажи загружаются…" }) });
			}

			return jsx("div", { className: "amadeus-characters", children: [
				jsx("div", { className: "amadeus-characters-toolbar", children: [
					jsx("input", {
						className: "amadeus-characters-search",
						type: "text",
						placeholder: "Найти персонажа…",
						value: search,
						onChange: function (event) { setSearch(event.target.value); }
					}),
					jsx("button", {
						className: "amadeus-characters-add",
						type: "button",
						disabled: busy,
						onClick: importModel,
						children: "Добавить"
					}),
					jsx("button", {
						className: "amadeus-characters-add",
						type: "button",
						disabled: busy,
						onClick: importFolderModel,
						style: { background: "transparent", color: "var(--dsw-alias-state-business-primary)", border: "1px solid var(--dsw-alias-state-business-primary)" },
						children: "Добавить папку"
					})
				] }),
				note ? jsx("div", { className: "amadeus-characters-note" + (note.error ? " amadeus-characters-note-error" : ""), children: note.text }) : null,
				shown.length === 0 ? jsx("div", { className: "amadeus-characters-empty", children: models.length === 0 ? "Персонажей пока нет — нажми «Добавить», чтобы импортировать модель Live2D." : "Ничего не найдено." }) : jsx("div", { className: "amadeus-characters-grid", children: shown.map(function (model) {
					var active = model.id === activeId;
					return jsx("div", {
						key: model.id,
						className: "amadeus-character-card" + (active ? " amadeus-character-card-active" : ""),
						onClick: function () { select(model.id); },
						children: [
							jsx("span", { className: "amadeus-character-preview", children: [
								jsx(Preview, { src: model.preview, alt: model.name }),
								active ? jsx("span", { className: "amadeus-character-badge", children: "✓" }) : null
							] }),
							jsx("button", {
								className: "amadeus-character-remove",
								type: "button",
								title: "Удалить",
								onClick: function (event) { event.stopPropagation(); removeModel(model.id); },
								children: "×"
							}),
							jsx("span", { className: "amadeus-character-body", children: [
								jsx("span", { className: "amadeus-character-name", children: model.name }),
								jsx("span", { className: "amadeus-character-summary", children: summary(model) })
							] }),
							active ? renderCharacterActions(model, runAction) : null
						]
					});
				}) })
			] });
		}

		function Models3DSection(props) {
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

			var refresh = react.useCallback(function () {
				var api = window.amadeus3d;
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
				var api = window.amadeus3d;
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

			var importModel = function () {
				var api = window.amadeus3d;
				if (!api || !api.import || busy) return;
				setBusy(true);
				setNote(null);
				api.import().then(function (result) {
					if (result && result.ok) { setNote({ text: "3D модель добавлена." }); refresh(); }
					else if (result && result.canceled) { /* cancelled */ }
					else setNote({ text: (result && result.error) || "Не удалось загрузить 3D модель.", error: true });
				}).catch(function () {
					setNote({ text: "Не удалось загрузить 3D модель.", error: true });
				}).finally(function () {
					setBusy(false);
				});
			};

			var removeModel = function (id) {
				var api = window.amadeus3d;
				if (!api || busy) return;
				if (!window.confirm("Удалить эту 3D модель?")) return;
				setBusy(true);
				setNote(null);
				api.remove(id).then(function (result) {
					if (result && result.ok) { setNote({ text: "3D модель удалена." }); refresh(); }
					else setNote({ text: (result && result.error) || "Не удалось удалить 3D модель.", error: true });
				}).catch(function () {
					setNote({ text: "Не удалось удалить 3D модель.", error: true });
				}).finally(function () {
					setBusy(false);
				});
			};

			var query = search.trim().toLowerCase();
			var shown = query ? models.filter(function (model) {
				return String(model.name || "").toLowerCase().indexOf(query) !== -1;
			}) : models;

			if (!loaded) {
				return jsx("div", { className: "amadeus-characters", children: jsx("div", { className: "amadeus-characters-empty", children: "3D модели загружаются…" }) });
			}

			return jsx("div", { className: "amadeus-characters", children: [
				jsx("div", { className: "amadeus-characters-toolbar", children: [
					jsx("input", {
						className: "amadeus-characters-search",
						type: "text",
						placeholder: "Найти 3D модель…",
						value: search,
						onChange: function (event) { setSearch(event.target.value); }
					})
				] }),
				note ? jsx("div", { className: "amadeus-characters-note" + (note.error ? " amadeus-characters-note-error" : ""), children: note.text }) : null,
				shown.length === 0 ? jsx("div", { className: "amadeus-characters-empty", children: models.length === 0 ? "3D моделей пока нет — положите файл .glb / .gltf / .vrm / .fbx / .obj в папку companion/models." : "Ничего не найдено." }) : jsx("div", { className: "amadeus-characters-grid", children: shown.map(function (model) {
					var active = model.id === activeId;
					return jsx("div", {
						key: model.id,
						className: "amadeus-character-card" + (active ? " amadeus-character-card-active" : ""),
						onClick: function () { select(model.id); },
						children: [
							jsx("span", { className: "amadeus-character-preview", children: [
								jsx("span", { className: "amadeus-character-preview-empty", children: "3D" }),
								active ? jsx("span", { className: "amadeus-character-badge", children: "✓" }) : null
							] }),
							jsx("button", {
								className: "amadeus-character-remove",
								type: "button",
								title: "Удалить",
								onClick: function (event) { event.stopPropagation(); removeModel(model.id); },
								children: "×"
							}),
							jsx("span", { className: "amadeus-character-body", children: [
								jsx("span", { className: "amadeus-character-name", children: model.name }),
								jsx("span", { className: "amadeus-character-summary", children: model.description || "3D модель" })
							] }),
							active ? jsx("div", { className: "amadeus-character-actions", onClick: function (event) { event.stopPropagation(); }, children: [
								jsx("span", { className: "amadeus-character-actions-title", children: "3D" }),
								jsx("div", { className: "amadeus-character-actions-grid", children: [
									jsx("button", { key: "load3d", className: "amadeus-character-action amadeus-character-action-reset", type: "button", onClick: function () { select(model.id); }, children: "Показать на экране" })
								] })
							] }) : null
						]
					});
				}) })
			] });
		}




function Live3DPage() {
  var activeState = react.useState(null);
  var active = activeState[0], setActive = activeState[1];
  var refresh = function () {
    fetch("/amadeus-live3d/active").then(function (r) { return r.json(); }).then(function (d) { setActive((d && d.active) || ""); }).catch(function () { setActive(""); });
  };
  react.useEffect(refresh, []);
  var pill = active === null ? null : active ? jsx("span", { className: "aui-pill aui-pill-on", children: "На экране" }) : jsx("span", { className: "aui-pill", children: "Модель не выбрана" });
  return jsx("div", { className: "aui-page", children: [
    jsx("div", { className: "aui-hero", children: [
      jsx("div", { className: "aui-hero-icon", children: "3D" }),
      jsx("div", { className: "aui-hero-text", children: [
        jsx("div", { className: "aui-hero-title", children: ["3D-персонаж", pill] }),
        jsx("div", { className: "aui-hero-sub", children: active ? "Активная модель: " + active : "Нажмите на карточку модели, чтобы показать её на рабочем столе." })
      ] })
    ] }),
    jsx("section", { className: "aui-card", children: [
      jsx("header", { className: "aui-card-head", children: [
        jsx("h3", { children: "Модели" }),
        jsx("p", { children: "Файлы .glb, .gltf, .vrm, .fbx и .obj из папки companion/models плагина." })
      ] }),
      jsx("div", { className: "aui-card-pad", children: jsx(Models3DSection, { onSelect: refresh }) })
    ] })
  ] });
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
    import: function () { return Promise.resolve({ ok: false, error: 'Импорт через диалог недоступен в DSH: положите модель в папку companion/models/ вручную.' }); },
    importFolder: function () { return Promise.resolve({ ok: false, error: 'Импорт через диалог недоступен в DSH: положите модель в папку companion/models/ вручную.' }); },
  };
}

    var inject = ["slots"];
    function apply(ctx) {
      window.amadeus3d = makeApi("/amadeus-live3d");

      if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=\"amadeus-live3d\"]") === null) {
        var tag = document.createElement("style");
        tag.dataset.pluginCss = "amadeus-live3d";
        tag.textContent = CSS + ACTIONS_CSS + AUI_CSS + ".amadeus-character-card{transition:transform .15s ease,box-shadow .15s ease}.amadeus-character-card:hover{transform:translateY(-2px);box-shadow:0 8px 18px rgba(0,0,0,.14)}.amadeus-character-preview{border-radius:10px;overflow:hidden}.amadeus-character-action{transition:transform .12s ease}.amadeus-character-action:hover{transform:translateY(-1px)}.amadeus-character-settings{display:flex;flex-direction:column;gap:10px;margin:0 0 14px;padding:14px 16px;border:1px solid var(--dsw-alias-border-l3);border-radius:12px;background:var(--dsw-alias-bg-base)}.amadeus-cs-head{display:flex;flex-wrap:wrap;align-items:center;gap:10px 16px}.amadeus-cs-title{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--dsw-alias-label-caption)}.amadeus-cs-row{display:flex;flex-wrap:wrap;gap:8px 18px;align-items:center}.amadeus-cs-sep{width:1px;height:20px;background:var(--dsw-alias-border-l3);flex:none}.amadeus-cs-toggle{display:inline-flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;user-select:none;white-space:nowrap;color:var(--dsw-alias-label-primary)}.amadeus-cs-toggle input{position:absolute;opacity:0;width:0;height:0}.amadeus-cs-switch{width:38px;height:22px;border-radius:999px;background:var(--dsw-alias-border-l3);transition:background .18s ease;position:relative;flex:none}.amadeus-cs-switch::after{content:\"\";position:absolute;top:3px;left:3px;width:16px;height:16px;border-radius:50%;background:var(--dsw-alias-bg-base);transition:transform .18s ease;box-shadow:0 1px 3px rgba(0,0,0,.35)}.amadeus-cs-toggle input:checked + .amadeus-cs-switch{background:var(--dsw-alias-state-business-primary)}.amadeus-cs-toggle input:checked + .amadeus-cs-switch::after{transform:translateX(16px)}.amadeus-cs-toggle input:disabled + .amadeus-cs-switch{opacity:.5}.amadeus-cs-select{appearance:none;padding:5px 26px 5px 10px;border-radius:8px;border:1px solid var(--dsw-alias-border-l3);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:12px;cursor:pointer}.amadeus-cs-select:disabled{opacity:.5;cursor:default}.amadeus-cs-note{margin-left:auto;font-size:12px;color:var(--dsw-alias-label-caption)}.amadeus-cs-note-error{color:#f38f9c}.amadeus-cs-tool{display:inline-flex;flex-wrap:wrap;align-items:center;gap:10px 14px}.amadeus-cs-color{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--dsw-alias-label-primary)}.amadeus-cs-color input[type=color]{width:30px;height:22px;padding:0;border:1px solid var(--dsw-alias-border-l3);border-radius:6px;background:transparent;cursor:pointer}.amadeus-cs-range{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--dsw-alias-label-primary)}.amadeus-cs-range input[type=range]{width:110px;accent-color:var(--dsw-alias-state-business-primary)}.amadeus-audio{display:flex;flex-direction:column;gap:10px;margin:0 0 14px;padding:14px 16px;border:1px solid var(--dsw-alias-border-l3);border-radius:12px;background:var(--dsw-alias-bg-base)}.amadeus-audio-row{display:flex;flex-wrap:wrap;gap:8px 16px;align-items:center}.amadeus-audio-title{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--dsw-alias-label-caption)}.amadeus-audio-label{font-size:12px;color:var(--dsw-alias-label-caption);min-width:64px}.amadeus-audio-scale{flex:1;min-width:120px;accent-color:var(--dsw-alias-state-business-primary)}.amadeus-audio-val{font-size:12px;color:var(--dsw-alias-label-primary);min-width:42px;text-align:right}.amadeus-audio-btn{padding:6px 12px;border-radius:8px;border:1px solid var(--dsw-alias-border-l3);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:12px;cursor:pointer}.amadeus-audio-btn:hover{background:var(--dsw-alias-interactive-bg-hover)}.amadeus-audio-btn.recording{background:#f43146;color:#fff;border-color:transparent}.amadeus-audio-level{flex:1;min-width:100px;height:6px;border-radius:999px;background:var(--dsw-alias-border-l3);overflow:hidden}.amadeus-audio-level i{display:block;height:100%;width:0;background:var(--dsw-alias-state-business-primary);transition:width .08s linear}.amadeus-audio-file{display:none}.amadeus-audio-note{font-size:12px;color:var(--dsw-alias-label-caption)}.amadeus-audio-note-error{color:#f38f9c}.amadeus-ptt{min-width:140px;padding:12px 18px;border-radius:999px;border:1px solid var(--dsw-alias-border-l3);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:13px;cursor:pointer;user-select:none;touch-action:none}.amadeus-ptt:active,.amadeus-ptt.recording{background:var(--dsw-alias-state-business-primary);color:#fff}";
        document.head.appendChild(tag);
      }
      ctx.slots.inject("settings.section", function () {
        return ctx.slots.register({ name: "settings.section", id: "models3d", order: 92, label: function () { return "live3D"; } }, Live3DPage);
      });
    }
    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  }
});
