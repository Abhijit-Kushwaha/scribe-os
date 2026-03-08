import React from 'react';
import { useOS } from './OSContext';
import { APP_REGISTRY } from './appRegistry';
import Window from './Window';
import Taskbar from './Taskbar';
import DesktopIcon from './DesktopIcon';
import DesktopContextMenu, { useDesktopContextMenu } from './DesktopContextMenu';
import { WALLPAPERS, ACCENT_COLORS } from './useOSSettings';
import wallpaper from '@/assets/wallpaper.jpg';

const DESKTOP_APPS = [
  'browser', 'tor', 'email',
  'terminal', 'cmd', 'files',
  'notepad', 'code', 'notes',
  'music', 'video', 'images',
  'calculator', 'spreadsheet',
  'vpn', 'adblock', 'passwords',
  'weather', 'network', 'keyboard',
  'taskmanager', 'settings',
  'games', 'aichat', 'recycle',
];

export default function Desktop() {
  const { windows, openWindow, settings } = useOS();
  const { menuPos, handleContextMenu, closeMenu } = useDesktopContextMenu();

  const wp = settings.wallpaper;
  const wpData = WALLPAPERS[wp];
  const accent = ACCENT_COLORS[settings.accentColor];
  const isTop = settings.taskbarPosition === 'top';
  const fontScale = settings.fontSize === 'small' ? 0.9 : settings.fontSize === 'large' ? 1.1 : 1;

  // Apply accent color as CSS variable
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

      {/* Desktop icons */}
      <div
        className={`absolute left-4 right-4 overflow-y-auto flex flex-col gap-1 z-10 scrollbar-os ${isTop ? 'top-16 bottom-4' : 'top-4 bottom-14'}`}
        data-no-ctx
        style={{ maxWidth: 80 }}
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

      {/* Taskbar */}
      <Taskbar />
    </div>
  );
}
