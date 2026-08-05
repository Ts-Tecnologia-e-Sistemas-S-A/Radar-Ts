import React, { useState } from 'react';
import { CompetitorItem } from '../types';
import { Swords, ShieldAlert, TrendingDown, Award, Search, Plus, Building2, ExternalLink, CheckCircle2 } from 'lucide-react';

interface CompetitorRadarViewProps {
  competitors: CompetitorItem[];
}

export const CompetitorRadarView: React.FC<CompetitorRadarViewProps> = ({
  competitors: initialCompetitors,
}) => {
  const [competitorsList, setCompetitorsList] = useState<CompetitorItem[]>(initialCompetitors);
  const [selectedCompetitor, setSelectedCompetitor] = useState<CompetitorItem>(initialCompetitors[0]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New Competitor Form State
  const [newName, setNewName] = useState('');
  const [newShare, setNewShare] = useState('5.0');
  const [newAvgPrice, setNewAvgPrice] = useState('1800000');
  const [newStrengths, setNewStrengths] = useState('');
  const [newWeaknesses, setNewWeaknesses] = useState('');
  const [newVulnerabilities, setNewVulnerabilities] = useState('');

  const filteredCompetitors = competitorsList.filter((comp) =>
    comp.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddCompetitor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newComp: CompetitorItem = {
      id: `comp-custom-${Date.now()}`,
      name: newName,
      marketShare: parseFloat(newShare) || 5.0,
      wonContractsCount: 10,
      avgPrice: parseFloat(newAvgPrice) || 1500000,
      strengths: newStrengths ? newStrengths.split('\n').filter(Boolean) : ['Presença regional e bom preço em pregões'],
      weaknesses: newWeaknesses ? newWeaknesses.split('\n').filter(Boolean) : ['Atendimento lento e falta de aplicativo nativo'],
      vulnerabilitiesForSICAP: newVulnerabilities ? newVulnerabilities.split('\n').filter(Boolean) : ['Sem inteligência pedagógica e sem IA'],
      recentWins: [
        {
          municipality: 'Município Mapeado',
          state: 'BR',
          value: parseFloat(newAvgPrice) || 1500000,
          date: '2025-10-10',
          objectStr: 'Licenciamento de software educacional',
          addendumsCount: 1,
          renewalsCount: 1
        }
      ]
    };

    setCompetitorsList([newComp, ...competitorsList]);
    setSelectedCompetitor(newComp);
    setShowAddModal(false);
    setNewName('');
    setNewStrengths('');
    setNewWeaknesses('');
    setNewVulnerabilities('');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-rose-600 font-bold text-xs uppercase tracking-wider">
            <Swords className="w-4 h-4" />
            <span>Módulo 7: Inteligência Competitiva Licitatória</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">
            Radar de Concorrentes & Histórico Licitatório ({competitorsList.length} Mapeados)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Rastreamento de preços homologados, aditivos contratuais, taxa de renovação e pontos fracos de empresas concorrentes de EdTech no setor público.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow"
        >
          <Plus className="w-4 h-4 text-blue-400" />
          <span>Cadastrar Novo Concorrente</span>
        </button>
      </div>

      {/* Search Bar & Stats info */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar concorrente por nome (ex: Betha, Fiorilli, TOTVS)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 text-xs pl-9 pr-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 font-medium text-slate-800"
          />
        </div>
        <div className="text-xs text-slate-600 font-semibold flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-600" />
          <span>Exibindo <strong>{filteredCompetitors.length}</strong> de {competitorsList.length} empresas catalogadas no mercado público</span>
        </div>
      </div>

      {/* Competitors Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredCompetitors.map((comp) => {
          const isSelected = selectedCompetitor.id === comp.id;
          return (
            <div
              key={comp.id}
              onClick={() => setSelectedCompetitor(comp)}
              className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-800 shadow-lg ring-2 ring-blue-500/50'
                  : 'bg-white text-slate-800 border-slate-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-extrabold text-sm leading-tight">{comp.name}</h3>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                  isSelected ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-700'
                }`}>
                  {comp.marketShare}% Share
                </span>
              </div>

              <div className="mt-3 space-y-1 text-xs">
                <p className={isSelected ? 'text-slate-300' : 'text-slate-500'}>
                  Contratos Homologados: <strong>{comp.wonContractsCount}</strong>
                </p>
                <p className={isSelected ? 'text-slate-300' : 'text-slate-500'}>
                  Ticket Médio: <strong className="text-emerald-400">R$ {(comp.avgPrice / 1000).toFixed(0)}k</strong>
                </p>
              </div>

              {isSelected && (
                <div className="mt-2 text-[10px] text-blue-300 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-blue-400" />
                  <span>Dossiê Selecionado</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Competitor Deep Dive Dossier */}
      {selectedCompetitor && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-2xl font-black text-slate-900">
                  Dossiê de Combate: {selectedCompetitor.name}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Market Share Estimado: {selectedCompetitor.marketShare}% em contratos municipais de tecnologia educacional
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="bg-rose-100 text-rose-800 font-bold text-xs px-3 py-1.5 rounded-lg border border-rose-200">
                {selectedCompetitor.vulnerabilitiesForSICAP.length} Argumentos de Combate Mapeados
              </span>
            </div>
          </div>

          {/* Grid: Strengths/Weaknesses + Vulnerabilities for SICAP */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            
            {/* Strengths */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <h4 className="font-extrabold text-slate-900 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Pontos Fortes Conhecidos</span>
              </h4>
              <ul className="space-y-1.5 text-slate-700 list-disc list-inside">
                {selectedCompetitor.strengths.map((s, idx) => (
                  <li key={idx} className="leading-snug">{s}</li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 space-y-2">
              <h4 className="font-extrabold text-amber-900 flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4 text-amber-600" />
                <span>Fraquezas Operacionais Mapeadas</span>
              </h4>
              <ul className="space-y-1.5 text-amber-800 list-disc list-inside">
                {selectedCompetitor.weaknesses.map((w, idx) => (
                  <li key={idx} className="leading-snug">{w}</li>
                ))}
              </ul>
            </div>

            {/* Vulnerabilities for SICAP Pitch */}
            <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 space-y-2">
              <h4 className="font-extrabold text-rose-900 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Argumentos Matadores SICAP</span>
              </h4>
              <ul className="space-y-1.5 text-rose-800 list-disc list-inside">
                {selectedCompetitor.vulnerabilitiesForSICAP.map((v, idx) => (
                  <li key={idx} className="leading-snug">{v}</li>
                ))}
              </ul>
            </div>

          </div>

          {/* Recent Won Contracts History */}
          <div className="space-y-3 pt-4 border-t border-slate-200">
            <h4 className="font-extrabold text-slate-900 text-sm">
              Histórico Licitatório e Aditivos Contratuais de {selectedCompetitor.name}
            </h4>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
              {selectedCompetitor.recentWins.map((win, idx) => (
                <div key={idx} className="p-4 bg-slate-50/60 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900">{win.municipality} - {win.state}</span>
                      <span className="text-[10px] bg-slate-200 font-mono font-bold px-1.5 py-0.5 rounded text-slate-700">
                        {win.date}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-1">{win.objectStr}</p>
                  </div>

                  <div className="text-right space-y-0.5">
                    <span className="font-black text-emerald-600 text-sm block">
                      R$ {win.value.toLocaleString('pt-BR')}
                    </span>
                    <span className="text-[10px] text-amber-700 font-bold block">
                      {win.addendumsCount} Aditivos | {win.renewalsCount} Renovações
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Add Custom Competitor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddCompetitor} className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">Cadastrar Empresa Concorrente</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nome da Empresa Concorrente</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Delta Software Educacional"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Market Share Estimado (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newShare}
                    onChange={(e) => setNewShare(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ticket Médio (R$)</label>
                  <input
                    type="number"
                    value={newAvgPrice}
                    onChange={(e) => setNewAvgPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Pontos Fortes (1 por linha)</label>
                <textarea
                  rows={2}
                  placeholder="Instalação antiga&#10;Preços baixos"
                  value={newStrengths}
                  onChange={(e) => setNewStrengths(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Fraquezas Operacionais (1 por linha)</label>
                <textarea
                  rows={2}
                  placeholder="Suporte lento&#10;Interface desatualizada"
                  value={newWeaknesses}
                  onChange={(e) => setNewWeaknesses(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Argumentos de Combate SICAP (1 por linha)</label>
                <textarea
                  rows={2}
                  placeholder="Sem inteligência pedagógica&#10;Não possui diário offline"
                  value={newVulnerabilities}
                  onChange={(e) => setNewVulnerabilities(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 text-xs shadow"
              >
                Salvar Concorrente
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

