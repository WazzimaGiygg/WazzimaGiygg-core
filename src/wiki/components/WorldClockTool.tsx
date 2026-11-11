import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  Laptop,
  Calendar,
  Sliders,
  Search,
  Sun,
  Moon,
  Copy,
  Check,
} from 'lucide-react';
import { AppTheme } from '../types';

export interface TimezoneItem {
  id: string;
  name: string;
  city: string;
  country: string;
  region: 'brasil' | 'americas' | 'europa' | 'asia' | 'oceania' | 'africa' | 'utc';
  iana: string;
  baseOffset: string;
  flag: string;
  highlight?: boolean;
}

export const TIMEZONES_CATALOG: TimezoneItem[] = [
  // Brasil (todos os 4 fusos horários do Brasil)
  { id: 'br-noronha', name: 'Fernando de Noronha', city: 'Noronha', country: 'Brasil', region: 'brasil', iana: 'America/Noronha', baseOffset: 'UTC-2', flag: '🇧🇷', highlight: true },
  { id: 'br-brasilia', name: 'Brasília / Horário Oficial', city: 'Brasília, São Paulo, Rio', country: 'Brasil', region: 'brasil', iana: 'America/Sao_Paulo', baseOffset: 'UTC-3', flag: '🇧🇷', highlight: true },
  { id: 'br-manaus', name: 'Manaus / Horário Amazônico', city: 'Manaus, Cuiabá, Campo Grande', country: 'Brasil', region: 'brasil', iana: 'America/Manaus', baseOffset: 'UTC-4', flag: '🇧🇷', highlight: true },
  { id: 'br-acre', name: 'Rio Branco / Horário do Acre', city: 'Rio Branco, Cruzeiro do Sul', country: 'Brasil', region: 'brasil', iana: 'America/Rio_Branco', baseOffset: 'UTC-5', flag: '🇧🇷', highlight: true },

  // UTC Base
  { id: 'utc-zero', name: 'UTC / GMT Universal', city: 'Greenwich, Londres (Inverno)', country: 'Global', region: 'utc', iana: 'UTC', baseOffset: 'UTC±0', flag: '🌐', highlight: true },

  // Américas
  { id: 'us-newyork', name: 'Nova York (Eastern)', city: 'Nova York, Miami, Toronto', country: 'EUA / Canadá', region: 'americas', iana: 'America/New_York', baseOffset: 'UTC-5 / UTC-4', flag: '🇺🇸' },
  { id: 'us-chicago', name: 'Chicago (Central)', city: 'Chicago, Dallas, Cidade do México', country: 'EUA / México', region: 'americas', iana: 'America/Chicago', baseOffset: 'UTC-6 / UTC-5', flag: '🇺🇸' },
  { id: 'us-denver', name: 'Denver (Mountain)', city: 'Denver, Phoenix, Calgary', country: 'EUA / Canadá', region: 'americas', iana: 'America/Denver', baseOffset: 'UTC-7 / UTC-6', flag: '🇺🇸' },
  { id: 'us-la', name: 'Los Angeles (Pacific)', city: 'Los Angeles, San Francisco, Vancouver', country: 'EUA / Canadá', region: 'americas', iana: 'America/Los_Angeles', baseOffset: 'UTC-8 / UTC-7', flag: '🇺🇸' },
  { id: 'us-alaska', name: 'Alasca', city: 'Anchorage', country: 'EUA', region: 'americas', iana: 'America/Anchorage', baseOffset: 'UTC-9 / UTC-8', flag: '🇺🇸' },
  { id: 'us-hawaii', name: 'Havaí', city: 'Honolulu', country: 'EUA', region: 'americas', iana: 'Pacific/Honolulu', baseOffset: 'UTC-10', flag: '🇺🇸' },
  { id: 'ar-ba', name: 'Buenos Aires', city: 'Buenos Aires', country: 'Argentina', region: 'americas', iana: 'America/Argentina/Buenos_Aires', baseOffset: 'UTC-3', flag: '🇦🇷' },
  { id: 'cl-santiago', name: 'Santiago', city: 'Santiago', country: 'Chile', region: 'americas', iana: 'America/Santiago', baseOffset: 'UTC-4 / UTC-3', flag: '🇨🇱' },
  { id: 'co-bogota', name: 'Bogotá / Lima', city: 'Bogotá, Lima, Quito', country: 'Colômbia / Peru', region: 'americas', iana: 'America/Bogota', baseOffset: 'UTC-5', flag: '🇨🇴' },

  // Europa
  { id: 'pt-lisbon', name: 'Lisboa / Londres (WET)', city: 'Lisboa, Londres, Dublin', country: 'Portugal / Reino Unido', region: 'europa', iana: 'Europe/Lisbon', baseOffset: 'UTC±0 / UTC+1', flag: '🇵🇹' },
  { id: 'fr-paris', name: 'Paris / Berlim / Madri (CET)', city: 'Paris, Berlim, Madri, Roma', country: 'União Europeia', region: 'europa', iana: 'Europe/Paris', baseOffset: 'UTC+1 / UTC+2', flag: '🇫🇷' },
  { id: 'gr-athens', name: 'Atenas / Helsinque (EET)', city: 'Atenas, Helsinque, Kiev, Bucareste', country: 'Grécia / Finlândia', region: 'europa', iana: 'Europe/Athens', baseOffset: 'UTC+2 / UTC+3', flag: '🇬🇷' },
  { id: 'ru-moscow', name: 'Moscou', city: 'Moscou, São Petersburgo', country: 'Rússia', region: 'europa', iana: 'Europe/Moscow', baseOffset: 'UTC+3', flag: '🇷🇺' },

  // Ásia & Oriente Médio
  { id: 'ae-dubai', name: 'Dubai', city: 'Dubai, Abu Dhabi', country: 'Emirados Árabes', region: 'asia', iana: 'Asia/Dubai', baseOffset: 'UTC+4', flag: '🇦🇪' },
  { id: 'in-delhi', name: 'Índia (IST)', city: 'Nova Délhi, Mumbai, Bangalore', country: 'Índia', region: 'asia', iana: 'Asia/Kolkata', baseOffset: 'UTC+5:30', flag: '🇮🇳' },
  { id: 'th-bangkok', name: 'Bangkok / Jacarta', city: 'Bangkok, Jacarta, Hanói', country: 'Tailândia / Indonésia', region: 'asia', iana: 'Asia/Bangkok', baseOffset: 'UTC+7', flag: '🇹🇭' },
  { id: 'cn-beijing', name: 'Pequim / Xangai / Hong Kong', city: 'Pequim, Xangai, Singapura', country: 'China / Singapura', region: 'asia', iana: 'Asia/Shanghai', baseOffset: 'UTC+8', flag: '🇨🇳' },
  { id: 'jp-tokyo', name: 'Tóquio / Seul', city: 'Tóquio, Seul, Kyoto', country: 'Japão / Coreia do Sul', region: 'asia', iana: 'Asia/Tokyo', baseOffset: 'UTC+9', flag: '🇯🇵' },

  // Oceania
  { id: 'au-sydney', name: 'Sydney / Melbourne (AEST)', city: 'Sydney, Melbourne, Brisbane', country: 'Austrália', region: 'oceania', iana: 'Australia/Sydney', baseOffset: 'UTC+10 / UTC+11', flag: '🇦🇺' },
  { id: 'nz-auckland', name: 'Auckland / Wellington', city: 'Auckland, Wellington', country: 'Nova Zelândia', region: 'oceania', iana: 'Pacific/Auckland', baseOffset: 'UTC+12 / UTC+13', flag: '🇳🇿' },

  // África
  { id: 'eg-cairo', name: 'Cairo', city: 'Cairo, Alexandria', country: 'Egito', region: 'africa', iana: 'Africa/Cairo', baseOffset: 'UTC+2 / UTC+3', flag: '🇪🇬' },
  { id: 'za-johannesburg', name: 'Joanesburgo', city: 'Joanesburgo, Cidade do Cabo', country: 'África do Sul', region: 'africa', iana: 'Africa/Johannesburg', baseOffset: 'UTC+2', flag: '🇿🇦' },
  { id: 'ng-lagos', name: 'Lagos', city: 'Lagos, Abuja', country: 'Nigéria', region: 'africa', iana: 'Africa/Lagos', baseOffset: 'UTC+1', flag: '🇳🇬' },
];

export interface WorldClockToolProps {
  theme?: AppTheme;
  standalone?: boolean;
}

export const WorldClockTool: React.FC<WorldClockToolProps> = () => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [timeOffsetHours, setTimeOffsetHours] = useState<number>(0);
  const [copiedTz, setCopiedTz] = useState<string | null>(null);

  // Atualização em tempo real de segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const simulatedDate = useMemo(() => {
    const d = new Date(currentTime.getTime());
    if (timeOffsetHours !== 0) {
      d.setHours(d.getHours() + timeOffsetHours);
    }
    return d;
  }, [currentTime, timeOffsetHours]);

  const userLocalIana = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return 'America/Sao_Paulo';
    }
  }, []);

  const filteredTimezones = useMemo(() => {
    return TIMEZONES_CATALOG.filter((tz) => {
      if (regionFilter !== 'all' && tz.region !== regionFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const matchName = tz.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q);
      const matchCity = tz.city.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q);
      const matchCountry = tz.country.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(q);
      const matchOffset = tz.baseOffset.toLowerCase().includes(q);
      return matchName || matchCity || matchCountry || matchOffset;
    });
  }, [regionFilter, searchQuery]);

  const formatTzTime = (iana: string, date: Date) => {
    try {
      const timeStr = new Intl.DateTimeFormat('pt-BR', {
        timeZone: iana,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(date);

      const dateStr = new Intl.DateTimeFormat('pt-BR', {
        timeZone: iana,
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(date);

      // Determina hora para ícone dia/noite
      const hourOnly = parseInt(
        new Intl.DateTimeFormat('en-US', {
          timeZone: iana,
          hour: 'numeric',
          hour12: false,
        }).format(date),
        10
      );
      const isDay = hourOnly >= 6 && hourOnly < 18;

      return { timeStr, dateStr, hourOnly, isDay };
    } catch {
      return { timeStr: '--:--:--', dateStr: 'Indisponível', hourOnly: 12, isDay: true };
    }
  };

  const handleCopyTz = (tz: TimezoneItem, timeStr: string, dateStr: string) => {
    const text = `${tz.name} (${tz.country}): ${timeStr} - ${dateStr}`;
    navigator.clipboard.writeText(text);
    setCopiedTz(tz.id);
    setTimeout(() => setCopiedTz(null), 1500);
  };

  // Horário oficial do Brasil agora
  const brasiliaInfo = formatTzTime('America/Sao_Paulo', simulatedDate);

  return (
    <div className="space-y-6">
      {/* Header Info Extension Banner */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Horário Mundial e Fusos Horários
          </h3>
          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
            Extensão de Ferramenta (WikiWorldClockTool)
          </span>
        </div>
      </div>

      {/* Banner Principal de Destaque: Horário Oficial de Brasília e Local */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card Horário de Brasília */}
        <div className="bg-gradient-to-br from-blue-700 to-indigo-900 text-white rounded-2xl p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-blue-200 text-xs font-bold uppercase tracking-wider mb-2">
            <span className="flex items-center gap-1.5">
              <span>🇧🇷</span> Horário Oficial do Brasil (Brasília)
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-white font-mono text-[10px]">
              UTC-3
            </span>
          </div>
          <div className="text-4xl md:text-5xl font-mono font-extrabold tracking-tight my-2">
            {brasiliaInfo.timeStr}
          </div>
          <div className="text-xs text-blue-100 flex items-center gap-2">
            <Calendar size={14} />
            <span className="capitalize">{brasiliaInfo.dateStr}</span>
            <span className="text-blue-300">•</span>
            <span>{brasiliaInfo.isDay ? '☀️ Dia' : '🌙 Noite'}</span>
          </div>
        </div>

        {/* Card Horário Local Detectado do Usuário */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1.5">
                <Laptop size={14} className="text-emerald-500" />
                <span>Seu Horário Local Detectado</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-[10px]">
                {userLocalIana}
              </span>
            </div>
            {(() => {
              const localInfo = formatTzTime(userLocalIana, simulatedDate);
              return (
                <>
                  <div className="text-4xl md:text-5xl font-mono font-extrabold text-slate-900 dark:text-white tracking-tight my-2">
                    {localInfo.timeStr}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Calendar size={14} />
                    <span className="capitalize">{localInfo.dateStr}</span>
                    <span>•</span>
                    <span>{localInfo.isDay ? '☀️ Dia no seu local' : '🌙 Noite no seu local'}</span>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Barra de Simulação / Conversor de Horários */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <Sliders size={16} className="text-blue-600 dark:text-blue-400" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Simulador de Horário Global (Conversor)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
              Deslocamento:{' '}
              <strong className="text-blue-600 dark:text-blue-400">
                {timeOffsetHours === 0 ? 'Agora (Ao Vivo)' : `${timeOffsetHours > 0 ? '+' : ''}${timeOffsetHours}h`}
              </strong>
            </span>
            {timeOffsetHours !== 0 && (
              <button
                onClick={() => setTimeOffsetHours(0)}
                className="text-[10px] px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold hover:bg-blue-200 transition"
              >
                Voltar ao Tempo Real
              </button>
            )}
          </div>
        </div>
        <input
          type="range"
          min="-12"
          max="14"
          value={timeOffsetHours}
          onChange={(e) => setTimeOffsetHours(parseInt(e.target.value, 10))}
          className="w-full accent-blue-600 cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
          <span>-12h</span>
          <span>-6h</span>
          <span className="font-bold text-slate-600 dark:text-slate-300">Tempo Presente</span>
          <span>+6h</span>
          <span>+14h</span>
        </div>
      </div>

      {/* Filtros por Região e Busca */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Abas por Continente / Região */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full text-xs">
          {[
            { id: 'all', label: 'Todos os Fusos' },
            { id: 'brasil', label: '🇧🇷 Brasil (4 Fusos)' },
            { id: 'americas', label: '🌎 Américas' },
            { id: 'europa', label: '🇪🇺 Europa' },
            { id: 'asia', label: '🌏 Ásia' },
            { id: 'oceania', label: '🦘 Oceania' },
            { id: 'africa', label: '🌍 África' },
            { id: 'utc', label: '🌐 UTC / Padrão' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRegionFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition cursor-pointer ${
                regionFilter === tab.id
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Campo de Busca de Cidades */}
        <div className="relative min-w-[220px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar cidade, fuso ou país..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Grade de Fusos Horários */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredTimezones.map((tz) => {
          const info = formatTzTime(tz.iana, simulatedDate);
          const isCopied = copiedTz === tz.id;

          return (
            <div
              key={tz.id}
              className={`p-4 rounded-2xl border transition relative group ${
                tz.highlight
                  ? 'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/60'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xl">{tz.flag}</span>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {tz.name}
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {tz.city}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold shrink-0">
                  {tz.baseOffset}
                </span>
              </div>

              {/* Horário Principal com Segundos */}
              <div className="flex items-baseline justify-between mt-3 mb-1">
                <div className="text-2xl font-mono font-bold text-slate-900 dark:text-white">
                  {info.timeStr}
                </div>
                <div className="flex items-center gap-1 text-xs">
                  {info.isDay ? (
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 text-[11px] font-medium">
                      <Sun size={13} /> Dia
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-indigo-500 dark:text-indigo-400 text-[11px] font-medium">
                      <Moon size={13} /> Noite
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <span className="capitalize">{info.dateStr}</span>
                <button
                  onClick={() => handleCopyTz(tz, info.timeStr, info.dateStr)}
                  className="p-1 rounded text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  title="Copiar Horário"
                >
                  {isCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
