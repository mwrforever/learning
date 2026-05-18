import { useState, useEffect, useCallback } from 'react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string;
  description: string;
  category: string;
}

const SHORTCUTS: ShortcutItem[] = [
  // File Operations
  { keys: 'Ctrl+N', description: '新建文件', category: '文件操作' },
  { keys: 'Ctrl+O', description: '打开文件', category: '文件操作' },
  { keys: 'Ctrl+S', description: '保存文件', category: '文件操作' },
  { keys: 'Ctrl+Shift+S', description: '另存为', category: '文件操作' },
  { keys: 'Ctrl+W', description: '关闭当前标签', category: '文件操作' },

  // Text Formatting
  { keys: 'Ctrl+B', description: '加粗', category: '文本格式' },
  { keys: 'Ctrl+I', description: '斜体', category: '文本格式' },
  { keys: 'Ctrl+U', description: '下划线', category: '文本格式' },
  { keys: 'Ctrl+Shift+S', description: '删除线', category: '文本格式' },
  { keys: 'Ctrl+`', description: '行内代码', category: '文本格式' },

  // Headings
  { keys: 'Ctrl+1', description: '标题 1', category: '标题' },
  { keys: 'Ctrl+2', description: '标题 2', category: '标题' },
  { keys: 'Ctrl+3', description: '标题 3', category: '标题' },
  { keys: 'Ctrl+4', description: '标题 4', category: '标题' },
  { keys: 'Ctrl+5', description: '标题 5', category: '标题' },
  { keys: 'Ctrl+6', description: '标题 6', category: '标题' },

  // Block Elements
  { keys: 'Ctrl+Shift+Q', description: '引用块', category: '块元素' },
  { keys: 'Ctrl+Shift+K', description: '代码块', category: '块元素' },
  { keys: 'Ctrl+Shift+U', description: '无序列表', category: '块元素' },
  { keys: 'Ctrl+Shift+O', description: '有序列表', category: '块元素' },
  { keys: 'Ctrl+Shift+H', description: '水平线', category: '块元素' },

  // Lists
  { keys: 'Ctrl+L', description: '无序列表', category: '列表' },
  { keys: 'Ctrl+Shift+L', description: '有序列表', category: '列表' },

  // View
  { keys: 'Ctrl+`', description: '切换源码/预览模式', category: '视图' },
  { keys: 'Ctrl+Shift+F', description: '专注模式', category: '视图' },
  { keys: 'Ctrl+\\', description: '切换侧边栏', category: '视图' },

  // Edit
  { keys: 'Ctrl+Z', description: '撤销', category: '编辑' },
  { keys: 'Ctrl+Y', description: '重做', category: '编辑' },
  { keys: 'Ctrl+F', description: '查找', category: '编辑' },
  { keys: 'Ctrl+H', description: '替换', category: '编辑' },

  // Insert
  { keys: 'Ctrl+K', description: '插入链接', category: '插入' },
  { keys: 'Ctrl+Shift+I', description: '插入图片', category: '插入' },
];

const FEATURES = [
  { title: 'Markdown 渲染', description: '实时渲染 Markdown 文本为格式化 HTML' },
  { title: '所见即所得', description: '编辑内容直接显示为最终效果' },
  { title: '代码块语言', description: '点击代码块可选择编程语言获取语法高亮' },
  { title: '快捷键支持', description: '完整的 Markdown 格式化快捷键' },
  { title: '主题切换', description: '支持浅色/深色/Solarized 主题' },
  { title: '自动保存', description: '编辑后自动保存文件' },
  { title: '多标签编辑', description: '支持同时打开多个文件' },
  { title: '专注模式', description: '隐藏所有 UI 元素，专注写作' },
  { title: '文件树', description: '侧边栏显示文件列表' },
  { title: '源码模式', description: '查看和编辑原始 Markdown 源码' },
];

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  const [activeTab, setActiveTab] = useState<'shortcuts' | 'features'>('shortcuts');

  // Group shortcuts by category
  const shortcutsByCategory = SHORTCUTS.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, ShortcutItem[]>);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={onClose}
    >
      <div
        className="w-[700px] max-h-[80vh] rounded-lg shadow-xl overflow-hidden"
        style={{ backgroundColor: 'var(--bg-primary)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-secondary)' }}
        >
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            帮助
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-hover-bg transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={() => setActiveTab('shortcuts')}
            className="px-6 py-3 text-sm font-medium transition-colors"
            style={{
              color: activeTab === 'shortcuts' ? 'var(--accent)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'shortcuts' ? '2px solid var(--accent)' : '2px solid transparent',
            }}
          >
            快捷键
          </button>
          <button
            onClick={() => setActiveTab('features')}
            className="px-6 py-3 text-sm font-medium transition-colors"
            style={{
              color: activeTab === 'features' ? 'var(--accent)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'features' ? '2px solid var(--accent)' : '2px solid transparent',
            }}
          >
            功能特性
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 120px)' }}>
          {activeTab === 'shortcuts' ? (
            <div className="space-y-6">
              {Object.entries(shortcutsByCategory).map(([category, items]) => (
                <div key={category}>
                  <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>
                    {category}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {items.map((item) => (
                      <div
                        key={item.keys}
                        className="flex items-center justify-between px-3 py-2 rounded"
                        style={{ backgroundColor: 'var(--bg-secondary)' }}
                      >
                        <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                          {item.description}
                        </span>
                        <kbd
                          className="px-2 py-1 text-xs rounded font-mono"
                          style={{
                            backgroundColor: 'var(--bg-primary)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border)',
                          }}
                        >
                          {item.keys}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {FEATURES.map((feature) => (
                <div
                  key={feature.title}
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                >
                  <h4 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
                    {feature.title}
                  </h4>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-3 border-t text-xs"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
        >
          Markdown Editor v0.1.0 - Typora Clone
        </div>
      </div>
    </div>
  );
}