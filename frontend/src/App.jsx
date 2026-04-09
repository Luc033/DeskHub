import { useState, useEffect, useRef, useContext } from "react";
import {
  Headphones, LineChart, Settings, MapPin, FileText,
  MessageSquare, Route, Link as LinkIcon, Smile, ChevronDown,
  PlusCircle, Search, X, CheckCircle2, LogOut, Moon, Sun,
  BookOpen, Bell, AlertTriangle, Info, AlarmClock, Megaphone, Terminal
} from "lucide-react";

import logo from "./assets/logo.ico";
import Messages from "./Messages";
import Shortcuts from "./Shortcuts";
import Links from "./Links";
import Emojis from "./Emojis";
import Attendances from "./Attendances";
import Cep from "./Cep";
import SettingsPage from "./Settings";
import LeitorNfe from "./LeitorNfe";
import Notes from "./Notes";
import Kpi from "./Kpi";

import { AuthContext } from "./contexts/AuthContext";

function App() {
  const { user, logout } = useContext(AuthContext);

  const [activeMainTab, setActiveMainTab] = useState("hub");
  const [activeHubSubTab, setActiveHubSubTab] = useState("messages");

  const [hubSearchQuery, setHubSearchQuery] = useState("");
  const [isHubModalOpen, setIsHubModalOpen] = useState(false);
  const [hubRefreshKey, setHubRefreshKey] = useState(0);
  const [globalToast, setGlobalToast] = useState(null);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const profileDropdownRef = useRef(null);
  const notificationsDropdownRef = useRef(null);

  const [alerts, setAlerts] = useState([]);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [isRecadoModalOpen, setIsRecadoModalOpen] = useState(false);
  const [recadoForm, setRecadoForm] = useState({ id: null, title: "", description: "", type: "informativo" });

  const [hubForm, setHubForm] = useState({
    type: "messages", topic: "", title: "", content: "", url: "", name: "", value: "",
  });

  // Busca de alertas
  const fetchAlerts = async () => {
    try {
      const res = await fetch("/api/alerts");
      if (res.ok) setAlerts(await res.json());
    } catch (error) {
      console.error("Falha ao buscar recados:", error);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  // Ticker do footer
  const activeAlerts = alerts.filter((a) => a.status === "active");
  const [tickerIndex, setTickerIndex] = useState(0);

  useEffect(() => {
    if (activeAlerts.length <= 1) return;
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % activeAlerts.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [activeAlerts.length]);

  const displayedAlert = activeAlerts[tickerIndex] || activeAlerts[0];

  // Tema
  useEffect(() => {
    const savedTheme = localStorage.getItem("deskhub_theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
    }
  }, []);

  // Click fora fecha dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target))
        setIsProfileOpen(false);
      if (notificationsDropdownRef.current && !notificationsDropdownRef.current.contains(event.target))
        setIsNotificationsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.body.classList.remove("dark");
      localStorage.setItem("deskhub_theme", "light");
      setIsDarkMode(false);
    } else {
      document.body.classList.add("dark");
      localStorage.setItem("deskhub_theme", "dark");
      setIsDarkMode(true);
    }
  };

  const showGlobalToast = (msg) => {
    setGlobalToast(msg);
    setTimeout(() => setGlobalToast(null), 3000);
  };

  // Submit do Hub
  const handleHubSubmit = async (e) => {
    e.preventDefault();
    let endpoint = "";
    let payload = {};

    if (hubForm.type === "messages") {
      endpoint = "/messages";
      payload = { topic: hubForm.topic, title: hubForm.title, content: hubForm.content };
    } else if (hubForm.type === "routes") {
      endpoint = "/shortcuts";
      payload = { title: hubForm.title, content: hubForm.content };
    } else if (hubForm.type === "links") {
      endpoint = "/links";
      payload = { title: hubForm.title, url: hubForm.url };
    } else if (hubForm.type === "emojis") {
      endpoint = "/emojis";
      payload = { name: hubForm.name, value: hubForm.value };
    }

    try {
      const response = await fetch("/api" + endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        showGlobalToast("Erro: " + (errorData.error || "Falha ao salvar."));
        return;
      }

      setHubRefreshKey((prev) => prev + 1);
      setIsHubModalOpen(false);
      showGlobalToast("Cadastro salvo com sucesso!");
    } catch (error) {
      showGlobalToast("Erro de rede. Verifique sua conexao.");
    }
  };

  // Submit de Recados
  const handleRecadoSubmit = async (e) => {
    e.preventDefault();
    const isNew = !recadoForm.id;
    const method = isNew ? "POST" : "PUT";
    const endpoint = isNew ? "/api/alerts" : "/api/alerts/" + recadoForm.id;
    try {
      await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recadoForm),
      });
      showGlobalToast(isNew ? "Recado criado!" : "Recado atualizado!");
      setIsRecadoModalOpen(false);
      fetchAlerts();
    } catch (error) {
      console.error(error);
    }
  };

  const handleCloseAlert = async (id) => {
    try {
      await fetch("/api/alerts/" + id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "closed" }),
      });
      showGlobalToast("Recado encerrado!");
      setSelectedNotification(null);
      fetchAlerts();
    } catch (error) {
      console.error(error);
    }
  };

  // Helpers
  const HubIcon = () => (
    <div className="flex items-center justify-center bg-emerald-600 rounded-md w-5 h-5 shadow-sm border border-emerald-500 shrink-0">
      <span className="text-[11px] font-black text-white">H</span>
    </div>
  );

  const navigation = [
    { name: "Hub", key: "hub", icon: HubIcon },
    { name: "Busca CEP", key: "cep", icon: MapPin },
    { name: "Anotacoes", key: "notes", icon: BookOpen },
    { name: "Atendimentos", key: "atendimentos", icon: Headphones },
    { name: "KPI", key: "kpi", icon: LineChart },
    { name: "Leitor NF-e", key: "leitor", icon: FileText },
  ];

  const hubSubNavigation = [
    { name: "Mensagens", key: "messages", icon: MessageSquare },
    { name: "Rotas", key: "routes", icon: Route },
    { name: "Links", key: "links", icon: LinkIcon },
    { name: "Emojis", key: "emojis", icon: Smile },
  ];

  const getAlertIcon = (type, size = 16) => {
    switch (type) {
      case "incidente": return <AlertTriangle size={size} className="text-red-500" />;
      case "lembrete": return <AlarmClock size={size} className="text-amber-500" />;
      default: return <Info size={size} className="text-blue-500" />;
    }
  };

  const getAlertColorConfig = (type) => {
    switch (type) {
      case "incidente": return { bg: "bg-red-50 dark:bg-red-500/10", border: "border-red-100 dark:border-red-500/20" };
      case "lembrete": return { bg: "bg-amber-50 dark:bg-amber-500/10", border: "border-amber-100 dark:border-amber-500/20" };
      default: return { bg: "bg-blue-50 dark:bg-blue-500/10", border: "border-blue-100 dark:border-blue-500/20" };
    }
  };

  const firstName = user?.name ? user.name.split(" ")[0] : "...";

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-50 text-slate-950 relative transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">

      {/* TOAST GLOBAL */}
      {globalToast && (
        <div className="fixed top-20 right-8 bg-slate-800 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-[200] animate-in fade-in slide-in-from-top-5 dark:bg-slate-700 dark:border dark:border-slate-600">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <span className="font-medium text-sm">{globalToast}</span>
        </div>
      )}

      {/* MODAL - LER RECADO */}
      {selectedNotification && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
            <div className={"px-6 py-4 border-b flex justify-between items-center " + getAlertColorConfig(selectedNotification.type).bg + " " + getAlertColorConfig(selectedNotification.type).border}>
              <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
                {getAlertIcon(selectedNotification.type, 20)}
                <h3 className="capitalize">{selectedNotification.type}</h3>
              </div>
              <button onClick={() => setSelectedNotification(null)} className="text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800 p-1 rounded">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h4 className="text-lg font-bold text-slate-800 dark:text-slate-100">{selectedNotification.title}</h4>
                <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">
                  Registrado em: {new Date(selectedNotification.createdAt).toLocaleString("pt-BR")}
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {selectedNotification.description}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
              <button onClick={() => setSelectedNotification(null)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-lg text-sm font-bold transition-colors">
                Fechar
              </button>
              {selectedNotification.status === "active" && (
                <button onClick={() => handleCloseAlert(selectedNotification.id)} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition-colors shadow-sm flex items-center gap-2">
                  <CheckCircle2 size={16} /> Encerrar Recado
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL - CRIAR/EDITAR RECADO */}
      {isRecadoModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                <Megaphone size={20} />
                <h3>{recadoForm.id ? "Editar Recado" : "Novo Recado"}</h3>
              </div>
              <button onClick={() => setIsRecadoModalOpen(false)} className="text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 p-1 rounded">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleRecadoSubmit} id="recado-form" className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Tipo de Recado</label>
                <div className="grid grid-cols-3 gap-2">
                  {["informativo", "lembrete", "incidente"].map((t) => (
                    <div
                      key={t}
                      onClick={() => setRecadoForm({ ...recadoForm, type: t })}
                      className={"flex flex-col items-center justify-center gap-1.5 py-3 border rounded-xl cursor-pointer transition-all " + (recadoForm.type === t ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-400 shadow-sm" : "border-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:hover:bg-slate-700")}
                    >
                      {getAlertIcon(t, 20)}
                      <span className={"text-[10px] font-bold capitalize " + (recadoForm.type === t ? "text-emerald-700 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400")}>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Titulo Curto</label>
                <input required value={recadoForm.title} onChange={(e) => setRecadoForm({ ...recadoForm, title: e.target.value })} placeholder="Ex: Instabilidade no Correios" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl outline-none focus:border-emerald-500 transition-colors text-sm dark:text-slate-200" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Descricao Detalhada</label>
                <textarea required rows="4" value={recadoForm.description} onChange={(e) => setRecadoForm({ ...recadoForm, description: e.target.value })} placeholder="Escreva os detalhes para a equipe..." className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl outline-none focus:border-emerald-500 transition-colors text-sm resize-none dark:text-slate-200" />
              </div>
            </form>
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex justify-end gap-3">
              <button onClick={() => setIsRecadoModalOpen(false)} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-lg text-sm font-bold transition-colors">Cancelar</button>
              <button type="submit" form="recado-form" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition-colors shadow-sm flex items-center gap-2"><CheckCircle2 size={16} /> Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL - NOVO CADASTRO DO HUB */}
      {isHubModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <PlusCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                Novo Cadastro &mdash; {hubSubNavigation.find((s) => s.key === hubForm.type)?.name}
              </h2>
              <button onClick={() => setIsHubModalOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 p-1.5 rounded-full transition-colors border border-slate-200 dark:border-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleHubSubmit} className="p-6 space-y-4">
              {hubForm.type === "messages" && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Categoria / Topico</label>
                    <input required placeholder="Ex: Suporte, Financeiro..." value={hubForm.topic} onChange={(e) => setHubForm((p) => ({ ...p, topic: e.target.value }))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm dark:text-slate-200" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Titulo</label>
                    <input required placeholder="Ex: Saudacao inicial" value={hubForm.title} onChange={(e) => setHubForm((p) => ({ ...p, title: e.target.value }))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm dark:text-slate-200" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Conteudo</label>
                    <textarea required rows="4" placeholder="Cole ou escreva a mensagem aqui..." value={hubForm.content} onChange={(e) => setHubForm((p) => ({ ...p, content: e.target.value }))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm resize-y dark:text-slate-200" />
                  </div>
                </>
              )}
              {hubForm.type === "routes" && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Titulo da Rota</label>
                    <input required placeholder="Ex: Pasta de Contratos" value={hubForm.title} onChange={(e) => setHubForm((p) => ({ ...p, title: e.target.value }))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm dark:text-slate-200" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Caminho Exato</label>
                    <input required placeholder="Ex: C:\Users\empresa\Documentos" value={hubForm.content} onChange={(e) => setHubForm((p) => ({ ...p, content: e.target.value }))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-mono dark:text-slate-200" />
                  </div>
                </>
              )}
              {hubForm.type === "links" && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Titulo do Link</label>
                    <input required placeholder="Ex: Portal do Cliente" value={hubForm.title} onChange={(e) => setHubForm((p) => ({ ...p, title: e.target.value }))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm dark:text-slate-200" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">URL</label>
                    <input required type="url" placeholder="https://..." value={hubForm.url} onChange={(e) => setHubForm((p) => ({ ...p, url: e.target.value }))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm dark:text-slate-200" />
                  </div>
                </>
              )}
              {hubForm.type === "emojis" && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Nome / Descricao</label>
                    <input required placeholder="Ex: Joinha, Checkmark..." value={hubForm.name} onChange={(e) => setHubForm((p) => ({ ...p, name: e.target.value }))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm dark:text-slate-200" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Valor ou Codigo</label>
                    <input required placeholder="Ex: joinha ou :thumbsup:" value={hubForm.value} onChange={(e) => setHubForm((p) => ({ ...p, value: e.target.value }))} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-mono dark:text-slate-200" />
                  </div>
                </>
              )}
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsHubModalOpen(false)} className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm">Cancelar</button>
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm flex items-center gap-2">
                  <PlusCircle className="h-4 w-4" /> Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm z-50 shrink-0 h-16 transition-colors dark:bg-slate-900 dark:border-slate-800 relative">
        <div className="flex items-center gap-8 h-full">
          <button onClick={() => setActiveMainTab("hub")} className="flex items-center gap-2 hover:opacity-80 transition-opacity outline-none">
            <img src={logo} alt="Logo DeskHub" className="h-8 w-8 shrink-0" />
            <h1 className="text-xl font-bold tracking-tight dark:text-slate-100">Desk<span className="text-emerald-600 dark:text-emerald-400">Hub</span></h1>
          </button>
          <nav className="hidden md:flex items-center h-full gap-1">
            {navigation.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveMainTab(item.key)}
                className={"h-full px-4 flex items-center gap-2 border-b-2 transition-all text-sm font-semibold " + (activeMainTab === item.key ? "border-emerald-600 text-emerald-700 bg-emerald-50/50 dark:text-emerald-400 dark:bg-emerald-950/20" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50")}
              >
                {item.key === "hub" ? <HubIcon /> : <item.icon className={"h-4 w-4 " + (activeMainTab === item.key ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500")} strokeWidth={2.5} />}
                {item.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4 relative">
          {/* Notificacoes */}
          <div className="relative" ref={notificationsDropdownRef}>
            <button onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-500 relative dark:text-slate-400 dark:hover:bg-slate-800">
              <Bell size={20} />
              {activeAlerts.length > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full dark:border-slate-900" />}
            </button>
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 dark:bg-slate-900 dark:border-slate-700">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 dark:bg-slate-800/50 dark:border-slate-800 flex justify-between items-center">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Avisos Ativos</p>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full dark:bg-emerald-500/20 dark:text-emerald-400">{activeAlerts.length}</span>
                </div>
                <div className="max-h-80 overflow-y-auto p-2 space-y-1">
                  {activeAlerts.map((al) => (
                    <div key={al.id} onClick={() => { setSelectedNotification(al); setIsNotificationsOpen(false); }} className={"p-3 border rounded-xl cursor-pointer hover:opacity-80 transition-opacity flex gap-3 " + getAlertColorConfig(al.type).bg + " " + getAlertColorConfig(al.type).border}>
                      <div className="mt-0.5 shrink-0">{getAlertIcon(al.type)}</div>
                      <div>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-tight">{al.title}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-1">{new Date(al.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                  ))}
                  {activeAlerts.length === 0 && <p className="text-center text-xs text-slate-400 py-6">Nenhum aviso no momento.</p>}
                </div>
              </div>
            )}
          </div>

          {/* Perfil */}
          <div ref={profileDropdownRef}>
            <button onClick={() => setIsProfileOpen((prev) => !prev)} className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:hover:bg-slate-800">
              <div className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center border border-emerald-200 overflow-hidden dark:bg-slate-800 dark:border-slate-700 dark:text-emerald-400">
                {user?.avatar ? <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" /> : <span className="font-bold text-sm uppercase">{firstName.charAt(0)}</span>}
              </div>
              <div className="hidden sm:flex flex-col items-start leading-none mr-1">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{firstName}</span>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 capitalize">{user?.role === "admin" ? "Administrador" : "Operador"}</span>
              </div>
              <ChevronDown className="h-4 w-4 text-slate-400 dark:text-slate-500 hidden sm:block" />
            </button>
            {isProfileOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 dark:bg-slate-900 dark:border-slate-700">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 dark:bg-slate-800/50 dark:border-slate-800">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{user?.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
                </div>
                <div className="p-1.5 flex flex-col gap-0.5">
                  <button onClick={() => { setIsProfileOpen(false); setActiveMainTab("settings"); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-semibold text-slate-700 rounded-xl hover:bg-slate-100 transition-colors dark:text-slate-300 dark:hover:bg-slate-800">
                    <Settings size={16} className="text-slate-400 dark:text-slate-500" /> Configuracoes
                  </button>
                  <button onClick={toggleTheme} className="w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-slate-700 rounded-xl hover:bg-slate-100 transition-colors dark:text-slate-300 dark:hover:bg-slate-800">
                    <div className="flex items-center gap-3">
                      {isDarkMode ? <Sun size={16} className="text-amber-500" /> : <Moon size={16} className="text-slate-400 dark:text-slate-500" />}
                      {isDarkMode ? "Modo Claro" : "Modo Escuro"}
                    </div>
                  </button>
                </div>
                <div className="h-px bg-slate-100 dark:bg-slate-800 w-full" />
                <div className="p-1.5">
                  <button onClick={() => logout()} className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-red-600 rounded-xl hover:bg-red-50 transition-colors dark:text-red-400 dark:hover:bg-red-950/30">
                    <LogOut size={16} /> Sair da conta
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* HUB SUB-NAV */}
      {activeMainTab === "hub" && (
        <div className="bg-white border-b border-slate-200 px-8 py-3 flex items-center shadow-sm z-10 shrink-0 transition-colors dark:bg-slate-800 dark:border-slate-700">
          <div className="flex items-center gap-2">
            {hubSubNavigation.map((subItem) => {
              const isActive = activeHubSubTab === subItem.key;
              return (
                <button
                  key={subItem.key}
                  onClick={() => setActiveHubSubTab(subItem.key)}
                  className={"px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all " + (isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-700")}
                >
                  <subItem.icon className="h-4 w-4" strokeWidth={isActive ? 2.5 : 2} />
                  {subItem.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className={"flex-1 flex flex-col relative bg-slate-50/50 dark:bg-slate-900/50 " + (activeMainTab === "notes" || activeMainTab === "leitor" ? "overflow-hidden" : "overflow-y-auto")}>
        {activeMainTab === "hub" && (
          <div className="bg-slate-50/90 backdrop-blur-md border-b border-slate-200 px-8 py-4 sticky top-0 z-10 flex items-center justify-between shrink-0 transition-colors dark:bg-slate-900/90 dark:border-slate-800">
            <div className="relative w-full max-w-md">
              <Search className="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder={"Pesquisar em " + (hubSubNavigation.find((s) => s.key === activeHubSubTab)?.name || "") + "..."}
                value={hubSearchQuery}
                onChange={(e) => setHubSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 py-2.5 pl-12 pr-4 rounded-xl shadow-sm outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm font-medium dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:placeholder-slate-500"
              />
            </div>
            <button
              onClick={() => {
                setHubForm({ type: activeHubSubTab, topic: "", title: "", content: "", url: "", name: "", value: "" });
                setIsHubModalOpen(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm flex items-center gap-2 shrink-0"
            >
              <PlusCircle className="h-5 w-5" strokeWidth={2.5} /> Novo Cadastro
            </button>
          </div>
        )}

        <div className={"flex-1 flex flex-col " + (activeMainTab === "notes" || activeMainTab === "leitor" ? "h-full" : "p-8")}>
          {activeMainTab === "hub" && activeHubSubTab === "messages" && <Messages searchQuery={hubSearchQuery} refreshKey={hubRefreshKey} />}
          {activeMainTab === "hub" && activeHubSubTab === "routes" && <Shortcuts searchQuery={hubSearchQuery} refreshKey={hubRefreshKey} />}
          {activeMainTab === "hub" && activeHubSubTab === "links" && <Links searchQuery={hubSearchQuery} refreshKey={hubRefreshKey} />}
          {activeMainTab === "hub" && activeHubSubTab === "emojis" && <Emojis searchQuery={hubSearchQuery} refreshKey={hubRefreshKey} />}
          {activeMainTab === "cep" && <Cep />}
          {activeMainTab === "atendimentos" && <Attendances />}
          {activeMainTab === "settings" && <SettingsPage />}
          {activeMainTab === "leitor" && <LeitorNfe />}
          {activeMainTab === "notes" && (
            <Notes
              alerts={alerts}
              fetchAlerts={fetchAlerts}
              setSelectedNotification={setSelectedNotification}
              setIsRecadoModalOpen={setIsRecadoModalOpen}
              setRecadoForm={setRecadoForm}
              showGlobalToast={showGlobalToast}
            />
          )}
          {activeMainTab === "kpi" && <Kpi />}
          {activeMainTab !== "hub" && activeMainTab !== "atendimentos" && activeMainTab !== "cep" && activeMainTab !== "settings" && activeMainTab !== "leitor" && activeMainTab !== "notes" && activeMainTab !== "kpi" && (
            <div className="text-center py-12 text-slate-500">Modulo {activeMainTab} em construcao.</div>
          )}
        </div>
      </main>

      {/* FOOTER TICKER GLOBAL - aparece em todas as abas exceto Settings */}
      {activeMainTab !== "settings" && (
        <footer className="h-8 shrink-0 bg-slate-900 flex items-center overflow-hidden z-40 relative w-full dark:bg-[#0a0a0a] dark:border-t dark:border-slate-800">
          <div className="h-full bg-slate-800 px-4 flex items-center gap-2 z-10 shrink-0 border-r border-slate-700 dark:bg-[#111] dark:border-slate-800">
            <Terminal size={14} className="text-emerald-400 dark:text-emerald-500" />
            <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest dark:text-emerald-500">V3.0.1</span>
          </div>
          <div className="flex-1 px-4 h-full flex items-center font-mono text-[11px] font-medium tracking-tight text-slate-300 dark:text-slate-400">
            {displayedAlert ? (
              <div
                key={displayedAlert.id}
                className="flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 cursor-pointer"
                onClick={() => setSelectedNotification(displayedAlert)}
              >
                <span className={"w-1.5 h-1.5 rounded-full shrink-0 " + (displayedAlert.type === "incidente" ? "bg-red-500 shadow-[0_0_5px_#ef4444]" : displayedAlert.type === "lembrete" ? "bg-amber-400 shadow-[0_0_5px_#fbbf24]" : "bg-blue-400 shadow-[0_0_5px_#60a5fa]")} />
                <span className={displayedAlert.type === "incidente" ? "text-red-400" : displayedAlert.type === "lembrete" ? "text-amber-400" : "text-blue-400"}>
                  [{new Date(displayedAlert.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}] NOVO RECADO: {displayedAlert.title}
                </span>
              </div>
            ) : (
              <span className="text-slate-500">Sistema operacional &mdash; nenhum aviso ativo.</span>
            )}
          </div>
        </footer>
      )}

    </div>
  );
}

export default App;
