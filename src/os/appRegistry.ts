import { OSApp } from './types';
import TerminalApp from '../apps/TerminalApp';
import CmdApp from '../apps/CmdApp';
import FileManagerApp from '../apps/FileManagerApp';
import NotepadApp from '../apps/NotepadApp';
import CodeEditorApp from '../apps/CodeEditorApp';
import BrowserApp from '../apps/BrowserApp';
import TorBrowserApp from '../apps/TorBrowserApp';
import SettingsApp from '../apps/SettingsApp';
import VPNApp from '../apps/VPNApp';
import AdBlockApp from '../apps/AdBlockApp';
import TaskManagerApp from '../apps/TaskManagerApp';
import AIChatApp from '../apps/AIChatApp';
import CalculatorApp from '../apps/CalculatorApp';
import MusicPlayerApp from '../apps/MusicPlayerApp';
import ImageViewerApp from '../apps/ImageViewerApp';
import VideoPlayerApp from '../apps/VideoPlayerApp';
import WeatherApp from '../apps/WeatherApp';
import NotesApp from '../apps/NotesApp';
import SpreadsheetApp from '../apps/SpreadsheetApp';
import PasswordManagerApp from '../apps/PasswordManagerApp';
import GameLauncherApp from '../apps/GameLauncherApp';
import NetworkMonitorApp from '../apps/NetworkMonitorApp';
import KeyboardTesterApp from '../apps/KeyboardTesterApp';
import EmailClientApp from '../apps/EmailClientApp';
import RecycleBinApp from '../apps/RecycleBinApp';
import ClockApp from '../apps/ClockApp';
import PaintApp from '../apps/PaintApp';
import SystemInfoApp from '../apps/SystemInfoApp';
import ClipboardApp from '../apps/ClipboardApp';
import ContactsApp from '../apps/ContactsApp';

export const APP_REGISTRY: OSApp[] = [
  // Core
  { id: 'terminal', name: 'Terminal', icon: '💻', component: TerminalApp, defaultWidth: 700, defaultHeight: 450 },
  { id: 'cmd', name: 'CMD', icon: '🖥️', component: CmdApp, defaultWidth: 700, defaultHeight: 450 },
  { id: 'files', name: 'Files', icon: '📁', component: FileManagerApp, defaultWidth: 600, defaultHeight: 450 },
  { id: 'notepad', name: 'Notepad', icon: '📝', component: NotepadApp, defaultWidth: 550, defaultHeight: 400 },
  { id: 'code', name: 'Code Editor', icon: '⌨️', component: CodeEditorApp, defaultWidth: 750, defaultHeight: 500 },
  // Internet
  { id: 'browser', name: 'Browser', icon: '🌐', component: BrowserApp, defaultWidth: 800, defaultHeight: 550 },
  { id: 'tor', name: 'Tor Browser', icon: '🧅', component: TorBrowserApp, defaultWidth: 800, defaultHeight: 550 },
  { id: 'email', name: 'Email', icon: '📧', component: EmailClientApp, defaultWidth: 750, defaultHeight: 500 },
  // Security
  { id: 'vpn', name: 'VPN', icon: '🔒', component: VPNApp, defaultWidth: 380, defaultHeight: 550 },
  { id: 'adblock', name: 'uBlock', icon: '🛡️', component: AdBlockApp, defaultWidth: 380, defaultHeight: 520 },
  { id: 'passwords', name: 'Passwords', icon: '🔑', component: PasswordManagerApp, defaultWidth: 450, defaultHeight: 500 },
  // Media
  { id: 'music', name: 'Music', icon: '🎵', component: MusicPlayerApp, defaultWidth: 380, defaultHeight: 560 },
  { id: 'video', name: 'Video', icon: '📹', component: VideoPlayerApp, defaultWidth: 640, defaultHeight: 480 },
  { id: 'images', name: 'Photos', icon: '🖼️', component: ImageViewerApp, defaultWidth: 550, defaultHeight: 450 },
  { id: 'paint', name: 'Paint', icon: '🎨', component: PaintApp, defaultWidth: 650, defaultHeight: 480 },
  // Productivity
  { id: 'notes', name: 'Notes', icon: '🗒️', component: NotesApp, defaultWidth: 600, defaultHeight: 450 },
  { id: 'spreadsheet', name: 'Spreadsheet', icon: '📊', component: SpreadsheetApp, defaultWidth: 700, defaultHeight: 500 },
  { id: 'calculator', name: 'Calculator', icon: '🧮', component: CalculatorApp, defaultWidth: 320, defaultHeight: 480 },
  { id: 'contacts', name: 'Contacts', icon: '👥', component: ContactsApp, defaultWidth: 550, defaultHeight: 420 },
  { id: 'clock', name: 'Clock', icon: '⏰', component: ClockApp, defaultWidth: 380, defaultHeight: 520 },
  // Utilities
  { id: 'taskmanager', name: 'Task Manager', icon: '📋', component: TaskManagerApp, defaultWidth: 500, defaultHeight: 500 },
  { id: 'settings', name: 'Settings', icon: '⚙️', component: SettingsApp, defaultWidth: 450, defaultHeight: 400 },
  { id: 'weather', name: 'Weather', icon: '🌡️', component: WeatherApp, defaultWidth: 380, defaultHeight: 480 },
  { id: 'network', name: 'Network', icon: '📶', component: NetworkMonitorApp, defaultWidth: 400, defaultHeight: 500 },
  { id: 'keyboard', name: 'Keyboard Test', icon: '⌨️', component: KeyboardTesterApp, defaultWidth: 600, defaultHeight: 380 },
  { id: 'clipboard', name: 'Clipboard', icon: '📋', component: ClipboardApp, defaultWidth: 400, defaultHeight: 450 },
  { id: 'sysinfo', name: 'System Info', icon: '🖥️', component: SystemInfoApp, defaultWidth: 550, defaultHeight: 450 },
  { id: 'recycle', name: 'Recycle Bin', icon: '🗑️', component: RecycleBinApp, defaultWidth: 450, defaultHeight: 400 },
  // Fun
  { id: 'games', name: 'Games', icon: '🎮', component: GameLauncherApp, defaultWidth: 380, defaultHeight: 520 },
  { id: 'aichat', name: 'AI Chat', icon: '🤖', component: AIChatApp, defaultWidth: 500, defaultHeight: 500 },
];
