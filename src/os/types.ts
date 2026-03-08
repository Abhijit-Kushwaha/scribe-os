export interface OSWindow {
  id: string;
  appId: string;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minimized: boolean;
  maximized: boolean;
  focused: boolean;
  zIndex: number;
}

export interface OSApp {
  id: string;
  name: string;
  icon: string;
  component: React.ComponentType<{ windowId: string }>;
  defaultWidth?: number;
  defaultHeight?: number;
  singleton?: boolean;
}

export interface FileNode {
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileNode[];
  icon?: string;
  modified?: number;
  size?: number;
}
