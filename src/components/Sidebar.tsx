import { useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { useEditor } from '../contexts/EditorContext';
import { FileTreeNode } from '../types';

function FolderIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function FileIcon({ name }: { name: string }) {
  const ext = name.split('.').pop()?.toLowerCase();
  let color = 'text-gray-400';

  if (ext === 'md') color = 'text-blue-400';
  else if (ext === 'html') color = 'text-orange-400';

  return (
    <svg className={`w-4 h-4 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

interface DirectoryEntry {
  name: string;
  path: string;
  is_directory: boolean;
}

function toFileTreeNode(entry: DirectoryEntry): FileTreeNode {
  return {
    name: entry.name,
    path: entry.path,
    isDirectory: entry.is_directory,
  };
}

interface TreeNodeProps {
  node: FileTreeNode;
  level: number;
  onCreateFile: (parentPath: string, isRoot: boolean, setChildren?: React.Dispatch<React.SetStateAction<FileTreeNode[]>>) => void;
  onCreateFolder: (parentPath: string, isRoot: boolean, setChildren?: React.Dispatch<React.SetStateAction<FileTreeNode[]>>) => void;
  onRefresh: (parentPath: string, setChildren: React.Dispatch<React.SetStateAction<FileTreeNode[]>>) => void;
}

function TreeNode({ node, level, onCreateFile, onCreateFolder, onRefresh }: TreeNodeProps) {
  const { sidebar, toggleFolder, setContent, setFilePath, setFileType, setSelectedFile } = useEditor();
  const [children, setChildren] = useState<FileTreeNode[]>([]);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const isExpanded = sidebar.expandedFolders.has(node.path);

  const handleClick = async () => {
    if (node.isDirectory) {
      if (!isExpanded) {
        onRefresh(node.path, setChildren);
      }
      toggleFolder(node.path);
    } else {
      setSelectedFile(node.path);
      try {
        const result = await invoke<{ content: string; file_type: string }>('read_file', { path: node.path });
        setContent(result.content);
        setFilePath(node.path);
        const ext = node.name.split('.').pop()?.toLowerCase();
        if (ext === 'md') setFileType('markdown');
        else if (ext === 'html' || ext === 'htm') setFileType('html');
        else setFileType('text');
      } catch (error) {
        console.error('读取文件失败:', error);
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowContextMenu(true);
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  };

  const closeContextMenu = () => {
    setShowContextMenu(false);
  };

  return (
    <div onContextMenu={handleContextMenu}>
      <div
        className={`flex items-center gap-1 px-2 py-1 cursor-pointer rounded ${
          sidebar.selectedFile === node.path ? 'bg-accent/20 text-accent' : 'hover:bg-hover-bg'
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
      >
        {node.isDirectory ? (
          <FolderIcon isOpen={isExpanded} />
        ) : (
          <FileIcon name={node.name} />
        )}
        <span className="text-sm truncate">{node.name}</span>
      </div>
      {node.isDirectory && isExpanded && children.length > 0 && (
        <div>
          {children.map((child) => (
            <TreeNode key={child.path} node={child} level={level + 1} onCreateFile={onCreateFile} onCreateFolder={onCreateFolder} onRefresh={onRefresh} />
          ))}
        </div>
      )}
      {showContextMenu && (
        <div
          className="fixed bg-[var(--bg-primary)] border border-[var(--border)] rounded shadow-lg py-1 z-50"
          style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {node.isDirectory && (
            <>
              <button
                className="w-full px-4 py-1.5 text-sm text-left hover:bg-hover-bg"
                style={{ color: 'var(--text-primary)' }}
                onClick={() => {
                  onCreateFile(node.path, false, setChildren);
                  closeContextMenu();
                }}
              >
                新建文件
              </button>
              <button
                className="w-full px-4 py-1.5 text-sm text-left hover:bg-hover-bg"
                style={{ color: 'var(--text-primary)' }}
                onClick={() => {
                  onCreateFolder(node.path, false, setChildren);
                  closeContextMenu();
                }}
              >
                新建文件夹
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const { sidebar, setCurrentPath, setFileTree } = useEditor();
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
  const [showContextMenu, setShowContextMenu] = useState(false);

  const readDirectory = useCallback(async (path: string): Promise<FileTreeNode[]> => {
    try {
      const result = await invoke<DirectoryEntry[]>('read_directory', { path });
      return result.map(toFileTreeNode);
    } catch (error) {
      console.error('读取目录失败:', error);
      return [];
    }
  }, []);

  const handleOpenFolder = async () => {
    try {
      const { open } = await import('@tauri-apps/api/dialog');
      const selected = await open({ directory: true });
      if (selected && typeof selected === 'string') {
        setCurrentPath(selected);
        const tree = await readDirectory(selected);
        setFileTree(tree);
      }
    } catch (error) {
      console.error('打开文件夹失败:', error);
    }
  };

  const handleCreateFile = async (parentPath: string, isRoot: boolean = false, setChildren?: React.Dispatch<React.SetStateAction<FileTreeNode[]>>) => {
    const name = prompt('请输入文件名:', 'untitled.md');
    if (!name) return;
    const filePath = parentPath.replace(/\\/g, '/') + '/' + name;
    try {
      await invoke('create_file', { path: filePath });
      if (isRoot) {
        const tree = await readDirectory(parentPath);
        setFileTree(tree);
      } else if (setChildren) {
        const tree = await readDirectory(parentPath);
        setChildren(tree);
      }
    } catch (error) {
      console.error('创建文件失败:', error);
      alert('创建文件失败: ' + error);
    }
  };

  const handleCreateFolder = async (parentPath: string, isRoot: boolean = false, setChildren?: React.Dispatch<React.SetStateAction<FileTreeNode[]>>) => {
    const name = prompt('请输入文件夹名:', 'new folder');
    if (!name) return;
    const folderPath = parentPath.replace(/\\/g, '/') + '/' + name;
    try {
      await invoke('create_directory', { path: folderPath });
      if (isRoot) {
        const tree = await readDirectory(parentPath);
        setFileTree(tree);
      } else if (setChildren) {
        const tree = await readDirectory(parentPath);
        setChildren(tree);
      }
    } catch (error) {
      console.error('创建文件夹失败:', error);
      alert('创建文件夹失败: ' + error);
    }
  };

  const handleRootCreateFile = () => {
    if (sidebar.currentPath) {
      handleCreateFile(sidebar.currentPath, true);
    }
  };

  const handleRootCreateFolder = () => {
    if (sidebar.currentPath) {
      handleCreateFolder(sidebar.currentPath, true);
    }
  };

  const handleRootContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!sidebar.currentPath) return;
    setShowContextMenu(true);
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  };

  return (
    <div
      className="w-56 h-full flex flex-col border-r overflow-hidden"
      style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border)' }}
    >
      <div
        className="px-3 py-2 border-b flex items-center justify-between"
        style={{ borderColor: 'var(--border)' }}
      >
        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          文件
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={handleRootCreateFile}
            className="p-1 rounded hover:bg-hover-bg disabled:opacity-50"
            title="新建文件"
            disabled={!sidebar.currentPath}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
          </button>
          <button
            onClick={handleRootCreateFolder}
            className="p-1 rounded hover:bg-hover-bg disabled:opacity-50"
            title="新建文件夹"
            disabled={!sidebar.currentPath}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11v6m-3-3h6" />
            </svg>
          </button>
          <button
            onClick={handleOpenFolder}
            className="p-1 rounded hover:bg-hover-bg"
            title="打开文件夹"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-1" onContextMenu={handleRootContextMenu} onClick={() => setShowContextMenu(false)}>
        {sidebar.fileTree.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            {sidebar.currentPath ? '文件夹为空' : '点击打开文件夹按钮选择一个文件夹'}
          </div>
        ) : (
          sidebar.fileTree.map((node) => (
            <TreeNode key={node.path} node={node} level={0} onCreateFile={handleCreateFile} onCreateFolder={handleCreateFolder} onRefresh={(path, setChildren) => {
              invoke<DirectoryEntry[]>('read_directory', { path }).then(result => {
                setChildren(result.map(toFileTreeNode));
              });
            }} />
          ))
        )}
      </div>
      {showContextMenu && sidebar.currentPath && (
        <div
          className="fixed bg-[var(--bg-primary)] border border-[var(--border)] rounded shadow-lg py-1 z-50"
          style={{ left: contextMenuPos.x, top: contextMenuPos.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full px-4 py-1.5 text-sm text-left hover:bg-hover-bg"
            style={{ color: 'var(--text-primary)' }}
            onClick={() => {
              handleCreateFile(sidebar.currentPath!, true);
              setShowContextMenu(false);
            }}
          >
            新建文件
          </button>
          <button
            className="w-full px-4 py-1.5 text-sm text-left hover:bg-hover-bg"
            style={{ color: 'var(--text-primary)' }}
            onClick={() => {
              handleCreateFolder(sidebar.currentPath!, true);
              setShowContextMenu(false);
            }}
          >
            新建文件夹
          </button>
        </div>
      )}
    </div>
  );
}