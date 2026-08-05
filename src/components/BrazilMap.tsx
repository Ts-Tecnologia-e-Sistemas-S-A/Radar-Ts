import React, { useState } from 'react';
import { Municipality, MunicipalityStatus } from '../types';
import { MapPin, Navigation, Eye, Filter } from 'lucide-react';

interface BrazilMapProps {
  municipalities: Municipality[];
  selectedMunicipality: Municipality | null;
  onSelectMunicipality: (municipality: Municipality) => void;
  selectedStateFilter: string;
  onStateFilterChange: (state: string) => void;
}

const STATUS_COLOR_MAP: Record<MunicipalityStatus, { bg: string; border: string; label: string; dot: string }> = {
  cliente: { bg: 'bg-emerald-500', border: 'border-emerald-600', label: 'Cliente SICAP', dot: '🟢' },
  oportunidade: { bg: 'bg-yellow-400', border: 'border-yellow-500', label: 'Oportunidade', dot: '🟡' },
  licitacao_proxima: { bg: 'bg-orange-500', border: 'border-orange-600', label: 'Licitação Próxima', dot: '🟠' },
  edital_publicado: { bg: 'bg-red-500', border: 'border-red-600', label: 'Edital Publicado', dot: '🔴' },
  contrato_encerrado: { bg: 'bg-slate-800', border: 'border-slate-900', label: 'Contrato Encerrado', dot: '⚫' },
};

export const BrazilMap: React.FC<BrazilMapProps> = ({
  municipalities,
  selectedMunicipality,
  onSelectMunicipality,
  selectedStateFilter,
  onStateFilterChange,
}) => {
  const [activeHover, setActiveHover] = useState<Municipality | null>(null);

  // Filter municipalities based on state selection
  const filteredMunis = selectedStateFilter
    ? municipalities.filter((m) => m.state === selectedStateFilter)
    : municipalities;

  // Extract unique states in dataset
  const availableStates = Array.from(new Set(municipalities.map((m) => m.state))).sort();

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex flex-col h-full">
      {/* Map Header & Legend Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-50 text-blue-700 rounded-lg">
              <Navigation className="w-5 h-5" />
            </span>
            <h2 className="text-base font-semibold text-slate-800">
              Mapa de Cobertura & Oportunidades
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Mapeamento nacional em tempo real por status licitatório
          </p>
        </div>

        {/* State Filter Selector */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedStateFilter}
            onChange={(e) => onStateFilterChange(e.target.value)}
            className="text-xs font-medium border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os Estados ({municipalities.length} municípios)</option>
            {availableStates.map((st) => (
              <option key={st} value={st}>
                Estado: {st} ({municipalities.filter((m) => m.state === st).length})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Status Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 py-3 px-3 bg-slate-50/80 rounded-lg border border-slate-100 my-3 text-xs">
        <span className="font-medium text-slate-600 text-[11px] uppercase tracking-wider">Status:</span>
        {(Object.keys(STATUS_COLOR_MAP) as MunicipalityStatus[]).map((stKey) => {
          const cfg = STATUS_COLOR_MAP[stKey];
          const count = municipalities.filter((m) => m.status === stKey).length;
          return (
            <div key={stKey} className="flex items-center gap-1.5 font-medium text-slate-700">
              <span className={`w-2.5 h-2.5 rounded-full ${cfg.bg}`} />
              <span>{cfg.label}</span>
              <span className="text-[10px] bg-slate-200/80 px-1.5 py-0.2 rounded-full font-bold text-slate-600">
                {count}
              </span>
            </div>
          );
        })}
      </div>

      {/* SVG Canvas Map Container */}
      <div className="relative flex-1 min-h-[360px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-inner p-4 flex items-center justify-center">
        {/* Stylized Background Mesh Grid */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Map SVG Graphic */}
        <svg
          viewBox="0 0 800 600"
          className="w-full h-full max-h-[500px] object-contain relative z-10"
        >
          {/* Brazil Simplified Map Polygon / Regions */}
          <g className="opacity-30 stroke-slate-600 fill-slate-800" strokeWidth="1.5">
            {/* North Region */}
            <path d="M 150,120 L 320,100 L 380,180 L 290,260 L 160,250 Z" />
            {/* Northeast Region */}
            <path d="M 380,180 L 580,140 L 630,220 L 520,300 L 390,250 Z" className="fill-slate-700/50" />
            {/* Midwest Region */}
            <path d="M 290,260 L 390,250 L 450,380 L 320,400 L 250,320 Z" />
            {/* Southeast Region */}
            <path d="M 450,380 L 570,330 L 590,440 L 460,450 Z" />
            {/* South Region */}
            <path d="M 460,450 L 540,460 L 500,560 L 420,530 Z" />
          </g>

          {/* Region Text Labels */}
          <g className="text-[11px] font-bold fill-slate-500/60 pointer-events-none select-none tracking-widest uppercase">
            <text x="220" y="180">NORTE</text>
            <text x="480" y="210" className="fill-blue-400/40 font-black">NORDESTE (FOCO)</text>
            <text x="330" y="330">CENTRO-OESTE</text>
            <text x="500" y="400">SUDESTE</text>
            <text x="460" y="500">SUL</text>
          </g>

          {/* Connecting Radar Projection Lines for High-IO Opportunities */}
          {filteredMunis
            .filter((m) => m.ioScore >= 80)
            .map((m) => {
              // Convert lat/long to SVG approximate canvas coordinates
              // Longitude range: -73 to -35 -> SVG X range: 80 to 720
              // Latitude range: +5 to -33 -> SVG Y range: 50 to 550
              const x = ((m.longitude || -42) - (-70)) * 17.5 + 100;
              const y = ((m.latitude || -4) - 4) * -14 + 100;

              return (
                <g key={`radar-line-${m.id}`}>
                  <line
                    x1={x}
                    y1={y}
                    x2={x + 20}
                    y2={y - 20}
                    className="stroke-orange-400/40"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  <circle
                    cx={x}
                    cy={y}
                    r="18"
                    className="fill-none stroke-orange-400/30 animate-ping"
                  />
                </g>
              );
            })}

          {/* Municipality Interactive Map Pins */}
          {filteredMunis.map((m) => {
            const x = ((m.longitude || -42) - (-70)) * 17.5 + 100;
            const y = ((m.latitude || -4) - 4) * -14 + 100;

            const isSelected = selectedMunicipality?.id === m.id;
            const isHovered = activeHover?.id === m.id;
            const statusCfg = STATUS_COLOR_MAP[m.status];

            return (
              <g
                key={m.id}
                className="cursor-pointer transition-transform duration-200"
                onClick={() => onSelectMunicipality(m)}
                onMouseEnter={() => setActiveHover(m)}
                onMouseLeave={() => setActiveHover(null)}
              >
                {/* Glow ring for selected or hovered pin */}
                {(isSelected || isHovered) && (
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 16 : 12}
                    className={`${isSelected ? 'fill-blue-500/30 stroke-blue-400' : 'fill-white/20 stroke-white/60'} animate-pulse`}
                    strokeWidth="2"
                  />
                )}

                {/* Main Pin Circle */}
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? 9 : 7}
                  className={`${statusCfg.bg} ${statusCfg.border} stroke-2 transition-all`}
                />

                {/* Pin Center Dot */}
                <circle cx={x} cy={y} r="2.5" className="fill-white" />

                {/* Label text next to pin */}
                <text
                  x={x + 12}
                  y={y + 4}
                  className={`text-[11px] font-semibold select-none ${
                    isSelected
                      ? 'fill-white font-extrabold text-xs'
                      : isHovered
                      ? 'fill-amber-300'
                      : 'fill-slate-300'
                  }`}
                >
                  {m.name} ({m.state})
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Floating Tooltip */}
        {activeHover && (
          <div className="absolute bottom-4 left-4 bg-slate-900/95 backdrop-blur border border-slate-700 text-white p-3 rounded-lg shadow-xl text-xs max-w-xs z-30 animate-in fade-in duration-150">
            <div className="flex items-center justify-between gap-2 border-b border-slate-700 pb-1.5 mb-2">
              <span className="font-bold text-sm text-amber-300">
                {activeHover.name} - {activeHover.state}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_COLOR_MAP[activeHover.status].bg} text-white`}>
                {STATUS_COLOR_MAP[activeHover.status].label}
              </span>
            </div>
            <div className="space-y-1 text-slate-300">
              <p>
                <strong className="text-slate-400">Sistema Atual:</strong> {activeHover.currentSystem}
              </p>
              <p>
                <strong className="text-slate-400">Vencimento:</strong>{' '}
                <span className={activeHover.contractDaysRemaining <= 60 ? 'text-red-400 font-bold' : 'text-slate-200'}>
                  {activeHover.contractDaysRemaining < 0
                    ? `Encerrado há ${Math.abs(activeHover.contractDaysRemaining)} dias`
                    : `${activeHover.contractDaysRemaining} dias restantes`}
                </span>
              </p>
              <p>
                <strong className="text-slate-400">Valor Estimado:</strong> R${' '}
                {activeHover.estimatedNewContractValue.toLocaleString('pt-BR')}
              </p>
              <div className="flex items-center justify-between pt-1 text-[11px]">
                <span>Índice Oportunidade (IO):</span>
                <span className="font-bold text-emerald-400 text-xs">{activeHover.ioScore}/100</span>
              </div>
            </div>
          </div>
        )}

        {/* Quick Map Action Notice */}
        <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur border border-slate-700/80 px-3 py-1.5 rounded-lg text-[11px] text-slate-300 flex items-center gap-1.5 pointer-events-none">
          <Eye className="w-3.5 h-3.5 text-blue-400" />
          <span>Clique em um município para abrir o Raio-X comercial</span>
        </div>
      </div>
    </div>
  );
};
