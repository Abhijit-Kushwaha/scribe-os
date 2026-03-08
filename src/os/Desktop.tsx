import React from 'react';
import { useOS } from './OSContext';
import { APP_REGISTRY } from './appRegistry';
import Window from './Window';
import Taskbar from './Taskbar';
import DesktopIcon from './DesktopIcon';
import DesktopContextMenu, { useDesktopContextMenu } from './DesktopContextMenu';
import wallpaper from '@/assets/wallpaper.jpg';

const DESKTOP_APPS = ['terminal', 'cmd', 'files', 'notepad', 'code', 'browser', 'tor', 'vpn', 'adblock', 'taskmanager', 'settings', 'aichat'];

export default function Desktop() {
  const { windows, openWindow } = useOS();
  const { menuPos, handleContextMenu, closeMenu } = useDesktopContextMenu();

  return (
    <div className="w-screen h-screen overflow-hidden relative select-none" onContextMenu={handleContextMenu}>
      {/* Wallpaper */}
      <img src={wallpaper} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-background/20" />

      {/* Desktop icons */}
      <div className="absolute top-4 left-4 flex flex-col gap-1 z-10" data-no-ctx>
        {DESKTOP_APPS.map(appId => {
          const app = APP_REGISTRY.find(a => a.id === appId)!;
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
