import React, { useState } from 'react';
import { X, Sparkles, Check, Zap, Image, BookOpen, ShieldCheck, Crown, MessageSquare } from 'lucide-react';
import { UserProfile } from '../types';
import { GeminiQuotaService } from '../services/geminiQuotaService';

interface GeminiPremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onUserUpdated: (user: UserProfile) => void;
  quotaTypeTriggered?: 'chats' | 'images' | 'notebook';
}

export const GeminiPremiumModal: React.FC<GeminiPremiumModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserUpdated,
  quotaTypeTriggered,
}) => {
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const isAlreadyPremium = !!(user?.isGeminiPremium || user?.geminiPlan === 'premium');

  const handleActivate = async (planType: 'subscription' | 'trial') => {
    setLoading(true);
    try {
      const updated = await GeminiQuotaService.activatePremium(user);
      onUserUpdated(updated);
      setSuccessMessage(
        planType === 'trial'
          ? '🎉 Teste de 30 Dias do Gemini Premium ativado com sucesso! Todas as cotas estão ilimitadas.'
          : '💎 Assinatura Gemini Premium ativada com sucesso! Aproveite chats, imagens e o Notebook sem limites.'
      );
      setTimeout(() => {
        setSuccessMessage(null);
        onClose();
      }, 2000);
    } catch (err: any) {
      alert('Erro ao ativar Gemini Premium: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-amber-200 dark:border-amber-900/40 overflow-hidden my-8">
        {/* Header com Gradiente Sofisticado */}
        <div className="relative bg-gradient-to-r from-amber-600 via-indigo-600 to-purple-700 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl shadow-inner">
              <Crown className="w-7 h-7 text-amber-300 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider bg-amber-400/30 text-amber-200 px-2.5 py-0.5 rounded-full">
                Google AI Studio & WikiWorldWeb
              </span>
              <h2 className="text-2xl font-bold tracking-tight">Plano Gemini Premium</h2>
            </div>
          </div>
          <p className="text-sm text-purple-100 max-w-lg mt-1">
            Desbloqueie o poder máximo da inteligência artificial para pesquisa, redação e expansão de verbetes na
            WikiWorldWeb.
          </p>

          {/* Banner de Cota Esgotada se disparado por limite */}
          {quotaTypeTriggered && !isAlreadyPremium && (
            <div className="mt-4 p-3 bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl flex items-center gap-2.5 text-xs text-amber-100">
              <Zap className="w-4 h-4 text-amber-300 flex-shrink-0" />
              <span>
                {quotaTypeTriggered === 'images' &&
                  'Você atingiu o limite gratuito de envio e análise de imagens. Atualize para o Gemini Premium para continuar sem restrições.'}
                {quotaTypeTriggered === 'notebook' &&
                  'Você atingiu o limite de execuções do Gemini Notebook. O plano pago oferece síntese ilimitada e inserção direta nos artigos.'}
                {quotaTypeTriggered === 'chats' &&
                  'Você atingiu o limite de consultas diárias gratuitas. Obtenha o Gemini Premium para chats ilimitados 24/7.'}
              </span>
            </div>
          )}
        </div>

        {/* Informações da Conta do Usuário */}
        <div className="bg-slate-50 dark:bg-slate-800/60 px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
          <div>
            {user && !user.isGuest ? (
              <span>
                Conectado como: <strong className="text-slate-900 dark:text-white">{user.displayName}</strong>{' '}
                <span className="text-slate-400 font-mono">(ID: {user.uid.slice(0, 10)}...)</span>
              </span>
            ) : (
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                ⚠️ Modo Convidado / Visitante (A assinatura ativará acesso imediato)
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Status atual:</span>
            {isAlreadyPremium ? (
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Ativo (Ilimitado)
              </span>
            ) : (
              <span className="font-medium text-slate-500 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">
                Plano Gratuito
              </span>
            )}
          </div>
        </div>

        {/* Conteúdo Principal: Comparativo */}
        <div className="p-6 space-y-6">
          {successMessage && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-xl text-emerald-800 dark:text-emerald-200 text-sm font-medium text-center shadow-sm">
              {successMessage}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card Plano Gratuito */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">Plano Gratuito</h3>
                <span className="text-xs text-slate-400">Padrão</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 mt-0.5">•</span>
                  <span>5 a 20 consultas de chat enciclopédico por dia</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 mt-0.5">•</span>
                  <span>1 a 3 análises de imagem por dia</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-400 mt-0.5">•</span>
                  <span>1 a 5 execuções do Gemini Notebook</span>
                </li>
                <li className="flex items-start gap-2 text-slate-400">
                  <span className="text-slate-400 mt-0.5">✕</span>
                  <span>Sem prioridade em períodos de alta demanda</span>
                </li>
              </ul>
            </div>

            {/* Card Gemini Premium */}
            <div className="border-2 border-amber-400 dark:border-amber-500 rounded-xl p-4 bg-amber-50/40 dark:bg-amber-950/20 relative shadow-sm">
              <div className="absolute -top-3 right-4 bg-gradient-to-r from-amber-500 to-purple-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-sm">
                Recomendado
              </div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Gemini Premium
                </h3>
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">R$ 19,90 / mês</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-200 font-medium">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span><strong>Chats Ilimitados</strong> 24h sem bloqueio diário</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span><strong>Imagens Ilimitadas</strong> com visão computacional avançada</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span><strong>Gemini Notebook Ilimitado</strong> e inserção direta em artigos</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Acesso prioritário a modelos Gemini 2.5 Flash / Pro</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Distintivo 💎 <strong>Gemini Pro</strong> no perfil da WikiWorldWeb</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Destaque das Ferramentas Incluídas */}
          <div className="border border-slate-100 dark:border-slate-800 rounded-xl p-4 bg-slate-50/70 dark:bg-slate-800/40">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Ferramentas de Pesquisa Integradas:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="flex items-start gap-2.5 p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                <MessageSquare className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-100">Chat do Artigo</div>
                  <div className="text-[11px] text-slate-500">Tira-dúvidas e redação em tempo real</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                <Image className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-100">Visão & Documentos</div>
                  <div className="text-[11px] text-slate-500">Transcreva fotos, tabelas e manuscritos</div>
                </div>
              </div>
              <div className="flex items-start gap-2.5 p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                <BookOpen className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-100">Gemini Notebook</div>
                  <div className="text-[11px] text-slate-500">Cruzamento de fontes e inserção na wiki</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer com Botões de Ação */}
        <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={() => handleActivate('trial')}
            disabled={loading || isAlreadyPremium}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
          >
            {isAlreadyPremium ? 'Plano Ativo' : '✨ Testar Grátis por 30 Dias'}
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
            >
              Agora Não
            </button>
            <button
              onClick={() => handleActivate('subscription')}
              disabled={loading || isAlreadyPremium}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 via-indigo-600 to-purple-600 hover:opacity-95 shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Crown className="w-4 h-4 text-amber-200" />
              {isAlreadyPremium ? 'Você já é Premium' : 'Ativar Gemini Premium Imediatamente'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
