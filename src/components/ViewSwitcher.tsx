import { ViewMode } from '../types';

interface ViewSwitcherProps {
  currentMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

export function ViewSwitcher({ currentMode, onModeChange }: ViewSwitcherProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onModeChange('wysiwyg')}
        className={`px-3 py-1 rounded ${
          currentMode === 'wysiwyg'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
      >
        WYSIWYG
      </button>
      <button
        onClick={() => onModeChange('source')}
        className={`px-3 py-1 rounded ${
          currentMode === 'source'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        }`}
      >
        Source
      </button>
    </div>
  );
}
