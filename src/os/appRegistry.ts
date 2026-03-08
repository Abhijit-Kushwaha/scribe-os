import { OSApp } from './types';
import TerminalApp from '../apps/TerminalApp';
import FileManagerApp from '../apps/FileManagerApp';
import NotepadApp from '../apps/NotepadApp';
import CodeEditorApp from '../apps/CodeEditorApp';
import BrowserApp from '../apps/BrowserApp';
import SettingsApp from '../apps/SettingsApp';
import VPNApp from '../apps/VPNApp';
import AdBlockApp from '../apps/AdBlockApp';
import TaskManagerApp from '../apps/TaskManagerApp';

export const APP_REGISTRY: OSApp[] = [
  { id: 'terminal', name: 'Terminal', icon: '💻', component: TerminalApp, defaultWidth: 700, defaultHeight: 450 },
  { id: 'files', name: 'Files', icon: '📁', component: FileManagerApp, defaultWidth: 600, defaultHeight: 450 },
  { id: 'notepad', name: 'Notepad', icon: '📝', component: NotepadApp, defaultWidth: 550, defaultHeight: 400 },
  { id: 'code', name: 'Code Editor', icon: '⌨️', component: CodeEditorApp, defaultWidth: 750, defaultHeight: 500 },
  { id: 'browser', name: 'Browser', icon: '🌐', component: BrowserApp, defaultWidth: 800, defaultHeight: 550 },
  { id: 'vpn', name: 'VPN', icon: '🔒', component: VPNApp, defaultWidth: 380, defaultHeight: 550 },
  { id: 'adblock', name: 'uBlock', icon: '🛡️', component: AdBlockApp, defaultWidth: 380, defaultHeight: 520 },
  { id: 'taskmanager', name: 'Task Manager', icon: '📊', component: TaskManagerApp, defaultWidth: 500, defaultHeight: 500 },
  { id: 'settings', name: 'Settings', icon: '⚙️', component: SettingsApp, defaultWidth: 450, defaultHeight: 400 },
];
