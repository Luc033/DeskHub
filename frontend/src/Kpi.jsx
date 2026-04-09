import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ReferenceLine
} from 'recharts';
import { LayoutDashboard, Calendar, CalendarDays, PhoneCall, Ticket, Coffee, Activity, AlertCircle, Target, PartyPopper } from 'lucide-react';

const API_URL = '/api';

const formatTime = (hoursFloat) => {
  const h = Math.floor(hoursFloat);
  const m = Math.round((hoursFloat - h) * 60);
  return `${h}h ${m}m`;
};

const meses = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// Paleta de Cores Refinadas
const colors = {
  ligacoes: '#3b82f6', // blue-500
  tickets: '#8b5cf6',  // violet-500
  pausas: '#f59e0b',   // amber-500
  taxa: '#10b981'      // emerald-500
};

// --- FUNÇÃO QUE CRUZA O CALENDÁRIO COM O BANCO DE DADOS E FERIADOS ---
const buildMonthData = (year, monthIndex, attendances, kpis, feriadosArray) => {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const data = [];
  const diasDaSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  let saldoAcumuladoTickets = 0;

  // Mapa rápido de dados agrupados por dia (YYYY-MM-DD)
  const dataMap = {};

  attendances.forEach(att => {
    // Usamos openedAt ou createdAt
    const d = new Date(att.openedAt || att.createdAt || att.updatedAt || att.opened_at);
    if(isNaN(d.getTime())) return;
    const dStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    
    if (!dataMap[dStr]) dataMap[dStr] = { phone: 0, ticket: 0, missed: 0, pauses: 0 };
    if (att.type === 'phone') dataMap[dStr].phone++;
    if (att.type === 'ticket') dataMap[dStr].ticket++;
  });

  kpis.forEach(kpi => {
    // Adiciona o T00:00:00 para evitar fuso horário puxando a data um dia pra trás
    const kpiDateStr = kpi.date.split('T')[0] + 'T00:00:00';
    const d = new Date(kpiDateStr);
    
    if(isNaN(d.getTime())) return;
    const dStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    
    if (!dataMap[dStr]) dataMap[dStr] = { phone: 0, ticket: 0, missed: 0, pauses: 0 };
    dataMap[dStr].missed = kpi.missedCalls;
    dataMap[dStr].pauses = parseFloat((kpi.pausesMins / 60).toFixed(2));
  });

  // Monta o array visual do mês
  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(year, monthIndex, day);
    const jsDayOfWeek = currentDate.getDay(); // 0 = Dom, 6 = Sab
    const dStr = `${year}-${String(monthIndex+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const dataStr = `${String(day).padStart(2,'0')}/${String(monthIndex+1).padStart(2,'0')}`;
    const weekNum = Math.ceil(day / 7);

    const isFimDeSemana = (jsDayOfWeek === 0 || jsDayOfWeek === 6);
    const isFeriado = feriadosArray.includes(dataStr);
    const isDiaUtil = !isFimDeSemana && !isFeriado;

    const dbData = dataMap[dStr] || { phone: 0, ticket: 0, missed: 0, pauses: 0 };

    const ligacoesAtendidas = dbData.phone;
    const ligacoesPerdidas = dbData.missed;
    const totalLigacoes = ligacoesAtendidas + ligacoesPerdidas;
    const ticketsAtendidos = dbData.ticket;
    
    const metaTicketsDia = isDiaUtil ? 3 : 0;
    saldoAcumuladoTickets += (ticketsAtendidos - metaTicketsDia);

    data.push({
      semana: weekNum,
      dia: diasDaSemana[jsDayOfWeek],
      dataStr,
      isDiaUtil,
      isFeriado,
      labelDia: isFeriado ? `${diasDaSemana[jsDayOfWeek]} (Feriado)` : diasDaSemana[jsDayOfWeek],
      ligacoesAtendidas,
      ligacoesPerdidas,
      ticketsAtendidos,
      saldoAcumuladoTickets,
      pausas: dbData.pauses,
      taxaAtendimento: totalLigacoes > 0 ? parseFloat(((ligacoesAtendidas / totalLigacoes) * 100).toFixed(2)) : 0
    });
  }
  return data;
};

export default function Kpi() {
  const hoje = new Date();
  const anoAtual = hoje.getFullYear();
  const mesAtual = hoje.getMonth();
  const semanaAtual = Math.min(5, Math.ceil(hoje.getDate() / 7));

  const [viewMode, setViewMode] = useState('mensal'); 
  const [selectedYear, setSelectedYear] = useState(anoAtual);
  const [selectedMonth, setSelectedMonth] = useState(mesAtual); 
  const [selectedWeek, setSelectedWeek] = useState(semanaAtual);

  const [attendances, setAttendances] = useState([]);
  const [kpis, setKpis] = useState([]);
  const [feriadosNacionais, setFeriadosNacionais] = useState([]);

  useEffect(() => {
    const fetchFeriados = async () => {
      try {
        const response = await fetch(`https://brasilapi.com.br/api/feriados/v1/${selectedYear}`);
        if(response.ok) {
           const data = await response.json();
           const formattedHolidays = data.map(feriado => {
              const [y, m, d] = feriado.date.split('-');
              return `${d}/${m}`;
           });
           setFeriadosNacionais(formattedHolidays);
        }
      } catch (err) {
        console.error("Falha ao buscar Feriados. Usando lista de backup.");
        setFeriadosNacionais(['01/01', '21/04', '01/05', '07/09', '12/10', '02/11', '15/11', '25/12']);
      }
    };
    fetchFeriados();
  }, [selectedYear]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [attRes, kpiRes] = await Promise.all([
          fetch(`${API_URL}/attendances`),
          fetch(`${API_URL}/kpis`)
        ]);
        if(attRes.ok) setAttendances(await attRes.json());
        if(kpiRes.ok) setKpis(await kpiRes.json());
      } catch (err) { console.error("Erro ao carregar KPIs", err); }
    };
    fetchData();
  }, []);

  const anosDisponiveis = useMemo(() => Array.from({ length: 5 }, (_, i) => anoAtual - 2 + i), [anoAtual]);

  const monthData = useMemo(() => buildMonthData(selectedYear, selectedMonth, attendances, kpis, feriadosNacionais), [selectedYear, selectedMonth, attendances, kpis, feriadosNacionais]);

  const weeklyData = useMemo(() => {
    return monthData.filter(d => d.semana === selectedWeek);
  }, [monthData, selectedWeek]);

  const monthlyGroupedData = useMemo(() => {
    const grouped = [];
    for (let w = 1; w <= 5; w++) {
      const weekData = monthData.filter(d => d.semana === w);
      if (weekData.length === 0) continue;

      const diasUteisNaSemana = weekData.filter(d => d.isDiaUtil).length;
      const totalAtendidas = weekData.reduce((acc, curr) => acc + curr.ligacoesAtendidas, 0);
      const totalPerdidas = weekData.reduce((acc, curr) => acc + curr.ligacoesPerdidas, 0);
      
      grouped.push({
        nome: `Semana ${w}`,
        diasUteis: diasUteisNaSemana,
        ligacoesAtendidas: totalAtendidas,
        metaLigacoes: diasUteisNaSemana * 25,
        ticketsAtendidos: weekData.reduce((acc, curr) => acc + curr.ticketsAtendidos, 0),
        metaTickets: diasUteisNaSemana * 3,
        pausas: parseFloat(weekData.reduce((acc, curr) => acc + curr.pausas, 0).toFixed(2)),
        metaPausas: parseFloat((diasUteisNaSemana * 2.5).toFixed(2)),
        taxaAtendimento: totalAtendidas > 0 ? parseFloat(((totalAtendidas / (totalAtendidas + totalPerdidas)) * 100).toFixed(2)) : 0
      });
    }
    return grouped;
  }, [monthData]);

  const currentSummaryData = viewMode === 'mensal' ? monthData : weeklyData;
  
  const totais = useMemo(() => {
    const at = currentSummaryData.reduce((acc, curr) => acc + curr.ligacoesAtendidas, 0);
    const pe = currentSummaryData.reduce((acc, curr) => acc + curr.ligacoesPerdidas, 0);
    const pausas = currentSummaryData.reduce((acc, curr) => acc + curr.pausas, 0);
    return {
      ligacoes: at,
      tickets: currentSummaryData.reduce((acc, curr) => acc + curr.ticketsAtendidos, 0),
      pausas: pausas,
      taxaMedia: at > 0 ? ((at / (at + pe)) * 100).toFixed(1) : 0
    };
  }, [currentSummaryData]);

  const isTaxaBoa = Number(totais.taxaMedia) >= 94;

  const diaDeHojeStr = `${String(hoje.getDate()).padStart(2,'0')}/${String(hoje.getMonth()+1).padStart(2,'0')}`;
  const diaSimulado = monthData.find(d => d.dataStr === diaDeHojeStr) || monthData[monthData.length - 1]; 
  
  const metaDiariaTickets = diaSimulado.isDiaUtil ? 3 : 0;
  const metaDiariaLigacoes = diaSimulado.isDiaUtil ? 25 : 0;
  const saldoAteOntem = diaSimulado.saldoAcumuladoTickets - (diaSimulado.ticketsAtendidos - metaDiariaTickets);
  const metaTicketsHoje = Math.max(0, metaDiariaTickets - saldoAteOntem);
  const precisaDeTicketsHoje = metaTicketsHoje > 0;
  const faltamLigacoes = diaSimulado.isDiaUtil ? Math.max(0, metaDiariaLigacoes - diaSimulado.ligacoesAtendidas) : 0;

  return (
    <div className="min-h-full bg-transparent text-slate-800 font-sans p-6 animate-in fade-in">
      
      {/* Cabeçalho */}
      <div className="max-w-7xl mx-auto mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3 dark:text-slate-100">
            <LayoutDashboard className="text-emerald-600 dark:text-emerald-400" size={32} />
            DeskHub KPIs
          </h1>
          <p className="text-slate-500 mt-1 dark:text-slate-400">Acompanhamento de performance e metas</p>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
          <div className="flex bg-slate-100 p-1 rounded-lg dark:bg-slate-800">
            <button onClick={() => setViewMode('mensal')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'mensal' ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-700 dark:text-emerald-400' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'}`}>Visão Mensal</button>
            <button onClick={() => setViewMode('semanal')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'semanal' ? 'bg-white text-emerald-700 shadow-sm dark:bg-slate-700 dark:text-emerald-400' : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'}`}>Visão Semanal</button>
          </div>
          <div className="w-px h-8 bg-slate-200 mx-1 hidden sm:block dark:bg-slate-700"></div>
          
          <div className="flex items-center gap-2 px-2">
            <CalendarDays size={18} className="text-slate-400" />
            <select className="bg-transparent text-sm font-medium text-slate-700 outline-none cursor-pointer dark:text-slate-300 dark:bg-slate-900" value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
              {anosDisponiveis.map((ano) => <option key={ano} value={ano}>{ano}</option>)}
            </select>
          </div>
          <div className="w-px h-8 bg-slate-200 mx-1 hidden sm:block dark:bg-slate-700"></div>

          <div className="flex items-center gap-2 px-2">
            <Calendar size={18} className="text-slate-400" />
            <select className="bg-transparent text-sm font-medium text-slate-700 outline-none cursor-pointer dark:text-slate-300 dark:bg-slate-900" value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))}>
              {meses.map((mes, idx) => <option key={mes} value={idx}>{mes}</option>)}
            </select>
          </div>
          {viewMode === 'semanal' && (
            <>
              <div className="w-px h-8 bg-slate-200 mx-1 dark:bg-slate-700"></div>
              <div className="flex items-center gap-2 px-2">
                <CalendarDays size={18} className="text-slate-400" />
                <select className="bg-transparent text-sm font-medium text-slate-700 outline-none cursor-pointer dark:text-slate-300 dark:bg-slate-900" value={selectedWeek} onChange={(e) => setSelectedWeek(Number(e.target.value))}>
                  {[1, 2, 3, 4, 5].map((sem) => <option key={sem} value={sem}>Semana {sem}</option>)}
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-6">

        {/* RADAR OPERACIONAL */}
        <div className={`rounded-2xl p-6 shadow-md text-white border relative overflow-hidden transition-colors duration-500 ${!diaSimulado.isDiaUtil ? 'bg-slate-800 border-slate-700 dark:bg-slate-900 dark:border-slate-800' : 'bg-emerald-900 border-emerald-800 dark:bg-emerald-950 dark:border-emerald-900'}`}>
          <div className="absolute top-0 right-0 p-6 opacity-10">
            {!diaSimulado.isDiaUtil ? <PartyPopper size={120} /> : <Target size={120} />}
          </div>
          <div className="relative z-10">
            <h2 className={`${!diaSimulado.isDiaUtil ? 'text-slate-300' : 'text-emerald-200'} text-sm font-semibold tracking-wider uppercase mb-4 flex items-center gap-2`}><Activity size={16} /> Radar Operacional - {diaSimulado.labelDia}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`${!diaSimulado.isDiaUtil ? 'bg-slate-700/50 border-slate-600/50' : 'bg-emerald-800/50 border-emerald-700/50'} rounded-xl p-5 border`}>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-medium flex items-center gap-2"><Ticket size={20} className={!diaSimulado.isDiaUtil ? 'text-slate-300' : 'text-emerald-300'} /> Banco de Tickets</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${saldoAteOntem >= 0 ? 'bg-teal-500/20 text-teal-300' : 'bg-rose-500/20 text-rose-300'}`}>Saldo: {saldoAteOntem > 0 ? `+${saldoAteOntem}` : saldoAteOntem}</span>
                </div>
                <p className={`text-sm ${!diaSimulado.isDiaUtil ? 'text-slate-300' : 'text-emerald-200'} mb-3`}>Meta de hoje: <strong className="text-white">{metaDiariaTickets} tickets</strong></p>
                {!diaSimulado.isDiaUtil ? <div className="bg-teal-500/10 p-3 rounded-lg border border-teal-500/20 text-xs text-teal-300">Final de semana/feriado: tudo que fizer conta como superávit.</div> : precisaDeTicketsHoje ? <div className="bg-rose-500/10 p-3 rounded-lg border border-rose-500/20 text-sm text-white font-medium">Precisa de {metaTicketsHoje} tickets hoje para bater a meta + pendências.</div> : <div className="bg-teal-500/10 p-3 rounded-lg border border-teal-500/20 text-sm text-white font-medium">Meta de hoje coberta pelo superávit!</div>}
              </div>
              <div className={`${!diaSimulado.isDiaUtil ? 'bg-slate-700/50 border-slate-600/50' : 'bg-emerald-800/50 border-emerald-700/50'} rounded-xl p-5 border`}>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-medium flex items-center gap-2"><PhoneCall size={20} className={!diaSimulado.isDiaUtil ? 'text-slate-300' : 'text-emerald-300'} /> Meta de Ligações</h3>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white">Exigida: {metaDiariaLigacoes}</span>
                </div>
                <p className={`text-sm ${!diaSimulado.isDiaUtil ? 'text-slate-300' : 'text-emerald-200'} mb-3`}>Progresso: {diaSimulado.ligacoesAtendidas} atendidas.</p>
                {diaSimulado.isDiaUtil && faltamLigacoes > 0 ? <div className="bg-amber-500/10 p-3 rounded-lg border border-amber-500/20 text-sm text-white">Faltam {faltamLigacoes} ligações para a meta de 25.</div> : <div className="bg-teal-500/10 p-3 rounded-lg border border-teal-500/20 text-sm text-white">Meta de ligações batida!</div>}
              </div>
            </div>
          </div>
        </div>

        {/* Cards Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard title="Total Ligações" value={totais.ligacoes} icon={PhoneCall} color="text-blue-500 dark:text-blue-400" />
          <SummaryCard title="Total Tickets" value={totais.tickets} icon={Ticket} color="text-violet-500 dark:text-violet-400" />
          <SummaryCard title="Tempo em Pausa" value={formatTime(totais.pausas)} icon={Coffee} color="text-amber-500 dark:text-amber-400" />
          <SummaryCard title="% Atendimento" value={`${totais.taxaMedia}%`} icon={isTaxaBoa ? Activity : AlertCircle} color={isTaxaBoa ? "text-emerald-500 dark:text-emerald-400" : "text-red-500 dark:text-red-400"} />
        </div>

        {/* GRÁFICOS */}
        {viewMode === 'mensal' ? (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col dark:bg-slate-900 dark:border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Resumo Mensal vs Metas Proporcionais</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">As metas consideram apenas os dias úteis ({meses[selectedMonth]} de {selectedYear})</p>
              </div>
              <div className="flex flex-wrap gap-4 text-xs font-medium">
                <div className="flex items-center gap-1.5 dark:text-slate-300">
                   <div className="w-3 h-3 bg-slate-400 rounded-sm"></div> Realizado
                </div>
                <div className="flex items-center gap-1.5 dark:text-slate-300">
                   <div className="w-3 h-3 border border-slate-400 bg-slate-400/20 rounded-sm" style={{ borderStyle: 'dashed' }}></div> Meta / Limite
                </div>
              </div>
            </div>

            <div className="h-[500px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyGroupedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="nome" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#f59e0b' }} tickFormatter={(val) => `${val}h`} />
                  
                  <Tooltip 
                    cursor={{fill: 'rgba(148, 163, 184, 0.05)'}}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#1e293b', color: '#fff' }}
                    formatter={(value, name) => {
                      if (name.includes("Pausas")) return [formatTime(value), name];
                      return [value, name];
                    }}
                  />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '20px' }} />
                  
                  {/* LIGAÇÕES: Realizado vs Meta */}
                  <Bar yAxisId="left" dataKey="ligacoesAtendidas" name="Ligações Atendidas" fill={colors.ligacoes} radius={[4, 4, 0, 0]} barSize={25} />
                  <Bar yAxisId="left" dataKey="metaLigacoes" name="Meta Ligações" fill={colors.ligacoes} fillOpacity={0.2} stroke={colors.ligacoes} strokeDasharray="3 3" radius={[4, 4, 0, 0]} barSize={25} />

                  {/* TICKETS: Realizado vs Meta */}
                  <Bar yAxisId="left" dataKey="ticketsAtendidos" name="Tickets Atendidos" fill={colors.tickets} radius={[4, 4, 0, 0]} barSize={25} />
                  <Bar yAxisId="left" dataKey="metaTickets" name="Meta Tickets" fill={colors.tickets} fillOpacity={0.2} stroke={colors.tickets} strokeDasharray="3 3" radius={[4, 4, 0, 0]} barSize={25} />

                  {/* PAUSAS: Realizado vs Meta (Eixo Direito) */}
                  <Bar yAxisId="right" dataKey="pausas" name="Tempo Pausas" fill={colors.pausas} radius={[4, 4, 0, 0]} barSize={25} />
                  <Bar yAxisId="right" dataKey="metaPausas" name="Limite Pausas" fill={colors.pausas} fillOpacity={0.2} stroke={colors.pausas} strokeDasharray="3 3" radius={[4, 4, 0, 0]} barSize={25} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ligações e Tickets Semanais */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-[350px] flex flex-col lg:col-span-2 dark:bg-slate-900 dark:border-slate-800">
              <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4 dark:text-slate-400">Evolução Diária</h3>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyData} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                    <XAxis dataKey="labelDia" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                    
                    {/* YAxis com domain manual para as linhas de Meta não cortarem */}
                    <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} domain={[0, dataMax => Math.max(30, dataMax + 5)]} />
                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} domain={[0, dataMax => Math.max(5, dataMax + 2)]} />
                    
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#1e293b', color: '#fff' }} />
                    
                    <ReferenceLine yAxisId="left" y={25} stroke={colors.ligacoes} strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Meta Ligações: 25', fill: colors.ligacoes, fontSize: 10 }} />
                    <ReferenceLine yAxisId="right" y={3} stroke={colors.tickets} strokeDasharray="3 3" label={{ position: 'insideTopRight', value: 'Meta Tickets: 3', fill: colors.tickets, fontSize: 10 }} />
                    
                    <Line yAxisId="left" type="monotone" dataKey="ligacoesAtendidas" name="Ligações" stroke={colors.ligacoes} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line yAxisId="right" type="monotone" dataKey="ticketsAtendidos" name="Tickets" stroke={colors.tickets} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pausas Semanais */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-[300px] flex flex-col dark:bg-slate-900 dark:border-slate-800">
              <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4 dark:text-slate-400">Tempo em Pausa</h3>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                    <XAxis dataKey="labelDia" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${val}h`} tick={{ fill: '#64748b' }} domain={[0, dataMax => Math.max(3, dataMax + 0.5)]} />
                    <Tooltip formatter={(value) => [formatTime(value), 'Pausa']} contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#1e293b', color: '#fff' }} />
                    <ReferenceLine y={2.5} stroke={colors.pausas} strokeDasharray="3 3" label={{ position: 'top', value: 'Limite (2.5h)', fill: colors.pausas, fontSize: 10 }} />
                    <Area type="monotone" dataKey="pausas" stroke={colors.pausas} fillOpacity={0.15} fill={colors.pausas} strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Taxa Atendimento */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-[300px] flex flex-col dark:bg-slate-900 dark:border-slate-800">
              <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-4 dark:text-slate-400">% Atendimento</h3>
              <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                    <XAxis dataKey="labelDia" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                    <YAxis domain={[80, 100]} axisLine={false} tickLine={false} unit="%" tick={{ fill: '#64748b' }} />
                    <Tooltip formatter={(v) => [`${v}%`, 'Taxa']} contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#1e293b', color: '#fff' }} />
                    <ReferenceLine y={94} stroke={colors.taxa} strokeDasharray="3 3" label={{ position: 'top', value: 'Meta (94%)', fill: colors.taxa, fontSize: 10 }} />
                    <Line type="monotone" dataKey="taxaAtendimento" stroke={colors.taxa} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ title, value, icon: Icon, color }) {
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-start justify-between dark:bg-slate-900 dark:border-slate-800">
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800 mt-1 dark:text-slate-100">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl bg-slate-50 border border-slate-100 dark:bg-slate-800 dark:border-slate-700 shadow-sm ${color}`}>
        <Icon size={20} strokeWidth={2.5} />
      </div>
    </div>
  );
}