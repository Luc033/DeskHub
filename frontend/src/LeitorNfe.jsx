import React, { useState } from 'react';
import { 
  UploadCloud, Code, FileCode, Search, ArrowRight, AlertCircle, Key, Info, 
  FileX2, Store, User, CircleDollarSign, PieChart, TrendingDown, Tags, 
  List, ChevronDown, ChevronUp, Percent, Map, Landmark, Receipt, RefreshCw,
  Clock, CheckCircle2, Users, MessageSquare // <-- Adicionados aqui!
} from 'lucide-react';

// ================= DICIONÁRIOS E UTILITÁRIOS =================
const dicCST = {
  "00": "Tributada integralmente", "10": "Tributada e com cobrança do ICMS por ST", "20": "Com redução de base de cálculo",
  "30": "Isenta/não tributada e com cobrança de ICMS por ST", "40": "Isenta", "41": "Não tributada", "50": "Suspensão", "51": "Diferimento",
  "60": "ICMS cobrado anteriormente por ST", "70": "Com redução de base de cálculo e cobrança do ICMS por ST", "90": "Outras",
  "101": "Tributada pelo SN com permissão de crédito", "102": "Tributada pelo SN sem permissão de crédito", "103": "Isenção do ICMS no SN para faixa de receita",
  "201": "Tributada pelo SN com permissão de crédito e com cobrança do ICMS por ST", "202": "Tributada pelo SN sem permissão de crédito e com cobrança do ICMS por ST",
  "203": "Isenção do ICMS no SN para faixa de receita e cobrança de ICMS por ST", "300": "Imune", "400": "Não tributada pelo SN",
  "500": "ICMS cobrado anteriormente por ST", "900": "Outros"
};

const dicCFOPComuns = {
  "1101": "Compra para industrialização", "1102": "Compra para comercialização", "1202": "Devolução de venda de mercadoria adquirida de terceiros",
  "1403": "Compra para comercialização em operação com mercadoria sujeita a ST", "2101": "Compra p/ industrialização (fora do estado)", 
  "2102": "Compra p/ comercialização (fora do estado)", "5101": "Venda de produção do estabelecimento", "5102": "Venda de mercadoria adquirida de terceiros",
  "5405": "Venda de mercadoria sujeita a ST, na condição de substituído", "6101": "Venda de produção do estabelecimento (fora do estado)", 
  "6102": "Venda de mercadoria adquirida de terceiros (fora do estado)"
};

const obterDescricaoCST = (cst) => {
  if (!cst || cst === "-") return "Código CST/CSOSN não informado";
  return dicCST[cst] || "CST/CSOSN sem descrição cadastrada no sistema.";
};

const obterDescricaoCFOP = (cfop) => {
  if (!cfop || cfop === "-") return "CFOP não informado";
  if (dicCFOPComuns[cfop]) return dicCFOPComuns[cfop];
  const prefixo = cfop.charAt(0);
  if(prefixo === '1') return "Entrada ou aquisição de serviços dentro do Estado";
  if(prefixo === '2') return "Entrada ou aquisição de serviços de outros Estados";
  if(prefixo === '3') return "Entrada ou aquisição de serviços do Exterior";
  if(prefixo === '5') return "Saída ou prestação de serviços para o Estado";
  if(prefixo === '6') return "Saída ou prestação de serviços para outros Estados";
  if(prefixo === '7') return "Saída ou prestação de serviços para o Exterior";
  return "CFOP genérico sem descrição específica.";
};

const codigosUF = { '11': 'RO', '12': 'AC', '13': 'AM', '14': 'RR', '15': 'PA', '16': 'AP', '17': 'TO', '21': 'MA', '22': 'PI', '23': 'CE', '24': 'RN', '25': 'PB', '26': 'PE', '27': 'AL', '28': 'SE', '29': 'BA', '31': 'MG', '32': 'ES', '33': 'RJ', '35': 'SP', '41': 'PR', '42': 'SC', '43': 'RS', '50': 'MS', '51': 'MT', '52': 'GO', '53': 'DF' };
const codigosMod = { '55': 'NF-e', '65': 'NFC-e', '57': 'CT-e', '67': 'CT-e OS', '59': 'CF-e (SAT)' };
const tpEmissaoDict = { '1': 'Normal', '2': 'Contingência FS', '3': 'Contingência SCAN', '4': 'Contingência DPEC', '5': 'Contingência FSDA', '6': 'Contingência SVC-AN', '7': 'Contingência SVC-RS', '9': 'Contingência Offline' };

const formatarMoeda = (valor) => {
  if (!valor || isNaN(parseFloat(valor))) return "R$ 0,00";
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(valor));
};

const formatarNumero = (valor) => {
  if (!valor || isNaN(parseFloat(valor))) return "0";
  return parseFloat(valor).toLocaleString('pt-BR', { maximumFractionDigits: 4 });
};

const formatarData = (dataString) => {
  if (!dataString) return "";
  const data = new Date(dataString);
  if (isNaN(data.getTime())) return dataString;
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();
  const hora = String(data.getHours()).padStart(2, '0');
  const min = String(data.getMinutes()).padStart(2, '0');
  return `${dia}/${mes}/${ano} às ${hora}:${min}`;
};

const formatarDocumento = (doc) => {
  if (!doc) return "";
  const limpo = doc.replace(/\D/g, '');
  if (limpo.length === 11) return limpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (limpo.length === 14) return limpo.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return doc;
};

const formatarChave = (chave) => {
  if (!chave || chave.length !== 44) return chave;
  return chave.match(/.{1,4}/g).join(' ');
};

// ================= COMPONENTES DE CAIXAS =================
const InfoBox = ({ label, value, sub, tooltip }) => (
  <div className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700 min-w-[110px] flex-1">
    <span className="text-slate-400 dark:text-slate-500 block mb-0.5 uppercase tracking-wide text-[8px] font-bold">{label}</span>
    {tooltip ? (
      <strong className="text-slate-800 dark:text-slate-200 border-b border-dashed border-slate-400 hover:border-[#175676] dark:hover:border-[#F2C94C] cursor-help transition-colors" title={tooltip}>{value}</strong>
    ) : (
      <strong className="text-slate-800 dark:text-slate-200">{value}</strong>
    )}
    {sub && <span className="block text-[9px] text-slate-500 mt-0.5">{sub}</span>}
  </div>
);

const colorClasses = {
  amber: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/50 text-amber-700 dark:text-amber-400",
  blue: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700/50 text-blue-700 dark:text-blue-400",
  emerald: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/50 text-emerald-700 dark:text-emerald-400",
  indigo: "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800/50 text-indigo-700 dark:text-indigo-400",
};
const labelClasses = {
  amber: "text-amber-600 dark:text-amber-500", blue: "text-blue-600 dark:text-blue-500",
  emerald: "text-emerald-600 dark:text-emerald-500", indigo: "text-indigo-600 dark:text-indigo-500",
};

const InfoBoxColor = ({ color, label, value, sub }) => (
  <div className={`p-2 rounded border min-w-[110px] flex-1 ${colorClasses[color]}`}>
    <span className={`block mb-0.5 uppercase tracking-wide text-[8px] font-bold ${labelClasses[color]}`}>{label}</span>
    <strong>{value}</strong>
    {sub && <span className="block text-[9px] opacity-70 mt-0.5">{sub}</span>}
  </div>
);

// ================= COMPONENTE PRINCIPAL =================
export default function LeitorNfe() {
  const [view, setView] = useState('upload'); // 'upload', 'chave', 'nfe', 'cancelamento'
  const [xmlText, setXmlText] = useState('');
  const [chaveInput, setChaveInput] = useState('');
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingSefaz, setIsLoadingSefaz] = useState(false);
  
  const [nfeData, setNfeData] = useState(null);
  const [chaveData, setChaveData] = useState(null);
  
  const [activeTab, setActiveTab] = useState('gerais');
  const [expandedRows, setExpandedRows] = useState({});
  const [allExpanded, setAllExpanded] = useState(false);

  const resetarApp = () => {
    setView('upload');
    setXmlText('');
    setChaveInput('');
    setError(null);
    setNfeData(null);
    setChaveData(null);
    setActiveTab('gerais');
    setExpandedRows({});
    setAllExpanded(false);
  };

  const getTagText = (node, tagName) => {
    if (!node) return "";
    let elements = node.getElementsByTagName(tagName);
    if (elements.length > 0) return elements[0].textContent.trim();
    elements = node.getElementsByTagNameNS("*", tagName);
    if (elements.length > 0) return elements[0].textContent.trim();
    const allElements = node.getElementsByTagName("*");
    for (let i = 0; i < allElements.length; i++) {
        if (allElements[i].localName === tagName) return allElements[i].textContent.trim();
    }
    return "";
  };

  const getTagsArray = (node, tagName) => {
    if (!node) return [];
    let els = node.getElementsByTagName(tagName);
    if (els.length > 0) return Array.from(els);
    els = node.getElementsByTagNameNS("*", tagName);
    if (els.length > 0) return Array.from(els);
    return Array.from(node.getElementsByTagName("*")).filter(el => el.localName === tagName);
  };

  const extrairEndereco = (node) => {
    if (!node) return "Endereço não informado.";
    const lgr = getTagText(node, "xLgr");
    const nro = getTagText(node, "nro");
    const cpl = getTagText(node, "xCpl");
    const bairro = getTagText(node, "xBairro");
    const mun = getTagText(node, "xMun");
    const uf = getTagText(node, "UF");
    const cepRaw = getTagText(node, "CEP");
    let endereco = `${lgr || ''}, ${nro || 'S/N'}`;
    if (cpl) endereco += ` - ${cpl}`;
    if (bairro) endereco += ` - ${bairro}`;
    if (mun && uf) endereco += `, ${mun} - ${uf}`;
    if (cepRaw && cepRaw.length === 8) endereco += ` | CEP: ${cepRaw.substring(0,5)}-${cepRaw.substring(5,8)}`;
    return endereco.replace(/^[\s,]+|[\s,]+$/g, '');
  };

  const processXML = (xmlString) => {
    setError(null);
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, "application/xml");

      if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
          throw new Error("O arquivo XML encontra-se malformado ou corrompido.");
      }

      if (getTagsArray(xmlDoc, "procEventoNFe").length > 0) {
        const infEvento = getTagsArray(xmlDoc, "infEvento")[0];
        const detEvento = getTagsArray(xmlDoc, "detEvento")[0];
        if (!detEvento || getTagText(detEvento, "descEvento").toUpperCase() !== "CANCELAMENTO") {
            throw new Error("O evento enviado não corresponde a um Cancelamento.");
        }
        setNfeData({
            tipo: 'CANCELAMENTO',
            chave: getTagText(infEvento, "chNFe"),
            data: getTagText(infEvento, "dhEvento"),
            protocolo: getTagText(detEvento, "nProt"),
            justificativa: getTagText(detEvento, "xJust")
        });
        setView('cancelamento');
      } else {
        const infNFe = getTagsArray(xmlDoc, "infNFe")[0];
        if (!infNFe) throw new Error("Estrutura não reconhecida. Não é uma NF-e válida.");
        
        const chaveFull = infNFe.getAttribute("Id") || "";
        const chave = chaveFull.replace("NFe", ""); 
        const ide = getTagsArray(infNFe, "ide")[0];

        const infProt = getTagsArray(xmlDoc, "infProt")[0];
        let cStat = "", xMotivo = "Nenhum protocolo de autorização encontrado.", statusTipo = "PENDENTE";

        if (infProt) {
            cStat = getTagText(infProt, "cStat");
            xMotivo = getTagText(infProt, "xMotivo") || xMotivo;
            if (cStat === "100" || cStat === "150") statusTipo = "AUTORIZADA";
            else if (cStat === "101" || cStat === "151" || cStat === "135") statusTipo = "CANCELADA";
            else if (cStat === "110" || cStat === "205" || cStat === "301" || cStat === "302" || cStat === "303") statusTipo = "DENEGADA";
            else statusTipo = "REJEITADA";
        }
        
        const emitente = getTagsArray(xmlDoc, "emit")[0];
        const destinatario = getTagsArray(xmlDoc, "dest")[0];
        const destDocText = destinatario ? (getTagText(destinatario, "CNPJ") || getTagText(destinatario, "CPF")) : null;

        const total = getTagsArray(xmlDoc, "total")[0];
        const icmsTot = getTagsArray(total, "ICMSTot")[0];
        const issqnTot = getTagsArray(total, "ISSQNtot")[0];
        
        const infAdic = getTagsArray(infNFe, "infAdic")[0];
        let infCplText = infAdic ? getTagText(infAdic, "infCpl") : "";
        let infAdFiscoText = infAdic ? getTagText(infAdic, "infAdFisco") : "";
        
        let infoCombinada = [];
        if (infAdFiscoText) infoCombinada.push("FISCO: " + infAdFiscoText);
        if (infCplText) infoCombinada.push(infCplText);
        let infoFinalTexto = infoCombinada.length > 0 ? infoCombinada.join("\n\n") : "Nenhuma informação complementar registrada na nota.";
        infoFinalTexto = infoFinalTexto.replace(/&lt;br\s*\/?&gt;/gi, '\n').replace(/<br\s*\/?>/gi, '\n').replace(/\\n/gi, '\n');

        let totBC_PIS = 0, totBC_COFINS = 0, totBC_ICMSDif = 0, totICMSDif = 0, totCredSN = 0;
        const dets = getTagsArray(infNFe, "det");
        const produtos = [];

        for (let i = 0; i < dets.length; i++) {
            const prod = getTagsArray(dets[i], "prod")[0];
            const imposto = getTagsArray(dets[i], "imposto")[0];
            const icmsNode = imposto ? getTagsArray(imposto, "ICMS")[0] : null;
            const ipiNode = imposto ? getTagsArray(imposto, "IPI")[0] : null;
            const pisNode = imposto ? getTagsArray(imposto, "PIS")[0] : null;
            const cofinsNode = imposto ? getTagsArray(imposto, "COFINS")[0] : null;
            const ibscbsNode = imposto ? getTagsArray(imposto, "IBSCBS")[0] : null;
            const issqnNode = imposto ? getTagsArray(imposto, "ISSQN")[0] : null;
            const icmsUfDestNode = imposto ? getTagsArray(imposto, "ICMSUFDest")[0] : null;
            const hasDifal = !!icmsUfDestNode;

            const vBC_PIS = pisNode ? getTagText(pisNode, "vBC") : "0.00";
            const vBC_COFINS = cofinsNode ? getTagText(cofinsNode, "vBC") : "0.00";
            const vCredICMSSN = icmsNode ? getTagText(icmsNode, "vCredICMSSN") : "0.00";
            const vICMSDifItem = icmsNode ? getTagText(icmsNode, "vICMSDif") : "0.00";
            const vBC_ICMS = icmsNode ? (getTagText(icmsNode, "vBC") || getTagText(icmsNode, "vBCSTRet")) : "0.00";

            totBC_PIS += parseFloat(vBC_PIS || 0);
            totBC_COFINS += parseFloat(vBC_COFINS || 0);
            totCredSN += parseFloat(vCredICMSSN || 0);
            if (parseFloat(vICMSDifItem) > 0) {
                totBC_ICMSDif += parseFloat(vBC_ICMS || 0);
                totICMSDif += parseFloat(vICMSDifItem || 0);
            }

            produtos.push({
                item: dets[i].getAttribute("nItem") || (i+1).toString(),
                cProd: getTagText(prod, "cProd"),
                xPed: getTagText(prod, "xPed"),
                vDescItem: getTagText(prod, "vDesc") || "0.00",
                vFreteItem: getTagText(prod, "vFrete") || "0.00",
                vSegItem: getTagText(prod, "vSeg") || "0.00",
                vOutroItem: getTagText(prod, "vOutro") || "0.00",
                infAdProd: getTagText(dets[i], "infAdProd"),
                descricao: getTagText(prod, "xProd"),
                cBenef: getTagText(prod, "cBenef"),
                ncm: getTagText(prod, "NCM"),
                und: getTagText(prod, "uCom"),
                qtd: getTagText(prod, "qCom"),
                vUn: getTagText(prod, "vUnCom"),
                vTot: getTagText(prod, "vProd"), 
                cfop: getTagText(prod, "CFOP"),
                
                cst: icmsNode ? (getTagText(icmsNode, "CST") || getTagText(icmsNode, "CSOSN") || "-") : "-",
                pICMS: getTagText(icmsNode, "pICMS") || getTagText(icmsNode, "pST") || "0.00",
                pRedBC: getTagText(icmsNode, "pRedBC") || "0.00",
                vBC_ICMS: vBC_ICMS,
                vICMS: getTagText(icmsNode, "vICMS") || "0.00",
                vICMSOp: getTagText(icmsNode, "vICMSOp") || "0.00",
                pDif: getTagText(icmsNode, "pDif") || "0.00",
                vICMSDif: vICMSDifItem,
                hasDifal,
                vBCUFDest: hasDifal ? getTagText(icmsUfDestNode, "vBCUFDest") : "0.00",
                pFCPUFDest: hasDifal ? getTagText(icmsUfDestNode, "pFCPUFDest") : "0.00",
                vFCPUFDest: hasDifal ? getTagText(icmsUfDestNode, "vFCPUFDest") : "0.00",
                pICMSUFDest: hasDifal ? getTagText(icmsUfDestNode, "pICMSUFDest") : "0.00",
                pICMSInter: hasDifal ? getTagText(icmsUfDestNode, "pICMSInter") : "0.00",
                pICMSInterPart: hasDifal ? getTagText(icmsUfDestNode, "pICMSInterPart") : "0.00",
                vICMSUFDest: hasDifal ? getTagText(icmsUfDestNode, "vICMSUFDest") : "0.00",
                vICMSUFRemet: hasDifal ? getTagText(icmsUfDestNode, "vICMSUFRemet") : "0.00",
                vFCPNormal: icmsNode ? (getTagText(icmsNode, "vFCP") || "0.00") : "0.00",
                pFCPNormal: icmsNode ? (getTagText(icmsNode, "pFCP") || "0.00") : "0.00",
                vFCPST: icmsNode ? (getTagText(icmsNode, "vFCPST") || "0.00") : "0.00",
                pICMSST: getTagText(icmsNode, "pICMSST") || getTagText(icmsNode, "pST") || "0.00",
                vBC_ICMSST: getTagText(icmsNode, "vBCST") || getTagText(icmsNode, "vBCSTRet") || "0.00",
                vICMSST: getTagText(icmsNode, "vICMSST") || getTagText(icmsNode, "vICMSSTRet") || getTagText(icmsNode, "vST") || "0.00",
                vBC_ISSQN: issqnNode ? getTagText(issqnNode, "vBC") : "0.00",
                vAliq_ISSQN: issqnNode ? getTagText(issqnNode, "vAliq") : "0.00",
                vISSQN: issqnNode ? getTagText(issqnNode, "vISSQN") : "0.00",
                cListServ: issqnNode ? getTagText(issqnNode, "cListServ") : "",
                pIPI: ipiNode ? getTagText(ipiNode, "pIPI") : "0.00",
                vBC_IPI: getTagText(imposto, "vBC") || "0.00", 
                vIPI: getTagText(imposto, "vIPI") || "0.00",
                pPIS: pisNode ? getTagText(pisNode, "pPIS") : "0.00",
                vBC_PIS: vBC_PIS,
                vPIS: getTagText(imposto, "vPIS") || "0.00",
                pCOFINS: cofinsNode ? getTagText(cofinsNode, "pCOFINS") : "0.00",
                vBC_COFINS: vBC_COFINS,
                vCOFINS: getTagText(imposto, "vCOFINS") || "0.00",
                pIBS: ibscbsNode ? (getTagText(ibscbsNode, "pIBSUF") || getTagText(ibscbsNode, "pIBS")) : "0.00",
                pCBS: ibscbsNode ? getTagText(ibscbsNode, "pCBS") : "0.00",
                vBC_IBSCBS: ibscbsNode ? getTagText(ibscbsNode, "vBC") : "0.00",
                vIBS: getTagText(imposto, "vIBS") || "0.00",
                vCBS: getTagText(imposto, "vCBS") || "0.00"
            });
        }

        const vServ = issqnTot ? getTagText(issqnTot, "vServ") : "0.00";
        const vBC_ISSQNTot = issqnTot ? getTagText(issqnTot, "vBC") : "0.00";
        const vISSQNTot = issqnTot ? getTagText(issqnTot, "vISSQN") : "0.00";
        let globalAliqISSQN = 0;
        if (parseFloat(vBC_ISSQNTot) > 0 && parseFloat(vISSQNTot) > 0) {
            globalAliqISSQN = (parseFloat(vISSQNTot) / parseFloat(vBC_ISSQNTot)) * 100;
        }

        const totFCP = (Number(getTagText(icmsTot, "vFCP")) || 0) + (Number(getTagText(icmsTot, "vFCPST")) || 0) + (Number(getTagText(icmsTot, "vFCPUFDest")) || 0);

        setNfeData({
            tipo: 'NFE', chave, statusTipo, cStat, xMotivo,
            numero: getTagText(ide, "nNF"), serie: getTagText(ide, "serie"), 
            dataEmissaoRaw: getTagText(ide, "dhEmi"), natOp: getTagText(ide, "natOp"), 
            infCpl: infoFinalTexto,
            emitNome: getTagText(emitente, "xNome") || getTagText(emitente, "xFant"), 
            emitCNPJ: getTagText(emitente, "CNPJ"), emitIE: getTagText(emitente, "IE"), 
            emitEnd: extrairEndereco(getTagsArray(emitente, "enderEmit")[0]),
            destNome: destinatario ? getTagText(destinatario, "xNome") : null, 
            destDoc: formatarDocumento(destDocText) || "N/A", 
            destEnd: destinatario ? extrairEndereco(getTagsArray(destinatario, "enderDest")[0]) : "Endereço não informado.",
            vNF: getTagText(icmsTot, "vNF") || "0.00", totProd: getTagText(icmsTot, "vProd") || "0.00", 
            totServ: vServ, totDesc: getTagText(icmsTot, "vDesc") || "0.00",
            totFrete: getTagText(icmsTot, "vFrete") || "0.00", totSeg: getTagText(icmsTot, "vSeg") || "0.00",
            totOutro: getTagText(icmsTot, "vOutro") || "0.00", totTribAprox: getTagText(icmsTot, "vTotTrib") || "0.00", 
            totBC_ICMS: getTagText(icmsTot, "vBC") || "0.00", totICMS: getTagText(icmsTot, "vICMS") || "0.00", 
            totBC_ICMS_ST: getTagText(icmsTot, "vBCST") || "0.00", totICMS_ST: getTagText(icmsTot, "vST") || "0.00", 
            totBC_ICMSDif, totICMSDif, totICMSDeson: getTagText(icmsTot, "vICMSDeson") || "0.00",
            totCredSN, totDIFAL: getTagText(icmsTot, "vICMSUFDest") || "0.00", totFCP: totFCP.toFixed(2), 
            vBC_ISSQNTot, vISSQNTot, globalAliqISSQN,
            totBC_PIS, totBC_COFINS,
            totIPI: getTagText(icmsTot, "vIPI") || "0.00", totII: getTagText(icmsTot, "vII") || "0.00",
            totPIS: getTagText(icmsTot, "vPIS") || "0.00", totCOFINS: getTagText(icmsTot, "vCOFINS") || "0.00",
            totIBS: getTagText(total, "vIBS") || "0.00", totCBS: getTagText(total, "vCBS") || "0.00", 
            produtos
        });
        setView('nfe');
      }
    } catch (err) {
      setError({ title: "Erro na Validação", message: err.message });
    }
  };

  const handleFileUpload = (file) => {
    if (!file || !file.name.toLowerCase().endsWith('.xml')) {
      setError({ title: "Formato Inválido", message: "Por favor, faça o upload de um ficheiro XML válido da NF-e." });
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => processXML(e.target.result.trim());
    reader.onerror = () => setError({ title: "Erro de Leitura", message: "Não foi possível ler o ficheiro selecionado." });
    reader.readAsText(file);
  };

  const handleAnalisarTextoXML = () => {
    const text = xmlText.trim();
    if (!text || (!text.includes('nfeProc') && !text.includes('NFe'))) {
      setError({ title: "Texto Inválido", message: "O texto inserido não parece ser um XML válido de NF-e." });
      return;
    }
    processXML(text);
  };

  const handleAnalisarChave = () => {
    const chaveLimpa = chaveInput.replace(/\D/g, '');
    if(chaveLimpa.length !== 44) {
      setError({ title: "Chave Inválida", message: "A chave de acesso deve conter exatamente 44 números." });
      return;
    }
    
    setError(null);
    const uf = chaveLimpa.substring(0, 2);
    const aamm = chaveLimpa.substring(2, 6); 
    const cnpj = chaveLimpa.substring(6, 20);
    const mod = chaveLimpa.substring(20, 22);
    const serie = parseInt(chaveLimpa.substring(22, 25), 10); 
    const nnf = parseInt(chaveLimpa.substring(25, 34), 10);
    const tpEmis = chaveLimpa.substring(34, 35);

    setChaveData({
      chaveFull: formatarChave(chaveLimpa),
      uf: codigosUF[uf] ? `${codigosUF[uf]} (${uf})` : `Desconhecido (${uf})`,
      data: `${aamm.substring(2, 4)}/20${aamm.substring(0, 2)}`,
      cnpj: formatarDocumento(cnpj),
      mod: codigosMod[mod] ? `${codigosMod[mod]} (${mod})` : `Documento ${mod}`,
      serie: serie.toString(),
      nnf: nnf.toString(),
      tpEmis: tpEmissaoDict[tpEmis] || `Tipo ${tpEmis}`
    });
    setView('chave');
  };

  // FUTURO: Integração com o Backend para buscar XML pela chave
 const handleBuscarXmlNaSefaz = async () => {
    setIsLoadingSefaz(true);
    setError(null);
    
    const chaveLimpa = chaveInput.replace(/\D/g, '');

    try {
      // Bate no nosso backend (que vai fazer o trabalho sujo de ir no consultadanfe)
      const res = await fetch(`/api/nfe/download/${chaveLimpa}`);
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Bloqueio de segurança. O site pode ter exigido um Captcha.");
      }

      if (data.xml) {
        // Encontrou o XML! Manda pra função que a gente já tem que processa e desenha a nota
        processXML(data.xml);
      } else {
        throw new Error("XML não retornado na resposta.");
      }
    } catch(e) {
      setError({ 
        title: "Aviso de Consulta Externa", 
        message: `${e.message} Tente fazer o upload manual do arquivo XML da nota.` 
      });
    } finally {
      setIsLoadingSefaz(false);
    }
  };

  const toggleTaxRow = (idx) => {
    setExpandedRows(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const toggleAllTaxes = () => {
    const newExpanded = !allExpanded;
    setAllExpanded(newExpanded);
    if (nfeData && nfeData.produtos) {
      const newRows = {};
      if (newExpanded) {
        nfeData.produtos.forEach((_, i) => newRows[i] = true);
      }
      setExpandedRows(newRows);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500">
      
      <div className="flex justify-end mb-4">
        <button onClick={resetarApp} className="text-sm font-medium text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-colors flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-700 px-4 py-2 rounded-lg">
          <RefreshCw className="h-4 w-4" /> Nova Consulta
        </button>
      </div>

      {view === 'upload' && (
        <div className="max-w-2xl mx-auto mt-6 animate-in slide-in-from-bottom-4">
          <div 
            className={`transition-all duration-300 bg-white dark:bg-slate-800 p-12 rounded-t-2xl shadow-sm border-2 border-b-0 border-dashed text-center relative group cursor-pointer overflow-hidden ${isDragging ? 'border-[#1FA697] bg-[#1FA697]/10 dark:bg-[#F2C94C]/10 dark:border-[#F2C94C] scale-[1.02]' : 'border-slate-200 dark:border-slate-700'}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileUpload(e.dataTransfer.files[0]); }}
          >
            <input type="file" accept=".xml" onChange={(e) => handleFileUpload(e.target.files[0])} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
            <div className="flex flex-col items-center justify-center space-y-4 pointer-events-none">
              <div className={`h-16 w-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${isDragging ? 'bg-[#1FA697]/20 text-[#1FA697] dark:text-[#F2C94C] scale-110' : 'bg-[#175676]/10 dark:bg-[#F2C94C]/10 text-[#175676] dark:text-[#F2C94C]'}`}>
                <UploadCloud className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-100 transition-colors duration-300">{isDragging ? "Solte o ficheiro agora!" : "Importar arquivo XML"}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 transition-colors duration-300">{isDragging ? "Iremos processar o seu XML instantaneamente." : "Arraste e solte o ficheiro da NF-e aqui para consultar."}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-100 dark:bg-slate-900/50 p-8 rounded-b-2xl shadow-sm border-2 border-slate-200 dark:border-slate-700 border-t-0 flex flex-col gap-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <Code className="h-4 w-4" /> Ou cole o texto do XML
              </h3>
              <div className="flex flex-col gap-2">
                <textarea value={xmlText} onChange={e => setXmlText(e.target.value)} rows="3" placeholder="Cole todo o conteúdo do XML aqui..." className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-mono dark:text-slate-200 focus:ring-2 focus:ring-[#175676] dark:focus:ring-[#F2C94C] outline-none transition-shadow resize-y"></textarea>
                <div className="flex justify-end">
                  <button onClick={handleAnalisarTextoXML} className="bg-[#175676] dark:bg-[#F2C94C] hover:opacity-90 text-white dark:text-slate-900 font-bold px-6 py-2.5 rounded-lg text-sm transition-opacity flex items-center justify-center gap-2">
                    Processar Texto <FileCode className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <Search className="h-4 w-4" /> Ou analise pela Chave de Acesso
              </h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <input value={chaveInput} onChange={e => setChaveInput(e.target.value)} type="text" maxLength="44" placeholder="Cole os 44 dígitos da chave aqui..." className="flex-1 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-mono dark:text-white focus:ring-2 focus:ring-[#175676] dark:focus:ring-[#F2C94C] outline-none transition-shadow" />
                <button onClick={handleAnalisarChave} className="bg-[#175676] dark:bg-[#F2C94C] hover:opacity-90 text-white dark:text-slate-900 font-bold px-6 py-3 rounded-lg text-sm transition-opacity flex items-center justify-center gap-2">
                  Decodificar <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          
          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800/50 rounded-xl flex items-start gap-3 animate-in fade-in">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold">{error.title}</h4>
                <p className="text-sm mt-1">{error.message}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW: APENAS CHAVE DE ACESSO */}
      {view === 'chave' && chaveData && (
        <div className="space-y-6 max-w-4xl mx-auto mt-6 animate-in fade-in">
          <div className="bg-[#175676] dark:bg-slate-800 rounded-xl p-8 text-white dark:text-slate-100 shadow-md border border-transparent dark:border-slate-700 relative overflow-hidden">
            <Key className="absolute -right-6 -bottom-6 h-48 w-48 text-white/20 dark:text-slate-600 opacity-30" />
            <div className="relative z-10">
              <h2 className="text-white/70 dark:text-[#F2C94C] font-bold tracking-widest uppercase text-xs mb-2">Chave de Acesso Decodificada</h2>
              <p className="font-mono text-xl sm:text-2xl font-bold tracking-wider mb-6 break-all">{chaveData.chaveFull}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-white/10 dark:bg-slate-900/50 p-6 rounded-lg backdrop-blur-sm border border-white/20 dark:border-slate-700">
                <div><p className="text-white/60 dark:text-slate-400 text-xs font-bold uppercase mb-1">Estado (UF)</p><p className="text-lg font-bold">{chaveData.uf}</p></div>
                <div><p className="text-white/60 dark:text-slate-400 text-xs font-bold uppercase mb-1">Emissão</p><p className="text-lg font-bold">{chaveData.data}</p></div>
                <div className="md:col-span-2"><p className="text-white/60 dark:text-slate-400 text-xs font-bold uppercase mb-1">CNPJ do Emitente</p><p className="text-lg font-bold">{chaveData.cnpj}</p></div>
                <div><p className="text-white/60 dark:text-slate-400 text-xs font-bold uppercase mb-1">Modelo</p><p className="text-lg font-bold">{chaveData.mod}</p></div>
                <div><p className="text-white/60 dark:text-slate-400 text-xs font-bold uppercase mb-1">Série</p><p className="text-lg font-bold">{chaveData.serie}</p></div>
                <div><p className="text-white/60 dark:text-slate-400 text-xs font-bold uppercase mb-1">Número</p><p className="text-lg font-bold">{chaveData.nnf}</p></div>
                <div><p className="text-white/60 dark:text-slate-400 text-xs font-bold uppercase mb-1">Tipo de Emissão</p><p className="text-lg font-bold">{chaveData.tpEmis}</p></div>
              </div>
            </div>
          </div>
          
          <div className="bg-[#F2C94C]/10 dark:bg-yellow-900/10 border border-[#F2C94C]/30 dark:border-yellow-700/50 text-slate-800 dark:text-yellow-100 p-4 rounded-lg text-sm flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 shrink-0 mt-0.5 text-[#C9A02A]" />
              <p>Como você informou apenas a chave, não é possível ler os itens e impostos. Deseja buscar o XML completo automaticamente?</p>
            </div>
            <button onClick={handleBuscarXmlNaSefaz} disabled={isLoadingSefaz} className="shrink-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2">
              {isLoadingSefaz ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Buscar XML Completo
            </button>
          </div>
        </div>
      )}

      {/* VIEW: CANCELAMENTO */}
      {view === 'cancelamento' && nfeData && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-red-200 dark:border-red-900/50 space-y-4 animate-in fade-in">
          <div className="flex items-center gap-3 text-red-600 dark:text-red-400 border-b border-red-100 dark:border-red-900/30 pb-4">
              <FileX2 className="h-8 w-8" />
              <h2 className="text-xl font-bold">Comprovante de Cancelamento</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">Chave de Acesso</p>
                  <p className="font-mono text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-200 break-all">{formatarChave(nfeData.chave)}</p>
              </div>
              <div></div>
              <div>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">Data e Hora do Cancelamento</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 text-lg">{formatarData(nfeData.data)}</p>
              </div>
              <div>
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">Número do Protocolo</p>
                  <p className="font-mono font-medium text-slate-800 dark:text-slate-200 text-lg">{nfeData.protocolo}</p>
              </div>
              <div className="md:col-span-2 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">Justificativa Registrada</p>
                  <p className="text-slate-800 dark:text-slate-300 italic whitespace-pre-wrap">"{nfeData.justificativa}"</p>
              </div>
          </div>
        </div>
      )}

      {/* VIEW: XML COMPLETO */}
      {view === 'nfe' && nfeData && (
        <div className="space-y-6 animate-in fade-in">
          
          <div className="bg-white dark:bg-slate-800 p-4 sm:px-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Chave de Acesso da NF-e</p>
              <p className="font-mono text-[13px] sm:text-base text-slate-800 dark:text-slate-200 break-all select-all font-semibold">{formatarChave(nfeData.chave)}</p>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              {nfeData.statusTipo === 'AUTORIZADA' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-[#1FA697]/10 dark:bg-[#1FA697]/20 text-[#13665c] dark:text-[#1FA697] border border-[#1FA697]/20" title={nfeData.xMotivo}>
                  <CheckCircle2 className="h-4 w-4" /> Autorizada
                </span>
              )}
              {nfeData.statusTipo === 'PENDENTE' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50" title="Sem protocolo SEFAZ">
                  <Clock className="h-4 w-4" /> Pendente
                </span>
              )}
              {(nfeData.statusTipo === 'REJEITADA' || nfeData.statusTipo === 'DENEGADA') && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50" title={nfeData.xMotivo}>
                  <FileX2 className="h-4 w-4" /> {nfeData.statusTipo === 'DENEGADA' ? 'Denegada' : 'Rejeitada'} - {nfeData.cStat}
                </span>
              )}
            </div>
          </div>

          <div className="border-b border-slate-200 dark:border-slate-700 mb-6">
            <nav className="flex overflow-x-auto custom-scrollbar">
              <button onClick={() => setActiveTab('gerais')} className={`flex items-center gap-2 border-b-2 py-4 px-6 text-sm font-bold whitespace-nowrap outline-none transition-colors ${activeTab === 'gerais' ? 'border-[#175676] text-[#175676] dark:border-[#F2C94C] dark:text-[#F2C94C]' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}><Info className="h-4 w-4" /> Dados da NF-e</button>
              <button onClick={() => setActiveTab('destinatario')} className={`flex items-center gap-2 border-b-2 py-4 px-6 text-sm font-bold whitespace-nowrap outline-none transition-colors ${activeTab === 'destinatario' ? 'border-[#175676] text-[#175676] dark:border-[#F2C94C] dark:text-[#F2C94C]' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}><Users className="h-4 w-4" /> Partes</button>
              <button onClick={() => setActiveTab('totais')} className={`flex items-center gap-2 border-b-2 py-4 px-6 text-sm font-bold whitespace-nowrap outline-none transition-colors ${activeTab === 'totais' ? 'border-[#175676] text-[#175676] dark:border-[#F2C94C] dark:text-[#F2C94C]' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}><Landmark className="h-4 w-4" /> Totais e Impostos</button>
              <button onClick={() => setActiveTab('itens')} className={`flex items-center gap-2 border-b-2 py-4 px-6 text-sm font-bold whitespace-nowrap outline-none transition-colors ${activeTab === 'itens' ? 'border-[#175676] text-[#175676] dark:border-[#F2C94C] dark:text-[#F2C94C]' : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}><List className="h-4 w-4" /> Detalhamento dos Itens</button>
            </nav>
          </div>

          {activeTab === 'gerais' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                      <p className="text-[11px] font-bold text-slate-400 uppercase mb-1">Número / Série</p>
                      <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{nfeData.numero} <span className="text-slate-400 dark:text-slate-500 text-sm font-normal">Série {nfeData.serie}</span></p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                      <p className="text-[11px] font-bold text-slate-400 uppercase mb-1">Data de Emissão</p>
                      <p className="text-xl font-bold text-slate-800 dark:text-slate-100">{formatarData(nfeData.dataEmissaoRaw)}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                      <p className="text-[11px] font-bold text-slate-400 uppercase mb-1">Natureza da Operação</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase mt-1 line-clamp-2">{nfeData.natOp || "N/A"}</p>
                  </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 px-5 py-3 flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-slate-500" />
                      <h3 className="font-bold text-slate-800 dark:text-slate-200">Informações Complementares</h3>
                  </div>
                  <div className="p-5">
                      <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{nfeData.infCpl}</p>
                  </div>
              </div>
            </div>
          )}

          {activeTab === 'destinatario' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 px-5 py-3 flex items-center gap-2">
                      <Store className="h-5 w-5 text-slate-500" />
                      <h3 className="font-bold text-slate-800 dark:text-slate-200">Dados do Emitente</h3>
                  </div>
                  <div className="p-5 space-y-4">
                      <div>
                          <p className="text-[11px] font-bold text-slate-400 uppercase">Razão Social / Nome Fantasia</p>
                          <p className="font-bold text-slate-800 dark:text-slate-100 mt-0.5 text-lg">{nfeData.emitNome}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <p className="text-[11px] font-bold text-slate-400 uppercase">CNPJ</p>
                              <p className="font-medium text-slate-700 dark:text-slate-300 mt-0.5">{formatarDocumento(nfeData.emitCNPJ)}</p>
                          </div>
                          <div>
                              <p className="text-[11px] font-bold text-slate-400 uppercase">Inscrição Estadual</p>
                              <p className="font-medium text-slate-700 dark:text-slate-300 mt-0.5">{nfeData.emitIE || "Isento"}</p>
                          </div>
                      </div>
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                          <p className="text-[11px] font-bold text-slate-400 uppercase">Endereço Completo</p>
                          <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{nfeData.emitEnd}</p>
                      </div>
                  </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 px-5 py-3 flex items-center gap-2">
                      <User className="h-5 w-5 text-[#175676] dark:text-[#F2C94C]" />
                      <h3 className="font-bold text-slate-800 dark:text-slate-200">Dados do Destinatário</h3>
                  </div>
                  <div className="p-5 space-y-4">
                      <div>
                          <p className="text-[11px] font-bold text-slate-400 uppercase">Razão Social / Nome Completo</p>
                          <p className="font-bold text-slate-800 dark:text-slate-100 mt-0.5 text-lg">{nfeData.destNome || "Consumidor Final"}</p>
                      </div>
                      <div>
                          <p className="text-[11px] font-bold text-slate-400 uppercase">CPF / CNPJ</p>
                          <p className="font-medium text-slate-700 dark:text-slate-300 mt-0.5">{nfeData.destDoc}</p>
                      </div>
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                          <p className="text-[11px] font-bold text-slate-400 uppercase">Endereço Completo</p>
                          <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{nfeData.destEnd}</p>
                      </div>
                  </div>
              </div>
            </div>
          )}

          {activeTab === 'totais' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-[#1FA697] dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-transparent dark:border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden text-white dark:text-slate-100">
                  <CircleDollarSign className="absolute -right-4 -top-10 h-48 w-48 text-white/20 dark:text-slate-600 opacity-30" />
                  <div className="relative z-10 w-full">
                      <p className="text-sm font-bold text-white/80 dark:text-[#F2C94C] uppercase tracking-wider">Valor Total da Nota Fiscal</p>
                      <p className="text-4xl font-black mt-1">{formatarMoeda(nfeData.vNF)}</p>
                  </div>
                  <div className="relative z-10 shrink-0 bg-black/10 dark:bg-slate-900/50 px-4 py-2 rounded-lg backdrop-blur-sm border border-transparent dark:border-slate-600">
                      <p className="text-xs font-bold text-white/90 dark:text-slate-300 uppercase tracking-wider text-center">Tributos Aprox. (Lei Transp.)</p>
                      <p className="text-xl font-bold text-white text-center mt-1">{formatarMoeda(nfeData.totTribAprox)}</p>
                  </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 px-5 py-4">
                      <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <PieChart className="h-5 w-5 text-[#6A2C70] dark:text-[#F2C94C]" /> Resumo Global de Impostos e Valores
                      </h3>
                  </div>
                  
                  <div className="p-5 sm:p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-y-6 gap-x-4">
                      
                      <div className="col-span-full mb-1">
                          <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700 pb-1">Valores da Operação</h4>
                      </div>
                      <InfoBox label="Valor Produtos" value={formatarMoeda(nfeData.totProd)} />
                      <InfoBox label="Valor Serviços" value={formatarMoeda(nfeData.totServ)} />
                      <InfoBox label="Valor Frete" value={formatarMoeda(nfeData.totFrete)} />
                      <InfoBox label="Valor Seguro" value={formatarMoeda(nfeData.totSeg)} />
                      <InfoBox label="Outras Despesas" value={formatarMoeda(nfeData.totOutro)} />
                      
                      <div className="bg-red-50 dark:bg-red-900/10 p-2 rounded-lg border border-red-100 dark:border-red-900/30">
                          <p className="text-[10px] font-bold text-red-400 dark:text-red-500 uppercase flex items-center gap-1"><TrendingDown className="h-3 w-3" /> Desconto Total</p>
                          <p className="text-base font-bold text-red-600 dark:text-red-400 mt-0.5">{formatarMoeda(nfeData.totDesc)}</p>
                      </div>
                      <div className="bg-[#1FA697]/10 dark:bg-[#F2C94C]/10 p-2 rounded-lg border border-[#1FA697]/20 dark:border-[#F2C94C]/20 col-span-2">
                          <p className="text-[10px] font-bold text-[#1FA697] dark:text-[#F2C94C] uppercase flex items-center gap-1"><Tags className="h-3 w-3" /> Produtos Líquidos (C/ Desc.)</p>
                          <p className="text-lg font-black text-[#13665c] dark:text-[#F2C94C] mt-0.5">{formatarMoeda(parseFloat(nfeData.totProd) - parseFloat(nfeData.totDesc))}</p>
                      </div>

                      <div className="col-span-full mt-2 mb-1">
                          <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700 pb-1">ICMS e Estaduais</h4>
                      </div>
                      <InfoBox label="Base ICMS" value={formatarMoeda(nfeData.totBC_ICMS)} />
                      <InfoBox label="Valor ICMS" value={formatarMoeda(nfeData.totICMS)} />
                      <InfoBox label="Base ICMS ST" value={formatarMoeda(nfeData.totBC_ICMS_ST)} />
                      <InfoBox label="Valor ICMS ST" value={formatarMoeda(nfeData.totICMS_ST)} />
                      <InfoBox label="Base ICMS Diferido" value={formatarMoeda(nfeData.totBC_ICMSDif)} />
                      <InfoBox label="Valor ICMS Diferido" value={formatarMoeda(nfeData.totICMSDif)} />
                      <InfoBox label="Val. ICMS Presumido / Deson." value={formatarMoeda(nfeData.totICMSDeson)} />
                      <InfoBox label="Valor Crédito SN" value={formatarMoeda(nfeData.totCredSN)} />
                      <InfoBox label="DIFAL (UF Destino)" value={formatarMoeda(nfeData.totDIFAL)} />
                      <InfoBox label="FCP Total" value={formatarMoeda(nfeData.totFCP)} />

                      {(parseFloat(nfeData.vBC_ISSQNTot) > 0 || parseFloat(nfeData.totServ) > 0) && (
                        <>
                          <div className="col-span-full mt-2 mb-1">
                              <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700 pb-1">ISSQN (Serviços Municipais)</h4>
                          </div>
                          <InfoBox label="Base Cálculo ISSQN" value={formatarMoeda(nfeData.vBC_ISSQNTot)} />
                          <InfoBox label="ISSQN % (Média)" value={`${formatarNumero(nfeData.globalAliqISSQN)}%`} />
                          <InfoBox label="Valor ISSQN" value={formatarMoeda(nfeData.vISSQNTot)} />
                        </>
                      )}

                      <div className="col-span-full mt-2 mb-1">
                          <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700 pb-1">Impostos Federais</h4>
                      </div>
                      <InfoBox label="Base PIS" value={formatarMoeda(nfeData.totBC_PIS)} />
                      <InfoBox label="Valor PIS" value={formatarMoeda(nfeData.totPIS)} />
                      <InfoBox label="Base COFINS" value={formatarMoeda(nfeData.totBC_COFINS)} />
                      <InfoBox label="Valor COFINS" value={formatarMoeda(nfeData.totCOFINS)} />
                      <InfoBox label="Valor do IPI" value={formatarMoeda(nfeData.totIPI)} />
                      <InfoBox label="Valor do II" value={formatarMoeda(nfeData.totII)} />

                      <div className="col-span-full mt-2 mb-1">
                          <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700 pb-1">Reforma Tributária</h4>
                      </div>
                      <InfoBox label="IBS" value={formatarMoeda(nfeData.totIBS)} />
                      <InfoBox label="CBS" value={formatarMoeda(nfeData.totCBS)} />
                  </div>
              </div>
            </div>
          )}

          {activeTab === 'itens' && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in">
              <div className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                      <List className="h-5 w-5 text-slate-500" />
                      <h3 className="font-bold text-slate-800 dark:text-slate-200">Lista de Produtos / Serviços</h3>
                  </div>
                  <div className="flex items-center gap-3 self-end sm:self-auto">
                      <button onClick={toggleAllTaxes} className="text-xs font-bold text-[#175676] dark:text-[#F2C94C] hover:text-opacity-80 bg-[#175676]/10 dark:bg-[#F2C94C]/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
                          {allExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />} 
                          {allExpanded ? 'Ocultar' : 'Mostrar'} Impostos / Adicionais
                      </button>
                      <span className="text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 py-1 px-3 rounded-full">{nfeData.produtos.length} item(ns)</span>
                  </div>
              </div>
              
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                  <table className="w-full text-left border-collapse min-w-[1000px]">
                      <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900 shadow-sm z-20">
                          <tr className="border-b border-slate-200 dark:border-slate-700 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              <th className="py-3 px-4 font-bold w-12 text-center">Nº</th>
                              <th className="py-3 px-4 font-bold text-center">Cód.</th>
                              <th className="py-3 px-4 font-bold">Produto / Serviço</th>
                              <th className="py-3 px-4 font-bold text-center">NCM</th>
                              <th className="py-3 px-4 font-bold text-center">UN</th>
                              <th className="py-3 px-4 font-bold text-right">Qtd</th>
                              <th className="py-3 px-4 font-bold text-right">V. Unitário</th>
                              <th className="py-3 px-4 font-bold text-right text-red-500 dark:text-red-400">Desc.</th>
                              <th className="py-3 px-4 font-bold text-right">V. Total</th>
                          </tr>
                      </thead>
                      <tbody className="text-sm text-slate-700 dark:text-slate-300">
                        {nfeData.produtos.map((prod, idx) => {
                          const valDesc = parseFloat(prod.vDescItem);
                          const valTotBruto = parseFloat(prod.vTot);
                          const valTotLiq = valTotBruto - valDesc;
                          const isExpanded = expandedRows[idx];

                          return (
                            <React.Fragment key={idx}>
                              <tr onClick={() => toggleTaxRow(idx)} title="Clique para exibir detalhes e impostos" className="hover:bg-[#175676]/5 dark:hover:bg-[#F2C94C]/10 transition-colors group cursor-pointer border-b border-slate-100 dark:border-slate-700">
                                <td className="py-4 px-4 text-center text-slate-400 font-mono text-xs">{prod.item}</td>
                                <td className="py-4 px-4 text-center text-slate-500 dark:text-slate-400 font-mono text-xs font-semibold">{prod.cProd}</td>
                                <td className="py-4 px-4 font-bold text-slate-800 dark:text-slate-200">
                                    {prod.descricao}
                                    {prod.xPed && <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-normal mt-0.5 uppercase tracking-wide">Pedido: {prod.xPed}</span>}
                                </td>
                                <td className="py-4 px-4 text-center text-slate-500 dark:text-slate-400">{prod.ncm}</td>
                                <td className="py-4 px-4 text-center text-slate-500 dark:text-slate-400">{prod.und}</td>
                                <td className="py-4 px-4 text-right text-slate-700 dark:text-slate-300 font-medium">{formatarNumero(prod.qtd)}</td>
                                <td className="py-4 px-4 text-right text-slate-700 dark:text-slate-300">{formatarMoeda(prod.vUn)}</td>
                                <td className="py-4 px-4 text-right text-red-500 dark:text-red-400 font-medium">{valDesc > 0 ? formatarMoeda(valDesc) : '-'}</td>
                                <td className="py-4 px-4 text-right">
                                    <div className="flex items-center justify-end gap-3">
                                        {valDesc > 0 ? (
                                          <div className="flex flex-col items-end leading-tight">
                                              <span className="text-[10px] text-slate-400 line-through" title="Valor Bruto Sem Desconto">{formatarMoeda(valTotBruto)}</span>
                                              <span className="font-bold text-[#1FA697] dark:text-[#F2C94C]" title="Valor Final Com Desconto Aplicado">{formatarMoeda(valTotLiq)}</span>
                                          </div>
                                        ) : (
                                          <span className="font-bold text-[#1FA697] dark:text-[#F2C94C]">{formatarMoeda(valTotLiq)}</span>
                                        )}
                                        <div className="bg-slate-100 dark:bg-slate-700 p-1 rounded group-hover:bg-[#175676]/20 dark:group-hover:bg-[#F2C94C]/20 transition-colors">
                                            {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-500 dark:text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-500 dark:text-slate-400" />}
                                        </div>
                                    </div>
                                </td>
                              </tr>
                              {isExpanded && (
                                <tr>
                                  <td colSpan="9" className="px-4 pb-4 pt-0 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20">
                                    <div className="flex flex-col gap-4 sm:ml-12 mt-3 mb-2 animate-in fade-in">
                                      
                                      <div>
                                        <h4 className="text-[10px] font-bold text-[#175676] dark:text-[#F2C94C] uppercase tracking-widest mb-2 border-b border-[#175676]/10 dark:border-slate-600 pb-1">
                                          <Percent className="w-3 h-3 inline mr-1 -mt-0.5" /> 
                                          {parseFloat(prod.vBC_ISSQN) > 0 || prod.cListServ ? 'ISSQN e Serviços' : 'ICMS, ST e Benefícios Fiscais'}
                                        </h4>
                                        <div className="flex flex-wrap gap-2 text-xs">
                                          <InfoBox label="CFOP / CST" value={`${prod.cfop} / ${prod.cst}`} tooltip={`${obterDescricaoCFOP(prod.cfop)} | ${obterDescricaoCST(prod.cst)}`} />
                                          {prod.cBenef && prod.cBenef !== 'SEM CBENEF' && <InfoBoxColor color="amber" label="Benefício (cBenef)" value={prod.cBenef} />}
                                          
                                          {parseFloat(prod.vBC_ISSQN) > 0 || parseFloat(prod.vISSQN) > 0 || prod.cListServ ? (
                                            <>
                                              <InfoBoxColor color="blue" label={`ISSQN (${formatarNumero(prod.vAliq_ISSQN)}%)`} value={formatarMoeda(prod.vISSQN)} sub={`BC: ${formatarMoeda(prod.vBC_ISSQN)}`} />
                                              <InfoBox label="Cód. Serviço LC 116" value={prod.cListServ || 'N/A'} />
                                            </>
                                          ) : (
                                            <>
                                              <InfoBox 
                                                label={`${parseFloat(prod.vICMSDif) > 0 ? 'ICMS Operação' : 'ICMS Efetivo'} (${formatarNumero(prod.pICMS)}%)`} 
                                                value={formatarMoeda(parseFloat(prod.vICMSDif) > 0 ? prod.vICMSOp : prod.vICMS)} 
                                                sub={`BC: ${formatarMoeda(prod.vBC_ICMS)} ${parseFloat(prod.pRedBC) > 0 ? `<br><span class="text-[9px] font-bold text-amber-600">RED. BC ${formatarNumero(prod.pRedBC)}%</span>` : ''}`} 
                                              />
                                              {parseFloat(prod.vICMSDif) > 0 && (
                                                <>
                                                  <InfoBoxColor color="amber" label={`ICMS Diferido (${formatarNumero(prod.pDif)}%)`} value={formatarMoeda(prod.vICMSDif)} sub={`BC: ${formatarMoeda(prod.vBC_ICMS)}`} />
                                                  <InfoBoxColor color="emerald" label={`ICMS Cobrado (${formatarNumero(prod.pICMS)}%)`} value={formatarMoeda(prod.vICMS)} sub={`BC: ${formatarMoeda(prod.vBC_ICMS)}`} />
                                                </>
                                              )}
                                              <InfoBox label={`ICMS ST (${formatarNumero(prod.pICMSST)}%)`} value={formatarMoeda(prod.vICMSST)} sub={`BC: ${formatarMoeda(prod.vBC_ICMSST)}`} />
                                              {parseFloat(prod.vFCPNormal) > 0 && <InfoBox label={`FCP (${formatarNumero(prod.pFCPNormal)}%)`} value={formatarMoeda(prod.vFCPNormal)} sub={`BC: ${formatarMoeda(prod.vBC_ICMS)}`} />}
                                              {parseFloat(prod.vFCPST) > 0 && <InfoBox label={`FCP ST`} value={formatarMoeda(prod.vFCPST)} sub={`BC: ${formatarMoeda(prod.vBC_ICMSST)}`} />}
                                            </>
                                          )}
                                        </div>
                                      </div>

                                      {prod.hasDifal && (
                                        <div className="mt-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800/50 rounded-lg p-3">
                                          <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2 block"><Map className="w-3 h-3 inline mr-1 -mt-0.5" /> Partilha de ICMS (DIFAL) e FCP Destino</span>
                                          <div className="flex flex-wrap gap-2 text-xs">
                                            <InfoBoxColor color="indigo" label="Alíq. Interna / Interest." value={`${formatarNumero(prod.pICMSUFDest)}% / ${formatarNumero(prod.pICMSInter)}%`} sub={`Base: ${formatarMoeda(prod.vBCUFDest)}`} />
                                            <InfoBoxColor color="indigo" label={`FCP Dest. (${formatarNumero(prod.pFCPUFDest)}%)`} value={formatarMoeda(prod.vFCPUFDest)} sub={`Base: ${formatarMoeda(prod.vBCUFDest)}`} />
                                            <InfoBoxColor color="indigo" label={`Part. Dest. (${formatarNumero(prod.pICMSInterPart)}%)`} value={formatarMoeda(prod.vICMSUFDest)} sub="DIFAL UF Destino" />
                                            {parseFloat(prod.vICMSUFRemet) > 0 && <InfoBoxColor color="indigo" label="Part. Origem" value={formatarMoeda(prod.vICMSUFRemet)} sub="DIFAL UF Origem" />}
                                          </div>
                                        </div>
                                      )}

                                      <div>
                                        <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-200 dark:border-slate-700 pb-1 mt-4"><Landmark className="w-3 h-3 inline mr-1 -mt-0.5" /> Impostos Federais</h4>
                                        <div className="flex flex-wrap gap-2 text-xs">
                                          <InfoBox label={`IPI (${formatarNumero(prod.pIPI)}%)`} value={formatarMoeda(prod.vIPI)} sub={`BC: ${formatarMoeda(prod.vBC_IPI)}`} />
                                          <InfoBox label={`PIS (${formatarNumero(prod.pPIS)}%)`} value={formatarMoeda(prod.vPIS)} sub={`BC: ${formatarMoeda(prod.vBC_PIS)}`} />
                                          <InfoBox label={`COFINS (${formatarNumero(prod.pCOFINS)}%)`} value={formatarMoeda(prod.vCOFINS)} sub={`BC: ${formatarMoeda(prod.vBC_COFINS)}`} />
                                        </div>
                                      </div>

                                      {(parseFloat(prod.vIBS) > 0 || parseFloat(prod.vCBS) > 0 || parseFloat(prod.vBC_IBSCBS) > 0) && (
                                        <div>
                                          <h4 className="text-[10px] font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest mb-2 border-b border-emerald-100 dark:border-emerald-800/30 pb-1 mt-4"><Receipt className="w-3 h-3 inline mr-1 -mt-0.5" /> Reforma Tributária</h4>
                                          <div className="flex flex-wrap gap-2 text-xs">
                                            <InfoBoxColor color="emerald" label={`IBS (${formatarNumero(prod.pIBS)}%)`} value={formatarMoeda(prod.vIBS)} sub={`BC: ${formatarMoeda(prod.vBC_IBSCBS)}`} />
                                            <InfoBoxColor color="emerald" label={`CBS (${formatarNumero(prod.pCBS)}%)`} value={formatarMoeda(prod.vCBS)} sub={`BC: ${formatarMoeda(prod.vBC_IBSCBS)}`} />
                                          </div>
                                        </div>
                                      )}

                                      {(valDesc > 0 || prod.infAdProd || parseFloat(prod.vFreteItem) > 0 || parseFloat(prod.vSegItem) > 0 || parseFloat(prod.vOutroItem) > 0) && (
                                        <div>
                                          <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-200 dark:border-slate-700 pb-1 mt-4"><Info className="w-3 h-3 inline mr-1 -mt-0.5" /> Outras Informações e Despesas do Item</h4>
                                          <div className="flex flex-col gap-2">
                                            <div className="flex flex-wrap gap-4 mb-2">
                                              {valDesc > 0 && <div className="flex items-center gap-2"><span className="text-red-500 dark:text-red-400 block uppercase tracking-wide text-[9px] font-bold">Desconto:</span><strong className="text-red-600 dark:text-red-400 text-xs">{formatarMoeda(valDesc)}</strong></div>}
                                              {parseFloat(prod.vFreteItem) > 0 && <div className="flex items-center gap-2"><span className="text-slate-500 dark:text-slate-400 block uppercase tracking-wide text-[9px] font-bold">Frete:</span><strong className="text-slate-800 dark:text-slate-200 text-xs">{formatarMoeda(prod.vFreteItem)}</strong></div>}
                                              {parseFloat(prod.vSegItem) > 0 && <div className="flex items-center gap-2"><span className="text-slate-500 dark:text-slate-400 block uppercase tracking-wide text-[9px] font-bold">Seguro:</span><strong className="text-slate-800 dark:text-slate-200 text-xs">{formatarMoeda(prod.vSegItem)}</strong></div>}
                                              {parseFloat(prod.vOutroItem) > 0 && <div className="flex items-center gap-2"><span className="text-slate-500 dark:text-slate-400 block uppercase tracking-wide text-[9px] font-bold">Outras Desp.:</span><strong className="text-slate-800 dark:text-slate-200 text-xs">{formatarMoeda(prod.vOutroItem)}</strong></div>}
                                            </div>
                                            {prod.infAdProd && <div className="flex items-start gap-2"><span className="text-slate-400 dark:text-slate-500 block uppercase tracking-wide text-[9px] font-bold mt-0.5 shrink-0">Info. Adicional:</span><span className="text-slate-800 dark:text-slate-300 text-xs whitespace-pre-wrap">{prod.infAdProd}</span></div>}
                                          </div>
                                        </div>
                                      )}

                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                      </tbody>
                  </table>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}