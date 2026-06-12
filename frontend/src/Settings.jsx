import { useState, useEffect, useContext, useRef } from "react";
import {
  User,
  Shield,
  Cpu,
  MessageSquareText,
  Save,
  CheckCircle2,
  UserPlus,
  Key,
  Bot,
  Database,
  AlertCircle,
  Upload,
  Users,
  Trash2,
  PhoneCall,
  Ticket,
} from "lucide-react";
import { AuthContext } from "./contexts/AuthContext";

export default function Settings() {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role?.toLowerCase() === "admin";

  const [activeTab, setActiveTab] = useState("account");
  const [accountSubTab, setAccountSubTab] = useState("profile");
  const [toast, setToast] = useState(null);

  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [userError, setUserError] = useState("");

  const fileInputRef = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // ================= ESTADOS =================
  const [defaultTratativas, setDefaultTratativas] = useState({
    phone: "",
    ticket: "",
  });
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    avatar: user?.avatar || null,
  });
  const [passwordForm, setPasswordForm] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const [aiSettings, setAiSettings] = useState({
    geminiKey: "",
    openaiKey: "",
    groqKey: "",
    geminiConfigured: false,
    openaiConfigured: false,
    groqConfigured: false,
    systemPrompt: "",
  });
  const [newUserForm, setNewUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });

  const [usersList, setUsersList] = useState([]);

  // ================= FETCH INICIAL =================
  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) setUsersList(await res.json());
    } catch (err) {
      console.error("Erro ao buscar usuários:", err);
    }
  };

  useEffect(() => {
    const localPhone = localStorage.getItem("my_default_tratativa_phone") || "";
    const localTicket = localStorage.getItem("my_default_tratativa_ticket") || "";
    setDefaultTratativas({ phone: localPhone, ticket: localTicket });

    fetch("/api/settings/system")
      .then((res) => res.json())
      .then((data) => {
        const newTratativas = {
          phone: data.defaultTratativaPhone || localPhone || "",
          ticket: data.defaultTratativaTicket || localTicket || "",
        };
        setDefaultTratativas(newTratativas);
        localStorage.setItem("my_default_tratativa_phone", newTratativas.phone);
        localStorage.setItem("my_default_tratativa_ticket", newTratativas.ticket);
      })
      .catch((err) => console.error(err));

    if (isAdmin) {
      fetch("/api/settings/ai")
        .then((res) => res.json())
        .then((data) => {
          setAiSettings({
            geminiKey: "",
            openaiKey: "",
            groqKey: "",
            geminiConfigured: data.geminiKey === '***configured***',
            openaiConfigured: data.openaiKey === '***configured***',
            groqConfigured: data.groqKey === '***configured***',
            systemPrompt: data.systemPrompt || "",
          });
        })
        .catch((err) => console.error(err));

      fetchUsers();
    }
  }, [isAdmin]);

  // ================= HANDLERS DE SISTEMA =================
  const handleSaveAttendances = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/settings/system", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          defaultTratativaPhone: defaultTratativas.phone,
          defaultTratativaTicket: defaultTratativas.ticket,
        }),
      });
      if (res.ok) {
        localStorage.setItem("my_default_tratativa_phone", defaultTratativas.phone);
        localStorage.setItem("my_default_tratativa_ticket", defaultTratativas.ticket);
        showToast("Tratativas padrão sincronizadas na nuvem!");
      }
    } catch (err) {
      showToast("Erro ao salvar. Verifique a conexão.");
    }
  };

  const handleSaveAiSettings = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        systemPrompt: aiSettings.systemPrompt,
      };
      if (aiSettings.geminiKey) payload.geminiKey = aiSettings.geminiKey;
      if (aiSettings.openaiKey) payload.openaiKey = aiSettings.openaiKey;
      if (aiSettings.groqKey) payload.groqKey = aiSettings.groqKey;

      const res = await fetch("/api/settings/ai", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setAiSettings(prev => ({
          ...prev,
          geminiKey: "",
          openaiKey: "",
          groqKey: "",
          geminiConfigured: data.geminiKey === '***configured***',
          openaiConfigured: data.openaiKey === '***configured***',
          groqConfigured: data.groqKey === '***configured***',
        }));
        showToast("Configurações da IA atualizadas!");
      }
    } catch (err) {
      showToast("Erro ao salvar configurações da IA.");
    }
  };

  // ================= MINHA CONTA: PERFIL =================
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError("");

    if (!profileForm.name.trim())
      return setProfileError("O nome não pode ficar vazio.");

    try {
      const res = await fetch("/api/me/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: profileForm.name }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erro ao atualizar perfil.");

      showToast("Perfil atualizado! Atualize a página para ver o novo nome.");
    } catch (err) {
      setProfileError(err.message);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setProfileError(
        "A imagem é muito grande. O tamanho máximo permitido é 2MB.",
      );
      return;
    }

    setProfileError("");

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;

      try {
        const res = await fetch("/api/me/avatar", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatar: base64String }),
        });

        if (!res.ok) throw new Error("Erro ao salvar imagem");

        setProfileForm((prev) => ({ ...prev, avatar: base64String }));
        showToast("Foto de perfil atualizada!");

        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        setProfileError("Falha ao enviar a imagem para o servidor.");
      }
    };
    reader.readAsDataURL(file);
  };

  // ================= MINHA CONTA: SEGURANÇA =================
  const handleSavePassword = async (e) => {
    e.preventDefault();
    setPasswordError("");

    if (passwordForm.new !== passwordForm.confirm) {
      return setPasswordError("As novas senhas não coincidem!");
    }

    const pwd = passwordForm.new;
    if (pwd.length < 8)
      return setPasswordError("A senha deve ter no mínimo 8 caracteres.");
    if (!/[A-Z]/.test(pwd))
      return setPasswordError(
        "A senha deve ter no mínimo uma letra maiúscula.",
      );
    if (!/[a-z]/.test(pwd))
      return setPasswordError(
        "A senha deve ter no mínimo uma letra minúscula.",
      );
    if (!/[0-9]/.test(pwd))
      return setPasswordError("A senha deve ter no mínimo um número.");
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd))
      return setPasswordError(
        "A senha deve ter no mínimo um caractere especial (!@#$...).",
      );

    try {
      const res = await fetch("/api/me/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.current,
          newPassword: passwordForm.new,
        }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erro ao atualizar senha.");

      showToast("Senha alterada com sucesso!");
      setPasswordForm({ current: "", new: "", confirm: "" });
    } catch (err) {
      setPasswordError(err.message);
    }
  };

  // ================= ADMIN: GERENCIAR USUÁRIOS =================
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUserError("");

    const pwd = newUserForm.password;
    if (pwd.length < 8)
      return setUserError("A senha deve ter no mínimo 8 caracteres.");
    if (!/[A-Z]/.test(pwd))
      return setUserError("A senha deve ter no mínimo uma letra maiúscula.");
    if (!/[a-z]/.test(pwd))
      return setUserError("A senha deve ter no mínimo uma letra minúscula.");
    if (!/[0-9]/.test(pwd))
      return setUserError("A senha deve ter no mínimo um número.");
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd))
      return setUserError(
        "A senha deve ter no mínimo um caractere especial (!@#$...).",
      );

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUserForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao cadastrar usuário.");

      showToast(`Usuário ${newUserForm.name} criado com sucesso!`);
      setNewUserForm({ name: "", email: "", password: "", role: "user" });
      fetchUsers();
    } catch (error) {
      setUserError(error.message);
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (
      !window.confirm(
        `Tem certeza absoluta que deseja EXCLUIR o usuário ${name} e todos os seus dados? Esta ação é irreversível.`,
      )
    )
      return;

    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao excluir usuário");
      }
      showToast("Usuário excluído!");
      fetchUsers();
    } catch (e) {
      setUserError(e.message);
    }
  };

  const handleResetPassword = async (id, name) => {
    const newPassword = window.prompt(
      `Digite a nova senha provisória para ${name} (Mínimo 8 carac, 1 maiúscula, 1 número, 1 especial):`,
    );
    if (!newPassword) return;

    if (
      newPassword.length < 8 ||
      !/[A-Z]/.test(newPassword) ||
      !/[a-z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword) ||
      !/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)
    ) {
      alert("A senha provisória não atende aos requisitos de segurança.");
      return;
    }

    try {
      const res = await fetch(`/api/users/${id}/reset-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao resetar senha");
      }
      showToast(`Senha de ${name} resetada com sucesso!`);
    } catch (e) {
      setUserError(e.message);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 animate-in fade-in duration-500 w-full max-w-[1400px] mx-auto mt-4 px-4 sm:px-6">
      {toast && (
        <div className="fixed bottom-8 right-8 bg-slate-800 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 z-[100] dark:bg-slate-800 dark:border dark:border-slate-700">
          <CheckCircle2 className="h-5 w-5 text-[#1FA697]" />
          <span className="font-medium text-sm">{toast}</span>
        </div>
      )}

      {/* SIDEBAR DE NAVEGAÇÃO */}
      <div className="w-full md:w-64 md:min-w-[250px] shrink-0 flex flex-col gap-2">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2 dark:text-slate-500">
          Configurações
        </h2>

        <button
          onClick={() => setActiveTab("account")}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${activeTab === "account" ? "bg-white text-[#175676] shadow-sm border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-[#1FA697]" : "text-slate-600 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200"}`}
        >
          <User size={18} /> Minha Conta
        </button>

        <button
          onClick={() => setActiveTab("attendances")}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${activeTab === "attendances" ? "bg-white text-[#175676] shadow-sm border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-[#1FA697]" : "text-slate-600 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200"}`}
        >
          <MessageSquareText size={18} /> Atendimentos
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab("system")}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm transition-all ${activeTab === "system" ? "bg-white text-[#175676] shadow-sm border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-[#1FA697]" : "text-slate-600 hover:bg-slate-200/50 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200"}`}
          >
            <Cpu size={18} /> Sistema
          </button>
        )}
      </div>

      {/* ÁREA DE CONTEÚDO */}
      <div className="flex-1 w-full bg-white border border-slate-200 rounded-2xl shadow-sm p-6 lg:p-10 dark:bg-slate-800 dark:border-slate-700 min-h-[500px]">
        {/* ================= ABA: MINHA CONTA ================= */}
        {activeTab === "account" && (
          <div className="space-y-6 animate-in fade-in w-full">
            <div className="flex items-center gap-4 border-b border-slate-200 pb-4 dark:border-slate-700 w-full">
              <button
                onClick={() => {
                  setAccountSubTab("profile");
                  setProfileError("");
                }}
                className={`text-sm font-bold pb-4 -mb-[17px] border-b-2 transition-colors ${accountSubTab === "profile" ? "border-[#1FA697] text-[#175676] dark:text-[#1FA697]" : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}
              >
                Perfil
              </button>
              <button
                onClick={() => {
                  setAccountSubTab("security");
                  setPasswordError("");
                }}
                className={`text-sm font-bold pb-4 -mb-[17px] border-b-2 transition-colors ${accountSubTab === "security" ? "border-[#1FA697] text-[#175676] dark:text-[#1FA697]" : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"}`}
              >
                Segurança
              </button>
            </div>

            {accountSubTab === "profile" && (
              <form
                onSubmit={handleSaveProfile}
                className="space-y-5 max-w-lg animate-in slide-in-from-right-4"
              >
                {profileError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600 text-sm font-bold dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400">
                    <AlertCircle size={16} /> {profileError}
                  </div>
                )}

                <div className="flex items-center gap-4 mb-6">
                  <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 dark:bg-slate-900/50 dark:border-slate-700 text-2xl font-bold text-[#175676] dark:text-[#1FA697] uppercase shrink-0 overflow-hidden">
                    {profileForm.avatar ? (
                      <img
                        src={profileForm.avatar}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : profileForm.name ? (
                      profileForm.name.charAt(0)
                    ) : (
                      "U"
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleAvatarChange}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current.click()}
                      className="text-sm font-semibold text-[#1FA697] hover:underline flex items-center gap-1.5"
                    >
                      <Upload size={14} /> Alterar foto
                    </button>
                    <p className="text-[10px] text-slate-400 mt-1">
                      JPG, PNG. Máx 2MB.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 dark:text-slate-300">
                    Nome de Exibição
                  </label>
                  <input
                    value={profileForm.name}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, name: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-[#175676]/20 focus:border-[#175676] transition-all text-sm dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-200 dark:focus:border-[#1FA697]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 dark:text-slate-300">
                    E-mail de Login
                  </label>
                  <input
                    type="email"
                    disabled
                    value={profileForm.email}
                    className="w-full bg-slate-100 border border-slate-200 px-4 py-3 rounded-xl outline-none text-sm text-slate-500 cursor-not-allowed dark:bg-slate-900 dark:border-slate-800 dark:text-slate-500"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    O e-mail de login não pode ser alterado por segurança.
                  </p>
                </div>
                <button
                  type="submit"
                  className="bg-[#175676] hover:bg-[#114058] text-white px-8 py-3 rounded-xl text-sm font-bold transition-colors shadow-sm flex items-center gap-2 dark:bg-[#1FA697] dark:hover:bg-[#188075]"
                >
                  <Save size={16} /> Salvar Perfil
                </button>
              </form>
            )}

            {accountSubTab === "security" && (
              <form
                onSubmit={handleSavePassword}
                className="space-y-5 max-w-lg animate-in slide-in-from-left-4"
              >
                {passwordError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600 text-sm font-bold dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400">
                    <AlertCircle size={16} /> {passwordError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 dark:text-slate-300">
                    Senha Atual
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordForm.current}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        current: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-[#175676]/20 focus:border-[#175676] transition-all text-sm dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-200 dark:focus:border-[#1FA697]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 dark:text-slate-300">
                    Nova Senha
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordForm.new}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, new: e.target.value })
                    }
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-[#175676]/20 focus:border-[#175676] transition-all text-sm dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-200 dark:focus:border-[#1FA697]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5 dark:text-slate-300">
                    Confirmar Nova Senha
                  </label>
                  <input
                    type="password"
                    required
                    value={passwordForm.confirm}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirm: e.target.value,
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-[#175676]/20 focus:border-[#175676] transition-all text-sm dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-200 dark:focus:border-[#1FA697]"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-[#175676] hover:bg-[#114058] text-white px-8 py-3 rounded-xl text-sm font-bold transition-colors shadow-sm flex items-center gap-2 dark:bg-[#1FA697] dark:hover:bg-[#188075]"
                >
                  <Key size={16} /> Atualizar Senha
                </button>
              </form>
            )}
          </div>
        )}

        {/* === ABA: ATENDIMENTOS === */}
        {activeTab === "attendances" && (
          <div className="space-y-6 animate-in fade-in">
            <div className="border-b border-slate-200 pb-4 mb-6 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                Tratativas Padrão por Tipo
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                Configure tratativas específicas para cada tipo de atendimento.
              </p>
            </div>
            <form
              onSubmit={handleSaveAttendances}
              className="space-y-8 w-full max-w-4xl"
            >
              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <PhoneCall size={16} className="text-blue-600 dark:text-blue-400" />
                  Tratativa Padrão - Ligações
                </label>
                <textarea
                  rows="10"
                  value={defaultTratativas.phone}
                  onChange={(e) => setDefaultTratativas({ ...defaultTratativas, phone: e.target.value })}
                  placeholder="Digite a tratativa padrão para atendimentos por ligação..."
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-4 rounded-xl outline-none focus:ring-2 focus:ring-[#175676]/20 focus:border-[#175676] transition-all text-sm resize-y leading-relaxed dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-200 dark:focus:border-[#1FA697]"
                ></textarea>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Ticket size={16} className="text-purple-600 dark:text-purple-400" />
                  Tratativa Padrão - Tickets
                </label>
                <textarea
                  rows="10"
                  value={defaultTratativas.ticket}
                  onChange={(e) => setDefaultTratativas({ ...defaultTratativas, ticket: e.target.value })}
                  placeholder="Digite a tratativa padrão para atendimentos por ticket..."
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-4 rounded-xl outline-none focus:ring-2 focus:ring-[#175676]/20 focus:border-[#175676] transition-all text-sm resize-y leading-relaxed dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-200 dark:focus:border-[#1FA697]"
                ></textarea>
              </div>

              <button
                type="submit"
                className="bg-[#175676] hover:bg-[#114058] text-white px-8 py-3 rounded-xl text-sm font-bold transition-colors shadow-sm flex items-center gap-2 dark:bg-[#1FA697] dark:hover:bg-[#188075]"
              >
                <Save size={16} /> Salvar Preferências
              </button>
            </form>
          </div>
        )}

        {/* === ABA: SISTEMA (ADMIN) === */}
        {activeTab === "system" && isAdmin && (
          <div className="space-y-12 animate-in fade-in w-full">
            {/* Secção: Integração IA */}
            <section className="w-full max-w-5xl">
              <div className="border-b border-slate-200 pb-3 mb-6 dark:border-slate-700 flex items-center gap-2">
                <Bot className="text-[#6A2C70] dark:text-[#d8a1de]" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                  Inteligência Artificial — Multi-Provider
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Prioridade: <strong>Gemini</strong> → <strong>ChatGPT</strong> → <strong>Llama (Groq)</strong>. Se o Gemini estiver indisponível, o sistema tenta automaticamente o próximo provider.
              </p>
              <form
                onSubmit={handleSaveAiSettings}
                className="space-y-5 w-full"
              >
                {/* Gemini */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-green-700 dark:text-green-400 flex items-center gap-1">
                    Gemini (Google) — Prioridade
                    {aiSettings.geminiConfigured && <span className="text-[10px] bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 px-2 py-0.5 rounded-full">configurada</span>}
                  </label>
                  <input
                    type="password"
                    placeholder={aiSettings.geminiConfigured ? "••••••••  (chave já configurada)" : "API Key Gemini: AIzaSy..."}
                    value={aiSettings.geminiKey}
                    onChange={(e) => setAiSettings({ ...aiSettings, geminiKey: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl outline-none dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-200"
                  />
                </div>

                {/* ChatGPT */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1">
                    ChatGPT (OpenAI) — Fallback 1
                    {aiSettings.openaiConfigured && <span className="text-[10px] bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-0.5 rounded-full">configurada</span>}
                  </label>
                  <input
                    type="password"
                    placeholder={aiSettings.openaiConfigured ? "••••••••  (chave já configurada)" : "API Key OpenAI: sk-..."}
                    value={aiSettings.openaiKey}
                    onChange={(e) => setAiSettings({ ...aiSettings, openaiKey: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl outline-none dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-200"
                  />
                </div>

                {/* Groq / Llama */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-orange-700 dark:text-orange-400 flex items-center gap-1">
                    Llama (Groq) — Fallback 2
                    {aiSettings.groqConfigured && <span className="text-[10px] bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 px-2 py-0.5 rounded-full">configurada</span>}
                  </label>
                  <input
                    type="password"
                    placeholder={aiSettings.groqConfigured ? "••••••••  (chave já configurada)" : "API Key Groq: gsk_..."}
                    value={aiSettings.groqKey}
                    onChange={(e) => setAiSettings({ ...aiSettings, groqKey: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl outline-none dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-200"
                  />
                </div>

                {/* System Prompt */}
                <textarea
                  rows="5"
                  placeholder="Prompt do Sistema (usado por todos os providers)..."
                  value={aiSettings.systemPrompt}
                  onChange={(e) =>
                    setAiSettings({
                      ...aiSettings,
                      systemPrompt: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-4 rounded-xl outline-none dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-200"
                ></textarea>
                <button
                  type="submit"
                  className="bg-[#6A2C70] hover:bg-[#4a1e4e] text-white px-8 py-3 rounded-xl text-sm font-bold shadow-sm dark:bg-[#6A2C70]/50 dark:text-[#d8a1de] dark:border dark:border-[#d8a1de]/30 dark:hover:bg-[#6A2C70]"
                >
                  Atualizar IA
                </button>
              </form>
            </section>

            {/* Secção: Gestão de Usuários */}
            <section className="w-full max-w-5xl">
              <div className="border-b border-slate-200 pb-3 mb-6 dark:border-slate-700 flex items-center gap-2">
                <Shield className="text-[#1FA697]" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                  Novo Usuário
                </h3>
              </div>

              {userError && (
                <div className="mb-5 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 text-sm font-bold animate-in slide-in-from-top-2">
                  <AlertCircle size={18} /> {userError}
                </div>
              )}

              <form
                onSubmit={handleCreateUser}
                className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full bg-slate-50 p-6 rounded-2xl border border-slate-200 dark:bg-slate-900/30 dark:border-slate-700"
              >
                <input
                  required
                  placeholder="Nome Completo"
                  value={newUserForm.name}
                  onChange={(e) =>
                    setNewUserForm({ ...newUserForm, name: e.target.value })
                  }
                  className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl outline-none focus:border-[#1FA697] dark:bg-slate-900/80 dark:border-slate-700 dark:text-slate-200"
                />
                <input
                  type="email"
                  required
                  placeholder="E-mail corporativo"
                  value={newUserForm.email}
                  onChange={(e) =>
                    setNewUserForm({ ...newUserForm, email: e.target.value })
                  }
                  className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl outline-none focus:border-[#1FA697] dark:bg-slate-900/80 dark:border-slate-700 dark:text-slate-200"
                />

                <div>
                  <input
                    type="password"
                    required
                    placeholder="Senha provisória"
                    value={newUserForm.password}
                    onChange={(e) =>
                      setNewUserForm({
                        ...newUserForm,
                        password: e.target.value,
                      })
                    }
                    className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl outline-none focus:border-[#1FA697] dark:bg-slate-900/80 dark:border-slate-700 dark:text-slate-200"
                  />
                  <p className="text-[10px] text-slate-400 mt-1.5 font-medium ml-1">
                    Requisitos: 8+ caracs, 1 maiúscula, 1 minúscula, 1 número e
                    1 especial.
                  </p>
                </div>

                <select
                  value={newUserForm.role}
                  onChange={(e) =>
                    setNewUserForm({ ...newUserForm, role: e.target.value })
                  }
                  className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl outline-none focus:border-[#1FA697] h-[50px] dark:bg-slate-900/80 dark:border-slate-700 dark:text-slate-200"
                >
                  <option value="user">Usuário Padrão</option>
                  <option value="admin">Administrador</option>
                </select>

                <div className="md:col-span-2 pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="bg-[#175676] hover:bg-[#114058] text-white px-8 py-3 rounded-xl text-sm font-bold shadow-sm flex items-center gap-2 dark:bg-[#1FA697] dark:hover:bg-[#188075]"
                  >
                    <UserPlus size={18} /> Cadastrar Usuário
                  </button>
                </div>
              </form>
            </section>

            {/* Secção: Lista de Usuários */}
            <section className="w-full max-w-5xl mt-12">
              <div className="border-b border-slate-200 pb-3 mb-6 dark:border-slate-700 flex items-center gap-2">
                <Users className="text-[#1FA697]" />
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                  Usuários Cadastrados
                </h3>
              </div>
              <div className="bg-slate-50 rounded-2xl border border-slate-200 dark:bg-slate-900/30 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Nome</th>
                      <th className="px-4 py-3 font-semibold">E-mail</th>
                      <th className="px-4 py-3 font-semibold">Nível</th>
                      <th className="px-4 py-3 font-semibold text-right">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700/50">
                    {usersList.map((u) => (
                      <tr
                        key={u.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="px-4 py-3 text-slate-800 dark:text-slate-200 font-medium">
                          {u.name}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                          {u.email}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase ${u.role === "admin" ? "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"}`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleResetPassword(u.id, u.name)}
                            className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-colors dark:hover:bg-amber-500/10"
                            title="Resetar Senha"
                          >
                            <Key size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id, u.name)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-red-500/10"
                            title="Excluir Usuário"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {usersList.length === 0 && (
                      <tr>
                        <td
                          colSpan="4"
                          className="text-center py-6 text-slate-400"
                        >
                          Nenhum usuário encontrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
