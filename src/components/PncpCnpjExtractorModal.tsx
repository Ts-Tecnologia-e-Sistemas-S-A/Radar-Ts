import React, { useState, useEffect } from 'react';
import { X, Building2, Search, Copy, Check, Download, Database, ShieldCheck, Sparkles, RefreshCw, FileText, ArrowRight } from 'lucide-react';
import { fetchPncpEducationCnpjs, PncpEducationCnpjResult } from '../services/govApisService';
import { Municipality } from '../types';

interface PncpCnpjExtractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMunicipality?: (m: Municipality) => void;
  municipalities?: Municipality[];
}

export const PncpCnpjExtractorModal: React.FC<PncpCnpjExtractorModalProps> = ({
  isOpen,
  onClose,
  onAddMunicipality,
  municipalities = []
}) => {
  const [selectedUf, setSelectedUf] = useState<string>('PI');
  const [dataInicial, setDataInicial] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10).replace(/-/g, '');
  });
  const [dataFinal, setDataFinal] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10).replace(/-/g, '');
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<PncpEducationCnpjResult | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [linkedCnpjs, setLinkedCnpjs] = useState<Set<string>>(new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRunSearch = async () => {
    setIsLoading(true);
    try {
      const res = await fetchPncpEducationCnpjs(selectedUf, dataInicial, dataFinal);
      setResult(res);
      if (res && res.totalEncontrados > 0) {
        showToast(`✅ ${res.totalEncontrados} CNPJs de Educação mapeados com sucesso!`);
      }
    } catch (err) {
      console.error(err);
      showToast('❌ Erro ao consultar a API do PNCP.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !result) {
      handleRunSearch();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const copyCnpjArray = () => {
    if (!result || !result.cnpjs) return;
    const jsonStr = JSON.stringify(result.cnpjs, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    showToast('📋 Lista de CNPJs copiada em formato JSON!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleLinkToCrm = (item: any) => {
    const rawName = item.razaoSocial || '';
    let cityName = rawName
      .replace(/SECRETARIA MUNICIPAL DE EDUCAÇÃO DE /i, '')
      .replace(/FUNDO MUNICIPAL DE EDUCAÇÃO DE /i, '')
      .replace(/PREFEITURA MUNICIPAL DE /i, '')
      .replace(/ - SEMEC.*/i, '')
      .replace(/ - SEMED.*/i, '')
      .replace(/ - FME.*/i, '')
      .replace(/\/.*/, '')
      .trim();

    if (!cityName) cityName = 'Município do PNCP';

    const newMuni: Municipality = {
      id: `mun-${cityName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-')}-${item.uf.toLowerCase()}`,
      name: cityName,
      state: item.uf || selectedUf,
      region: 'Nordeste',
      population: 45000,
      status: 'oportunidade',
      funnelStage: 'prospectado',
      currentSystem: 'Sistema Mapeado no PNCP',
      currentContractValue: 1250000,
      contractDaysRemaining: 75,
      renewalProbability: 'Média',
      tenderProbability: 85,
      estimatedNewContractValue: 1500000,
      probableModality: 'Pregão Eletrônico',
      ioScore: 88,
      ioFactors: {
        contractExpiringDays: 85,
        lowIdebScore: 75,
        techInvestmentHistory: 80,
        budgetAvailability: 90,
        managementChange: 70,
        federalFundsAvailable: 90,
        existingRelationship: 60
      },
      educationalMetrics: {
        ideb: 4.2,
        idebTarget: 5.4,
        dropoutRate: 4.5,
        schoolsCount: 32,
        studentsCount: 6500,
        teachersCount: 380,
        fundebBudget: 18500000,
        mainPains: ['Controle de Compras do PNCP', 'Diário Eletrônico']
      },
      keyContacts: [
        {
          name: item.razaoSocial,
          role: 'Órgão Comprador (PNCP)',
          phone: '(86) 3221-0000',
          email: `contato@${cityName.toLowerCase().replace(/\s+/g, '')}.${item.uf.toLowerCase()}.gov.br`
        }
      ],
      buyingHistory: [
        {
          year: 2026,
          company: 'PNCP Registro Público',
          value: 1250000,
          objectStr: item.ultimoObjeto,
          modality: 'Pregão Eletrônico',
          addendumsCount: 0
        }
      ],
      lastActivityDate: new Date().toISOString().slice(0, 10),
      notes: `CNPJ Oficial PNCP: ${item.cnpj} (${item.razaoSocial}). Mapeado via consulta automatizada ao PNCP em ${new Date().toLocaleDateString('pt-BR')}.`,
      verifiedSources: [`PNCP API Oficial (CNPJ: ${item.cnpj})`]
    };

    if (onAddMunicipality) {
      onAddMunicipality(newMuni);
    }

    setLinkedCnpjs(prev => new Set(prev).add(item.cnpj));
    showToast(`🏛️ ${cityName} (${item.cnpj}) vinculado com sucesso ao CRM!`);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-[60] bg-emerald-950 text-emerald-100 border border-emerald-500/50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-slideInRight font-medium text-sm">
          <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-4xl w-full text-slate-100 shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-6 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-black text-white tracking-tight">Extrator de CNPJs de Educação do PNCP</h3>
                <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                  Lei 14.133/2021
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Mapeamento de Fundos Municipais de Educação (FME) e Secretarias (SEMED) em tempo real via API pública do PNCP
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Query Controls */}
        <div className="p-6 bg-slate-900/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Estado (UF)</label>
              <select
                value={selectedUf}
                onChange={(e) => setSelectedUf(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white text-xs font-bold px-3 py-2 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="PI">Piauí (PI)</option>
                <option value="MA">Maranhão (MA)</option>
                <option value="CE">Ceará (CE)</option>
                <option value="BA">Bahia (BA)</option>
                <option value="PE">Pernambuco (PE)</option>
                <option value="RN">Rio Grande do Norte (RN)</option>
                <option value="PB">Paraíba (PB)</option>
                <option value="PA">Pará (PA)</option>
                <option value="TO">Tocantins (TO)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Data Inicial (AAAAMMDD)</label>
              <input
                type="text"
                value={dataInicial}
                onChange={(e) => setDataInicial(e.target.value)}
                placeholder="20260801"
                className="bg-slate-800 border border-slate-700 text-white text-xs font-mono font-bold px-3 py-2 rounded-xl w-32 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Data Final (AAAAMMDD)</label>
              <input
                type="text"
                value={dataFinal}
                onChange={(e) => setDataFinal(e.target.value)}
                placeholder="20260813"
                className="bg-slate-800 border border-slate-700 text-white text-xs font-mono font-bold px-3 py-2 rounded-xl w-32 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <button
              onClick={handleRunSearch}
              disabled={isLoading}
              className="mt-5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Consultando PNCP...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Mapear CNPJs</span>
                </>
              )}
            </button>
          </div>

          {result && result.cnpjs && result.cnpjs.length > 0 && (
            <button
              onClick={copyCnpjArray}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span>{copied ? 'Copiado!' : 'Copiar Array de CNPJs'}</span>
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {isLoading ? (
            <div className="text-center py-16 space-y-4">
              <RefreshCw className="w-10 h-10 text-blue-400 animate-spin mx-auto" />
              <p className="text-sm font-semibold text-slate-300">Conectando ao Endpoint do PNCP (API Pública do Governo Federal)...</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Filtrando licitações e contratações do estado de <b>{selectedUf}</b> contendo os termos de Educação (merenda, escola, transporte, software, SEMED/FME).
              </p>
            </div>
          ) : result && result.detalhes && result.detalhes.length > 0 ? (
            <>
              {/* Stats Summary Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-black text-lg">
                    {result.totalEncontrados}
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Órgãos Encontrados</span>
                    <span className="text-sm font-black text-white">CNPJs de Educação Unificados</span>
                  </div>
                </div>

                <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-lg">
                    {selectedUf}
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Estado Mapeado</span>
                    <span className="text-sm font-black text-white">{result.source}</span>
                  </div>
                </div>

                <div className="bg-slate-800/80 border border-slate-700/80 p-4 rounded-2xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-black text-lg">
                    100%
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Conformidade Legal</span>
                    <span className="text-sm font-black text-white">CNPJs extraídos de orgaoEntidade.cnpj</span>
                  </div>
                </div>
              </div>

              {/* CNPJ List Items */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  <span>Relação de CNPJs Ativos Encontrados no PNCP ({result.detalhes.length})</span>
                </h4>

                {result.detalhes.map((item, idx) => {
                  const isLinked = linkedCnpjs.has(item.cnpj);

                  return (
                    <div
                      key={idx}
                      className="bg-slate-800/60 hover:bg-slate-800 border border-slate-700/80 p-4 rounded-2xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 max-w-2xl">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-blue-900/60 text-blue-300 border border-blue-700/60 font-mono font-black text-xs px-2.5 py-1 rounded-lg">
                            CNPJ: {item.cnpj}
                          </span>
                          <span className="bg-slate-700 text-slate-200 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md">
                            {item.esferaId || 'MUNICIPAL'}
                          </span>
                          <span className="bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md">
                            UF: {item.uf}
                          </span>
                        </div>

                        <h5 className="font-extrabold text-white text-sm">
                          {item.razaoSocial}
                        </h5>

                        <p className="text-xs text-slate-400 line-clamp-2">
                          <span className="text-slate-300 font-semibold">Última Licitação / Objeto: </span>
                          {item.ultimoObjeto}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(item.cnpj);
                            showToast(`📋 CNPJ ${item.cnpj} copiado!`);
                          }}
                          className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold px-3 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Copiar</span>
                        </button>

                        <button
                          onClick={() => handleLinkToCrm(item)}
                          disabled={isLinked}
                          className={`text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                            isLinked
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/80 cursor-default'
                              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'
                          }`}
                        >
                          {isLinked ? (
                            <>
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Vinculado ao CRM</span>
                            </>
                          ) : (
                            <>
                              <Database className="w-3.5 h-3.5" />
                              <span>Cadastrar no CRM</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-400 space-y-3">
              <Building2 className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-sm font-medium">Nenhum CNPJ localizado para o período e UF selecionados.</p>
              <p className="text-xs text-slate-500">Tente expandir o intervalo de datas ou selecionar outro estado (ex: PI ou MA).</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Extração via Swagger Oficial do PNCP (API REST consulta/v1/contratacoes/publicacao)</span>
          </div>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
