import { useState, useEffect } from 'react';
import { Trash2, Pencil, CheckCircle2, Tags, X, Save, PlusCircle } from 'lucide-react';

export default function Categories({ searchQuery, refreshKey }) {
  const [categories, setCategories] = useState([]);
  const [toast, setToast] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [newName, setNewName] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetch('/api/categories')
      .then(res => {
        if (!res.ok) throw new Error('Falha na API');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) setCategories(data);
        else setCategories([]);
      })
      .catch(err => {
        console.error('Erro ao buscar categorias:', err);
        setCategories([]);
      });
  }, [refreshKey]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast(err.error || 'Erro ao criar categoria');
        return;
      }
      const created = await res.json();
      setCategories(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName('');
      showToast('Categoria criada com sucesso!');
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      showToast('Erro de rede ao criar categoria');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
      try {
        await fetch(`/api/categories/${id}`, { method: 'DELETE' });
        setCategories(categories.filter(c => c.id !== id));
        showToast('Categoria excluída!');
      } catch (error) {
        console.error('Erro ao deletar:', error);
      }
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/categories/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingItem.name })
      });
      const updated = await res.json();
      setCategories(categories.map(c => c.id === updated.id ? updated : c).sort((a, b) => a.name.localeCompare(b.name)));
      setEditingItem(null);
      showToast('Categoria atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      alert('Erro ao atualizar no banco de dados!');
    }
  };

  const filtered = categories.filter(c =>
    (c.name || '').toLowerCase().includes((searchQuery || '').toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {toast && (
        <div className="fixed bottom-8 right-8 bg-slate-800 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 dark:bg-slate-700 dark:border dark:border-slate-600">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <span className="font-medium text-sm">{toast}</span>
        </div>
      )}

      {/* MODAL DE EDIÇÃO */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300 dark:bg-slate-800 dark:border dark:border-slate-700">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 dark:text-slate-200">
                <Pencil className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> Editar Categoria
              </h2>
              <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 p-1.5 rounded-full transition-colors border border-slate-200 dark:bg-slate-800 dark:border-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 dark:text-slate-300">Nome da Categoria</label>
                <input required value={editingItem.name} onChange={e => setEditingItem({ ...editingItem, name: e.target.value })} className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-200" />
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

      {/* LISTA DE CATEGORIAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map(cat => (
          <div key={cat.id} className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-emerald-500/30 shadow-sm hover:shadow-md transition-all group flex items-center justify-between relative overflow-hidden dark:bg-slate-800 dark:border-slate-700 dark:hover:border-emerald-500/50">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-center gap-3 pl-1 min-w-0">
              <span className="text-sm font-bold text-slate-700 truncate dark:text-slate-200">{cat.name}</span>
            </div>
            <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => setEditingItem(cat)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors dark:hover:bg-slate-700/50 dark:hover:text-blue-400" title="Editar">
                <Pencil className="h-4 w-4" />
              </button>
              <button onClick={() => handleDelete(cat.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-red-950/30 dark:hover:text-red-400" title="Eliminar">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && !newName && (
        <div className="text-center py-16 text-slate-400 bg-white border border-dashed border-slate-300 rounded-2xl dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500">
          <Tags className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium text-slate-500 dark:text-slate-400">Nenhuma categoria cadastrada.</p>
          <p className="text-sm text-slate-400 mt-1 dark:text-slate-500">Crie categorias para organizar suas mensagens e atendimentos.</p>
        </div>
      )}
    </div>
  );
}
