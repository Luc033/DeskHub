import { useState, useEffect } from 'react';
import { Copy, Trash2, Pencil, CheckCircle2, Route, X, Save } from 'lucide-react';

export default function Shortcuts({ searchQuery, refreshKey }) {
  const [shortcuts, setShortcuts] = useState([]);
  const [toast, setToast] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetch(`/api/shortcuts`)
      .then(res => res.json())
      .then(data => setShortcuts(data))
      .catch(err => console.error("Erro ao buscar rotas:", err));
  }, [refreshKey]);

  const handleDelete = async (id) => {
    if(window.confirm("Tem certeza que deseja excluir esta rota?")) {
      try {
        await fetch(`/api/shortcuts/${id}`, { method: 'DELETE' });
        setShortcuts(shortcuts.filter(s => s.id !== id));
        showToast('Rota excluída!');
      } catch (error) {
        console.error("Erro ao deletar:", error);
      }
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/shortcuts/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingItem.title,
          content: editingItem.content
        })
      });
      
      const updatedShortcut = await response.json();
      setShortcuts(shortcuts.map(s => s.id === updatedShortcut.id ? updatedShortcut : s));
      setEditingItem(null);
      showToast('Rota atualizada com sucesso!');
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      alert('Erro ao atualizar no banco de dados!');
    }
  };

  const handleCopy = (content) => {
    navigator.clipboard.writeText(content);
    showToast('Caminho copiado!');
  };

  const filtered = shortcuts.filter(s => 
    (s.title || '').toLowerCase().includes((searchQuery || '').toLowerCase()) || 
    (s.content || '').toLowerCase().includes((searchQuery || '').toLowerCase())
  );

  return (
    <div className="animate-in fade-in duration-500 ">
      {toast && (
        <div className="fixed bottom-8 right-8 bg-slate-800 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 dark:bg-slate-700 dark:border dark:border-slate-600">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <span className="font-medium text-sm">{toast}</span>
        </div>
      )}

      {/* MODAL DE EDIÇÃO */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300 dark:bg-slate-800 dark:border dark:border-slate-700">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 dark:text-slate-200">
                <Pencil className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> Editar Rota
              </h2>
              <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 p-1.5 rounded-full transition-colors border border-slate-200 dark:bg-slate-800 dark:border-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 dark:text-slate-300">Título da Rota</label>
                <input required value={editingItem.title} onChange={e => setEditingItem({...editingItem, title: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-200" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 dark:text-slate-300">Caminho Exato</label>
                <input required value={editingItem.content} onChange={e => setEditingItem({...editingItem, content: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-200" />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setEditingItem(null)} className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-200 hover:text-slate-800 transition-colors text-sm dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200">Cancelar</button>
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm flex items-center gap-2">
                  <Save className="h-4 w-4" /> Atualizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map(s => (
          <div key={s.id} className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-500/30 shadow-sm hover:shadow-md transition-all group flex flex-col relative overflow-hidden dark:bg-slate-800 dark:border-slate-700 dark:hover:border-emerald-500/50">
            <div className="flex justify-between items-start mb-3">
              <span className="text-sm font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-lg truncate max-w-[80%] dark:text-emerald-400 dark:bg-emerald-500/10 dark:border dark:border-emerald-500/20">
                {s.title}
              </span>
              <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => setEditingItem(s)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors dark:hover:bg-slate-700/50 dark:hover:text-blue-400" title="Editar">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => handleDelete(s.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-red-950/30 dark:hover:text-red-400" title="Eliminar">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex-1 flex items-center justify-between gap-3 dark:bg-slate-900/50 dark:border-slate-700/50">
              <span className="text-sm text-slate-600 font-medium truncate dark:text-slate-300">{s.content}</span>
              <button onClick={() => handleCopy(s.content)} className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors shrink-0 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20" title="Copiar Rota">
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-400 bg-white border border-dashed border-slate-300 rounded-2xl mt-4 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500">
          <Route className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium text-slate-500">Nenhuma rota encontrada.</p>
        </div>
      )}
    </div>
  );
}