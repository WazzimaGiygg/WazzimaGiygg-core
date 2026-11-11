import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Unlock,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Loader2,
  Ban,
  Globe,
  RefreshCw,
  UserX,
  ChevronDown,
  ChevronUp,
  Settings,
  Database,
  ExternalLink,
} from 'lucide-react';
import { UserProfile } from '../types';
import { StorageService } from '../services/storageService';
import { MazeRecaptcha } from './MazeRecaptcha';
import {
  verifyClientIpForLogin,
  WikimediaIpCheckResult,
  isWikimediaSimulationActive,
  setWikimediaSimulation,
} from '../utils/wikimediaIpChecker';
import {
  checkClientVpnConnection,
  VpnCheckResult,
  isVpnSimulationActive,
  setVpnSimulation,
} from '../utils/vpnChecker';
import {
  PRIORITY_WIKIMEDIA_ADMINS,
  checkIfWikimediaAdmin,
  BlockedWikimediaAdminResult,
} from '../utils/wikimediaAdminChecker';
import {
  getActiveFirebaseConfig,
  saveCustomStoredConfig,
  clearCustomStoredConfig,
  isUsingCustomStoredConfig,
} from '../config/firebaseCustomConfig';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
  onOpenVpnChecker?: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onOpenVpnChecker,
}) => {
  const [isRecaptchaVerified, setIsRecaptchaVerified] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [recaptchaError, setRecaptchaError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Estados da Verificação de IP Wikimedia Foundation
  const [isCheckingIp, setIsCheckingIp] = useState(true);
  const [ipCheckResult, setIpCheckResult] = useState<WikimediaIpCheckResult | null>(null);
  const [isSimulatingWikimedia, setIsSimulatingWikimedia] = useState(false);

  // Estados da Verificação de Conexão VPN / Proxy Anônimo
  const [isCheckingVpn, setIsCheckingVpn] = useState(true);
  const [vpnCheckResult, setVpnCheckResult] = useState<VpnCheckResult | null>(null);
  const [isSimulatingVpn, setIsSimulatingVpn] = useState(false);

  // Estados para Auditoria de Nicknames de Administradores WMF
  const [testAdminInput, setTestAdminInput] = useState('');
  const [testAdminResult, setTestAdminResult] = useState<BlockedWikimediaAdminResult | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string>(() => getActiveFirebaseConfig().projectId);
  const [showFirebaseConfigPanel, setShowFirebaseConfigPanel] = useState(false);
  const [firebaseSnippetInput, setFirebaseSnippetInput] = useState('');
  const [configFeedback, setConfigFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleApplyFirebaseConfig = () => {
    setConfigFeedback(null);
    if (!firebaseSnippetInput.trim()) {
      setConfigFeedback({ type: 'error', message: 'Cole o snippet ou objeto de configuração do Firebase Console.' });
      return;
    }

    try {
      let cfg: any = null;
      const text = firebaseSnippetInput.trim();

      // Tentativa 1: JSON direto
      if (text.startsWith('{') && text.endsWith('}')) {
        try {
          cfg = JSON.parse(text);
        } catch {
          // segue para regex
        }
      }

      // Tentativa 2: Extração via Regex para snippet JS do console
      if (!cfg || !cfg.apiKey) {
        const apiKeyMatch = text.match(/apiKey\s*[:=]\s*["']([^"']+)["']/i);
        const projectIdMatch = text.match(/projectId\s*[:=]\s*["']([^"']+)["']/i);
        const authDomainMatch = text.match(/authDomain\s*[:=]\s*["']([^"']+)["']/i);
        const storageBucketMatch = text.match(/storageBucket\s*[:=]\s*["']([^"']+)["']/i);
        const messagingSenderIdMatch = text.match(/messagingSenderId\s*[:=]\s*["']([^"']+)["']/i);
        const appIdMatch = text.match(/appId\s*[:=]\s*["']([^"']+)["']/i);

        if (apiKeyMatch && projectIdMatch) {
          cfg = {
            apiKey: apiKeyMatch[1],
            projectId: projectIdMatch[1],
            authDomain: authDomainMatch ? authDomainMatch[1] : `${projectIdMatch[1]}.firebaseapp.com`,
            storageBucket: storageBucketMatch ? storageBucketMatch[1] : `${projectIdMatch[1]}.firebasestorage.app`,
            messagingSenderId: messagingSenderIdMatch ? messagingSenderIdMatch[1] : '',
            appId: appIdMatch ? appIdMatch[1] : '',
          };
        }
      }

      if (!cfg || !cfg.apiKey || !cfg.projectId) {
        throw new Error('Não foi possível identificar apiKey e projectId no texto colado. Verifique se copiou o bloco firebaseConfig do Firebase Console.');
      }

      saveCustomStoredConfig(cfg);
      setActiveProjectId(cfg.projectId);
      setConfigFeedback({
        type: 'success',
        message: `Projeto "${cfg.projectId}" salvo com sucesso! Recarregando conexão com o Firebase...`,
      });

      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }, 1200);
    } catch (err: any) {
      setConfigFeedback({
        type: 'error',
        message: err?.message || 'Erro ao processar a configuração do Firebase.',
      });
    }
  };

  const handleResetToDefaultConfig = () => {
    clearCustomStoredConfig();
    setConfigFeedback({
      type: 'success',
      message: 'Configuração restaurada para o projeto padrão. Recarregando...',
    });
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }, 1000);
  };

  const handleTestAdmin = (name: string) => {
    setTestAdminInput(name);
    const res = checkIfWikimediaAdmin(name);
    setTestAdminResult(res);
    if (res.isBlocked) {
      setLoginError(`[BLOQUEIO WMF ATIVO] ${res.reason}`);
    } else {
      setLoginError(null);
    }
  };

  const runIpVerification = async () => {
    setIsCheckingIp(true);
    try {
      const res = await verifyClientIpForLogin();
      setIpCheckResult(res);
      setIsSimulatingWikimedia(!!res.isSimulated);
    } catch (err) {
      console.warn('Falha na checagem de IP:', err);
    } finally {
      setIsCheckingIp(false);
    }
  };

  const runVpnVerification = async (forceRefresh = false) => {
    setIsCheckingVpn(true);
    try {
      const res = await checkClientVpnConnection(forceRefresh);
      setVpnCheckResult(res);
      setIsSimulatingVpn(!!res.isSimulated);
    } catch (err) {
      console.warn('Falha na checagem de VPN:', err);
    } finally {
      setIsCheckingVpn(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runIpVerification();
      runVpnVerification();
    }
  }, [isOpen]);

  const toggleSimulation = () => {
    const nextState = !isSimulatingWikimedia;
    setWikimediaSimulation(nextState);
    setIsSimulatingWikimedia(nextState);
    runIpVerification();
  };

  const toggleVpnSimulation = () => {
    const nextState = !isSimulatingVpn;
    setVpnSimulation(nextState, 'nordvpn');
    setIsSimulatingVpn(nextState);
    runVpnVerification(true);
  };

  if (!isOpen) return null;

  const validateRecaptcha = (): boolean => {
    if (!isRecaptchaVerified || !recaptchaToken) {
      setRecaptchaError('Por favor, resolva o Desafio do Labirinto acima para desbloquear o login com a Conta Google.');
      return false;
    }
    setRecaptchaError(null);
    return true;
  };

  // Google OAuth Login
  const handleGoogleLogin = async () => {
    // 1. Verificação prévia de IP Wikimedia Foundation
    if (ipCheckResult?.isWikimedia) {
      setLoginError(
        `Acesso bloqueado: O login está permanentemente desabilitado para conexões originadas da Wikimedia Foundation (AS14907, IP: ${ipCheckResult.ip}${ipCheckResult.matchedRange ? `, faixa: ${ipCheckResult.matchedRange}` : ''}).`
      );
      return;
    }

    // 1.1 Verificação prévia de VPN / Proxy
    if (vpnCheckResult?.blocked) {
      setLoginError(
        `Acesso bloqueado: O login está desabilitado para conexões que utilizam VPN ou Proxy anônimo (${vpnCheckResult.provider || vpnCheckResult.ip}). Por favor, desative sua VPN para acessar a WikiWorldWeb.`
      );
      return;
    }

    if (!validateRecaptcha()) return;

    setIsLoading(true);
    setLoginError(null);
    setUnauthorizedDomain(null);
    try {
      const user = await StorageService.loginWithGoogle();
      onLoginSuccess(user);
      onClose();
    } catch (err: any) {
      const msg = err?.message || '';
      console.error('Falha no login Google:', err);
      if (err?.code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
        const domain = err?.domain || (typeof window !== 'undefined' ? window.location.hostname : 'wikizero.wazzimagiygg.com');
        const projId = err?.activeProjectId || getActiveFirebaseConfig().projectId;
        setUnauthorizedDomain(domain);
        setActiveProjectId(projId);
        setLoginError(
          `O domínio atual (${domain}) não está autorizado no projeto Firebase ativo "${projId}".`
        );
      } else if (msg.includes('Bloqueado') || msg.includes('bloqueada') || msg.includes('banida') || msg.includes('Wikimedia')) {
        setLoginError(msg);
      } else if (err?.code === 'auth/popup-closed-by-user' || msg.includes('popup-closed')) {
        setLoginError('A janela de login com a Conta Google foi fechada antes da confirmação. Tente novamente.');
      } else if (err?.code === 'auth/cancelled-popup-request') {
        setLoginError('Operação de login cancelada. Tente novamente.');
      } else {
        setLoginError(msg || 'Não foi possível autenticar com a Conta Google. Verifique sua conexão e tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isBlockedByWikimedia = !!ipCheckResult?.isWikimedia;
  const isBlockedByVpn = !!vpnCheckResult?.blocked;
  const isAnyIpBlocked = isBlockedByWikimedia || isBlockedByVpn;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl relative my-auto max-h-[94vh] flex flex-col">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer z-10"
          aria-label="Fechar modal de login"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3 mb-3 flex-shrink-0">
          <img
            src="/logo.png"
            alt="Logotipo WikiZero"
            className="w-10 h-10 rounded-xl object-contain shadow-md flex-shrink-0 p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-serif-heading font-bold text-slate-900 dark:text-white leading-tight">
                Login • WikiZero
              </h3>
              {isBlockedByWikimedia ? (
                <span className="bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-300 dark:border-rose-800 flex items-center gap-1">
                  <Ban size={11} />
                  IP Wikimedia Bloqueado
                </span>
              ) : isBlockedByVpn ? (
                <span className="bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-300 dark:border-rose-800 flex items-center gap-1">
                  <ShieldAlert size={11} />
                  VPN / Proxy Bloqueado
                </span>
              ) : isRecaptchaVerified ? (
                <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                  <CheckCircle2 size={11} />
                  Google Liberado
                </span>
              ) : (
                <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-700 flex items-center gap-1">
                  <Lock size={10} />
                  reCAPTCHA Pendente
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {isBlockedByWikimedia
                ? 'Tentativas de login originadas da Wikimedia Foundation são bloqueadas por segurança.'
                : isBlockedByVpn
                ? 'Tentativas de login originadas de conexões VPN ou Proxy anônimo estão bloqueadas.'
                : 'O reCAPTCHA do Labirinto deve ser concluído para liberar o login com a Conta Google.'}
            </p>
          </div>
        </div>

        {/* ALERTA DE BLOQUEIO DE IP DA WIKIMEDIA FOUNDATION */}
        {isBlockedByWikimedia && ipCheckResult && (
          <div className="mb-3 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border-2 border-rose-300 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200 shadow-sm space-y-2 flex-shrink-0 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-rose-200 dark:bg-rose-900/80 text-rose-700 dark:text-rose-200 shrink-0">
                <ShieldAlert size={18} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-rose-800 dark:text-rose-100 text-sm">
                    Bloqueio Ativo: Origem Wikimedia Foundation Detectada
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 font-mono text-[10px] font-bold">
                    AS14907
                  </span>
                  {ipCheckResult.isSimulated && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 font-mono text-[10px] font-bold">
                      MODO TESTE
                    </span>
                  )}
                </div>
                <p className="text-[11px] leading-relaxed text-rose-800 dark:text-rose-200">
                  O endereço IP desta conexão (<code className="font-bold font-mono bg-rose-200/80 dark:bg-rose-900/80 px-1 py-0.5 rounded">{ipCheckResult.ip}</code>
                  {ipCheckResult.matchedRange && (
                    <> na faixa <code className="font-bold font-mono bg-rose-200/80 dark:bg-rose-900/80 px-1 py-0.5 rounded">{ipCheckResult.matchedRange}</code></>
                  )}) pertence aos blocos de rede oficiais mantidos pela <strong>Wikimedia Foundation, Inc.</strong>
                </p>
                <p className="text-[11px] leading-relaxed text-rose-700 dark:text-rose-300 font-medium">
                  <strong>Política de Segurança WikiWorldWeb:</strong> Por diretriz editorial de isolamento independente, neutralidade e proteção contra interferências institucionais, o login e a criação de sessões com credenciais a partir de endereços IP da Wikimedia Foundation estão <u>estritamente vetados</u>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ALERTA DE BLOQUEIO DE VPN / PROXY ANÔNIMO */}
        {isBlockedByVpn && vpnCheckResult && !isBlockedByWikimedia && (
          <div className="mb-3 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border-2 border-rose-300 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200 shadow-sm space-y-2 flex-shrink-0 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-rose-200 dark:bg-rose-900/80 text-rose-700 dark:text-rose-200 shrink-0">
                <ShieldAlert size={18} />
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-rose-800 dark:text-rose-100 text-sm">
                      Bloqueio Ativo: Conexão via VPN / Proxy Detectada
                    </span>
                    {vpnCheckResult.isSimulated && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 font-mono text-[10px] font-bold">
                        SIMULAÇÃO ({vpnCheckResult.simulatedPreset || 'TESTE'})
                      </span>
                    )}
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 font-mono text-[10px] font-bold">
                    RISCO: {vpnCheckResult.riskScore}%
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-rose-800 dark:text-rose-200">
                  Esta conexão está utilizando o túnel <strong>{vpnCheckResult.provider || 'VPN / Proxy'}</strong> (IP: <code className="font-bold font-mono bg-rose-200/80 dark:bg-rose-900/80 px-1 py-0.5 rounded">{vpnCheckResult.ip}</code>
                  {vpnCheckResult.country ? ` em ${vpnCheckResult.country}` : ''}).
                </p>
                <p className="text-[11px] leading-relaxed text-rose-700 dark:text-rose-300 font-medium">
                  <strong>Política Anti-Sockpuppets e Integridade Editorial:</strong> O login e o registro de contas estão bloqueados para conexões originadas de VPNs, Tor e Proxies de datacenter para combater vandalismo coordenado e criação de identidades falsas.
                </p>

                <div className="pt-1 flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => runVpnVerification(true)}
                    disabled={isCheckingVpn}
                    className="py-1 px-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[11px] transition flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw size={11} className={isCheckingVpn ? 'animate-spin' : ''} />
                    <span>Desativei a VPN (Reverificar)</span>
                  </button>

                  {onOpenVpnChecker && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenVpnChecker();
                      }}
                      className="py-1 px-2.5 rounded-lg border border-rose-300 dark:border-rose-700 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-800 dark:text-rose-200 font-semibold text-[11px] transition flex items-center gap-1 cursor-pointer"
                    >
                      <ExternalLink size={11} />
                      <span>Diagnóstico Completo no Verificador de VPN</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Unauthorized Domain Guide Notice */}
        {unauthorizedDomain && (
          <div className="mb-3 p-3 rounded-xl bg-amber-50/95 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-xs text-amber-900 dark:text-amber-200 flex-shrink-0 space-y-2.5 shadow-xs animate-in fade-in">
            <div className="flex items-center justify-between gap-1.5 font-bold text-amber-900 dark:text-amber-200">
              <div className="flex items-center gap-1.5">
                <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <span>Discrepância de Projeto / Domínio no Firebase</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-200/80 dark:bg-amber-900/80 text-amber-950 dark:text-amber-100 font-semibold border border-amber-300 dark:border-amber-700">
                Auth Error
              </span>
            </div>

            <div className="bg-white/80 dark:bg-slate-900/80 rounded-lg p-2 border border-amber-200 dark:border-amber-800 space-y-1">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-600 dark:text-slate-400">Domínio da Aplicação:</span>
                <code className="font-mono font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-1 rounded">{unauthorizedDomain}</code>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-600 dark:text-slate-400">Projeto Firebase Ativo no App:</span>
                <code className="font-mono font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/80 px-1 rounded">{activeProjectId}</code>
              </div>
            </div>

            <p className="text-[11px] leading-relaxed text-amber-900 dark:text-amber-200">
              <strong>Motivo do erro:</strong> Você cadastrou o domínio no console do projeto <strong>wzzm-ce3fc</strong>, mas a aplicação está apontando para o projeto <strong>{activeProjectId}</strong>.
            </p>
          </div>
        )}

        {/* Firebase Config Panel (Standalone or Toggle) */}
        {showFirebaseConfigPanel && (
          <div className="mb-3 p-3 bg-white dark:bg-slate-900 rounded-xl border border-blue-300 dark:border-blue-700 space-y-2 animate-in fade-in shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                <Database size={14} className="text-blue-600" />
                Configuração do Projeto Firebase ({activeProjectId})
              </span>
              <button
                type="button"
                onClick={() => setShowFirebaseConfigPanel(false)}
                className="text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X size={14} />
              </button>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              No Firebase Console do projeto <strong>wzzm-ce3fc</strong>: vá em <strong>⚙️ Configurações do Projeto &gt; Geral &gt; Seus aplicativos &gt; Configuração do SDK</strong>, copie e cole o snippet abaixo:
            </p>
            <textarea
              rows={4}
              value={firebaseSnippetInput}
              onChange={(e) => setFirebaseSnippetInput(e.target.value)}
              placeholder={'const firebaseConfig = {\n  apiKey: "AIzaSy...",\n  projectId: "wzzm-ce3fc",\n  authDomain: "wzzm-ce3fc.firebaseapp.com",\n  appId: "1:..."\n};'}
              className="w-full text-[11px] font-mono p-2 rounded border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {configFeedback && (
              <div
                className={`p-2 rounded text-[11px] ${
                  configFeedback.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800'
                }`}
              >
                {configFeedback.message}
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleApplyFirebaseConfig}
                className="flex-1 py-1.5 px-2.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 size={13} />
                <span>Salvar e Conectar ao wzzm-ce3fc</span>
              </button>
              {isUsingCustomStoredConfig() && (
                <button
                  type="button"
                  onClick={handleResetToDefaultConfig}
                  className="py-1.5 px-2.5 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 text-[11px] transition cursor-pointer"
                >
                  Restaurar Padrão
                </button>
              )}
            </div>
          </div>
        )}

        {/* Login Error Notice */}
        {loginError && !unauthorizedDomain && (
          <div className="mb-3 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300 flex items-center gap-2 flex-shrink-0">
            <AlertTriangle size={14} className="flex-shrink-0 text-red-500" />
            <span>{loginError}</span>
          </div>
        )}

        {/* Recaptcha Error Notice */}
        {recaptchaError && !isRecaptchaVerified && !isBlockedByWikimedia && (
          <div className="mb-3 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2 flex-shrink-0">
            <AlertTriangle size={14} className="flex-shrink-0 text-amber-500" />
            <span>{recaptchaError}</span>
          </div>
        )}

        {/* Content Area with scroll if needed */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          {/* Open Google Login Card */}
          <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/70 rounded-xl p-3 text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-900 dark:text-emerald-200 font-bold text-[11px]">
              <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Login Aberto via Conta Google</span>
            </div>
            <p className="text-[11px] text-emerald-800/90 dark:text-emerald-300/90 leading-relaxed">
              Usuários não cadastrados previamente podem entrar diretamente com sua <strong>Conta Google</strong>. Seu perfil de editor e página de usuário pública são provisionados automaticamente com segurança e transparência.
            </p>
          </div>

          {/* OIDC Information Badge */}
          <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs space-y-1.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 font-mono text-[11px]">
                <ShieldCheck size={14} className="text-blue-500" />
                Google Identity Services (OIDC)
              </span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800">
                  OAuth 2.0
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
                  OpenID Connect
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              Autenticação federada com suporte nativo aos escopos <code>openid</code>, <code>profile</code> e <code>email</code>. Suas permissões e histórico de edições são vinculados com total segurança.
            </p>
          </div>

          {/* Primary Google Login Button */}
          <div className="space-y-2">
            {isBlockedByWikimedia ? (
              <div className="w-full py-3.5 px-4 rounded-xl font-medium text-xs flex items-center justify-center gap-3 shadow-xs bg-rose-100/80 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border-2 border-dashed border-rose-400 dark:border-rose-700 cursor-not-allowed select-none">
                <Ban size={18} className="text-rose-600 dark:text-rose-400 flex-shrink-0" />
                <span className="font-bold text-sm">
                  Login Desabilitado para IPs da Wikimedia Foundation
                </span>
              </div>
            ) : isBlockedByVpn ? (
              <div className="w-full py-3.5 px-4 rounded-xl font-medium text-xs flex items-center justify-center gap-3 shadow-xs bg-rose-100/80 dark:bg-rose-950/60 text-rose-800 dark:text-rose-200 border-2 border-dashed border-rose-400 dark:border-rose-700 cursor-not-allowed select-none">
                <Ban size={18} className="text-rose-600 dark:text-rose-400 flex-shrink-0" />
                <span className="font-bold text-sm">
                  Login Desabilitado para Conexões com VPN / Proxy
                </span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl font-medium text-xs flex items-center justify-center gap-3 transition shadow-sm bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border-2 border-blue-500 hover:border-blue-600 ring-2 ring-blue-500/20 cursor-pointer active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin text-blue-600" />
                ) : (
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27A7.19 7.19 0 0 1 4.9 12c0-.79.14-1.57.38-2.27V6.58H1.25A11.96 11.96 0 0 0 0 12c0 1.92.45 3.74 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                )}
                <span className="font-bold text-sm">
                  {isLoading ? 'Conectando via Google OIDC...' : 'Entrar com Google (OAuth 2.0 / OpenID Connect)'}
                </span>
              </button>
            )}

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
              <ShieldCheck size={13} className="text-emerald-500 flex-shrink-0" />
              <span>Conexão protegida com Google OAuth 2.0 e OpenID Connect 1.0</span>
            </div>
          </div>

          {/* Bot Challenge (apenas se não estiver bloqueado por IP Wikimedia ou VPN) */}
          {!isBlockedByWikimedia && !isBlockedByVpn && (
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Sparkles size={13} className="text-amber-500" />
                  Desafio Interativo Anti-Robô (Labirinto):
                </span>
                {isRecaptchaVerified && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 size={11} /> Validado
                  </span>
                )}
              </div>

              <MazeRecaptcha
                onSuccess={(token) => {
                  setIsRecaptchaVerified(true);
                  setRecaptchaToken(token);
                  setRecaptchaError(null);
                }}
                onInstantLogin={handleGoogleLogin}
                actionButtonText="Entrar com Google (OAuth 2.0 / OIDC)"
                isGoogleAction={true}
                autoEnterDelay={0}
                compact={true}
              />
            </div>
          )}

          {/* PAINEL DE SEGURANÇA: BLOQUEIO DE NICKNAMES DE ADMINISTRADORES WMF */}
          <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/30 p-3 text-xs space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5 font-bold text-rose-900 dark:text-rose-200">
                <UserX size={14} className="text-rose-600 dark:text-rose-400" />
                <span>Bloqueio de Nicknames WMF Ativo</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAdminPanel(!showAdminPanel)}
                className="text-[11px] text-rose-700 dark:text-rose-300 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <span>{showAdminPanel ? 'Ocultar Detalhes' : 'Ver Regras & Testar'}</span>
                {showAdminPanel ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            </div>

            <p className="text-[11px] text-rose-800 dark:text-rose-300 leading-relaxed">
              Tentativas de login com nicknames de administradores, burocratas e operadores da <strong>Wikimedia Foundation</strong> são bloqueadas por diretriz de independência e neutralidade institucional.
            </p>

            {/* Administradores Prioritários com Ação Rápida de Teste */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-semibold text-rose-900 dark:text-rose-200 uppercase tracking-wider block">
                Administradores Prioritários com Bloqueio Estrito:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRIORITY_WIKIMEDIA_ADMINS.map((admin) => (
                  <button
                    key={admin.name}
                    type="button"
                    onClick={() => handleTestAdmin(admin.name)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium border transition cursor-pointer flex items-center gap-1 shadow-2xs ${
                      testAdminInput.toLowerCase() === admin.name.toLowerCase()
                        ? 'bg-rose-600 text-white border-rose-700'
                        : 'bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/50'
                    }`}
                    title={`Clique para simular e verificar o bloqueio do nickname '${admin.name}' (${admin.project})`}
                  >
                    <span>🚫</span>
                    <span>{admin.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Painel expandido de teste customizado */}
            {showAdminPanel && (
              <div className="mt-2 pt-2 border-t border-rose-200 dark:border-rose-800 space-y-2 animate-in fade-in">
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={testAdminInput}
                    onChange={(e) => setTestAdminInput(e.target.value)}
                    placeholder="Digite qualquer nickname para auditar..."
                    className="flex-1 px-2.5 py-1 text-xs rounded border border-rose-300 dark:border-rose-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500 font-mono"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleTestAdmin(testAdminInput);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleTestAdmin(testAdminInput)}
                    className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded transition cursor-pointer shadow-2xs"
                  >
                    Verificar
                  </button>
                </div>

                {testAdminResult && (
                  <div
                    className={`p-2 rounded border text-[11px] leading-relaxed ${
                      testAdminResult.isBlocked
                        ? 'bg-rose-100 dark:bg-rose-950 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                        : 'bg-emerald-50 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    }`}
                  >
                    {testAdminResult.isBlocked ? (
                      <div>
                        <div className="font-bold flex items-center gap-1 text-xs">
                          <Ban size={12} className="text-rose-600" />
                          <span>ACESSO BLOQUEADO: Administrador WMF Detectado</span>
                          {testAdminResult.isPriority && (
                            <span className="bg-rose-200 dark:bg-rose-800 text-[9px] px-1.5 py-0.2 rounded font-mono font-bold">
                              PRIORITÁRIO
                            </span>
                          )}
                        </div>
                        <p className="mt-1">{testAdminResult.reason}</p>
                        {testAdminResult.project && (
                          <div className="mt-1 text-[10px] text-rose-700 dark:text-rose-300 font-mono">
                            Origem: {testAdminResult.project}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 font-medium">
                        <CheckCircle2 size={13} className="text-emerald-600" />
                        <span>O nickname '{testAdminInput}' não consta nos registros de administradores WMF e está liberado.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Rodapé com Informação do IP de Origem e Ferramenta de Teste/Auditoria */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Globe size={13} className={isBlockedByWikimedia ? 'text-rose-500' : 'text-slate-400'} />
                <span>
                  {isCheckingIp ? (
                    'Verificando IP...'
                  ) : (
                    <>
                      IP:{' '}
                      <span className="font-mono text-[10px] font-semibold text-slate-700 dark:text-slate-300">
                        {ipCheckResult?.ip || 'Detectado'}
                      </span>
                      {ipCheckResult?.isWikimedia && (
                        <span className="ml-1 text-[10px] text-rose-600 dark:text-rose-400 font-bold">
                          (WMF)
                        </span>
                      )}
                    </>
                  )}
                </span>
              </div>

              {/* Status de VPN */}
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono border flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-750">
                {isCheckingVpn ? (
                  <>
                    <RefreshCw size={9} className="animate-spin text-blue-500" />
                    <span>Checando VPN...</span>
                  </>
                ) : isBlockedByVpn ? (
                  <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                    <ShieldAlert size={10} />
                    VPN Ativa ({vpnCheckResult?.riskScore}%)
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <ShieldCheck size={10} />
                    VPN: Não detectada
                  </span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {onOpenVpnChecker && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenVpnChecker();
                  }}
                  className="text-[10px] px-2 py-1 rounded border transition cursor-pointer font-medium flex items-center gap-1 shadow-2xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                  title="Abrir página especial de diagnóstico e verificador de conexões VPN"
                >
                  <ShieldAlert size={10} className="text-blue-500" />
                  <span>Verificador de VPN</span>
                </button>
              )}

              <button
                type="button"
                onClick={toggleVpnSimulation}
                className={`text-[10px] px-2 py-1 rounded border transition cursor-pointer font-medium flex items-center gap-1 shadow-2xs ${
                  isSimulatingVpn
                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 hover:bg-rose-200'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title="Alterna simulação de VPN comercial (NordVPN) para testar o bloqueio em tempo real"
              >
                <RefreshCw size={10} className={isCheckingVpn ? 'animate-spin' : ''} />
                <span>{isSimulatingVpn ? 'Desativar Teste VPN' : '🧪 Testar Bloqueio VPN'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowFirebaseConfigPanel(!showFirebaseConfigPanel)}
                className="text-[10px] px-2 py-1 rounded border transition cursor-pointer font-medium flex items-center gap-1 shadow-2xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                title="Configurar credenciais do Firebase (ex: wzzm-ce3fc)"
              >
                <Settings size={10} />
                <span>Firebase</span>
              </button>

              <button
                type="button"
                onClick={toggleSimulation}
                className={`text-[10px] px-2 py-1 rounded border transition cursor-pointer font-medium flex items-center gap-1 shadow-2xs ${
                  isSimulatingWikimedia
                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800 hover:bg-rose-200'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
                title="Alterna simulação de IP pertencente à Wikimedia Foundation (208.80.154.224)"
              >
                <RefreshCw size={10} className={isCheckingIp ? 'animate-spin' : ''} />
                <span>{isSimulatingWikimedia ? 'Desativar WMF' : '🧪 Testar WMF'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
