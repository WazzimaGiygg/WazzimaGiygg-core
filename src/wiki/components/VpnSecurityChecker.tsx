import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Globe,
  Server,
  RefreshCw,
  Search,
  Sliders,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  ExternalLink,
  ArrowLeft,
  Activity,
  History,
  Trash2,
  Lock,
  Unlock,
  Radio,
  Cpu,
  Key,
  Database,
  FileText,
  UserX,
  HelpCircle,
} from 'lucide-react';
import {
  checkClientVpnConnection,
  checkCustomIpForVpn,
  isVpnSimulationActive,
  getVpnSimulationConfig,
  setVpnSimulation,
  PRESET_VPNS,
  VpnCheckResult,
  VpnPreset,
  getVpnAuditLogs,
  clearVpnAuditLogs,
  VpnAuditEntry,
} from '../utils/vpnChecker';
import { UserProfile } from '../types';

interface VpnSecurityCheckerProps {
  currentUser: UserProfile | null;
  onBack?: () => void;
  onOpenLoginModal?: () => void;
}

export const VpnSecurityChecker: React.FC<VpnSecurityCheckerProps> = ({
  currentUser,
  onBack,
  onOpenLoginModal,
}) => {
  // Conexão Atual do Usuário
  const [currentConnection, setCurrentConnection] = useState<VpnCheckResult | null>(null);
  const [isLoadingCurrent, setIsLoadingCurrent] = useState(true);

  // Analisador de IP Customizado
  const [targetIpInput, setTargetIpInput] = useState('');
  const [customResult, setCustomResult] = useState<VpnCheckResult | null>(null);
  const [isAnalyzingCustom, setIsAnalyzingCustom] = useState(false);

  // Simulação de VPN
  const [isSimActive, setIsSimActive] = useState<boolean>(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('nordvpn');

  // Logs de Auditoria
  const [auditLogs, setAuditLogs] = useState<VpnAuditEntry[]>([]);

  // Aba Ativa
  const [activeTab, setActiveTab] = useState<'current' | 'analyzer' | 'policy' | 'audit'>('current');

  // Carrega status da conexão atual
  const refreshCurrentConnection = async (force = false) => {
    setIsLoadingCurrent(true);
    try {
      const res = await checkClientVpnConnection(force);
      setCurrentConnection(res);
      const sim = getVpnSimulationConfig();
      setIsSimActive(sim.active);
      setSelectedPresetId(sim.presetId);
    } catch (err) {
      console.error('Erro ao verificar conexão:', err);
    } finally {
      setIsLoadingCurrent(false);
    }
  };

  // Carrega logs de auditoria
  const loadAuditLogs = () => {
    setAuditLogs(getVpnAuditLogs());
  };

  useEffect(() => {
    refreshCurrentConnection();
    loadAuditLogs();
  }, []);

  // Alterna simulação de VPN
  const handleToggleSimulation = (active: boolean, presetId = selectedPresetId) => {
    setVpnSimulation(active, presetId);
    setIsSimActive(active);
    setSelectedPresetId(presetId);
    refreshCurrentConnection(true);
  };

  // Analisa IP customizado
  const handleAnalyzeCustomIp = async (ipToAnalyze = targetIpInput) => {
    const clean = ipToAnalyze.trim();
    if (!clean) return;
    setIsAnalyzingCustom(true);
    try {
      const res = await checkCustomIpForVpn(clean);
      setCustomResult(res);
    } catch (err) {
      console.error('Erro ao analisar IP:', err);
    } finally {
      setIsAnalyzingCustom(false);
    }
  };

  // Limpa histórico de auditoria
  const handleClearLogs = () => {
    if (confirm('Deseja realmente limpar o histórico local de tentativas de login com VPN bloqueadas?')) {
      clearVpnAuditLogs();
      loadAuditLogs();
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Top Header / Breadcrumbs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition"
                title="Voltar"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
              <ShieldAlert size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                  Verificador de Conexões VPN e Proxies
                </h1>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  Special:VpnChecker
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Diagnóstico de rede em tempo real, detecção de túneis anônimos e aplicação da política de integridade editorial.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-stretch sm:self-auto">
          <button
            type="button"
            onClick={() => refreshCurrentConnection(true)}
            disabled={isLoadingCurrent}
            className="flex-1 sm:flex-initial py-2 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoadingCurrent ? 'animate-spin text-blue-600' : ''} />
            <span>{isLoadingCurrent ? 'Verificando...' : 'Reavaliar Minha Conexão'}</span>
          </button>

          {onOpenLoginModal && (
            <button
              type="button"
              onClick={onOpenLoginModal}
              className="flex-1 sm:flex-initial py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Key size={14} />
              <span>Testar no Modal de Login</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('current')}
          className={`py-2.5 px-4 text-xs font-semibold rounded-t-lg transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'current'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Activity size={14} />
          <span>Minha Conexão Atual</span>
          {currentConnection && (
            <span
              className={`w-2 h-2 rounded-full ${
                currentConnection.blocked ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'
              }`}
            />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('analyzer')}
          className={`py-2.5 px-4 text-xs font-semibold rounded-t-lg transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'analyzer'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Search size={14} />
          <span>Analisador de Qualquer IP & Presets</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('policy')}
          className={`py-2.5 px-4 text-xs font-semibold rounded-t-lg transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'policy'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <FileText size={14} />
          <span>Diretrizes & Por Que Bloqueamos VPNs</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('audit');
            loadAuditLogs();
          }}
          className={`py-2.5 px-4 text-xs font-semibold rounded-t-lg transition flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'audit'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <History size={14} />
          <span>Auditoria de Tentativas Bloqueadas</span>
          {auditLogs.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
              {auditLogs.length}
            </span>
          )}
        </button>
      </div>

      {/* ABA 1: MINHA CONEXÃO ATUAL */}
      {activeTab === 'current' && (
        <div className="space-y-6">
          {/* Banner de Resultado Geral */}
          {isLoadingCurrent ? (
            <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col items-center justify-center gap-3 text-center">
              <RefreshCw size={28} className="animate-spin text-blue-600" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Auditando conexão e analisando rotas de rede...
              </p>
              <p className="text-xs text-slate-500">
                Checando nós de saída, DNS reverso, faixas de IP conhecidas e serviços de VPN.
              </p>
            </div>
          ) : currentConnection ? (
            <div
              className={`p-5 sm:p-6 rounded-2xl border-2 transition-all shadow-sm ${
                currentConnection.blocked
                  ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900 text-rose-900 dark:text-rose-100'
                  : 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-900 text-emerald-900 dark:text-emerald-100'
              }`}
            >
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div
                    className={`p-3 rounded-2xl shrink-0 ${
                      currentConnection.blocked
                        ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300'
                        : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300'
                    }`}
                  >
                    {currentConnection.blocked ? <ShieldAlert size={28} /> : <ShieldCheck size={28} />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-base sm:text-lg font-bold">
                        {currentConnection.blocked
                          ? 'Conexão via VPN / Proxy Detectada — Login Bloqueado'
                          : 'Conexão Residencial Verificada — Acesso Liberado'}
                      </span>
                      {currentConnection.isSimulated && (
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-200 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                          SIMULAÇÃO ATIVA ({currentConnection.simulatedPreset || 'TESTE'})
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm opacity-90 leading-relaxed max-w-3xl">
                      {currentConnection.reason}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0 border-slate-200/60 dark:border-slate-800">
                  <span className="text-[11px] font-semibold uppercase tracking-wider opacity-75">
                    Score de Risco de Mascaramento
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-2xl font-black font-mono">
                      {currentConnection.riskScore}%
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        currentConnection.riskScore >= 70
                          ? 'bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100'
                          : currentConnection.riskScore >= 40
                          ? 'bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100'
                          : 'bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100'
                      }`}
                    >
                      {currentConnection.riskScore >= 70 ? 'ALTO' : currentConnection.riskScore >= 40 ? 'MÉDIO' : 'BAIXO'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Grid de Detalhes Técnicos da Conexão */}
          {currentConnection && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: IP e Classificação */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Globe size={13} />
                    Endereço IP
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800">
                    IPv4
                  </span>
                </div>
                <div className="font-mono font-bold text-base text-slate-800 dark:text-slate-100 truncate">
                  {currentConnection.ip}
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400">
                  Origem:{' '}
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {currentConnection.city ? `${currentConnection.city}, ` : ''}{currentConnection.country || 'Identificado'}
                  </span>
                </div>
              </div>

              {/* Card 2: Provedor / ASN */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Server size={13} />
                    Provedor / ASN
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800">
                    {currentConnection.asn || 'AS'}
                  </span>
                </div>
                <div className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate" title={currentConnection.provider}>
                  {currentConnection.provider || 'Telecom / Banda Larga'}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {currentConnection.org || currentConnection.provider || 'Rede Residencial'}
                </div>
              </div>

              {/* Card 3: Análise de Túnel */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Radio size={13} />
                    Tipo de Conexão
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {currentConnection.isTor ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      Nó Tor
                    </span>
                  ) : currentConnection.isVpn ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                      VPN Comercial
                    </span>
                  ) : currentConnection.isProxy ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      Proxy Anônimo
                    </span>
                  ) : currentConnection.isHosting ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      Datacenter/Cloud
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      Residencial Direta
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  DNS Reverso: {currentConnection.reverseDns || 'Sem PTR mascarado'}
                </div>
              </div>

              {/* Card 4: Permissão no Login */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-2">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                  <span className="font-semibold flex items-center gap-1.5">
                    {currentConnection.blocked ? <Lock size={13} /> : <Unlock size={13} />}
                    Status de Login
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {currentConnection.blocked ? (
                    <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold text-sm">
                      <XCircle size={16} />
                      <span>BLOQUEADO</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                      <CheckCircle2 size={16} />
                      <span>LIBERADO</span>
                    </div>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {currentConnection.blocked
                    ? 'Desconecte sua VPN para efetuar login.'
                    : 'Pode se autenticar normalmente.'}
                </div>
              </div>
            </div>
          )}

          {/* Painel de Simulação para Testes e Demonstrações */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Sliders size={16} className="text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Simulador Interativo de VPN para Testes e Auditoria
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Permite simular o comportamento de conexões de VPN conhecidas (como NordVPN, Tor ou Mullvad) no seu navegador sem precisar alterar sua rede física.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleSimulation(!isSimActive)}
                  className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    isSimActive
                      ? 'bg-rose-600 text-white hover:bg-rose-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <RefreshCw size={12} className={isLoadingCurrent ? 'animate-spin' : ''} />
                  <span>{isSimActive ? 'Desativar Simulação' : 'Ativar Simulação de VPN'}</span>
                </button>
              </div>
            </div>

            {/* Presets Rápidos */}
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                Selecione uma Predefinição de VPN para Testar:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {PRESET_VPNS.map((preset) => {
                  const isSelected = isSimActive && selectedPresetId === preset.id;
                  const isBlocked = preset.type !== 'residential';
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleToggleSimulation(true, preset.id)}
                      className={`p-2.5 rounded-xl border text-left transition flex items-start justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 ring-2 ring-blue-500/20'
                          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                          {preset.name}
                        </div>
                        <div className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                          IP: {preset.ip} • {preset.asn}
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                          {preset.description}
                        </p>
                      </div>

                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 font-mono ${
                          isBlocked
                            ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                            : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        }`}
                      >
                        {isBlocked ? 'BLOQUEADO' : 'LIBERADO'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: ANALISADOR DE QUALQUER IP */}
      {activeTab === 'analyzer' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-4">
            <div className="space-y-1">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Search size={16} className="text-blue-600" />
                Auditar Qualquer Endereço IP (IPv4 / IPv6)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Digite um endereço IP de usuário suspeito ou nó de rede para verificar se ele seria bloqueado ao tentar realizar login.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAnalyzeCustomIp();
              }}
              className="flex flex-col sm:flex-row items-stretch gap-2"
            >
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={targetIpInput}
                  onChange={(e) => setTargetIpInput(e.target.value)}
                  placeholder="Ex: 185.156.172.4 ou 193.138.218.71"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>

              <button
                type="submit"
                disabled={isAnalyzingCustom || !targetIpInput.trim()}
                className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={14} className={isAnalyzingCustom ? 'animate-spin' : ''} />
                <span>{isAnalyzingCustom ? 'Analisando...' : 'Verificar IP'}</span>
              </button>
            </form>

            {/* Presets Rápidos para Análise */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                Ou selecione um exemplo para testar:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_VPNS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setTargetIpInput(p.ip);
                      handleAnalyzeCustomIp(p.ip);
                    }}
                    className="text-[10px] font-mono px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                  >
                    {p.name.split(' ')[0]} ({p.ip})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Resultado da Análise Customizada */}
          {customResult && (
            <div
              className={`p-5 rounded-2xl border-2 transition shadow-sm space-y-4 ${
                customResult.blocked
                  ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900 text-rose-900 dark:text-rose-100'
                  : 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-900 text-emerald-900 dark:text-emerald-100'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2.5 rounded-xl shrink-0 ${
                      customResult.blocked
                        ? 'bg-rose-100 dark:bg-rose-900/80 text-rose-600 dark:text-rose-200'
                        : 'bg-emerald-100 dark:bg-emerald-900/80 text-emerald-600 dark:text-emerald-200'
                    }`}
                  >
                    {customResult.blocked ? <ShieldAlert size={24} /> : <ShieldCheck size={24} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-base">
                        IP: <code className="font-mono text-sm px-1.5 py-0.5 rounded bg-black/10">{customResult.ip}</code>
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                          customResult.blocked
                            ? 'bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100'
                            : 'bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100'
                        }`}
                      >
                        {customResult.blocked ? 'LOGIN SERIA BLOQUEADO' : 'LOGIN SERIA LIBERADO'}
                      </span>
                    </div>
                    <p className="text-xs mt-1 leading-relaxed">{customResult.reason}</p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[10px] font-semibold uppercase opacity-75">Grau de Risco</div>
                  <div className="text-xl font-bold font-mono">{customResult.riskScore}%</div>
                </div>
              </div>

              {/* Informações Complementares */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-black/10 text-xs">
                <div>
                  <span className="font-semibold block opacity-75">Provedor / Organização:</span>
                  <span className="font-medium">{customResult.provider || 'Não informado'}</span>
                </div>
                <div>
                  <span className="font-semibold block opacity-75">ASN & Localização:</span>
                  <span className="font-medium">
                    {customResult.asn || 'AS Desconhecido'} {customResult.country ? `(${customResult.country})` : ''}
                  </span>
                </div>
                <div>
                  <span className="font-semibold block opacity-75">DNS Reverso:</span>
                  <span className="font-mono text-[11px] truncate block">
                    {customResult.reverseDns || 'Nenhum hostname PTR'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ABA 3: DIRETRIZES & POR QUE BLOQUEAMOS VPNS */}
      {activeTab === 'policy' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-6">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileText size={20} className="text-blue-600" />
                Política de Conexões Anonimizadoras e Bloqueio de VPNs
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Entenda a justificativa de governança comunitária, integridade editorial e conformidade de segurança que fundamenta a restrição ao uso de VPNs para autenticação na WikiWorldWeb.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1: Prevenção de Sockpuppets */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-800 dark:text-slate-200">
                  <UserX size={16} className="text-rose-500" />
                  <span>Combate a Contas Fantoches (Sockpuppets)</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Redes privadas virtuais permitem criar dezenas de identidades falsas mascarando a origem de IP real. Na Wikipédia e na WikiWorldWeb, decisões editoriais são tomadas por consenso comunitário — contas fantoches fraudam votações e criam falsos consensos.
                </p>
              </div>

              {/* Card 2: Evasão de Sanções Administrativas */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-800 dark:text-slate-200">
                  <Lock size={16} className="text-amber-500" />
                  <span>Evasão de Bloqueios e Sanções</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Usuários bloqueados pelo Conselho de Arbitragem (ArbCom) ou administradores frequentemente utilizam VPNs para contornar penalidades e reincidir em assédio, difamação ou guerras de edições. O bloqueio de VPN no login fecha essa porta de reincidência.
                </p>
              </div>

              {/* Card 3: Vandalismo em Massa e Bots */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-800 dark:text-slate-200">
                  <AlertTriangle size={16} className="text-blue-500" />
                  <span>Mitigação de Vandalismo Coordenado</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Ataques automatizados de bots de spam e raspadores maliciosos utilizam proxies de datacenter e nós VPN para inundar o banco de dados. Exigir IPs residenciais garante rastreabilidade responsável.
                </p>
              </div>

              {/* Card 4: Como Proceder se Você Usa VPN */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-800 dark:text-slate-200">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  <span>Como Proceder se Você Utiliza VPN?</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Caso utilize VPN corporativa ou privada no seu dispositivo, basta <strong>pausar a VPN temporariamente por 10 segundos</strong> para concluir a autenticação com sua conta Google. Uma vez iniciada a sessão, o token permanece ativo.
                </p>
              </div>
            </div>

            {/* Isenção de Bloqueio de IP */}
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-blue-900 dark:text-blue-200">
                <Info size={15} />
                <span>Isenção de Bloqueio de IP (IPBE — IP Block Exemption)</span>
              </div>
              <p className="text-blue-800 dark:text-blue-300 leading-relaxed">
                Editores veteranos e membros de instituições acadêmicas que comprovadamente necessitam de túneis VPN por motivos de segurança institucional ou censura geográfica podem solicitar uma credencial de <strong>Isenção de Bloqueio de IP</strong> junto aos Administradores ou pelo Comitê de Arbitragem.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ABA 4: AUDITORIA DE TENTATIVAS BLOQUEADAS */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="space-y-0.5">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <History size={16} className="text-blue-600" />
                  Registro de Auditoria de Tentativas de Login com VPN Interceptadas
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Histórico de tentativas de login ou criação de sessão bloqueadas pela camada de segurança.
                </p>
              </div>

              {auditLogs.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearLogs}
                  className="py-1.5 px-3 rounded-lg border border-rose-300 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 text-xs font-medium transition cursor-pointer flex items-center gap-1"
                >
                  <Trash2 size={12} />
                  <span>Limpar Registros</span>
                </button>
              )}
            </div>

            {auditLogs.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                <CheckCircle2 size={28} className="mx-auto text-emerald-500" />
                <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Nenhuma tentativa de login com VPN bloqueada registrada neste navegador.
                </p>
                <p className="text-[11px] text-slate-500">
                  Quando um usuário tentar efetuar login com uma VPN conectada, o evento será catalogado aqui com IP, Provedor e data/hora.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold">
                      <th className="py-2.5 px-3">Data / Hora</th>
                      <th className="py-2.5 px-3">Endereço IP</th>
                      <th className="py-2.5 px-3">Provedor / Rede</th>
                      <th className="py-2.5 px-3">Tipo de Tentativa</th>
                      <th className="py-2.5 px-3">Score</th>
                      <th className="py-2.5 px-3">Ação Aplicada</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString('pt-BR')}
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                          {log.ip}
                        </td>
                        <td className="py-2 px-3 text-slate-700 dark:text-slate-300">
                          {log.provider || 'VPN Desconhecida'}
                        </td>
                        <td className="py-2 px-3">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {log.attemptType === 'google_login' ? 'Google OAuth' : 'Convidado'}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono font-bold text-rose-600 dark:text-rose-400">
                          {log.riskScore}%
                        </td>
                        <td className="py-2 px-3">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                            LOGIN BLOQUEADO
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
