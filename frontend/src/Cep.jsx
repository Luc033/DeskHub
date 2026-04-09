import { useState } from 'react';
import { MapPin, Search, AlertCircle, Map } from 'lucide-react';

export default function Cep() {
  const [cepInput, setCepInput] = useState('');
  const [cepResult, setCepResult] = useState(null);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState('');

  const handleCepSearch = async (e) => {
    e.preventDefault();
    const cepLimpo = cepInput.replace(/\D/g, '');
    
    if (cepLimpo.length !== 8) {
      setCepError('Por favor, digite um CEP completo.');
      setCepResult(null); 
      return;
    }
    
    setCepLoading(true); 
    setCepError(''); 
    setCepResult(null);
    
    try {
      const resp = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const dados = await resp.json();
      
      if (dados.erro) {
        setCepError('CEP não encontrado. Verifique os números digitados.');
      } else {
        setCepResult(dados);
      }
    } catch (err) {
      setCepError('Erro de conexão. Tente novamente mais tarde.');
    } finally { 
      setCepLoading(false); 
    }
  };

  const formatCep = (value) => {
    let v = value.replace(/\D/g, "");
    if (v.length > 5) v = v.slice(0, 5) + "-" + v.slice(5, 8);
    return v;
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-lg mx-auto mt-10">
      <form onSubmit={handleCepSearch} className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center relative overflow-hidden dark:bg-slate-800 dark:border-slate-700">
        
        {/* Faixa decorativa no topo */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-emerald-500"></div>

        <h2 className="text-2xl font-extrabold text-slate-800 flex items-center justify-center gap-3 mb-8 dark:text-slate-100">
          <MapPin className="h-7 w-7 text-emerald-600 dark:text-emerald-400" strokeWidth={2.5} /> 
          Consulta de CEP
        </h2>
        
        <div className="flex gap-3 mb-8">
          <input 
            type="text" 
            maxLength="9" 
            placeholder="00000-000" 
            value={cepInput} 
            onChange={(e) => setCepInput(formatCep(e.target.value))} 
            className="flex-1 bg-slate-50 border-2 border-slate-200 p-3.5 rounded-2xl outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-center text-xl tracking-widest font-mono text-slate-700 transition-all shadow-inner dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-200 dark:focus:border-emerald-500 dark:placeholder-slate-500" 
          />
          <button 
            type="submit" 
            disabled={cepLoading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3.5 rounded-2xl transition-all shadow-sm flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {cepLoading ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Search className="h-5 w-5" strokeWidth={2.5} />}
          </button>
        </div>
        
        <div className="min-h-[220px] flex flex-col justify-center border-t border-slate-100 pt-8 dark:border-slate-700">
          
          {cepError && (
            <p className="text-red-600 font-bold bg-red-50 p-4 rounded-xl flex items-center justify-center gap-2 text-sm border border-red-100 animate-in fade-in dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50">
              <AlertCircle className="h-5 w-5" /> {cepError}
            </p>
          )}
          
          {cepResult && (
            <div className="space-y-3 text-left animate-in fade-in slide-in-from-bottom-4">
              <div className="flex justify-between items-center bg-slate-50 p-3.5 rounded-xl border border-slate-100 dark:bg-slate-900/50 dark:border-slate-700/50">
                <span className="font-bold text-slate-400 text-xs uppercase tracking-wider dark:text-slate-500">CEP</span> 
                <span className="text-slate-800 font-bold text-base dark:text-slate-200">{cepResult.cep}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-3.5 rounded-xl border border-slate-100 dark:bg-slate-900/50 dark:border-slate-700/50">
                <span className="font-bold text-slate-400 text-xs uppercase tracking-wider dark:text-slate-500">Logradouro</span> 
                <span className="text-slate-800 font-bold text-sm truncate ml-4 dark:text-slate-200" title={cepResult.logradouro}>{cepResult.logradouro || '---'}</span>
              </div>
              <div className="flex justify-between items-center bg-slate-50 p-3.5 rounded-xl border border-slate-100 dark:bg-slate-900/50 dark:border-slate-700/50">
                <span className="font-bold text-slate-400 text-xs uppercase tracking-wider dark:text-slate-500">Bairro</span> 
                <span className="text-slate-800 font-bold text-sm truncate ml-4 dark:text-slate-200" title={cepResult.bairro}>{cepResult.bairro || '---'}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col bg-slate-50 p-3.5 rounded-xl border border-slate-100 dark:bg-slate-900/50 dark:border-slate-700/50">
                  <span className="font-bold text-slate-400 text-xs uppercase tracking-wider mb-1 dark:text-slate-500">Cidade</span> 
                  <span className="text-slate-800 font-bold text-sm truncate dark:text-slate-200">{cepResult.localidade}</span>
                </div>
                <div className="flex flex-col bg-slate-50 p-3.5 rounded-xl border border-slate-100 dark:bg-slate-900/50 dark:border-slate-700/50">
                  <span className="font-bold text-slate-400 text-xs uppercase tracking-wider mb-1 dark:text-slate-500">Estado (UF)</span> 
                  <span className="text-slate-800 font-bold text-sm dark:text-slate-200">{cepResult.estado || cepResult.uf}</span>
                </div>
              </div>
            </div>
          )}
          
          {!cepLoading && !cepError && !cepResult && (
            <div className="text-slate-400 flex flex-col items-center gap-3 opacity-60 dark:text-slate-500">
              <Map className="h-14 w-14 text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
              <p className="font-medium text-sm">Digite o CEP acima e clique na lupa.</p>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}