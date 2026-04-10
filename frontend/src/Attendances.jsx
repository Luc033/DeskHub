import { useState, useEffect, useRef } from "react";
import {
  Phone,
  Ticket,
  PlusCircle,
  CheckCircle2,
  Trash2,
  Clock,
  CheckCircle,
  X,
  Lock,
  PhoneCall,
  AlertTriangle,
  MessageSquare,
  Smile,
  Route,
  Link as LinkIcon,
  Copy,
  Eraser,
  Zap,
  Search,
  CheckSquare,
} from "lucide-react";
import { useAutocomplete } from "./useAutocomplete";
import AutocompletePopover from "./AutocompletePopover";

// ================= FUNÇÕES UTILITÁRIAS =================
const isValidCNPJ = (cnpj) => {
  if (!cnpj) return true;
  const numbers = cnpj.replace(/[^\d]+/g, "");
  if (numbers.length !== 14) return false;
  if (/^(\d)\1+$/.test(numbers)) return false;

  let tamanho = numbers.length - 2;
  let numerosBase = numbers.substring(0, tamanho);
  let digitos = numbers.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += numerosBase.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado != digitos.charAt(0)) return false;

  tamanho = tamanho + 1;
  numerosBase = numbers.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  for (let i = tamanho; i >= 1; i--) {
    soma += numerosBase.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado != digitos.charAt(1)) return false;

  return true;
};

const maskCNPJ = (value) => {
  if (!value) return "";
  let v = value.replace(/\D/g, "");
  if (v.length > 14) v = v.substring(0, 14);
  v = v.replace(/^(\d{2})(\d)/, "$1.$2");
  v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
  v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
  v = v.replace(/(\d{4})(\d)/, "$1-$2");
  return v;
};

const formatDateTime = (dateString) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function Attendances() {
  const defaultTratativa =
    localStorage.getItem("my_default_tratativa") ||
    "Olá, tudo bem?\n\nMe chamo Lucas e conforme conversamos...";

  const [attendances, setAttendances] = useState([]);
  const [toast, setToast] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [localTab, setLocalTab] = useState("phone");

  const [missedCalls, setMissedCalls] = useState(
    () => localStorage.getItem("my_missed_calls") || "0",
  );
  const [pauses, setPauses] = useState(
    () => localStorage.getItem("my_pauses") || "00:00",
  );

  const [form, setForm] = useState({
    ticket: "#",
    descricao: "",
    cnpj: "",
    companyName: "",
    tratativa: defaultTratativa,
    notes: "",
    category: "Outros",
  });

  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);

  const CATEGORY_STYLES = {
    Fiscal: {
      bg: "bg-[#dcfce7] dark:bg-[#166534]/30",
      text: "text-[#166534] dark:text-[#bbf7d0]",
      border: "border-[#bbf7d0] dark:border-[#166534]/60",
    },
    Integrações: {
      bg: "bg-[#dbeafe] dark:bg-[#1e40af]/30",
      text: "text-[#1e40af] dark:text-[#bfdbfe]",
      border: "border-[#bfdbfe] dark:border-[#1e40af]/60",
    },
    ERP: {
      bg: "bg-[#fef9c3] dark:bg-[#854d0e]/30",
      text: "text-[#854d0e] dark:text-[#fef08a]",
      border: "border-[#fef08a] dark:border-[#854d0e]/60",
    },
    Logística: {
      bg: "bg-[#fee2e2] dark:bg-[#991b1b]/30",
      text: "text-[#991b1b] dark:text-[#fecaca]",
      border: "border-[#fecaca] dark:border-[#991b1b]/60",
    },
    "Minha conta": {
      bg: "bg-[#f3e8ff] dark:bg-[#6A2C70]/30",
      text: "text-[#6b21a8] dark:text-[#e9d5ff]",
      border: "border-[#e9d5ff] dark:border-[#6A2C70]/60",
    },
    Financeiro: {
      bg: "bg-[#ffedd5] dark:bg-[#9a3412]/30",
      text: "text-[#9a3412] dark:text-[#fed7aa]",
      border: "border-[#fed7aa] dark:border-[#9a3412]/60",
    },
    API: {
      bg: "bg-[#f1f5f9] dark:bg-[#175676]/40",
      text: "text-[#0f172a] dark:text-[#cbd5e1]",
      border: "border-[#cbd5e1] dark:border-[#175676]/60",
    },
    Outros: {
      bg: "bg-white dark:bg-slate-800",
      text: "text-slate-600 dark:text-slate-200",
      border: "border-slate-200 dark:border-slate-600",
    },
  };

  const [hubData, setHubData] = useState({
    messages: [],
    emojis: [],
    shortcuts: [],
    links: [],
  });
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [dropdownSearch, setDropdownSearch] = useState("");
  const tratativaRef = useRef(null);
  const { popup, listRef, confirmItem, handleChange, handleKeyDown, close } =
    useAutocomplete({
      textareaRef: tratativaRef,
      hubData,
      onInsert: (newText, newCursorPos) => {
        setForm((prev) => ({ ...prev, tratativa: newText }));
        requestAnimationFrame(() => {
          if (tratativaRef.current) {
            tratativaRef.current.focus();
            tratativaRef.current.setSelectionRange(newCursorPos, newCursorPos);
          }
        });
      },
    });
  const [cursorPos, setCursorPos] = useState({ start: 0, end: 0 });

  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddForm, setQuickAddForm] = useState({
    type: "messages",
    topic: "",
    title: "",
    content: "",
    url: "",
    name: "",
    value: "",
  });

  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  });

  const isCreatingRef = useRef(false);
  const timerRef = useRef(null);
  const abortControllerRef = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const copyToClipboard = (text, notify = true) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
      if (notify) showToast("Copiado com sucesso!");
    } catch (err) {}
    document.body.removeChild(textArea);
  };

  useEffect(() => {
    fetch(`/api/attendances`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setAttendances(data);
        else setAttendances([]);
      })
      .catch((err) => {
        console.error("Erro no fetch:", err);
        setAttendances([]);
      });

    Promise.all([
      fetch(`/api/messages`).then((res) => res.json()),
      fetch(`/api/shortcuts`).then((res) => res.json()),
      fetch(`/api/links`).then((res) => res.json()),
      fetch(`/api/emojis`).then((res) => res.json()),
    ]).then(([messages, shortcuts, links, emojis]) =>
      setHubData({ messages, shortcuts, links, emojis }),
    );

    // Sincroniza a tratativa padrão do banco com o LocalStorage logo ao abrir a tela
    fetch(`/api/settings/system`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.defaultTratativa) {
          localStorage.setItem("my_default_tratativa", data.defaultTratativa);
        }
      })
      .catch((err) => console.error("Erro ao sincronizar tratativa:", err));
  }, []);

  useEffect(() => {
    const fetchCompany = async () => {
      if (!form.cnpj) return;
      const cnpjNumbers = form.cnpj.replace(/\D/g, "");
      if (cnpjNumbers.length === 14 && isValidCNPJ(form.cnpj)) {
        try {
          const response = await fetch(
            `https://brasilapi.com.br/api/cnpj/v1/${cnpjNumbers}`,
          );
          if (response.ok) {
            const data = await response.json();
            setForm((prev) => ({ ...prev, companyName: data.razao_social }));
          }
        } catch (error) {}
      }
    };
    const timeoutId = setTimeout(fetchCompany, 800);
    return () => clearTimeout(timeoutId);
  }, [form.cnpj]);

  useEffect(() => {
    if (!form.descricao || form.descricao.length < 5) return;

    const timer = setTimeout(async () => {
      try {
        showToast("Analisando a categoria...");
        const res = await fetch(`/api/ai/categorize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: form.descricao }),
        });

        const data = await res.json();

        if (data.error) {
          showToast(`Erro: ${data.error}`);
          return;
        }

        if (CATEGORY_STYLES[data.category]) {
          setForm((prev) => {
            if (prev.category === data.category) return prev;
            return { ...prev, category: data.category };
          });
          showToast(`${data.provider || 'IA'} classificou como: ${data.category}`);
        }
      } catch (e) {
        console.error("Erro ao categorizar atendimento:", e);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [form.descricao]);

  const reloadAttendances = async () => {
    try {
      const res = await fetch(`/api/attendances`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setAttendances(data);
        }
      }
    } catch (err) {
      console.error("Erro ao recarregar atendimentos:", err);
    }
  };

  useEffect(() => {
    if (!isModalOpen) return;

    if (editingId) {
      const currentAtt = attendances.find((a) => a.id === editingId);
      if (currentAtt?.status === "finalized") return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    timerRef.current = setTimeout(async () => {
      if (editingId) {
        try {
          await fetch(`/api/attendances/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
            signal: abortControllerRef.current.signal,
          });

          setAttendances((prev) =>
            prev.map((a) => (a.id === editingId ? { ...a, ...form } : a)),
          );
        } catch (e) {
          if (e.name !== "AbortError") {
            console.error("Erro no auto-save PUT:", e);
          }
        }
      } else {
        if (isCreatingRef.current) return;

        isCreatingRef.current = true;
        try {
          const res = await fetch(`/api/attendances`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...form,
              type: localTab,
              status: "in_progress",
            }),
            signal: abortControllerRef.current.signal,
          });

          const novo = await res.json();
          setEditingId(novo.id);

          setAttendances((prev) => [
            { ...novo, type: localTab, status: "in_progress" },
            ...prev,
          ]);
        } catch (e) {
          if (e.name !== "AbortError") {
            console.error("Erro no auto-save POST:", e);
          }
        } finally {
          isCreatingRef.current = false;
        }
      }
    }, 1500);

    return () => {
      clearTimeout(timerRef.current);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [form, isModalOpen, editingId, localTab]);

  useEffect(() => {
    localStorage.setItem("my_missed_calls", missedCalls);
    localStorage.setItem("my_pauses", pauses);

    const syncTimeout = setTimeout(() => {
      const [h, m] = (pauses || "00:00").split(":").map(Number);
      const pausesMins = (h || 0) * 60 + (m || 0);

      fetch(`/api/kpis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          missedCalls: Number(missedCalls || 0),
          pausesMins,
        }),
      }).catch((err) => console.error("Erro ao sincronizar KPI:", err));
    }, 1000);

    return () => clearTimeout(syncTimeout);
  }, [missedCalls, pauses]);

  const handleOpenNew = () => {
    const currentDefault =
      localStorage.getItem("my_default_tratativa") ||
      "Olá, tudo bem?\n\nMe chamo Lucas e conforme conversamos...\n\n\n\nEspero que tenha gostado do atendimento.\n\nQualquer coisa estamos à disposição.";

    setForm({
      ticket: "#",
      descricao: "",
      cnpj: "",
      companyName: "",
      tratativa: currentDefault,
      notes: "",
      category: "Outros",
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = async () => {
    clearTimeout(timerRef.current);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (editingId) {
      const currentAtt = attendances.find((a) => a.id === editingId);
      if (currentAtt?.status === "in_progress") {
        try {
          await fetch(`/api/attendances/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          });
          setAttendances((prev) =>
            prev.map((a) => (a.id === editingId ? { ...a, ...form } : a)),
          );
        } catch (e) {}
      }
    } else {
      if (!isCreatingRef.current) {
        isCreatingRef.current = true;
        try {
          const res = await fetch(`/api/attendances`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...form,
              type: localTab,
              status: "in_progress",
            }),
          });
          const novo = await res.json();
          setAttendances((prev) => [
            { ...novo, type: localTab, status: "in_progress" },
            ...prev,
          ]);
        } catch (e) {
        } finally {
          isCreatingRef.current = false;
        }
      }
    }

    await reloadAttendances();
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleFinalize = async (e) => {
    if (e) e.preventDefault();
    clearTimeout(timerRef.current);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    try {
      let idToFinalize = editingId;

      if (!idToFinalize) {
        if (isCreatingRef.current) {
          showToast("Aguarde, processando...");
          return;
        }

        isCreatingRef.current = true;
        const resCreate = await fetch(`/api/attendances`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            type: localTab,
            status: "in_progress",
          }),
        });
        const novo = await resCreate.json();
        idToFinalize = novo.id;
        isCreatingRef.current = false;
      }

      const response = await fetch(
        `/api/attendances/${idToFinalize}/finalize`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tratativa: form.tratativa,
            notes: form.notes,
          }),
        },
      );

      await reloadAttendances();
      setIsModalOpen(false);
      setEditingId(null);
      copyToClipboard(form.tratativa, false);
      showToast("Atendimento finalizado e tratativa copiada!");
    } catch (error) {
      console.error(error);
      isCreatingRef.current = false;
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    if (
      window.confirm(
        "Tem certeza que deseja apagar este registo para sempre?",
      )
    ) {
      try {
        await fetch(`/api/attendances/${id}`, {
          method: "DELETE",
        });
        await reloadAttendances();
        showToast("Registo apagado!");
      } catch (error) {}
    }
  };

  const filteredAttendances = attendances.filter((a) => {
    if (a.type !== localTab) return false;
    
    const dateVal = a.openedAt || a.createdAt || a.created_at || a.updatedAt;
    if (!dateVal) return false;
    
    const d = new Date(dateVal);
    const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    
    return dStr === selectedDate;
  });

  const isCurrentlyFinalized = editingId
    ? attendances.find((a) => a.id === editingId)?.status === "finalized"
    : false;

  const handleDeleteAll = async () => {
    if (
      window.confirm(
        "CUIDADO: Deseja excluir permanentemente TODOS os atendimentos nesta aba?",
      )
    ) {
      for (const att of filteredAttendances) {
        try {
          await fetch(`/api/attendances/${att.id}`, {
            method: "DELETE",
          });
        } catch (e) {}
      }
      const idsToRemove = filteredAttendances.map((a) => a.id);
      setAttendances(attendances.filter((a) => !idsToRemove.includes(a.id)));
      showToast("Todos os registros foram apagados!");
    }
  };

  const handleDropdownToggle = async (type) => {
    if (activeDropdown === type) {
      setActiveDropdown(null);
      setDropdownSearch("");
    } else {
      setActiveDropdown(type);
      setDropdownSearch("");
      try {
        const endpoint =
          type === "msg"
            ? "messages"
            : type === "route"
              ? "shortcuts"
              : type === "link"
                ? "links"
                : "emojis";
        const res = await fetch(`/api/${endpoint}`);
        const data = await res.json();
        setHubData((prev) => ({ ...prev, [endpoint]: data }));
      } catch (e) {}
    }
  };

  const handleTextareaState = (e) =>
    setCursorPos({
      start: e.target.selectionStart,
      end: e.target.selectionEnd,
    });

  const handleInsertShortcut = (contentToInsert) => {
    copyToClipboard(contentToInsert, false);
    showToast("Copiado e Inserido!");

    const start = cursorPos.start;
    const end = cursorPos.end;
    const text = form.tratativa || "";

    const newText =
      text.substring(0, start) + contentToInsert + text.substring(end);
    setForm((prev) => ({ ...prev, tratativa: newText }));

    const newPos = start + contentToInsert.length;
    setCursorPos({ start: newPos, end: newPos });

    setActiveDropdown(null);
    setDropdownSearch("");

    if (tratativaRef.current) {
      tratativaRef.current.focus();
      setTimeout(
        () => tratativaRef.current.setSelectionRange(newPos, newPos),
        0,
      );
    }
  };

  const handleModalBackgroundClick = (e) => {
    if (e.target !== e.currentTarget) return;

    e.preventDefault();
    if (tratativaRef.current) tratativaRef.current.focus();
    setActiveDropdown(null);
    setIsCategoryMenuOpen(false);
    handleCloseModal();
  };

  const handleQuickAddSubmit = async (e) => {
    e.preventDefault();
    let endpoint = "";
    let payload = {};
    if (quickAddForm.type === "messages") {
      endpoint = "/messages";
      payload = {
        topic: quickAddForm.topic,
        title: quickAddForm.title,
        content: quickAddForm.content,
      };
    } else if (quickAddForm.type === "routes") {
      endpoint = "/shortcuts";
      payload = { title: quickAddForm.title, content: quickAddForm.content };
    } else if (quickAddForm.type === "links") {
      endpoint = "/links";
      payload = { title: quickAddForm.title, url: quickAddForm.url };
    } else if (quickAddForm.type === "emojis") {
      endpoint = "/emojis";
      payload = { name: quickAddForm.name, value: quickAddForm.value };
    }

    try {
      await fetch(`/api${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setIsQuickAddOpen(false);
      setQuickAddForm({
        type: quickAddForm.type,
        topic: "",
        title: "",
        content: "",
        url: "",
        name: "",
        value: "",
        command: "",
      });
      showToast("Adicionado ao Hub!");
    } catch (error) {}
  };

  const getFilteredDropdownData = (type) => {
    const data =
      type === "msg"
        ? hubData.messages
        : type === "route"
          ? hubData.shortcuts
          : type === "link"
            ? hubData.links
            : hubData.emojis;
    if (!dropdownSearch) return data;
    const term = dropdownSearch.toLowerCase();
    return data.filter(
      (item) =>
        (item.title || item.name || "").toLowerCase().includes(term) ||
        (item.content || item.value || item.url || "")
          .toLowerCase()
          .includes(term),
    );
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto pb-12 mt-4">
      {toast && (
        <div className="fixed bottom-8 right-8 bg-slate-800 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-[100] dark:bg-slate-800 dark:border dark:border-slate-700">
          <CheckCircle2 className="h-5 w-5 text-[#1FA697] dark:text-[#1FA697]" />
          <span className="font-medium text-sm">{toast}</span>
        </div>
      )}
      <AutocompletePopover
        popup={popup}
        listRef={listRef}
        confirmItem={confirmItem}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col dark:bg-slate-800 dark:border-slate-700">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 dark:text-slate-400">
            Ligações Atendidas
          </span>
          <div className="flex items-center gap-2 mt-auto">
            <PhoneCall
              size={20}
              className="text-[#175676] dark:text-[#1FA697]"
            />
            <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {attendances.filter((a) => a.type === "phone").length}
            </span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col dark:bg-slate-800 dark:border-slate-700">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 dark:text-slate-400">
            Tickets Respondidos
          </span>
          <div className="flex items-center gap-2 mt-auto">
            <Ticket size={20} className="text-[#175676] dark:text-[#1FA697]" />
            <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {attendances.filter((a) => a.type === "ticket").length}
            </span>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col dark:bg-slate-800 dark:border-slate-700">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 dark:text-slate-400">
            Ligações Perdidas
          </span>
          <div className="flex items-center mt-auto bg-white border border-slate-300 rounded-xl overflow-hidden focus-within:border-[#1FA697] focus-within:ring-2 focus-within:ring-[#1FA697]/20 transition-all dark:bg-slate-900/50 dark:border-slate-700 dark:focus-within:border-[#1FA697]">
            <button
              onClick={() =>
                setMissedCalls((prev) =>
                  Math.max(0, parseInt(prev || 0) - 1).toString(),
                )
              }
              className="px-3 py-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors font-bold text-lg leading-none border-r border-slate-200 flex items-center justify-center dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              -
            </button>
            <input
              type="number"
              min="0"
              value={missedCalls}
              onChange={(e) => setMissedCalls(e.target.value)}
              className="w-full bg-transparent p-1.5 outline-none text-center font-bold text-slate-800 text-sm dark:text-slate-200"
            />
            <button
              onClick={() =>
                setMissedCalls((prev) => (parseInt(prev || 0) + 1).toString())
              }
              className="px-3 py-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors font-bold text-lg leading-none border-l border-slate-200 flex items-center justify-center dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              +
            </button>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col dark:bg-slate-800 dark:border-slate-700">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider dark:text-slate-400">
              Pausas
            </span>
            <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 dark:bg-slate-700 dark:text-slate-300">
              Máx 2h30
            </span>
          </div>
          <div className="flex items-center mt-auto bg-white border border-slate-300 rounded-xl overflow-hidden focus-within:border-[#F2C94C] focus-within:ring-2 focus-within:ring-[#F2C94C]/20 transition-all dark:bg-slate-900/50 dark:border-slate-700 dark:focus-within:border-[#F2C94C]">
            <input
              type="time"
              value={pauses}
              onChange={(e) => setPauses(e.target.value)}
              className="w-full bg-transparent p-1.5 outline-none text-center font-bold text-slate-800 text-sm dark:text-slate-200"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex bg-slate-200/80 p-1 rounded-xl w-full sm:w-auto dark:bg-slate-800/80">
          <button
            onClick={() => setLocalTab("phone")}
            className={`flex-1 sm:flex-none flex justify-center items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all ${localTab === "phone" ? "bg-white text-[#175676] shadow-sm dark:bg-slate-700 dark:text-[#1FA697]" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}
          >
            <PhoneCall
              size={16}
              className={
                localTab === "phone" ? "text-[#175676] dark:text-[#1FA697]" : ""
              }
            />{" "}
            Ligações
          </button>
          <button
            onClick={() => setLocalTab("ticket")}
            className={`flex-1 sm:flex-none flex justify-center items-center gap-2 px-6 py-2 rounded-lg font-bold text-sm transition-all ${localTab === "ticket" ? "bg-white text-[#175676] shadow-sm dark:bg-slate-700 dark:text-[#1FA697]" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}
          >
            <Ticket
              size={16}
              className={
                localTab === "ticket"
                  ? "text-[#175676] dark:text-[#1FA697]"
                  : ""
              }
            />{" "}
            Tickets
          </button>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-bold text-sm bg-white border border-slate-200 text-slate-700 outline-none focus:ring-2 focus:ring-[#175676]/20 focus:border-[#175676] transition-all cursor-pointer dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:focus:border-[#1FA697] dark:focus:ring-[#1FA697]/20"
          />

          {filteredAttendances.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="flex-1 sm:flex-none flex justify-center items-center gap-2 text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors border border-red-100 dark:bg-red-950/30 dark:border-red-900/50 dark:hover:bg-red-900/40 dark:text-red-400"
            >
              <Trash2 size={16} /> Excluir todos
            </button>
          )}
          
          <button
            onClick={handleOpenNew}
            className="flex-1 sm:flex-none flex justify-center items-center gap-2 bg-[#175676] hover:bg-[#114058] text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-colors dark:bg-[#1FA697] dark:hover:bg-[#175676]"
          >
            <PlusCircle size={18} /> Novo
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div
          onMouseDown={handleModalBackgroundClick}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[95vh] flex flex-col animate-in slide-in-from-bottom-4 overflow-hidden dark:bg-slate-900 dark:border dark:border-slate-700"
            onClick={() => setActiveDropdown(null)}
          >
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 shrink-0 dark:bg-slate-800 dark:border-slate-800">
              <div className="flex items-center gap-4 w-full pr-4">
                {isCurrentlyFinalized ? (
                  <span className="bg-[#1FA697]/10 text-[#1FA697] px-3 py-1.5 rounded-md text-sm font-bold flex items-center gap-2 shrink-0 dark:bg-[#1FA697]/20">
                    <Lock size={16} /> Finalizado
                  </span>
                ) : (
                  <span className="bg-[#6A2C70]/10 text-[#6A2C70] px-3 py-1.5 rounded-md text-sm font-bold flex items-center gap-2 shrink-0 dark:bg-[#6A2C70]/30 dark:text-[#d8a1de]">
                    {localTab === "phone" ? (
                      <PhoneCall size={16} />
                    ) : (
                      <Ticket size={16} />
                    )}{" "}
                    Em progresso
                  </span>
                )}
                <span className="text-slate-300 mx-1 shrink-0 dark:text-slate-600">
                  |
                </span>

                <div
                  className="text-sm font-bold text-slate-700 truncate max-w-[60vw] shrink-0 dark:text-slate-200"
                  title={form.companyName}
                >
                  {form.companyName || "Razão Social Indisponível"}
                </div>

                <div className="relative ml-2 shrink-0 z-[199]">
                  <button
                    type="button"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsCategoryMenuOpen((prev) => !prev);
                    }}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black border shadow-sm cursor-pointer transition-all hover:opacity-80 ${CATEGORY_STYLES[form.category || "Outros"].bg} ${CATEGORY_STYLES[form.category || "Outros"].text} ${CATEGORY_STYLES[form.category || "Outros"].border}`}
                    title={`Categoria: ${form.category || "Outros"}`}
                  >
                    {(form.category || "Outros").charAt(0).toUpperCase()}
                  </button>

                  {isCategoryMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsCategoryMenuOpen(false);
                        }}
                      />
                      <div
                        className="absolute top-full left-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col dark:bg-slate-800 dark:border-slate-700"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-400">
                          Categoria do Atendimento
                        </div>
                        <div className="p-1">
                          {Object.keys(CATEGORY_STYLES).map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setForm((prev) => ({ ...prev, category: cat }));
                                setIsCategoryMenuOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-sm font-bold cursor-pointer rounded-lg hover:bg-slate-50 flex items-center gap-3 transition-colors ${CATEGORY_STYLES[cat].text} dark:hover:bg-slate-700/50`}
                            >
                              <div
                                className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] border ${CATEGORY_STYLES[cat].bg} ${CATEGORY_STYLES[cat].border} shrink-0`}
                              >
                                {cat.charAt(0).toUpperCase()}
                              </div>
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-slate-500 hover:text-slate-800 hover:bg-slate-200 px-4 py-2 rounded-xl transition-colors shrink-0 font-semibold text-sm dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                Fechar
              </button>
            </div>

            <form
              id="attendance-form"
              onSubmit={handleFinalize}
              className="flex-1 overflow-y-auto p-6 flex flex-col gap-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 shrink-0">
                <div className="md:col-span-6 relative">
                  <label className="block text-sm font-semibold text-slate-700 mb-1 dark:text-slate-300">
                    Descrição:{" "}
                    <span className="font-normal text-slate-500 dark:text-slate-400">
                      auxílio referente
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={form.descricao}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          descricao: e.target.value,
                        }))
                      }
                      placeholder="erro na emissão da NF-e..."
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-[#175676]/20 focus:border-[#175676] transition-all text-sm pr-12 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:focus:border-[#1FA697] dark:focus:ring-[#1FA697]/20"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(`Auxílio referente ${form.descricao}`)
                      }
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:bg-[#175676]/10 hover:text-[#175676] rounded-lg transition-colors dark:hover:bg-slate-700 dark:hover:text-[#1FA697]"
                      title="Copiar Descrição Completa"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-sm font-semibold text-slate-700 mb-1 dark:text-slate-300">
                    Ticket
                  </label>
                  <input
                    type="text"
                    value={form.ticket}
                    onChange={(e) => {
                      const val = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        ticket: val.startsWith("#") ? val : "#" + val,
                      }));
                    }}
                    placeholder="#5412345"
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-[#175676]/20 focus:border-[#175676] transition-all text-sm font-mono dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:focus:border-[#1FA697] dark:focus:ring-[#1FA697]/20"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-sm font-semibold text-slate-700 mb-1 dark:text-slate-300">
                    CNPJ
                  </label>
                  <div className="relative">
                    <input
                      autoFocus
                      type="text"
                      value={form.cnpj}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          cnpj: maskCNPJ(e.target.value),
                        }))
                      }
                      placeholder="00.000.000/0001-00"
                      className={`w-full px-4 py-2.5 border rounded-xl outline-none focus:ring-2 transition-all text-sm font-mono pr-10 ${
                        !form.cnpj
                          ? "border-slate-200 bg-slate-50 focus:ring-[#175676]/20 focus:border-[#175676] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:focus:border-[#1FA697] dark:focus:ring-[#1FA697]/20"
                          : !isValidCNPJ(form.cnpj)
                            ? "border-red-400 focus:ring-red-500/20 bg-red-50 text-red-900 dark:bg-red-950/30 dark:border-red-900/50 dark:text-red-400"
                            : "border-[#1FA697] focus:ring-[#1FA697]/20 bg-[#1FA697]/10 text-[#175676] dark:bg-[#1FA697]/20 dark:border-[#1FA697]/50 dark:text-[#1FA697]"
                      }`}
                    />
                    {form.cnpj && isValidCNPJ(form.cnpj) && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-[#1FA697] dark:text-[#1FA697]">
                        <CheckCircle2 size={18} />
                      </div>
                    )}
                    {form.cnpj && !isValidCNPJ(form.cnpj) && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-red-500 dark:text-red-400">
                        <AlertTriangle size={18} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div
                className="flex flex-wrap items-center gap-2 bg-slate-100 p-2.5 rounded-xl border border-slate-200 shrink-0 relative dark:bg-slate-800 dark:border-slate-700"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => setIsQuickAddOpen(true)}
                  className="bg-[#175676] hover:bg-[#114058] text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-1.5 shadow-sm dark:bg-[#1FA697] dark:hover:bg-[#188075]"
                >
                  <PlusCircle size={16} /> Novo
                </button>
                <div className="h-6 w-px bg-slate-300 mx-2 dark:bg-slate-600"></div>

                {[
                  {
                    id: "msg",
                    label: "Mensagens",
                    icon: MessageSquare,
                    data: hubData.messages,
                  },
                  {
                    id: "emoji",
                    label: "Emojis",
                    icon: Smile,
                    data: hubData.emojis,
                  },
                  {
                    id: "route",
                    label: "Rotas",
                    icon: Route,
                    data: hubData.shortcuts,
                  },
                  {
                    id: "link",
                    label: "Links",
                    icon: LinkIcon,
                    data: hubData.links,
                  },
                ].map((menu) => (
                  <div key={menu.id} className="relative">
                    <button
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDropdownToggle(menu.id);
                      }}
                      className={`border px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm ${activeDropdown === menu.id ? "bg-white border-[#1FA697] text-[#175676] dark:bg-slate-700 dark:border-[#1FA697] dark:text-slate-100" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"}`}
                    >
                      <menu.icon size={16} className="text-[#1FA697]" />{" "}
                      {menu.label}
                    </button>

                    {activeDropdown === menu.id && (
                      <div
                        className="absolute top-full left-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden flex flex-col max-h-80 dark:bg-slate-800 dark:border-slate-700"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="p-2 border-b border-slate-100 bg-slate-50 shrink-0 dark:bg-slate-900/50 dark:border-slate-700">
                          <div className="relative">
                            <Search
                              size={14}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                            <input
                              type="text"
                              autoFocus
                              placeholder={`Pesquisar em ${menu.label}...`}
                              value={dropdownSearch}
                              onChange={(e) =>
                                setDropdownSearch(e.target.value)
                              }
                              className="w-full bg-white border border-slate-200 pl-8 pr-3 py-1.5 rounded-lg text-sm outline-none focus:border-[#175676] dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 dark:focus:border-[#1FA697]"
                            />
                          </div>
                        </div>
                        <div className="overflow-y-auto flex-1 p-1">
                          {getFilteredDropdownData(menu.id).map((item) => {
                            const content =
                              item.content || item.value || item.url;
                            const title = item.title || item.name;
                            return (
                              <button
                                type="button"
                                key={item.id}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  handleInsertShortcut(content);
                                }}
                                className="w-full text-left p-3 border-b last:border-b-0 border-slate-100 hover:bg-slate-50 transition-colors group rounded-lg dark:border-slate-700 dark:hover:bg-slate-700"
                              >
                                <p className="font-bold text-sm text-slate-800 truncate dark:text-slate-200">
                                  {title}
                                </p>
                                <p className="text-xs text-slate-500 truncate mt-0.5 group-hover:whitespace-normal group-hover:break-words dark:text-slate-400">
                                  {content}
                                </p>
                              </button>
                            );
                          })}
                          {getFilteredDropdownData(menu.id).length === 0 && (
                            <p className="text-center p-4 text-xs text-slate-400">
                              Nenhum resultado.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[350px]">
                <div className="flex flex-col h-full border border-slate-200 rounded-2xl overflow-hidden shadow-sm dark:border-slate-700">
                  <div className="bg-slate-50 px-5 py-3 border-b border-slate-200 flex justify-between items-center shrink-0 dark:bg-slate-800/50 dark:border-slate-700">
                    <label className="text-sm font-bold text-slate-800 flex items-center gap-2 dark:text-slate-200">
                      <MessageSquare
                        size={18}
                        className="text-[#175676] dark:text-[#1FA697]"
                      />{" "}
                      Tratativa Final
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({
                          ...prev,
                          tratativa: defaultTratativa,
                        }));
                        showToast("Tratativa redefinida!");
                      }}
                      className="text-xs font-bold text-slate-500 hover:text-[#175676] hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                    >
                      <Eraser size={14} /> Limpar
                    </button>
                  </div>
                  <textarea
                    ref={tratativaRef}
                    required
                    value={form.tratativa}
                    onChange={(e) => {
                      setForm((prev) => ({
                        ...prev,
                        tratativa: e.target.value,
                      }));
                      handleTextareaState(e);
                      handleChange(e);
                    }}
                    onKeyDown={(e) => {
                      if (handleKeyDown(e)) e.preventDefault();
                    }}
                    onBlur={(e) => {
                      handleTextareaState(e);
                      setTimeout(() => close(), 150);
                    }}
                    onClick={handleTextareaState}
                    onKeyUp={handleTextareaState}
                    placeholder="Descreva o atendimento..."
                    className="flex-1 w-full bg-white px-5 py-4 outline-none resize-none whitespace-pre-wrap leading-relaxed text-sm text-slate-700 selection:bg-[#6A2C70]/30 selection:text-[#6A2C70] dark:bg-slate-800/50 dark:text-slate-200 dark:selection:bg-[#6A2C70]/50 dark:selection:text-[#d8a1de]"
                  ></textarea>
                </div>

                <div className="flex flex-col h-full bg-amber-50/50 border border-amber-200 rounded-2xl overflow-hidden shadow-sm dark:bg-[#F2C94C]/10 dark:border-[#C9A02A]/40">
                  <div className="bg-amber-100/60 px-5 py-3 border-b border-amber-200 flex justify-between items-center shrink-0 dark:bg-[#C9A02A]/20 dark:border-[#C9A02A]/30">
                    <label className="text-sm font-bold text-amber-800 flex items-center gap-2 dark:text-[#F2C94C]">
                      <Zap
                        size={18}
                        className="text-amber-600 dark:text-[#F2C94C]"
                      />{" "}
                      Anotações Internas
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({ ...prev, notes: "" }));
                        showToast("Anotações limpas!");
                      }}
                      className="text-xs font-bold text-amber-700 hover:text-amber-900 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 dark:text-[#C9A02A] dark:hover:text-[#F2C94C] dark:hover:bg-[#C9A02A]/30"
                    >
                      <Eraser size={14} /> Limpar
                    </button>
                  </div>
                  <textarea
                    value={form.notes}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    placeholder="Notas privadas..."
                    className="flex-1 w-full bg-transparent px-5 py-4 outline-none resize-none whitespace-pre-wrap leading-relaxed text-sm text-slate-700 selection:bg-amber-300 selection:text-amber-900 dark:text-slate-200 dark:selection:bg-[#C9A02A]/60 dark:selection:text-[#F2C94C]"
                  ></textarea>
                </div>
              </div>
            </form>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 shrink-0 dark:bg-slate-800/50 dark:border-slate-800">
              {isCurrentlyFinalized ? (
                <button
                  type="button"
                  onClick={() => {
                    copyToClipboard(form.tratativa, false);
                    setIsModalOpen(false);
                    showToast("Copiado e fechado!");
                  }}
                  className="px-6 py-2.5 rounded-xl font-bold text-white bg-[#1FA697] hover:bg-[#188075] flex items-center gap-2 shadow-sm transition-colors text-sm dark:bg-[#175676] dark:hover:bg-[#114058]"
                >
                  <Copy size={18} /> Copiar e fechar
                </button>
              ) : (
                <button
                  type="submit"
                  form="attendance-form"
                  className="px-6 py-2.5 rounded-xl font-bold text-white bg-[#175676] hover:bg-[#12435c] flex items-center gap-2 shadow-sm transition-colors text-sm dark:bg-[#1FA697] dark:hover:bg-[#188075]"
                >
                  <CheckCircle size={18} /> Finalizar
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QUICK ADD MODAL */}
      {isQuickAddOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 dark:bg-slate-900 dark:border dark:border-slate-700">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2 dark:text-slate-200">
                <PlusCircle className="text-[#175676] dark:text-[#1FA697]" />{" "}
                Adicionar ao Hub Rápido
              </h2>
              <button
                onClick={() => setIsQuickAddOpen(false)}
                className="text-slate-400 hover:bg-slate-200 p-1.5 rounded-full dark:hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleQuickAddSubmit} className="p-6 space-y-4">
              <select
                value={quickAddForm.type}
                onChange={(e) =>
                  setQuickAddForm((prev) => ({ ...prev, type: e.target.value }))
                }
                className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl outline-none focus:border-[#175676] font-medium dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:focus:border-[#1FA697]"
              >
                <option value="messages">Mensagem</option>
                <option value="routes">Rota</option>
                <option value="links">Link</option>
                <option value="emojis">Emoji</option>
              </select>
              {quickAddForm.type === "messages" && (
                <div className="space-y-3">
                  <input
                    required
                    placeholder="Categoria"
                    value={quickAddForm.topic}
                    onChange={(e) =>
                      setQuickAddForm((prev) => ({
                        ...prev,
                        topic: e.target.value,
                      }))
                    }
                    className="w-full bg-slate-50 border px-4 py-2.5 rounded-xl outline-none focus:border-[#175676] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:focus:border-[#1FA697]"
                  />
                  <input
                    placeholder="Comando (opcional, ex: bomdia)"                    
                    value={quickAddForm.command || ""}
                    onChange={(e) =>
                      setQuickAddForm((prev) => ({
                        ...prev,
                        command: e.target.value,
                      }))
                    }
                    className="w-full bg-slate-50 border px-4 py-2.5 rounded-xl outline-none focus:border-[#175676] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:focus:border-[#1FA697]"
                  />
                  <input
                    required
                    placeholder="Título"
                    value={quickAddForm.title}
                    onChange={(e) =>
                      setQuickAddForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="w-full bg-slate-50 border px-4 py-2.5 rounded-xl outline-none focus:border-[#175676] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:focus:border-[#1FA697]"
                  />
                  <textarea
                    required
                    placeholder="Conteúdo"
                    rows="3"
                    value={quickAddForm.content}
                    onChange={(e) =>
                      setQuickAddForm((prev) => ({
                        ...prev,
                        content: e.target.value,
                      }))
                    }
                    className="w-full bg-slate-50 border px-4 py-3 rounded-xl outline-none focus:border-[#175676] resize-y dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:focus:border-[#1FA697]"
                  ></textarea>
                </div>
              )}
              {quickAddForm.type === "routes" && (
                <div className="space-y-3">
                  <input
                    placeholder="Comando (opcional, ex: bomdia)"
                    value={quickAddForm.command || ""}
                    onChange={(e) =>
                      setQuickAddForm((prev) => ({
                        ...prev,
                        command: e.target.value,
                      }))
                    }
                    className="w-full bg-slate-50 border px-4 py-2.5 rounded-xl outline-none focus:border-[#175676] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:focus:border-[#1FA697]"
                  />
                  <input
                    required
                    placeholder="Título"
                    value={quickAddForm.title}
                    onChange={(e) =>
                      setQuickAddForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="w-full bg-slate-50 border px-4 py-2.5 rounded-xl outline-none focus:border-[#175676] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:focus:border-[#1FA697]"
                  />
                  <input
                    required
                    placeholder="Caminho exato"
                    value={quickAddForm.content}
                    onChange={(e) =>
                      setQuickAddForm((prev) => ({
                        ...prev,
                        content: e.target.value,
                      }))
                    }
                    className="w-full bg-slate-50 border px-4 py-2.5 rounded-xl outline-none focus:border-[#175676] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:focus:border-[#1FA697]"
                  />
                </div>
              )}
              {quickAddForm.type === "links" && (
                <div className="space-y-3">
                  <input
                    placeholder="Comando (opcional, ex: bomdia)"
                    value={quickAddForm.command || ""}
                    onChange={(e) =>
                      setQuickAddForm((prev) => ({
                        ...prev,
                        command: e.target.value,
                      }))
                    }
                    className="w-full bg-slate-50 border px-4 py-2.5 rounded-xl outline-none focus:border-[#175676] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:focus:border-[#1FA697]"
                  />
                  <input
                    required
                    placeholder="Título"
                    value={quickAddForm.title}
                    onChange={(e) =>
                      setQuickAddForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="w-full bg-slate-50 border px-4 py-2.5 rounded-xl outline-none focus:border-[#175676] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:focus:border-[#1FA697]"
                  />
                  <input
                    required
                    type="url"
                    placeholder="URL"
                    value={quickAddForm.url}
                    onChange={(e) =>
                      setQuickAddForm((prev) => ({
                        ...prev,
                        url: e.target.value,
                      }))
                    }
                    className="w-full bg-slate-50 border px-4 py-2.5 rounded-xl outline-none focus:border-[#175676] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:focus:border-[#1FA697]"
                  />
                </div>
              )}
              {quickAddForm.type === "emojis" && (
                <div className="space-y-3">
                  <input
                    placeholder="Comando (opcional, ex: bomdia)"
                    value={quickAddForm.command || ""}
                    onChange={(e) =>
                      setQuickAddForm((prev) => ({
                        ...prev,
                        command: e.target.value,
                      }))
                    }
                    className="w-full bg-slate-50 border px-4 py-2.5 rounded-xl outline-none focus:border-[#175676] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:focus:border-[#1FA697]"
                  />
                  <input
                    required
                    placeholder="Nome / Atalho"
                    value={quickAddForm.name}
                    onChange={(e) =>
                      setQuickAddForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="w-full bg-slate-50 border px-4 py-2.5 rounded-xl outline-none focus:border-[#175676] dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:focus:border-[#1FA697]"
                  />
                  <input
                    required
                    placeholder="Código"
                    value={quickAddForm.value}
                    onChange={(e) =>
                      setQuickAddForm((prev) => ({
                        ...prev,
                        value: e.target.value,
                      }))
                    }
                    className="w-full bg-slate-50 border px-4 py-2.5 rounded-xl outline-none focus:border-[#175676] font-mono dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:focus:border-[#1FA697]"
                  />
                </div>
              )}
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="submit"
                  className="bg-[#175676] hover:bg-[#12435c] text-white px-6 py-2.5 rounded-xl font-bold dark:bg-[#1FA697] dark:hover:bg-[#188075]"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LISTAGEM DE ATENDIMENTOS NA TELA PRINCIPAL */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAttendances.map((att, index) => {
          const isInProgress = att.status === "in_progress";
          const displayNumber = filteredAttendances.length - index;

          return (
            <div
              key={att.id}
              onClick={() => {
                setForm({
                  ticket: att.ticket || "#",
                  descricao: att.descricao || "",
                  cnpj: att.cnpj || "",
                  companyName: att.companyName || "",
                  tratativa: att.tratativa || "",
                  notes: att.notes || "",
                  category: att.category || "Outros",
                });
                setEditingId(att.id);
                setIsModalOpen(true);
              }}
              className={`p-5 rounded-2xl border shadow-sm transition-all duration-300 cursor-pointer flex flex-col relative overflow-hidden group ${isInProgress ? "bg-white border-[#6A2C70]/40 hover:border-[#6A2C70] hover:shadow-lg hover:shadow-[#6A2C70]/10 dark:bg-slate-800 dark:border-[#6A2C70]/60 dark:hover:border-[#d8a1de] dark:hover:shadow-none" : "bg-slate-50 border-slate-200 opacity-80 hover:opacity-100 hover:shadow-md dark:bg-slate-900/50 dark:border-slate-800 dark:hover:border-slate-700"}`}
            >
              {isInProgress ? (
                <div className="absolute left-0 top-0 bottom-0 w-[5px] bg-[#6A2C70] group-hover:bg-[#4a1e4e] transition-colors dark:bg-[#d8a1de]"></div>
              ) : (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-400 dark:bg-slate-600"></div>
              )}

              <div className="flex justify-between items-start mb-2 pl-2">
                <h4 className="font-bold text-slate-800 text-lg flex items-center gap-2 dark:text-slate-200">
                  {att.type === "phone" ? (
                    <PhoneCall
                      size={18}
                      className="text-slate-400 dark:text-slate-500"
                    />
                  ) : (
                    <Ticket
                      size={18}
                      className="text-slate-400 dark:text-slate-500"
                    />
                  )}
                  Nº {displayNumber}
                </h4>
                <button
                  onClick={(e) => handleDelete(att.id, e)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="pl-2 mb-4">
                {isInProgress ? (
                  <span className="bg-[#6A2C70]/10 text-[#6A2C70] px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider dark:bg-[#6A2C70]/30 dark:text-[#d8a1de]">
                    Em Progresso
                  </span>
                ) : (
                  <span className="bg-[#1FA697]/10 text-[#175676] px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider dark:bg-[#1FA697]/20 dark:text-[#1FA697]">
                    Finalizado
                  </span>
                )}
              </div>

              <div className="bg-transparent flex-1 pl-2 mb-4 space-y-1.5 text-sm">
                <p className="text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-500 dark:text-slate-500">
                    Razão social:
                  </span>{" "}
                  {att.companyName || "-"}
                </p>
                <p className="text-slate-600 dark:text-slate-400">
                  <span className="font-semibold text-slate-500 dark:text-slate-500">
                    CNPJ:
                  </span>{" "}
                  {att.cnpj || "-"}
                </p>
                {att.descricao && (
                  <p className="text-slate-800 font-medium mt-2 dark:text-slate-300">
                    {att.descricao}
                  </p>
                )}
              </div>

              <div className="mt-auto pt-3 border-t border-slate-100 pl-2 text-xs text-slate-400 flex items-center gap-1.5 dark:border-slate-700/50 dark:text-slate-500">
                <Clock size={14} />
                {isInProgress
                  ? `Criado em ${formatDateTime(att.createdAt || att.created_at || new Date())}`
                  : `Finalizado em ${formatDateTime(att.updatedAt || att.updated_at || new Date())}`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
