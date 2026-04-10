import { useState, useEffect } from 'react';
import { Copy, Trash2, Pencil, Folder, CheckCircle2, MessageSquareText, X, Save } from 'lucide-react';

export default function Messages({ searchQuery, refreshKey }) {
  const [messages, setMessages] = useState([]);
  const [toast, setToast] = useState(null);
  const [categories, setCategories] = useState([]);
  
  // Novo estado para controlar a edição
  const [editingItem, setEditingItem] = useState(null); 

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

useEffect(() => {
    fetch(`/api/messages`)
      .then(res => {
        if (!res.ok) throw new Error("Falha na API");
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setMessages(data);
        } else {
          setMessages([]);
        }
      })
      .catch(err => {
        console.error("Erro ao buscar mensagens:", err);
        setMessages([]);
      });

    fetch('/api/categories')
      .then(res => res.ok ? res.json() : [])
      .then(data => { if (Array.isArray(data)) setCategories(data); })
      .catch(() => {});
  }, [refreshKey]);

  // Função para Deletar
  const handleDelete = async (id) => {
    if(window.confirm("Tem certeza que deseja excluir esta mensagem?")) {
      try {
        await fetch(`/api/messages/${id}`, { method: 'DELETE' });
        setMessages(messages.filter(m => m.id !== id));
        showToast('Mensagem excluída!');
      } catch (error) {
        console.error("Erro ao deletar:", error);
      }
    }
  };

  // Nova Função para Atualizar no Banco de Dados
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/messages/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: editingItem.topic,
          title: editingItem.title,
          content: editingItem.content
        })
      });
      
      const updatedMsg = await response.json();
      
      // Atualiza a lista na tela com o item novo
      setMessages(messages.map(m => m.id === updatedMsg.id ? updatedMsg : m));
      setEditingItem(null); // Fecha o modal
      showToast('Mensagem atualizada com sucesso!');
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      alert('Erro ao atualizar no banco de dados!');
    }
  };

  const handleCopy = (content) => {
    navigator.clipboard.writeText(content);
    showToast('Copiado para a área de transferência!');
  };

  const filteredMessages = messages.filter(m => 
    (m.title || '').toLowerCase().includes((searchQuery || '').toLowerCase()) || 
    (m.content || '').toLowerCase().includes((searchQuery || '').toLowerCase()) ||
    (m.topic || '').toLowerCase().includes((searchQuery || '').toLowerCase())
  );

  const groupedMessages = filteredMessages.reduce((acc, msg) => {
    const t = msg.topic || 'Sem Tema';
    if (!acc[t]) acc[t] = [];
    acc[t].push(msg);
    return acc;
  }, {});

  return (
    <div className="space-y-8 animate-in fade-in duration-500 ">
      
      {toast && (
        <div className="fixed bottom-8 right-8 bg-slate-800 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-50 dark:bg-slate-700 dark:border dark:border-slate-600">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <span className="font-medium text-sm">{toast}</span>
        </div>
      )}

      {/* MODAL DE EDIÇÃO SOBREPOSTO */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300 dark:bg-slate-800 dark:border dark:border-slate-700">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 dark:text-slate-200">
                <Pencil className="h-5 w-5 text-emerald-600 dark:text-emerald-400" /> Editar Mensagem
              </h2>
              <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 p-1.5 rounded-full transition-colors border border-slate-200 dark:bg-slate-800 dark:border-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 dark:text-slate-300">Categoria / Tópico</label>
                <select required value={editingItem.topic} onChange={e => setEditingItem({...editingItem, topic: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-200">
                  <option value="">Selecione uma categoria...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 dark:text-slate-300">Título da Mensagem</label>
                <input required value={editingItem.title} onChange={e => setEditingItem({...editingItem, title: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-200" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5 dark:text-slate-300">Conteúdo Completo</label>
                <textarea required rows="4" value={editingItem.content} onChange={e => setEditingItem({...editingItem, content: e.target.value})} className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm resize-y dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-200"></textarea>
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

      {/* Lista de Mensagens Agrupadas */}
      <div className="space-y-8">
        {Object.keys(groupedMessages).sort().map(topic => (
          <div key={topic} className="space-y-4">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-2 pl-1 dark:border-slate-800 dark:text-slate-400">
              <Folder className="h-4 w-4" /> {topic}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {groupedMessages[topic].map(msg => (
                <div key={msg.id} className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-500/30 shadow-sm hover:shadow-md transition-all group flex flex-col relative overflow-hidden dark:bg-slate-800 dark:border-slate-700 dark:hover:border-emerald-500/50">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="flex justify-between items-start mb-3 pl-1">
                    <h4 className="font-bold text-slate-800 text-base leading-tight pr-2 line-clamp-2 dark:text-slate-200">
                      {msg.title}
                    </h4>
                    
                    {/* Botões de Ação (Aparecem no Hover) */}
                    <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingItem(msg)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors dark:hover:bg-slate-700/50 dark:hover:text-blue-400" title="Editar">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(msg.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-red-950/30 dark:hover:text-red-400" title="Eliminar">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4 flex-1 dark:bg-slate-900/50 dark:border-slate-700/50">
                    <p className="text-slate-600 text-sm line-clamp-3 leading-relaxed dark:text-slate-400">
                      {msg.content}
                    </p>
                  </div>
                  <button onClick={() => handleCopy(msg.content)} className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20">
                    <Copy className="h-4 w-4" /> Copiar Mensagem
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        {messages.length === 0 && (
          <div className="text-center py-16 text-slate-400 bg-white border border-dashed border-slate-300 rounded-2xl dark:bg-slate-800 dark:border-slate-700 dark:text-slate-500">
            <MessageSquareText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium text-slate-500 dark:text-slate-400">Nenhuma mensagem encontrada.</p>
          </div>
        )}
      </div>
    </div>
  );
}