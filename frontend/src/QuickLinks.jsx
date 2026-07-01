import { useState, useEffect, useMemo } from 'react';
import {
  Search, PlusCircle, Trash2, Pencil, CheckCircle2, ExternalLink,
  Link as LinkIcon, X, Save, Tag, Star
} from 'lucide-react';

const emptyForm = { id: null, title: '', url: '', category: '' };

export default function QuickLinks() {
  const [quickLinks, setQuickLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // ===== Abre a URL em uma nova aba de forma deterministica =====
  // Nao depende do atributo target="_blank" sobreviver no DOM. O href e
  // mantido nos <a> para acessibilidade, clique do meio e Ctrl+clique.
  const abrirNovaAba = (e, url) => {
    e.preventDefault();
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // ===== READ: busca todos os QuickLinks do usuario logado =====
  const fetchQuickLinks = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/quicklinks');
      const data = await res.json();
      setQuickLinks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao buscar QuickLinks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQuickLinks(); }, []);

  // ===== CREATE / UPDATE: salva um novo link ou atualiza um existente =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    const isEditing = Boolean(form.id);
    const payload = {
      title: form.title,
      url: form.url,
      category: form.category.trim() || 'Geral',
    };

    try {
      const res = await fetch(
        isEditing ? `/api/quicklinks/${form.id}` : '/api/quicklinks',
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showToast('Erro: ' + (err.error || 'Falha ao salvar.'));
        return;
      }

      const saved = await res.json();

      if (isEditing) {
        setQuickLinks((prev) => prev.map((q) => (q.id === saved.id ? saved : q)));
        showToast('Link atualizado com sucesso!');
      } else {
        setQuickLinks((prev) => [saved, ...prev]);
        showToast('Link criado com sucesso!');
      }

      setIsModalOpen(false);
      setForm(emptyForm);
    } catch (error) {
      console.error('Erro ao salvar QuickLink:', error);
      showToast('Erro de rede. Verifique sua conexao.');
    }
  };

  // ===== FAVORITE: alterna o status de favorito (atualizacao otimista) =====
  const handleToggleFavorite = async (item) => {
    const novoValor = !item.favorite;
    setQuickLinks((prev) =>
      prev.map((q) => (q.id === item.id ? { ...q, favorite: novoValor } : q))
    );
    try {
      const res = await fetch(`/api/quicklinks/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ favorite: novoValor }),
      });
      if (!res.ok) throw new Error('Falha ao favoritar');
      const saved = await res.json();
      setQuickLinks((prev) => prev.map((q) => (q.id === saved.id ? saved : q)));
    } catch (error) {
      console.error('Erro ao favoritar:', error);
      setQuickLinks((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, favorite: item.favorite } : q))
      );
      showToast('Erro ao atualizar favorito.');
    }
  };

  // ===== DELETE: remove um link =====
  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este link?')) return;
    try {
      await fetch(`/api/quicklinks/${id}`, { method: 'DELETE' });
      setQuickLinks((prev) => prev.filter((q) => q.id !== id));
      showToast('Link excluido!');
    } catch (error) {
      console.error('Erro ao deletar:', error);
      showToast('Erro ao excluir o link.');
    }
  };

  // ===== Helpers de UI =====
  const openCreateModal = () => {
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setForm({ id: item.id, title: item.title, url: item.url, category: item.category || '' });
    setIsModalOpen(true);
  };

  // Chips de filtro: "Todas", "Favoritos" e as categorias existentes
  const categories = useMemo(() => {
    const set = new Set(quickLinks.map((q) => q.category || 'Geral'));
    return ['Todas', 'Favoritos', ...Array.from(set).sort()];
  }, [quickLinks]);

  // Filtro por texto (titulo OU categoria) + filtro pelo chip ativo
  const filtered = useMemo(() => {
    const term = searchQuery.toLowerCase();
    return quickLinks.filter((q) => {
      const matchesText =
        (q.title || '').toLowerCase().includes(term) ||
        (q.category || '').toLowerCase().includes(term) ||
        (q.url || '').toLowerCase().includes(term);
      const matchesFilter =
        activeCategory === 'Todas'
          ? true
          : activeCategory === 'Favoritos'
            ? q.favorite
            : (q.category || 'Geral') === activeCategory;
      return matchesText && matchesFilter;
    });
  }, [quickLinks, searchQuery, activeCategory]);

  return (
    <div className="animate-in fade-in duration-500">
      {/* TOAST */}
      {toast && (
        <div className="fixed bottom-8 right-8 bg-slate-800 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 dark:bg-slate-700 dark:border dark:border-slate-600">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <span className="font-medium text-sm">{toast}</span>
        </div>
      )}

      {/* BARRA SUPERIOR: busca + botao novo link */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        <div className="relative w-full max-w-md">
          <Search className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por titulo ou categoria..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 py-2.5 pl-12 pr-4 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:placeholder-slate-500"
          />
        </div>
        <button
          onClick={openCreateModal}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm flex items-center justify-center gap-2 shrink-0"
        >
          <PlusCircle className="h-5 w-5" strokeWidth={2.5} /> Novo Link
        </button>
      </div>

      {/* CHIPS DE CATEGORIA */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={
                'px-3 py-1.5 rounded-full text-xs font-bold transition-all border inline-flex items-center gap-1 ' +
                (activeCategory === cat
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 dark:hover:bg-slate-700')
              }
            >
              {cat === 'Favoritos' && (
                <Star
                  className={
                    'h-3.5 w-3.5 ' +
                    (activeCategory === cat ? 'fill-white' : 'fill-amber-400 text-amber-400')
                  }
                />
              )}
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* GRID DE CARDS */}
      {loading ? (
        <div className="text-center py-16 text-slate-400">
          <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((q) => (
            <div
              key={q.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-500/40 shadow-sm hover:shadow-md transition-all group flex flex-col gap-3 dark:bg-slate-800 dark:border-slate-700 dark:hover:border-emerald-500/50"
            >
              <div className="flex items-start justify-between gap-2">
                {/* Abrir em nova aba ao clicar no titulo */}
                <a
                  href={q.url}
                  onClick={(e) => abrirNovaAba(e, q.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-emerald-700 hover:text-emerald-500 flex items-center gap-2 transition-colors text-base dark:text-emerald-400 dark:hover:text-emerald-300 min-w-0"
                  title={q.title}
                >
                  <LinkIcon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{q.title}</span>
                </a>
                <div className="flex gap-1 shrink-0 items-center">
                  <button
                    onClick={() => handleToggleFavorite(q)}
                    className={
                      'p-1.5 rounded-lg transition-colors ' +
                      (q.favorite
                        ? 'text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10'
                        : 'text-slate-300 hover:text-amber-400 hover:bg-amber-50 dark:text-slate-600 dark:hover:text-amber-400 dark:hover:bg-amber-500/10')
                    }
                    title={q.favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                  >
                    <Star className={'h-4 w-4 ' + (q.favorite ? 'fill-amber-400' : '')} />
                  </button>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditModal(q)}
                      className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors dark:hover:bg-slate-700/50 dark:hover:text-blue-400"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(q.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-red-950/30 dark:hover:text-red-400"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <a
                href={q.url}
                onClick={(e) => abrirNovaAba(e, q.url)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-slate-400 truncate hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                title={q.url}
              >
                {q.url}
              </a>

              <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-100 dark:border-slate-700/50">
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full dark:bg-emerald-500/10 dark:text-emerald-400">
                  <Tag className="h-3 w-3" /> {q.category || 'Geral'}
                </span>
                <a
                  href={q.url}
                  onClick={(e) => abrirNovaAba(e, q.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-emerald-600 transition-colors dark:text-slate-400 dark:hover:text-emerald-400"
                >
                  Abrir <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ESTADO VAZIO */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-slate-400 bg-white border border-dashed border-slate-300 rounded-2xl mt-4 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500">
          <ExternalLink className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="font-medium text-slate-500 dark:text-slate-400">Nenhum link encontrado.</p>
          <p className="text-xs mt-1">Clique em &quot;Novo Link&quot; para adicionar o primeiro.</p>
        </div>
      )}

      {/* MODAL DE CRIACAO / EDICAO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300 dark:bg-slate-800 dark:border dark:border-slate-700">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 dark:text-slate-200">
                {form.id ? (
                  <><Pencil className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> Editar Link</>
                ) : (
                  <><PlusCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> Novo Link</>
                )}
              </h2>
              <button
                onClick={() => { setIsModalOpen(false); setForm(emptyForm); }}
                className="text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 p-1.5 rounded-full transition-colors border border-slate-200 dark:bg-slate-800 dark:border-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 dark:text-slate-300">Titulo</label>
                <input
                  required
                  placeholder="Ex: Painel do Bling"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-200"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 dark:text-slate-300">URL</label>
                <input
                  required
                  type="url"
                  placeholder="https://..."
                  value={form.url}
                  onChange={(e) => setForm((p) => ({ ...p, url: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-200"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 dark:text-slate-300">Categoria</label>
                <input
                  placeholder="Ex: Bling, Suporte, Financeiro... (padrao: Geral)"
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-200"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setForm(emptyForm); }}
                  className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-200 hover:text-slate-800 transition-colors text-sm dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm flex items-center gap-2"
                >
                  <Save className="h-4 w-4" /> {form.id ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
