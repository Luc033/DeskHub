import { useState, useEffect } from 'react';
import { Copy, Trash2, Pencil, CheckCircle2, Link as LinkIcon, ExternalLink, X, Save } from 'lucide-react';

export default function Links({ searchQuery, refreshKey }) {
  const [links, setLinks] = useState([]);
  const [toast, setToast] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetch(`/api/links`)
      .then(res => res.json())
      .then(data => setLinks(data))
      .catch(err => console.error("Erro ao buscar links:", err));
  }, [refreshKey]);

  const handleDelete = async (id) => {
    if(window.confirm("Tem certeza que deseja excluir este link?")) {
      try {
        await fetch(`/api/links/${id}`, { method: 'DELETE' });
        setLinks(links.filter(l => l.id !== id));
        showToast('Link excluído!');
      } catch (error) {
        console.error("Erro ao deletar:", error);
      }
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/links/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingItem.title,
          url: editingItem.url
        })
      });
      
      const updatedLink = await response.json();
      setLinks(links.map(l => l.id === updatedLink.id ? updatedLink : l));
      setEditingItem(null);
      showToast('Link atualizado com sucesso!');
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      alert('Erro ao atualizar no banco de dados!');
    }
  };

  const handleCopy = (url) => {
    navigator.clipboard.writeText(url);
    showToast('URL copiada!');
  };

  const filtered = links.filter(l => 
    (l.title || '').toLowerCase().includes((searchQuery || '').toLowerCase()) || 
    (l.url || '').toLowerCase().includes((searchQuery || '').toLowerCase())
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
                <Pencil className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> Editar Link
              </h2>
              <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 p-1.5 rounded-full transition-colors border border-slate-200 dark:bg-slate-800 dark:border-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 dark:text-slate-300">Título do Link</label>
                <input required value={editingItem.title} onChange={e => setEditingItem({...editingItem, title: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-200" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 dark:text-slate-300">URL</label>
                <input required type="url" value={editingItem.url} onChange={e => setEditingItem({...editingItem, url: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-200" />
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
        {filtered.map(l => (
          <div key={l.id} className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-500/30 shadow-sm hover:shadow-md transition-all group flex items-center justify-between dark:bg-slate-800 dark:border-slate-700 dark:hover:border-emerald-500/50">
            <div className="flex-1 overflow-hidden pr-3">
              <a href={l.url} target="_blank" rel="noopener noreferrer" className="font-bold text-emerald-700 hover:text-emerald-500 flex items-center gap-2 truncate transition-colors text-base mb-1 dark:text-emerald-400 dark:hover:text-emerald-300">
                <LinkIcon className="h-4 w-4 shrink-0" /> {l.title}
              </a>
              <p className="text-xs text-slate-400 truncate dark:text-slate-500">{l.url}</p>
            </div>
            
            <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => setEditingItem(l)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors dark:hover:bg-slate-700/50 dark:hover:text-blue-400" title="Editar">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => handleCopy(l.url)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors dark:hover:bg-emerald-500/20 dark:hover:text-emerald-400" title="Copiar URL">
                <Copy className="h-4 w-4" />
              </button>
              <button onClick={() => handleDelete(l.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-red-950/30 dark:hover:text-red-400" title="Eliminar">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-400 bg-white border border-dashed border-slate-300 rounded-2xl mt-4 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500">
          <ExternalLink className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium text-slate-500">Nenhum link encontrado.</p>
        </div>
      )}
    </div>
  );
}