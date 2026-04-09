import { MessageSquare, Smile, Route, Link as LinkIcon, Search } from 'lucide-react';

const TRIGGER_META = {
  '/': { icon: MessageSquare, label: 'Mensagens',  color: 'text-[#175676] dark:text-[#1FA697]' },
  ':': { icon: Smile,         label: 'Emojis',     color: 'text-[#F2C94C] dark:text-[#F2C94C]' },
  '<': { icon: Route,         label: 'Rotas',      color: 'text-[#6A2C70] dark:text-[#d8a1de]' },
  '&': { icon: LinkIcon,      label: 'Links',      color: 'text-[#1FA697] dark:text-teal-400'},
};

const TRIGGER_HINT = {
  '/': (item) => item.topic ? `${item.topic}` : '',
  ':': (item) => item.value || '',
  '<': (item) => item.content || '',
  '&': (item) => item.url || '',
};

const TRIGGER_LABEL = {
  '/': (item) => item.title || item.command || '',
  ':': (item) => item.name  || item.command || '',
  '<': (item) => item.title || item.command || '',
  '&': (item) => item.title || item.command || '',
};

export default function AutocompletePopover({ popup, listRef, confirmItem }) {
  if (!popup.isOpen) return null;

  const meta  = TRIGGER_META[popup.trigger]  || {};
  const Icon  = meta.icon || Search;
  const label = meta.label || 'Itens';
  const color = meta.color || 'text-slate-500 dark:text-slate-400';

  const POPOVER_WIDTH = 320;
  const leftSafe = Math.min(popup.position.left, window.innerWidth - POPOVER_WIDTH - 16);

  const POPOVER_MAX_HEIGHT = 280;
  const spaceBelow = window.innerHeight - popup.position.top;
  const openUpward = spaceBelow < POPOVER_MAX_HEIGHT + 8;

  const style = {
    position: 'fixed',
    left:     `${leftSafe}px`,
    width:    `${POPOVER_WIDTH}px`,
    zIndex:   9999,
    ...(openUpward
      ? { bottom: `${window.innerHeight - popup.position.top + 4}px` }
      : { top:    `${popup.position.top + 4}px` }
    ),
  };

  return (
    <div
      style={style}
      onMouseDown={(e) => e.preventDefault()}
      className="bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden flex flex-col dark:bg-slate-800 dark:border-slate-700"
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 bg-slate-50 shrink-0 dark:bg-slate-900/50 dark:border-slate-700">
        <Icon size={14} className={color} />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">{label}</span>
        {popup.query && (
          <span className="ml-auto text-xs text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded dark:bg-slate-800 dark:text-slate-300">
            {popup.trigger}{popup.query}
          </span>
        )}
      </div>

      <ul
        ref={listRef}
        className="overflow-y-auto"
        style={{ maxHeight: `${POPOVER_MAX_HEIGHT}px` }}
      >
        {popup.items.length === 0 ? (
          <li className="px-4 py-5 text-sm text-slate-400 text-center italic select-none dark:text-slate-500">
            Nenhum comando encontrado
          </li>
        ) : (
          popup.items.map((item, idx) => {
            const isSelected = idx === popup.selectedIndex;
            const mainLabel  = TRIGGER_LABEL[popup.trigger]?.(item) || '';
            const hint       = TRIGGER_HINT[popup.trigger]?.(item)  || '';
            const cmd        = item.command ? `${popup.trigger}${item.command}` : null;

            return (
              <li
                key={item.id || idx}
                onMouseDown={() => confirmItem(item)}
                className={`
                  flex items-start gap-3 px-3 py-2.5 cursor-pointer select-none transition-colors
                  ${isSelected
                    ? 'bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-slate-100'
                    : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/50'
                  }
                `}
              >
                <div className={`mt-0.5 shrink-0 ${color}`}>
                  <Icon size={14} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold truncate">{mainLabel}</span>
                    {cmd && (
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1 py-0.5 rounded shrink-0 dark:bg-slate-800 dark:text-slate-400">
                        {cmd}
                      </span>
                    )}
                  </div>
                  {hint && (
                    <p className="text-xs text-slate-400 truncate mt-0.5 dark:text-slate-500">{hint}</p>
                  )}
                </div>

                {isSelected && (
                  <kbd className="shrink-0 self-center text-[10px] text-slate-400 bg-slate-200 border border-slate-300 rounded px-1 py-0.5 font-mono dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300">
                    ↵
                  </kbd>
                )}
              </li>
            );
          })
        )}
      </ul>

      <div className="flex items-center gap-3 px-3 py-1.5 border-t border-slate-100 bg-slate-50 shrink-0 dark:bg-slate-900/50 dark:border-slate-700">
        <span className="text-[10px] text-slate-400 flex items-center gap-1 dark:text-slate-500">
          <kbd className="bg-slate-200 border border-slate-300 rounded px-1 font-mono dark:bg-slate-800 dark:border-slate-600 dark:text-slate-400">↑↓</kbd> navegar
        </span>
        <span className="text-[10px] text-slate-400 flex items-center gap-1 dark:text-slate-500">
          <kbd className="bg-slate-200 border border-slate-300 rounded px-1 font-mono dark:bg-slate-800 dark:border-slate-600 dark:text-slate-400">↵</kbd> inserir
        </span>
        <span className="text-[10px] text-slate-400 flex items-center gap-1 dark:text-slate-500">
          <kbd className="bg-slate-200 border border-slate-300 rounded px-1 font-mono dark:bg-slate-800 dark:border-slate-600 dark:text-slate-400">Esc</kbd> fechar
        </span>
      </div>
    </div>
  );
}