import React, { useState } from 'react';
import {
  Wrench,
  Lock,
  LogIn,
  AlertTriangle,
  Clock,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface MaintenanceScreenProps {
  message?: string;
  estimatedReturn?: string;
  onLoginWithGoogle: () => Promise<void>;
  currentUser?: any;
  onRefresh: () => void;
  supportUrl?: string;
}

export default function MaintenanceScreen({
  message = 'O portal WazzimaGiygg encontra-se em manutenção programada para atualização de infraestrutura, auditoria forense e sincronização de dados.',
  estimatedReturn = 'Retorno previsto em breve',
  onLoginWithGoogle,
  currentUser,
  onRefresh,
  supportUrl = 'https://support.wazzimagiygg.com/'
}: MaintenanceScreenProps) {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      await onLoginWithGoogle();
    } catch (err: any) {
      setLoginError(err?.message || 'Falha no login com Google.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const isUnauthorizedUser = currentUser && currentUser.email?.toLowerCase() !== 'pedrohenriquecardonaperes@gmail.com';

  return (
    <div className="min-h-screen bg-[#F4F3F0] text-[#141414] font-sans flex flex-col justify-between p-4 sm:p-8 selection:bg-amber-400 selection:text-black">
      {/* Top Header */}
      <header className="border-b-4 border-[#141414] pb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-[#141414] text-white p-2.5 font-bold font-mono tracking-tighter text-xl shadow-[3px_3px_0px_0px_rgba(217,119,6,1)]">
            WZZM
          </div>
          <div>
            <h1 className="font-editorial text-2xl font-black uppercase tracking-tight">
              WazzimaGiygg
            </h1>
            <p className="font-mono text-xs text-stone-600">
              Ecossistema Digital & Acervo Enciclopédico NotMediaWiki
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-rose-600 text-white font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            Modo Manutenção Ativo
          </span>
          <button
            onClick={onRefresh}
            className="p-1.5 bg-stone-200 hover:bg-stone-300 border-2 border-[#141414] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
            title="Recarregar status"
          >
            <RefreshCw className="w-4 h-4 text-stone-800" />
          </button>
        </div>
      </header>

      {/* Main Notice Box */}
      <main className="max-w-3xl w-full mx-auto my-8 bg-white border-4 border-[#141414] p-6 sm:p-10 shadow-[10px_10px_0px_0px_rgba(20,20,20,1)] space-y-6">
        <div className="flex items-center gap-3 text-rose-600 border-b-2 border-stone-200 pb-4">
          <Wrench className="w-8 h-8" />
          <h2 className="font-editorial text-2xl sm:text-3xl font-bold uppercase tracking-tight text-stone-950">
            Portal em Manutenção Programada
          </h2>
        </div>

        {/* Message */}
        <div className="space-y-3 font-serif text-base sm:text-lg text-stone-800 leading-relaxed">
          <p>{message}</p>
        </div>

        {/* Estimated Return Box */}
        <div className="p-4 bg-amber-50 border-2 border-amber-600 shadow-[3px_3px_0px_0px_rgba(217,119,6,1)] flex items-center gap-3 font-mono text-xs">
          <Clock className="w-5 h-5 text-amber-700 flex-shrink-0" />
          <div>
            <span className="font-bold text-amber-950 uppercase">Previsão de Retorno: </span>
            <span className="text-amber-900 font-semibold">{estimatedReturn}</span>
          </div>
        </div>

        {/* Unauthorized user alert if logged in with wrong email */}
        {isUnauthorizedUser && (
          <div className="p-4 bg-red-50 border-2 border-red-600 shadow-[3px_3px_0px_0px_rgba(220,38,38,1)] space-y-2 font-mono text-xs text-red-950">
            <div className="flex items-center gap-2 font-bold text-red-700">
              <AlertTriangle className="w-5 h-5" />
              <span>Acesso Não Autorizado Durante Manutenção</span>
            </div>
            <p>
              A conta conectada (<strong>{currentUser?.email}</strong>) não possui credencial de Burocrata.
              Durante este período de manutenção técnica, apenas o Burocrata oficial (
              <code className="bg-red-100 px-1 py-0.5">pedrohenriquecardonaperes@gmail.com</code>) tem permissão de acesso
              às configurações e operação do ecossistema.
            </p>
          </div>
        )}

        {loginError && (
          <div className="p-3 bg-red-100 border-2 border-red-600 text-red-900 font-mono text-xs">
            {loginError}
          </div>
        )}

        {/* Bureaucrat Google Access Section */}
        <div className="p-6 bg-[#FAF9F5] border-2 border-[#141414] shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-stone-900" />
              <h3 className="font-editorial text-lg font-bold text-stone-950">
                Acesso Administrativo Restrito
              </h3>
            </div>
            <span className="text-[10px] font-mono bg-stone-900 text-white px-2 py-0.5 font-bold uppercase">
              Burocrata Oficial
            </span>
          </div>

          <p className="text-xs font-mono text-stone-600 leading-relaxed">
            Se você é o Burocrata responsável pela administração do sistema (
            <code className="text-stone-900 font-bold">pedrohenriquecardonaperes@gmail.com</code>), realize login com sua
            conta Google para liberar o acesso irrestrito às ferramentas, configurações e desativação da manutenção.
          </p>

          <div className="pt-2">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className="w-full sm:w-auto px-6 py-3 bg-[#141414] hover:bg-stone-800 text-white font-mono text-xs font-bold uppercase tracking-wider border-2 border-black shadow-[4px_4px_0px_0px_rgba(217,119,6,1)] flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 active:translate-x-0.5 active:translate-y-0.5 transition-all"
            >
              <LogIn className={`w-4 h-4 ${isLoggingIn ? 'animate-spin' : 'text-amber-400'}`} />
              <span>{isLoggingIn ? 'Autenticando via Google...' : 'Entrar com Google como Burocrata'}</span>
            </button>
          </div>
        </div>

        {/* Support Link */}
        <div className="pt-2 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-stone-600">
          <span>Dúvidas ou urgências operacionais?</span>
          <a
            href={supportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-stone-900 hover:text-amber-700 font-bold underline flex items-center gap-1"
          >
            <span>Central de Suporte & Ouvidoria WZZM</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-2 border-[#141414] pt-4 text-center font-mono text-xs text-stone-500">
        WazzimaGiygg Public Knowledge Ecosystem • Protocolo de Governança 3.05.3.e
      </footer>
    </div>
  );
}
