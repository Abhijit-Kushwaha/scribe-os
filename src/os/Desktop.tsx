import React from 'react';
import { useOS } from './OSContext';
import { APP_REGISTRY } from './appRegistry';
import Window from './Window';
import Taskbar from './Taskbar';
import DesktopIcon from './DesktopIcon';
import DesktopContextMenu, { useDesktopContextMenu } from './DesktopContextMenu';
import WindowSwitcher from './WindowSwitcher';
import { WALLPAPERS, ACCENT_COLORS } from './useOSSettings';
import wallpaper from '@/assets/wallpaper.jpg';

const DESKTOP_APPS = [
  'browser', 'tor', 'email',
  'terminal', 'cmd', 'files',
  'notepad', 'code', 'notes',
  'music', 'video', 'images', 'paint',
  'calculator', 'spreadsheet', 'contacts',
  'vpn', 'adblock', 'passwords',
  'weather', 'network', 'keyboard',
  'clock', 'clipboard', 'sysinfo',
  'taskmanager', 'settings',
  'games', 'aichat', 'recycle',
  'recon', 'vulnlab', 'pentest', 'bugvault', 'triage',
];

export default function Desktop() {
  const { windows, openWindow, settings } = useOS();
  const { menuPos, handleContextMenu, closeMenu } = useDesktopContextMenu();

  const wp = settings.wallpaper;
  const wpData = WALLPAPERS[wp];
  const accent = ACCENT_COLORS[settings.accentColor];
  const isTop = settings.taskbarPosition === 'top';
  const fontScale = settings.fontSize === 'small' ? 0.9 : settings.fontSize === 'large' ? 1.1 : 1;

  const rootStyle: React.CSSProperties = {
    ['--primary' as any]: accent.hsl,
    ['--ring' as any]: accent.hsl,
    ['--accent' as any]: accent.hsl.replace(/46%$/, '40%'),
    ['--os-glow' as any]: accent.hsl,
    fontSize: `${fontScale * 100}%`,
    filter: settings.screenBrightness < 100 ? `brightness(${settings.screenBrightness / 100})` : undefined,
  };

  return (
    <div className="w-screen h-screen overflow-hidden relative select-none" onContextMenu={handleContextMenu} style={rootStyle}>
      {/* Wallpaper */}
      {wp === 'default' ? (
        <>
          <img src={wallpaper} alt="" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-background/20" />
        </>
      ) : (
        <div className="absolute inset-0" style={{ background: wpData.css }} />
      )}

      {/* Desktop icons - multi-column grid */}
      <div
        className={`absolute left-2 right-2 overflow-y-auto grid gap-0 z-10 scrollbar-os ${
          isTop ? 'top-14 bottom-2' : 'top-2 bottom-14'
        }`}
        style={{
          gridTemplateColumns: 'repeat(auto-fill, 80px)',
          gridTemplateRows: 'repeat(auto-fill, 82px)',
          gridAutoFlow: 'column',
          alignContent: 'start',
        }}
        data-no-ctx
      >
        {DESKTOP_APPS.map(appId => {
          const app = APP_REGISTRY.find(a => a.id === appId)!;
          if (!app) return null;
          return (
            <DesktopIcon
              key={app.id}
              icon={app.icon}
              label={app.name}
              onClick={() => openWindow(app.id, app.name, app.defaultWidth, app.defaultHeight)}
            />
          );
        })}
      </div>

      {/* Windows */}
      {windows.map(win => {
        const app = APP_REGISTRY.find(a => a.id === win.appId);
        if (!app) return null;
        const AppComponent = app.component;
        return (
          <Window key={win.id} window={win}>
            <AppComponent windowId={win.id} />
          </Window>
        );
      })}

      {/* Context Menu */}
      {menuPos && <DesktopContextMenu x={menuPos.x} y={menuPos.y} onClose={closeMenu} />}

      {/* Window Switcher (Alt+Tab) */}
      <WindowSwitcher />

      {/* Taskbar */}
      <Taskbar />
    </div>
  );
}
