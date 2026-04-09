import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import { 
  Folder, FolderOpen, FileText, ChevronRight, ChevronDown, X, 
  Search, Plus, CheckCircle2, Activity, Edit2, FolderPlus, FilePlus,
  PanelRightClose, MoreVertical, BellRing,
  AlertTriangle, Info, AlarmClock, CheckSquare, RotateCcw,
  Bold, Italic, List, ListOrdered, Code, Save, Trash2, Pin, Terminal, Megaphone,
  Image as ImageIcon, Video as VideoIcon, Heading1, Heading2, Heading3, MessageSquareQuote,
  Paperclip, UploadCloud, Link as LinkIcon, FileCode
} from 'lucide-react';


// === ESTILOS GLOBAIS E CSS DO EDITOR ===
const customStyles = `
  @keyframes marquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
  .animate-marquee { display: inline-block; white-space: nowrap; animation: marquee 35s linear infinite; }
  
  .ProseMirror { outline: none; white-space: pre-wrap; }
  .ProseMirror p.is-editor-empty:first-child::before { content: attr(data-placeholder); float: left; color: #cbd5e1; pointer-events: none; height: 0; }
  .dark .ProseMirror p.is-editor-empty:first-child::before { color: #475569; }

  .ProseMirror strong { font-weight: 700; color: inherit; }
  .ProseMirror em { font-style: italic; }
  .ProseMirror ul { list-style-type: disc; padding-left: 1.5rem; margin-top: 0.5rem; margin-bottom: 0.5rem; }
  .ProseMirror ol { list-style-type: decimal; padding-left: 1.5rem; margin-top: 0.5rem; margin-bottom: 0.5rem; }
  
  .ProseMirror h1 { font-size: 2.25rem; font-weight: 800; line-height: 1.2; margin-top: 2rem; margin-bottom: 1rem; }
  .ProseMirror h2 { font-size: 1.875rem; font-weight: 700; line-height: 1.3; margin-top: 1.75rem; margin-bottom: 0.75rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.25rem; }
  .dark .ProseMirror h2 { border-bottom-color: #334155; }
  .ProseMirror h3 { font-size: 1.5rem; font-weight: 600; line-height: 1.4; margin-top: 1.5rem; margin-bottom: 0.5rem; }

  .ProseMirror blockquote { 
    border-left: 4px solid #10b981;
    background-color: #ecfdf5; 
    padding: 0.75rem 1rem; 
    color: #047857; 
    font-style: normal; 
    margin-top: 1rem; 
    margin-bottom: 1rem; 
    border-radius: 0 0.5rem 0.5rem 0;
  }
  .dark .ProseMirror blockquote { border-left-color: #10b981; background-color: rgba(16, 185, 129, 0.1); color: #34d399; }
  .ProseMirror code { background-color: #f1f5f9; padding: 0.2rem 0.4rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.875em; color: #ef4444; }
  .dark .ProseMirror code { background-color: #1e293b; color: #f87171; }
  .ProseMirror img { max-width: 100%; height: auto; border-radius: 0.5rem; margin-top: 1rem; margin-bottom: 1rem; border: 1px solid #e2e8f0; }
  .dark .ProseMirror img { border-color: #334155; }
  .ProseMirror iframe { width: 100%; aspect-ratio: 16/9; border-radius: 0.5rem; margin-top: 1rem; margin-bottom: 1rem; }

  /* Estilo da Folha Sulfite (A4) */
  .paper-wrapper { background-color: #f1f5f9; }
  .dark .paper-wrapper { background-color: #020617; }
  .paper-document {
    background-color: #ffffff;
    min-height: 297mm;
    max-width: 210mm;
    margin: 2rem auto;
    padding: 4rem 5rem;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
    border-radius: 4px;
    border: 1px solid #e2e8f0;
  }
  .dark .paper-document {
    background-color: #0f172a;
    border-color: #1e293b;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
  }
`;

const MenuBar = ({ editor, onOpenMediaModal }) => {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-slate-200 bg-white shrink-0 dark:bg-slate-900/80 dark:border-slate-800 shadow-sm z-10 relative">
      <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-1.5 rounded transition-colors ${editor.isActive('bold') ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800'}`} title="Negrito (Ctrl+B)"><Bold size={16} /></button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-1.5 rounded transition-colors ${editor.isActive('italic') ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800'}`} title="Itálico (Ctrl+I)"><Italic size={16} /></button>
      
      <div className="w-px h-4 bg-slate-300 mx-1 dark:bg-slate-700"></div>

      <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`p-1.5 rounded transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800'}`} title="Título Principal (H1)"><Heading1 size={16} /></button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`p-1.5 rounded transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800'}`} title="Subtítulo (H2)"><Heading2 size={16} /></button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`p-1.5 rounded transition-colors ${editor.isActive('heading', { level: 3 }) ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800'}`} title="Tópico (H3)"><Heading3 size={16} /></button>
      
      <div className="w-px h-4 bg-slate-300 mx-1 dark:bg-slate-700"></div>
      
      <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-1.5 rounded transition-colors ${editor.isActive('bulletList') ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800'}`} title="Lista com Marcadores"><List size={16} /></button>
      <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-1.5 rounded transition-colors ${editor.isActive('orderedList') ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800'}`} title="Lista Numerada"><ListOrdered size={16} /></button>
      
      <div className="w-px h-4 bg-slate-300 mx-1 dark:bg-slate-700"></div>
      
      <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={`p-1.5 rounded transition-colors ${editor.isActive('codeBlock') ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800'}`} title="Bloco de Código"><Code size={16} /></button>
      <button onClick={() => editor.chain().focus().setBlockquote().insertContent('📝 <strong>Nota:</strong> ').run()} className={`p-1.5 rounded transition-colors ${editor.isActive('blockquote') ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800'}`} title="Inserir Citação / Nota">
        <MessageSquareQuote size={16} />
      </button>

      <div className="w-px h-4 bg-slate-300 mx-1 dark:bg-slate-700"></div>
      
      <button onClick={onOpenMediaModal} className="flex items-center gap-1.5 px-2 p-1.5 rounded transition-colors text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-slate-800 text-xs font-bold" title="Anexar Arquivo, Imagem ou Vídeo">
        <Paperclip size={14} /> Anexar
      </button>
    </div>
  );
};

export default function Notes({ alerts, fetchAlerts, setSelectedNotification, setIsRecadoModalOpen, setRecadoForm, showGlobalToast }) {
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [notes, setNotes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState(null);

  const [openTabs, setOpenTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  
  const currentNote = openTabs.find(t => t.id === activeTabId) || { id: null, title: "", content: "", category: "Integrações", isPinned: false };

  const [virtualFolders, setVirtualFolders] = useState([]); 
  const [openFolders, setOpenFolders] = useState({ "Integrações": true, "Fiscal": false, "Logística": false, "Outros": false });

  const [editingFolder, setEditingFolder] = useState(null);
  const [editingFolderText, setEditingFolderText] = useState("");
  const [openFileMenu, setOpenFileMenu] = useState(null);
  const [editingFile, setEditingFile] = useState(null);
  const [editingFileText, setEditingFileText] = useState("");
  
  const [creatingType, setCreatingType] = useState(null);
  const [creatingTargetFolder, setCreatingTargetFolder] = useState(null);
  const [creatingText, setCreatingText] = useState("");
  const ghostInputRef = useRef(null);

  const [alertTab, setAlertTab] = useState('ativos');
  
  // Modal de Mídia
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaTab, setMediaTab] = useState('upload');
  const [mediaUrl, setMediaUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit, 
      Image.configure({ inline: true, allowBase64: true }),
      Youtube.configure({ controls: true }),
      Placeholder.configure({ placeholder: 'Comece a digitar o conteúdo do seu manual aqui...' })
    ],
    content: currentNote.content || "",
    onUpdate: ({ editor }) => {
      setOpenTabs(prev => prev.map(tab => 
        tab.id === activeTabId ? { ...tab, content: editor.getHTML() } : tab
      ));
    },
    editorProps: { attributes: { className: 'prose prose-sm focus:outline-none max-w-none text-slate-800 dark:prose-invert dark:text-slate-300' } },
  });

  const showLocalToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const loadNotes = async () => {
    try {
      const res = await fetch(`/api/notes`);
      if (res.ok) setNotes(await res.json());
    } catch (error) { console.error("Erro ao carregar notas", error); }
  };

  useEffect(() => { loadNotes(); }, []);

  useEffect(() => {
    if (creatingType && ghostInputRef.current) ghostInputRef.current.focus();
  }, [creatingType]);

  useEffect(() => {
    if (editor && activeTabId) {
      const activeTabContent = openTabs.find(t => t.id === activeTabId)?.content || "";
      if (activeTabContent !== editor.getHTML()) {
        editor.commands.setContent(activeTabContent);
      }
    }
  }, [activeTabId, editor, openTabs]);

  useEffect(() => {
    const handleGlobalClick = () => setOpenFileMenu(null);
    if (openFileMenu) window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [openFileMenu]);

  // === AÇÕES DE BANCO DE DADOS (NOTAS) ===
  const handleSaveNote = async (noteToSave = currentNote) => {
    if (!noteToSave || !activeTabId) return;
    
    // Impede envio se não tem o que salvar
    if (!noteToSave.title && !noteToSave.content) return;
    
    const isTempId = typeof noteToSave.id === 'string' && noteToSave.id.startsWith('temp-');
    
    const payload = {
      title: noteToSave.title?.trim() === "" ? "Nova Página Sem Título" : noteToSave.title,
      content: noteToSave.content || "",
      category: noteToSave.category || "Outros",
      isPinned: noteToSave.isPinned || false
    };

    try {
      const method = isTempId || !noteToSave.id ? "POST" : "PUT";
      const endpoint = isTempId || !noteToSave.id ? `/api/notes` : `/api/notes/${noteToSave.id}`;

      const res = await fetch(endpoint, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error("Erro no servidor (Possível arquivo muito grande)");
      const savedData = await res.json();
      
      setOpenTabs(prev => prev.map(tab => tab.id === noteToSave.id ? savedData : tab));
      setActiveTabId(savedData.id);

      if (!openFolders[savedData.category]) {
        setOpenFolders(prev => ({ ...prev, [savedData.category]: true }));
      }
      showLocalToast("Nota salva com sucesso.");
      loadNotes(); 
    } catch (error) { 
      console.error(error);
      showLocalToast("Falha ao tentar salvar. O arquivo pode ser muito grande."); 
    }
  };

  const handleDeleteNote = async (id, e) => {
    e.stopPropagation();
    if (window.confirm("Apagar permanentemente esta página?")) {
      await fetch(`/api/notes/${id}`, { method: "DELETE" });
      closeTab(e, id);
      loadNotes();
      showLocalToast("Registro apagado.");
    }
  };

  const handleSelectNote = (note) => {
    const isAlreadyOpen = openTabs.find(t => t.id === note.id);
    if (!isAlreadyOpen) setOpenTabs(prev => [...prev, note]);
    setActiveTabId(note.id);
  };

  const closeTab = (e, idToClose) => {
    e.stopPropagation();
    const newTabs = openTabs.filter(t => t.id !== idToClose);
    setOpenTabs(newTabs);
    if (activeTabId === idToClose) {
      setActiveTabId(newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null);
    }
  };

  // === CRIAÇÃO IN-LINE ===
  const triggerCreateFolder = () => { setCreatingType('folder'); setCreatingText(''); };
  const triggerCreateSubfolder = (parentPath, e) => { e.stopPropagation(); setCreatingType('subfolder'); setCreatingTargetFolder(parentPath); setCreatingText(''); setOpenFolders(prev => ({ ...prev, [parentPath]: true })); };
  const triggerCreateFile = (folderName, e) => { e.stopPropagation(); setCreatingType('file'); setCreatingTargetFolder(folderName); setCreatingText(''); setOpenFolders(prev => ({ ...prev, [folderName]: true })); };

  const handleGhostInputBlurOrEnter = async (e) => {
    if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== 'Escape') return;
    if (e.key === 'Escape') { setCreatingType(null); return; }

    const text = creatingText.trim();
    const type = creatingType;
    const targetFolder = creatingTargetFolder;
    
    setCreatingType(null); 
    if (text === "") return; 

    if (type === 'folder' || type === 'subfolder') {
      const finalPath = type === 'subfolder' ? `${targetFolder}/${text}` : text;
      const payload = { title: "Página Inicial", content: "", category: finalPath, isPinned: false };
      try {
         const res = await fetch(`/api/notes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
         const savedData = await res.json();
         setOpenTabs(prev => [...prev, savedData]);
         setActiveTabId(savedData.id);
         setOpenFolders(prev => ({ ...prev, [finalPath]: true }));
         if (type === 'subfolder') setOpenFolders(prev => ({ ...prev, [targetFolder]: true }));
         loadNotes();
      } catch (err) { console.error(err); }
    } else if (type === 'file') {
      const payload = { title: text, content: "", category: targetFolder, isPinned: false };
      try {
         const res = await fetch(`/api/notes`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
         const savedData = await res.json();
         setOpenTabs(prev => [...prev, savedData]);
         setActiveTabId(savedData.id);
         loadNotes();
      } catch (err) { console.error(err); }
    }
  };

  const renameFolder = async (oldPath, newName) => {
    if (!newName || newName.trim() === "" || oldPath.endsWith(newName)) return;
    const parentPath = oldPath.substring(0, oldPath.lastIndexOf('/'));
    const newPath = parentPath ? `${parentPath}/${newName}` : newName;
    if (oldPath === newPath) return;

    const notesToUpdate = notes.filter(n => n.category === oldPath || n.category?.startsWith(`${oldPath}/`));
    setVirtualFolders(prev => prev.map(f => f === oldPath ? newPath : f.startsWith(`${oldPath}/`) ? f.replace(oldPath, newPath) : f));
    setOpenFolders(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => {
         if (k === oldPath) { next[newPath] = next[k]; delete next[k]; }
         else if (k.startsWith(`${oldPath}/`)) {
           const sub = k.replace(oldPath, newPath); next[sub] = next[k]; delete next[k];
         }
      });
      return next;
    });

    if (notesToUpdate.length > 0) {
      showLocalToast("Atualizando árvore no banco...");
      for (const note of notesToUpdate) {
        const updatedCat = note.category === oldPath ? newPath : note.category.replace(`${oldPath}/`, `${newPath}/`);
        await fetch(`/api/notes/${note.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...note, category: updatedCat }) });
      }
      loadNotes();
      setOpenTabs(prev => prev.map(t => {
         if (t.category === oldPath) return { ...t, category: newPath };
         if (t.category?.startsWith(`${oldPath}/`)) return { ...t, category: t.category.replace(`${oldPath}/`, `${newPath}/`) };
         return t;
      }));
      showLocalToast("Diretório atualizado!");
    }
  };

  const renameFile = async (id, newTitle) => {
    if (!newTitle || newTitle.trim() === "") return;
    const noteToUpdate = notes.find(n => n.id === id);
    if (!noteToUpdate || noteToUpdate.title === newTitle) return;
    try {
      await fetch(`/api/notes/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...noteToUpdate, title: newTitle }) });
      loadNotes();
      setOpenTabs(prev => prev.map(t => t.id === id ? { ...t, title: newTitle } : t));
      showLocalToast("Página renomeada.");
    } catch (error) { console.error(error); }
  };

  const toggleFolder = (folderName) => setOpenFolders(prev => ({ ...prev, [folderName]: !prev[folderName] }));

  // === DRAG & DROP E MODAL DE MÍDIA ===
  const processFile = (file) => {
    if (!file || !editor) return;
    const type = file.type;

    // ✅ SEGURANÇA: Limite de 5MB para imagens
    if (file.size > 5 * 1024 * 1024) {
      showLocalToast("Arquivo muito grande. Máximo 5MB.");
      return;
    }

    if (type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        editor.chain().focus().setImage({ src: e.target.result }).run();
        setIsMediaModalOpen(false);
      };
      reader.readAsDataURL(file);
    } 
    else if (type === 'text/xml' || type === 'application/xml' || type === 'application/json' || type.startsWith('text/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        editor.chain().focus().insertContent(`<p><strong>📄 ${file.name}</strong></p>`).setCodeBlock().insertContent(text).run();
        setIsMediaModalOpen(false);
      };
      reader.readAsText(file);
    } 
    else if (file.name.endsWith('.exe') || file.name.endsWith('.bat') || file.name.endsWith('.sh')) {
      showLocalToast("Formato bloqueado por segurança.");
    } else {
      showLocalToast("Formato não suportado para visualização.");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleMediaUrlSubmit = (e) => {
    e.preventDefault();
    if (!mediaUrl || !editor) return;

    // ✅ SEGURANÇA: Validar protocolo da URL
    try {
      const url = new URL(mediaUrl);
      if (!['http:', 'https:'].includes(url.protocol)) {
        showLocalToast("URL inválida. Use http:// ou https://");
        return;
      }
    } catch {
      showLocalToast("URL inválida.");
      return;
    }
    
    if (mediaUrl.includes('youtube.com') || mediaUrl.includes('youtu.be')) {
      editor.chain().focus().setYoutubeVideo({ src: mediaUrl }).run();
    } else {
      editor.chain().focus().setImage({ src: mediaUrl }).run();
    }
    setMediaUrl("");
    setIsMediaModalOpen(false);
  };

  // === MONTAGEM DA ÁRVORE ===
  const DEFAULT_CATEGORIES = ["Integrações", "Fiscal", "Logística", "Outros"];
  const categoriesFromNotes = notes.map(n => n.category).filter(c => c && c.trim() !== "");
  const allCategoriesSet = new Set([...DEFAULT_CATEGORIES, ...virtualFolders, ...categoriesFromNotes]);

  const buildFlatTree = () => {
    const root = { subfolders: {}, notes: [] };
    const ensurePath = (path) => {
      if (!path) return root;
      const parts = path.split('/');
      let current = root;
      let currentPath = '';
      for (const part of parts) {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        if (!current.subfolders[part]) current.subfolders[part] = { name: part, path: currentPath, subfolders: {}, notes: [] };
        current = current.subfolders[part];
      }
      return current;
    };

    allCategoriesSet.forEach(cat => ensurePath(cat));
    
    const isSearching = searchQuery.trim().length > 0;
    const q = searchQuery.toLowerCase();
    notes.forEach(note => {
      if (!isSearching || note.title?.toLowerCase().includes(q) || note.content?.toLowerCase().includes(q)) {
        ensurePath(note.category || "Outros").notes.push(note);
      }
    });

    const flatTree = [];
    const traverse = (subfolders, level = 0) => {
       const sortedKeys = Object.keys(subfolders).sort((a,b) => a.localeCompare(b));
       for (const key of sortedKeys) {
          const folder = subfolders[key];
          flatTree.push({ type: 'folder', level, ...folder });
          
          if (openFolders[folder.path] || isSearching) {
             traverse(folder.subfolders, level + 1);
             folder.notes.sort((a,b) => (a.title||"").localeCompare(b.title||"")).forEach(note => {
                flatTree.push({ type: 'note', level: level + 1, note });
             });
             
             if (creatingTargetFolder === folder.path && (creatingType === 'file' || creatingType === 'subfolder')) {
                flatTree.push({ type: 'ghost', level: level + 1, ghostType: creatingType });
             }
             
             if (Object.keys(folder.subfolders).length === 0 && folder.notes.length === 0 && creatingTargetFolder !== folder.path) {
                flatTree.push({ type: 'empty', level: level + 1 });
             }
          }
       }
    };
    traverse(root.subfolders);
    return flatTree;
  };
  const treeData = buildFlatTree();

  // === AÇÕES DE RECADOS E TICKER ANIMADO ===
  const deleteAlert = async (e, id) => {
    e.stopPropagation();
    if(window.confirm("Apagar permanentemente este recado?")) {
      try {
        await fetch(`/api/alerts/${id}`, { method: 'DELETE' });
        showGlobalToast("Recado excluído!");
        fetchAlerts();
      } catch (err) { console.error(err); }
    }
  };

  const setAlertStatus = async (e, id, status) => {
    e.stopPropagation();
    try {
      await fetch(`/api/alerts/${id}`, { method: 'PUT', headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      showGlobalToast(status === 'closed' ? "Recado encerrado!" : "Recado reativado!");
      fetchAlerts();
    } catch (err) { console.error(err); }
  };

  const editAlert = (e, alert) => {
    e.stopPropagation();
    setRecadoForm(alert);
    setIsRecadoModalOpen(true);
  };

  const getAlertIcon = (type, size = 14) => {
    switch (type) {
      case 'incidente': return <AlertTriangle size={size} className="text-red-500" />;
      case 'lembrete': return <AlarmClock size={size} className="text-amber-500" />;
      default: return <Info size={size} className="text-blue-500" />;
    }
  };

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const closedAlerts = alerts.filter(a => a.status === 'closed');

  const groupedClosedAlerts = closedAlerts.reduce((acc, alert) => {
    const date = new Date(alert.createdAt).toLocaleDateString('pt-BR');
    if (!acc[date]) acc[date] = [];
    acc[date].push(alert);
    return acc;
  }, {});



  return (
    <div className="flex flex-col h-full w-full bg-slate-50 text-slate-900 font-sans overflow-hidden transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <style>{customStyles}</style>
      
      {toast && (
        <div className="fixed top-20 right-8 bg-slate-800 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 animate-in fade-in slide-in-from-top-5 border border-slate-700 dark:bg-slate-800 dark:border-slate-700">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <span className="font-medium text-sm">{toast}</span>
        </div>
      )}

      {/* ================= MODAL DE MÍDIA E ANEXOS ================= */}
      {isMediaModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-bold">
                <Paperclip size={20} className="text-emerald-600 dark:text-emerald-400" />
                <h3>Anexar Arquivo ou Mídia</h3>
              </div>
              <button onClick={() => setIsMediaModalOpen(false)} className="text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 p-1 rounded"><X size={20}/></button>
            </div>
            
            <div className="flex border-b border-slate-200 dark:border-slate-800">
              <button onClick={() => setMediaTab('upload')} className={`flex-1 flex justify-center items-center gap-2 py-3 text-xs font-bold transition-colors ${mediaTab === 'upload' ? 'border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                <UploadCloud size={14}/> Computador
              </button>
              <button onClick={() => setMediaTab('link')} className={`flex-1 flex justify-center items-center gap-2 py-3 text-xs font-bold transition-colors ${mediaTab === 'link' ? 'border-b-2 border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                <LinkIcon size={14}/> URL Externa
              </button>
            </div>

            <div className="p-6">
              {mediaTab === 'upload' ? (
                <div 
                  className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl transition-all ${isDragging ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10' : 'border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50'}`}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                >
                  <div className="flex gap-4 text-slate-400 dark:text-slate-500 mb-4">
                    <ImageIcon size={32}/> <VideoIcon size={32}/> <FileCode size={32}/>
                  </div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300 text-center">Arraste e solte o arquivo aqui</p>
                  <p className="text-xs text-slate-500 text-center mt-2 px-4 leading-relaxed">Suporta Imagens (PNG, JPG, GIF) e Arquivos de Texto (XML, JSON, TXT). Eles serão lidos de forma segura e inseridos na página.</p>
                  <div className="mt-6 flex items-center justify-center w-full">
                     <span className="text-xs text-slate-400 bg-white dark:bg-slate-800 px-2 relative z-10">OU</span>
                     <div className="h-px bg-slate-200 dark:bg-slate-700 w-full absolute"></div>
                  </div>
                  <label className="mt-4 px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded cursor-pointer transition-colors">
                    Procurar no Computador
                    <input type="file" className="hidden" onChange={(e) => { if(e.target.files?.length) processFile(e.target.files[0]); }} />
                  </label>
                  <p className="text-[10px] text-slate-400 mt-6 font-mono text-center bg-slate-100 dark:bg-slate-900 px-3 py-1.5 rounded">Dica: Você também pode simplesmente dar Ctrl+V na imagem direto dentro da página!</p>
                </div>
              ) : (
                <form onSubmit={handleMediaUrlSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Cole o link da Imagem, GIF ou Vídeo (YouTube)</label>
                    <input autoFocus value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} placeholder="Ex: https://youtube.com/watch?v=..." className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl outline-none focus:border-emerald-500 transition-colors text-sm dark:text-slate-200" />
                  </div>
                  <div className="flex justify-end pt-2">
                    <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition-colors shadow-sm flex items-center gap-2">Inserir</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        
        {/* === EXPLORADOR ESQUERDO === */}
        <aside className="w-72 border-r border-slate-200 bg-slate-50 flex flex-col shrink-0 dark:bg-slate-900/80 dark:border-slate-800">
          <div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-3 shrink-0">
             <div className="relative group">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 dark:group-focus-within:text-emerald-400" />
                <input 
                  type="text" placeholder="Deep Search (Títulos ou Conteúdo)..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-md h-8 pl-8 pr-2 text-xs focus:outline-none focus:border-emerald-500/50 transition-all text-slate-800 placeholder-slate-400 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-200 dark:focus:border-emerald-500/50 shadow-sm"
                />
             </div>
             <div className="flex items-center justify-between pl-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest dark:text-slate-400">DeskHub Workspace</span>
                <button onClick={triggerCreateFolder} title="Novo Diretório" className="text-slate-400 hover:text-emerald-600 transition-colors p-1 hover:bg-slate-200 rounded dark:hover:bg-slate-800"><FolderPlus size={14} /></button>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto pt-2 pb-4 custom-scrollbar select-none">
             {creatingType === 'folder' && (
                <div className="flex items-center gap-1.5 px-2 py-1.5 mx-2 mb-1 text-sm font-medium rounded bg-emerald-50 dark:bg-emerald-900/30">
                  <ChevronRight size={14} className="text-emerald-500 shrink-0" />
                  <Folder size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" fill="currentColor" fillOpacity={0.2} />
                  <input 
                    ref={ghostInputRef} value={creatingText} onChange={e => setCreatingText(e.target.value)} onBlur={handleGhostInputBlurOrEnter} onKeyDown={handleGhostInputBlurOrEnter}
                    className="bg-transparent border-none outline-none w-full text-xs text-emerald-800 dark:text-emerald-300" placeholder="Nome da pasta..."
                  />
                </div>
             )}

             {treeData.map((item, i) => {
               const paddingStyle = { paddingLeft: `${(item.level * 16) + 8}px` };

               if (item.type === 'folder') {
                 const isOpen = openFolders[item.path] || searchQuery.length > 0;
                 return (
                   <div key={`folder-${item.path}`} style={paddingStyle} className="mb-0.5">
                     <div className="flex items-center justify-between py-1.5 pr-2 mr-2 text-sm font-medium text-slate-700 rounded hover:bg-slate-200/50 cursor-pointer transition-colors group dark:text-slate-300 dark:hover:bg-slate-800">
                        <div className="flex items-center gap-1.5 flex-1 overflow-hidden" onClick={() => toggleFolder(item.path)}>
                          {isOpen ? <ChevronDown size={14} className="text-slate-400 shrink-0" /> : <ChevronRight size={14} className="text-slate-400 shrink-0" />}
                          {isOpen ? <FolderOpen size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" fill="currentColor" fillOpacity={0.2} /> : <Folder size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" fill="currentColor" fillOpacity={0.2} />}
                          
                          {editingFolder === item.path ? (
                            <input 
                              autoFocus value={editingFolderText} onChange={(e) => setEditingFolderText(e.target.value)} onBlur={() => { renameFolder(item.path, editingFolderText); setEditingFolder(null); }} onKeyDown={(e) => { if(e.key === 'Enter'){ renameFolder(item.path, editingFolderText); setEditingFolder(null); } }}
                              className="text-xs bg-white border border-emerald-500 rounded px-1 w-full text-slate-800 dark:bg-slate-900 dark:text-white outline-none" onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <span className="truncate flex-1 text-xs">{item.name}</span>
                          )}
                        </div>

                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0 transition-opacity">
                           <button onClick={(e) => { e.stopPropagation(); setEditingFolder(item.path); setEditingFolderText(item.name); }} title="Renomear Pasta" className="p-1 rounded hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-500"><Edit2 size={12} /></button>
                           <button onClick={(e) => triggerCreateSubfolder(item.path, e)} title="Nova Sub-pasta" className="p-1 rounded hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-500"><FolderPlus size={12} /></button>
                           <button onClick={(e) => triggerCreateFile(item.path, e)} title="Nova Página Aqui" className="p-1 rounded hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-500"><FilePlus size={12} /></button>
                        </div>
                     </div>
                   </div>
                 );
               }

               if (item.type === 'note') {
                 return (
                   <div key={`note-${item.note.id}`} style={paddingStyle} className="mb-0.5">
                     <div onClick={() => handleSelectNote(item.note)} className={`flex items-center justify-between text-[11px] py-1.5 pr-2 mr-2 border-l border-slate-200/50 dark:border-slate-800/50 pl-2 rounded cursor-pointer group transition-all ${activeTabId === item.note.id ? 'bg-slate-200/80 font-medium dark:bg-slate-800/80 text-emerald-700 dark:text-emerald-400' : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200'}`}>
                        <div className="flex items-center gap-2 truncate flex-1 pr-2">
                          <FileText size={12} className="opacity-70 shrink-0 text-slate-500 dark:text-slate-400" />
                          
                          {editingFile === item.note.id ? (
                            <input 
                              autoFocus value={editingFileText} onChange={(e) => setEditingFileText(e.target.value)} onBlur={() => { renameFile(item.note.id, editingFileText); setEditingFile(null); }} onKeyDown={(e) => { if(e.key === 'Enter'){ renameFile(item.note.id, editingFileText); setEditingFile(null); } }}
                              className="text-[11px] bg-white border border-emerald-500 rounded px-1 w-full text-slate-800 dark:bg-slate-900 dark:text-white outline-none" onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <span className="truncate">{item.note.title || "Sem título"}</span>
                          )}
                        </div>
                        
                        {!editingFile && (
                          <div className="relative shrink-0 flex items-center">
                            <button 
                              onClick={(e) => { e.stopPropagation(); setOpenFileMenu(openFileMenu === item.note.id ? null : item.note.id); }} 
                              className={`p-0.5 rounded transition-colors text-slate-500 ${openFileMenu === item.note.id ? 'opacity-100 bg-slate-300 dark:bg-slate-700' : 'opacity-0 group-hover:opacity-100 hover:bg-slate-300 dark:hover:bg-slate-700'}`}
                            >
                              <MoreVertical size={14}/>
                            </button>
                            {openFileMenu === item.note.id && (
                              <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 shadow-xl rounded-md z-50 py-1 w-28 dark:bg-slate-800 dark:border-slate-700">
                                <button onClick={(e) => { e.stopPropagation(); setEditingFile(item.note.id); setEditingFileText(item.note.title); setOpenFileMenu(null); }} className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors">Renomear</button>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteNote(item.note.id, e); setOpenFileMenu(null); }} className="w-full text-left px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 transition-colors">Excluir</button>
                              </div>
                            )}
                          </div>
                        )}
                     </div>
                   </div>
                 );
               }

               if (item.type === 'ghost') {
                 return (
                   <div key={`ghost-${i}`} style={paddingStyle} className="mb-0.5">
                     <div className="flex items-center gap-2 text-[11px] py-1.5 pr-2 mr-2 border-l border-emerald-500/50 pl-2 rounded bg-emerald-50 dark:bg-emerald-900/30">
                       {item.ghostType === 'file' ? <FileText size={12} className="text-slate-500 shrink-0" /> : <Folder size={12} className="text-emerald-600 dark:text-emerald-400 shrink-0" fill="currentColor" fillOpacity={0.2} />}
                       <input 
                         ref={ghostInputRef} value={creatingText} onChange={e => setCreatingText(e.target.value)} onBlur={handleGhostInputBlurOrEnter} onKeyDown={handleGhostInputBlurOrEnter}
                         className="bg-transparent border-none outline-none w-full text-slate-800 dark:text-slate-200" placeholder={item.ghostType === 'file' ? "Nome da página..." : "Nova pasta..."}
                       />
                     </div>
                   </div>
                 );
               }

               if (item.type === 'empty') {
                 return <span key={`empty-${i}`} style={paddingStyle} className="text-[10px] text-slate-400 italic py-1 block opacity-50 border-l border-slate-200/50 dark:border-slate-800/50 pl-4">Pasta vazia</span>;
               }

               return null;
             })}
          </div>
        </aside>

        {/* === ÁREA CENTRAL (IDE Editor com Folha Sulfite) === */}
        <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-950 relative border-r border-slate-200 dark:border-slate-800">
          
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 shrink-0 dark:bg-slate-900 dark:border-slate-800 h-[45px] z-10 relative shadow-sm">
             <div className="flex overflow-x-auto pt-2 pl-2 gap-1 h-full custom-scrollbar">
                {openTabs.map(tab => (
                  <div key={tab.id} onClick={() => setActiveTabId(tab.id)} className={`flex items-center gap-2 px-4 py-2 text-[11px] border border-slate-200 border-b-0 rounded-t-lg font-semibold cursor-pointer relative z-10 transition-colors ${activeTabId === tab.id ? 'bg-white text-emerald-700 dark:bg-slate-950 dark:border-slate-800 dark:text-emerald-400 shadow-[0_2px_0_0_#fff] dark:shadow-[0_2px_0_0_#020617]' : 'bg-slate-100 text-slate-500 hover:bg-white dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-800/50 dark:hover:bg-slate-900'}`}>
                    <FileText size={12} className="opacity-70 shrink-0 text-slate-500" />
                    <span className="truncate max-w-[120px]">{tab.title || "Sem Título"}</span>
                    <button onClick={(e) => closeTab(e, tab.id)} className="opacity-50 hover:opacity-100 hover:bg-slate-200 dark:hover:bg-slate-700 p-0.5 rounded"><X size={12}/></button>
                  </div>
                ))}
             </div>
             
             <div className="flex items-center gap-2 pr-3 pb-1 shrink-0">
               {!rightPanelOpen && (
                  <button onClick={() => setRightPanelOpen(true)} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-emerald-600 p-1.5 rounded bg-slate-100 transition-colors dark:bg-slate-800 dark:text-slate-400 dark:hover:text-emerald-400 uppercase tracking-widest border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                    <BellRing size={12}/> Recados
                  </button>
               )}
               {activeTabId && (
                 <button onClick={() => handleSaveNote(currentNote)} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded text-xs font-bold hover:bg-emerald-700 transition-all shadow-sm">
                   <Save size={14} /> Salvar
                 </button>
               )}
             </div>
          </div>

          {activeTabId ? (
            <div className="flex flex-col flex-1 overflow-hidden relative animate-in fade-in duration-300 paper-wrapper">
               <MenuBar editor={editor} onOpenMediaModal={() => setIsMediaModalOpen(true)} />
               
               <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
                 {/* Estilo A4 aplicado aqui */}
                 <div className="paper-document">
                   <div className="mb-4">
                      <input 
                        type="text" placeholder="Título da Página" value={currentNote.title || ""} 
                        onChange={(e) => setOpenTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, title: e.target.value } : t))}
                        onBlur={() => { if(currentNote.id && !currentNote.id.startsWith('temp-')) handleSaveNote(currentNote); }} 
                        className="w-full bg-transparent outline-none text-4xl font-extrabold text-slate-800 placeholder-slate-300 tracking-tight dark:text-slate-100 dark:placeholder-slate-700" 
                      />
                   </div>
                   <EditorContent editor={editor} />
                 </div>
               </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 select-none paper-wrapper">
                <FileText size={48} className="opacity-20 mb-4" />
                <p>Selecione um arquivo na barra lateral ou crie um novo.</p>
            </div>
          )}
        </main>

        {/* === PAINEL DIREITO: NOVO QUADRO DE RECADOS === */}
        {rightPanelOpen && (
          <aside className="w-80 bg-slate-50/30 flex flex-col shrink-0 animate-in slide-in-from-right duration-300 dark:bg-slate-900/50 shadow-[-5px_0_15px_-3px_rgba(0,0,0,0.05)] z-20">
            <div className="h-[45px] border-b border-slate-200 flex items-center justify-between px-3 shrink-0 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <BellRing size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest dark:text-slate-400">Recados da Operação</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => { setRecadoForm({ id: null, title: "", description: "", type: "informativo" }); setIsRecadoModalOpen(true); }} className="text-emerald-600 bg-emerald-100 p-1 rounded hover:bg-emerald-200 transition-colors dark:text-emerald-400 dark:bg-emerald-500/20 dark:hover:bg-emerald-500/30" title="Novo Recado"><Plus size={14}/></button>
                <button onClick={() => setRightPanelOpen(false)} className="text-slate-400 hover:text-slate-700 p-1 transition-colors dark:hover:text-slate-200"><PanelRightClose size={14}/></button>
              </div>
            </div>
            
            {/* Abas do Quadro de Recados */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 shrink-0">
              <button onClick={() => setAlertTab('ativos')} className={`flex-1 text-[11px] font-bold uppercase tracking-widest py-2 border-b-2 transition-colors ${alertTab === 'ativos' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Ativos ({activeAlerts.length})</button>
              <button onClick={() => setAlertTab('encerrados')} className={`flex-1 text-[11px] font-bold uppercase tracking-widest py-2 border-b-2 transition-colors ${alertTab === 'encerrados' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Encerrados</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50">
              
              {/* CONTEÚDO: ATIVOS */}
              {alertTab === 'ativos' && (
                <div className="space-y-3">
                  {activeAlerts.length === 0 ? (
                     <div className="text-center py-10 text-slate-400">Nenhum recado ativo! 🎉</div>
                  ) : (
                    activeAlerts.map(alert => (
                      <div key={alert.id} className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer group dark:bg-slate-800 dark:border-slate-700" onClick={() => setSelectedNotification(alert)}>
                        <div className="flex items-start gap-2">
                           <div className="mt-0.5">{getAlertIcon(alert.type, 16)}</div>
                           <div className="flex-1 min-w-0">
                             <h4 className="text-xs font-bold text-slate-800 truncate dark:text-slate-100">{alert.title}</h4>
                             <p className="text-[10px] text-slate-400 font-mono mt-0.5">{new Date(alert.createdAt).toLocaleString('pt-BR')}</p>
                           </div>
                        </div>
                        <div className="mt-3 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={(e) => editAlert(e, alert)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors" title="Editar"><Edit2 size={12} /></button>
                           <button onClick={(e) => deleteAlert(e, alert.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Excluir"><Trash2 size={12} /></button>
                           <button onClick={(e) => setAlertStatus(e, alert.id, 'closed')} className="px-2 py-1 flex items-center gap-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded hover:bg-emerald-100 transition-colors border border-emerald-200 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:text-emerald-400">
                             <CheckSquare size={12} /> Encerrar
                           </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* CONTEÚDO: ENCERRADOS */}
              {alertTab === 'encerrados' && (
                <div className="space-y-6">
                  {Object.keys(groupedClosedAlerts).length === 0 ? (
                     <div className="text-center py-10 text-slate-400">Histórico limpo.</div>
                  ) : (
                    Object.entries(groupedClosedAlerts).sort(([dateA], [dateB]) => {
                      const parseDate = (d) => new Date(d.split('/').reverse().join('-'));
                      return parseDate(dateB) - parseDate(dateA);
                    }).map(([dateStr, alertsInDate]) => (
                      <div key={dateStr} className="space-y-2">
                        <h5 className="text-[10px] font-bold text-slate-500 bg-slate-200/50 inline-block px-2 py-1 rounded-md dark:bg-slate-800 dark:text-slate-400">{dateStr}</h5>
                        {alertsInDate.map(alert => (
                          <div key={alert.id} className="bg-slate-100/50 border border-slate-200 rounded-xl p-3 group dark:bg-slate-800/30 dark:border-slate-800" onClick={() => setSelectedNotification(alert)}>
                            <div className="flex items-start gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                               <div className="mt-0.5 grayscale">{getAlertIcon(alert.type, 16)}</div>
                               <div className="flex-1 min-w-0 line-through">
                                 <h4 className="text-xs font-bold text-slate-600 truncate dark:text-slate-400">{alert.title}</h4>
                                 <p className="text-[10px] text-slate-400 font-mono mt-0.5">{new Date(alert.createdAt).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</p>
                               </div>
                            </div>
                            <div className="mt-3 flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button onClick={(e) => deleteAlert(e, alert.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="Excluir Permanentemente"><Trash2 size={12} /></button>
                               <button onClick={(e) => setAlertStatus(e, alert.id, 'active')} className="px-2 py-1 flex items-center gap-1 bg-amber-50 text-amber-600 text-[10px] font-bold rounded hover:bg-amber-100 transition-colors border border-amber-200 dark:bg-amber-500/10 dark:border-amber-500/20 dark:text-amber-400">
                                 <RotateCcw size={12} /> Reativar
                               </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
