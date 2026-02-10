import { useState, useCallback } from 'react';

export function usePipWindow() {
  const [pipWindow, setPipWindow] = useState<Window | null>(null);

  const openPip = useCallback(async (activeTab: string, setActiveTab: (tab: any) => void) => {
    if (!('documentPictureInPicture' in window)) {
      alert("PiP 미지원");
      return;
    }
    try {
      // @ts-ignore
      const win = await window.documentPictureInPicture.requestWindow({ width: 360, height: 600 });
      setPipWindow(win);
      
      // Get current theme variables from root
      const computedStyle = getComputedStyle(document.documentElement);
      
      const getVar = (name: string, fallback: string) => {
          const val = computedStyle.getPropertyValue(name).trim();
          return val || fallback;
      };

      const style = document.createElement('style');
      style.textContent = `
        @import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css");
        
        :root {
            --bg-main: ${getVar('--bg-main', '#0f111a')};
            --bg-panel: ${getVar('--bg-panel', '#1a1d29')};
            --border-color: ${getVar('--border-color', 'rgba(255, 255, 255, 0.1)')};
            --color-primary: ${getVar('--color-primary', '#3b82f6')};
            --color-secondary: ${getVar('--color-secondary', '#6366f1')};
            --color-accent: ${getVar('--color-accent', '#fbbf24')};
            --color-success: ${getVar('--color-success', '#34d399')};
            --color-danger: ${getVar('--color-danger', '#f87171')};
            --text-primary: ${getVar('--text-primary', '#ffffff')};
            --text-secondary: ${getVar('--text-secondary', '#94a3b8')};
        }

        * { box-sizing: border-box; }

        body {
            margin: 0;
            padding: 0;
            background-color: var(--bg-main);
            color: var(--text-primary);
            font-family: 'Pretendard', sans-serif;
            overflow: hidden;
            height: 100vh;
            display: flex;
            flex-direction: column;
        }

        /* Layout Structure */
        .hud-container {
            display: flex;
            flex-direction: column;
            height: 100%;
            padding: 8px;
            gap: 8px;
        }

        /* Hide Spin Buttons */
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
        input[type=number] {
            -moz-appearance: textfield;
        }

        /* HEADER: Tabs + Slots */
        .hud-header {
            display: flex;
            flex-direction: column;
            gap: 8px;
            background: var(--bg-panel);
            padding: 10px;
            border-radius: 10px;
            border: 1px solid var(--border-color);
        }

        .tab-group {
            display: flex;
            width: 100%;
            background: rgba(0,0,0,0.3);
            border-radius: 8px;
            padding: 4px;
            height: 40px;
        }
        .tab-btn {
            flex: 1;
            background: transparent;
            border: none;
            color: var(--text-secondary);
            padding: 0;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            border-radius: 6px;
            transition: all 0.2s;
        }
        .tab-btn.active {
            background: var(--color-primary);
            color: white;
            box-shadow: 0 1px 2px rgba(0,0,0,0.2);
            font-size: 15px;
        }

        .slot-control-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            background: rgba(0,0,0,0.2);
            padding: 8px 12px;
            border-radius: 8px;
            border: 1px solid var(--border-color);
        }
        .slot-desc {
            font-size: 13px;
            font-weight: 700;
            color: var(--text-secondary);
        }
        .slot-input-wrapper {
            display: flex;
            align-items: center;
            gap: 4px;
        }
        .slot-input {
            background: transparent;
            border: none;
            color: var(--color-accent);
            font-size: 20px;
            font-weight: 900;
            width: 60px;
            text-align: right;
            outline: none;
            padding: 0;
        }
        .slot-unit {
             font-size: 12px;
             font-weight: 700;
             color: var(--text-muted);
             margin-top: 4px;
        }

        /* DATA GRID: Materials */
        .data-grid {
            display: flex;
            flex-direction: column;
            gap: 6px;
            flex: 1;
            overflow-y: auto;
            padding: 4px 0;
        }

        .material-row {
            display: grid;
            grid-template-columns: 80px 1fr 120px; /* Name | Input | Needed */
            align-items: center;
            background: var(--bg-panel);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 0 12px;
            padding: 0 12px;
            /* height: 64px; Removed fixed height */
            flex: 1; /* Expand to fill space */
            min-height: 56px;
            position: relative;
            overflow: hidden;
        }
        
        /* Rarity Accents */
        .material-row.rare { border-left: 4px solid #3b82f6; }
        .material-row.uncommon { border-left: 4px solid #10b981; }
        .material-row.common { border-left: 4px solid #94a3b8; }

        .mat-name {
            font-size: 15px;
            font-weight: 800;
            color: var(--text-primary);
        }
        .mat-price {
            font-size: 12px;
            color: var(--text-secondary);
            font-weight: 600;
            display: block;
            margin-top: 2px;
        }

        .mat-input-wrapper {
            display: flex;
            justify-content: center;
        }
        .mat-input {
            background: rgba(0,0,0,0.3);
            border: 1px solid var(--border-color);
            border-radius: 6px;
            border-radius: 6px;
            color: rgba(255,255,255,0.95);
            font-size: 22px; /* Much Larger */
            font-weight: 900;
            text-align: center;
            width: 100px;
            padding: 6px;
            outline: none;
        }
        .mat-input:focus {
            border-color: var(--color-primary);
            background: rgba(0,0,0,0.6);
            color: #fff;
        }
        
        .mat-status {
            text-align: right;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            justify-content: center;
        }
        .status-bundle {
            font-size: 14px;
            font-weight: 800;
            color: var(--color-danger);
            background: rgba(239, 68, 68, 0.15);
            padding: 4px 8px;
            border-radius: 6px;
        }
        .status-ok {
            font-size: 14px;
            font-weight: 800;
            color: var(--color-success);
            background: rgba(16, 185, 129, 0.1);
            padding: 4px 10px;
            border-radius: 6px;
        }
        .status-detail {
            font-size: 11px;
            color: var(--text-secondary);
            margin-top: 4px;
            font-weight: 600;
        }

        /* METRICS BAR (Extended) */
        .metrics-bar {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-top: auto;
            background: var(--bg-panel);
            border-top: 1px solid var(--border-color);
            padding: 12px;
            border-radius: 12px 12px 0 0;
        }

        /* Dash Profit Cards */
        .dash-profit-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
        }
        .dash-profit-card {
            background: rgba(255,255,255,0.03);
            border: 1px solid var(--border-color);
            border-radius: 10px;
            padding: 12px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
        }
        .dash-profit-card.selling {
             background: rgba(16, 185, 129, 0.05);
             border-color: rgba(16, 185, 129, 0.2);
        }
        .dash-profit-card.usage {
             background: rgba(14, 165, 233, 0.05);
             border-color: rgba(14, 165, 233, 0.2);
        }
        
        .dash-profit-split {
            width: 100%;
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid rgba(255,255,255,0.1);
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .dash-label {
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
        }
        .dash-val {
            font-size: 20px;
            font-weight: 900;
            letter-spacing: -0.5px;
            line-height: 1.2;
        }
        .dash-val.green { color: var(--color-success); }
        .dash-val.blue { color: var(--color-primary); }
        .dash-val.red { color: var(--color-danger); }
        
        .dash-sub {
            font-size: 12px;
            font-weight: 600;
            opacity: 0.8;
            margin-top: 2px;
            background: rgba(0,0,0,0.2);
            padding: 2px 6px;
            border-radius: 4px;
        }

        .missing-row {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            color: var(--color-danger);
            font-weight: 700;
            background: rgba(239, 68, 68, 0.1);
            padding: 6px;
            border-radius: 6px;
            margin-bottom: 4px;
        }

        /* TOAST - Positioned at Top Overlaying Tabs */
        .toast-popup {
            position: absolute;
            top: 20px;
            left: 0;
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            z-index: 10000;
            pointer-events: none;
            padding: 0 16px;
            animation: toastSlide 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .toast-content {
            background: rgba(15, 23, 42, 0.98);
            border: 1px solid;
            padding: 12px 16px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            gap: 10px;
            color: white;
            box-shadow: 0 10px 40px -10px rgba(0,0,0,0.5);
            backdrop-filter: blur(16px);
            width: 100%;
            justify-content: center;
        }
        .toast-content.error {
            border-color: rgba(239, 68, 68, 0.5);
            color: #fca5a5;
            background: rgba(69, 10, 10, 0.95);
        }
        .toast-content.success {
            border-color: rgba(16, 185, 129, 0.5);
            color: #6ee7b7;
            background: rgba(6, 78, 59, 0.95);
        }
        .toast-message {
            font-size: 14px;
            font-weight: 800;
            white-space: nowrap;
            letter-spacing: -0.3px;
        }
        @keyframes toastSlide {
            from { opacity: 0; transform: translateY(-20px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .hud-btn {
            width: 100%;
            padding: 14px;
            background: var(--color-primary);
            border: none;
            border-radius: 8px;
            color: white;
            font-weight: 800;
            font-size: 16px;
            cursor: pointer;
            transition: background 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        .hud-btn:hover { background: var(--color-secondary); }
        .hud-btn-sub { font-size: 12px; opacity: 0.8; font-weight: 500; }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #444; border-radius: 2px; }
      `;
      win.document.head.appendChild(style);

      win.addEventListener("pagehide", () => {
        setPipWindow(null);
      });
      
      // Theme Sync: Observe main window's html style changes
      const observer = new MutationObserver(() => {
          if (win.closed) {
              observer.disconnect();
              return;
          }
          const newStyle = getComputedStyle(document.documentElement);
          const pipRoot = win.document.documentElement;
          
          pipRoot.style.setProperty('--bg-main', newStyle.getPropertyValue('--bg-main'));
          pipRoot.style.setProperty('--bg-panel', newStyle.getPropertyValue('--bg-panel'));
          pipRoot.style.setProperty('--border-color', newStyle.getPropertyValue('--border-color'));
          pipRoot.style.setProperty('--color-primary', newStyle.getPropertyValue('--color-primary'));
          pipRoot.style.setProperty('--color-secondary', newStyle.getPropertyValue('--color-secondary'));
          pipRoot.style.setProperty('--color-accent', newStyle.getPropertyValue('--color-accent'));
          pipRoot.style.setProperty('--color-success', newStyle.getPropertyValue('--color-success'));
          pipRoot.style.setProperty('--color-danger', newStyle.getPropertyValue('--color-danger'));
          pipRoot.style.setProperty('--text-primary', newStyle.getPropertyValue('--text-primary'));
          pipRoot.style.setProperty('--text-secondary', newStyle.getPropertyValue('--text-secondary'));
      });
      
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'class'] });
      
      // Cleanup observer when PiP closes
      win.addEventListener("unload", () => observer.disconnect());

    } catch (e) {
      console.error(e);
      alert("PiP 실행 실패");
    }
  }, []);

  const closePip = useCallback(() => {
      if (pipWindow) {
          pipWindow.close();
          setPipWindow(null);
      }
  }, [pipWindow]);

  return { pipWindow, openPip, closePip };
}
