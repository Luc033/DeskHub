import { useState, useEffect, useRef, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURAÇÃO DOS GATILHOS
// Cada gatilho mapeia: chave no hubData | campo usado no label | campo inserido
// ─────────────────────────────────────────────────────────────────────────────
const TRIGGERS = {
  '/': { dataKey: 'messages',  labelField: 'title', insertField: 'content' },
  ':': { dataKey: 'emojis',    labelField: 'name',  insertField: 'value'   },
  '<': { dataKey: 'shortcuts', labelField: 'title', insertField: 'content' },
  '&': { dataKey: 'links',     labelField: 'title', insertField: 'url'     },
};

// ─────────────────────────────────────────────────────────────────────────────
// TÉCNICA DO "DIV ESPELHO"
// Replica os estilos do textarea num div invisível para medir a posição exata
// do caret em coordenadas de tela (screen coordinates).
// ─────────────────────────────────────────────────────────────────────────────
const MIRROR_PROPS = [
  'borderTopWidth','borderRightWidth','borderBottomWidth','borderLeftWidth',
  'paddingTop','paddingRight','paddingBottom','paddingLeft',
  'fontFamily','fontSize','fontStyle','fontWeight','fontVariant',
  'lineHeight','letterSpacing','wordSpacing','textTransform',
  'whiteSpace','wordWrap','wordBreak','width','boxSizing',
  'tabSize',
];

function getCaretScreenCoordinates(textarea) {
  const computed = window.getComputedStyle(textarea);

  const mirror = document.createElement('div');
  MIRROR_PROPS.forEach(prop => { mirror.style[prop] = computed[prop]; });
  mirror.style.position   = 'absolute';
  mirror.style.visibility = 'hidden';
  mirror.style.pointerEvents = 'none';
  mirror.style.top        = '0px';
  mirror.style.left       = '-9999px'; // Mantém escondido da tela

  // Texto antes do cursor
  const textBefore = document.createTextNode(
    textarea.value.substring(0, textarea.selectionStart)
  );

  // Span marcador: representa a posição real do cursor
  const marker = document.createElement('span');
  marker.textContent = '\u200B'; // zero-width space

  // Texto depois do cursor
  const textAfter = document.createTextNode(
    textarea.value.substring(textarea.selectionStart)
  );

  mirror.appendChild(textBefore);
  mirror.appendChild(marker);
  mirror.appendChild(textAfter);
  document.body.appendChild(mirror);

  // Pegamos as 3 caixas de medida
  const markerRect   = marker.getBoundingClientRect();
  const mirrorRect   = mirror.getBoundingClientRect();
  const textareaRect = textarea.getBoundingClientRect();

  document.body.removeChild(mirror);

  const lineHeight = parseFloat(computed.lineHeight) || 20;

  // FIX: Calcula a distância interna do cursor até o topo/esquerda do espelho
  const relativeTop = markerRect.top - mirrorRect.top;
  const relativeLeft = markerRect.left - mirrorRect.left;

  // Como o Popover usa `position: fixed` (relativo à viewport), a soma fica perfeita!
  return {
    top:  textareaRect.top + relativeTop + lineHeight - textarea.scrollTop,
    left: textareaRect.left + relativeLeft - textarea.scrollLeft,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK PRINCIPAL
// Parâmetros:
//   textareaRef  — ref do elemento <textarea>
//   hubData      — { messages, emojis, shortcuts, links }
//   onInsert     — callback(newText: string, newCursorPos: number)
//                  chamado quando o usuário confirma um item
// ─────────────────────────────────────────────────────────────────────────────
export function useAutocomplete({ textareaRef, hubData, onInsert }) {
  const [popup, setPopup] = useState({
    isOpen:        false,
    trigger:       null,  // O caractere gatilho: '/', ':', '<', '&'
    query:         '',    // O que o usuário digitou após o gatilho
    items:         [],    // Lista filtrada de itens
    selectedIndex: 0,     // Índice do item focado no teclado
    position:      { top: 0, left: 0 }, // Coordenadas de tela (fixed)
    triggerStart:  -1,    // Posição do gatilho no texto
  });

  const listRef = useRef(null); // ref da <ul> do popover para scroll automático

  // ── Filtra os itens com base no trigger e na query ──────────────────────
  const filterItems = useCallback((trigger, query, data) => {
    const cfg    = TRIGGERS[trigger];
    if (!cfg) return [];
    const source = Array.isArray(data[cfg.dataKey]) ? data[cfg.dataKey] : [];
    if (!query) return source.slice(0, 25);

    const lower = query.toLowerCase();
    return source.filter(item => {
      const label   = (item[cfg.labelField] || '').toLowerCase();
      const command = (item.command || '').toLowerCase();
      return label.includes(lower) || command.startsWith(lower);
    }).slice(0, 25);
  }, []);

  // ── Fecha o popup ────────────────────────────────────────────────────────
  const close = useCallback(() => {
    setPopup(p => ({ ...p, isOpen: false, trigger: null, query: '', selectedIndex: 0 }));
  }, []);

  // ── Insere o item selecionado no textarea ────────────────────────────────
  const confirmItem = useCallback((item) => {
    if (!textareaRef.current || !item || !popup.trigger) return;

    const cfg         = TRIGGERS[popup.trigger];
    const insertValue = item[cfg.insertField] || '';
    const text        = textareaRef.current.value;
    const cursorPos   = textareaRef.current.selectionStart;

    // Remove o gatilho + query e coloca o conteúdo real no lugar
    const before     = text.substring(0, popup.triggerStart);
    const after      = text.substring(cursorPos);
    const newText    = before + insertValue + after;
    const newCursor  = before.length + insertValue.length;

    close();
    onInsert(newText, newCursor);
  }, [popup.trigger, popup.triggerStart, close, onInsert, textareaRef]);

  // ── Handler do onChange do textarea ─────────────────────────────────────
  // Deve ser chamado a cada alteração do valor. Recebe o evento nativo.
  const handleChange = useCallback((e) => {
    const ta         = e.target;
    const cursorPos  = ta.selectionStart;
    const text       = ta.value;

    // Busca o gatilho mais recente antes do cursor (sem cruzar espaços)
    let triggerPos   = -1;
    let foundTrigger = null;

    for (let i = cursorPos - 1; i >= 0; i--) {
      const ch = text[i];

      // Chegamos a espaço ou newline sem encontrar gatilho → sem match
      if (/[\s\n]/.test(ch)) break;

      if (TRIGGERS[ch]) {
        // Gatilho válido: deve estar no início da string ou após whitespace
        if (i === 0 || /[\s\n]/.test(text[i - 1])) {
          triggerPos   = i;
          foundTrigger = ch;
        }
        break;
      }
    }

    if (foundTrigger !== null) {
      const query    = text.substring(triggerPos + 1, cursorPos);
      const items    = filterItems(foundTrigger, query, hubData);
      const position = getCaretScreenCoordinates(ta);

      setPopup({
        isOpen:        true,
        trigger:       foundTrigger,
        query,
        items,
        selectedIndex: 0,
        position,
        triggerStart:  triggerPos,
      });
    } else if (popup.isOpen) {
      close();
    }
  }, [hubData, filterItems, popup.isOpen, close]);

  // ── Handler do onKeyDown do textarea ────────────────────────────────────
  // Retorna `true` se o evento foi consumido pelo autocomplete (previne o comportamento padrão).
  const handleKeyDown = useCallback((e) => {
    if (!popup.isOpen) return false;

    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return true;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setPopup(p => ({ ...p, selectedIndex: Math.min(p.selectedIndex + 1, p.items.length - 1) }));
      return true;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setPopup(p => ({ ...p, selectedIndex: Math.max(p.selectedIndex - 1, 0) }));
      return true;
    }

    if (e.key === 'Enter' || e.key === 'Tab') {
      if (popup.items.length > 0) {
        e.preventDefault();
        confirmItem(popup.items[popup.selectedIndex]);
        return true;
      }
    }

    return false;
  }, [popup, close, confirmItem]);

  // ── Rola automaticamente o item selecionado para a área visível ──────────
  useEffect(() => {
    if (!listRef.current || !popup.isOpen) return;
    const el = listRef.current.children[popup.selectedIndex];
    if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [popup.selectedIndex, popup.isOpen]);

  // ── Fecha ao clicar fora ─────────────────────────────────────────────────
  useEffect(() => {
    if (!popup.isOpen) return;
    const handler = () => close();
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [popup.isOpen, close]);

  // Retorna tudo que o componente precisa
  return {
    popup,        // Estado do popup (isOpen, items, selectedIndex, position, trigger)
    listRef,      // ref para o <ul> do popover
    close,        // fecha o popup
    confirmItem,  // insere um item específico
    handleChange, // passa para o onChange do textarea
    handleKeyDown,// passa para o onKeyDown do textarea
  };
}
