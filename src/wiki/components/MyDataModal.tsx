import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  Download,
  Trash2,
  RotateCcw,
  X,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  Bell,
  Sliders,
  Send,
  Check,
  ShieldCheck,
  Info,
  Clock,
  AlertTriangle,
  FileText,
  UserX,
} from 'lucide-react';
import { UserProfile, CookieConsent, LgpdNotificationPreferences, LgpdAccountDeletionRequest } from '../types';
import { StorageService } from '../services/storageService';

interface MyDataModalProps {
  isOpen: boolean;
  user: UserProfile | null;
  consent: CookieConsent | null;
  onClose: () => void;
  onRevokeConsent: () => void;
  onRequestDeletion: () => void;
  onRefreshNotifications?: () => void;
  initialTab?: 'titular' | 'notifications';
}

export const MyDataModal: React.FC<MyDataModalProps> = ({
  isOpen,
  user,
  consent,
  onClose,
  onRevokeConsent,
  onRequestDeletion,
  onRefreshNotifications,
  initialTab = 'titular',
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'titular' | 'notifications'>(initialTab);
  const [notifPrefs, setNotifPrefs] = useState<LgpdNotificationPreferences>(() =>
    StorageService.getLgpdNotificationPreferences()
  );
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [testSent, setTestSent] = useState(false);

  // Estados da Solicitação de Exclusão LGPD (Art. 18, VI)
  const [deletionRequest, setDeletionRequest] = useState<LgpdAccountDeletionRequest | null>(null);
  const [showDeletionForm, setShowDeletionForm] = useState(false);
  const [deletionReasonInput, setDeletionReasonInput] = useState(
    'Solicitação formal do titular para eliminação definitiva de dados pessoais conforme o Artigo 18, inciso VI da LGPD (Lei nº 13.709/2018).'
  );
  const [deletionConfirmedCheckbox, setDeletionConfirmedCheckbox] = useState(false);
  const [isSubmittingDeletion, setIsSubmittingDeletion] = useState(false);
  const [deletionFeedback, setDeletionFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (isOpen && user?.uid && !user.isGuest) {
      StorageService.getLgpdDeletionRequestForUser(user.uid).then((req) => {
        setDeletionRequest(req);
      });
    }
  }, [isOpen, user?.uid, user?.isGuest]);

  const handleSubmitDeletionRequest = async () => {
    if (!user || user.isGuest) return;
    if (!deletionConfirmedCheckbox) {
      setDeletionFeedback({
        text: 'Por favor, marque a caixa confirmando a desassociação das contribuições para prosseguir.',
        type: 'error',
      });
      return;
    }
    setIsSubmittingDeletion(true);
    setDeletionFeedback(null);
    try {
      const res = await StorageService.createLgpdDeletionRequest(user, deletionReasonInput);
      if (res.success && res.request) {
        setDeletionRequest(res.request);
        setShowDeletionForm(false);
        setDeletionFeedback({ text: res.message, type: 'success' });
        if (onRefreshNotifications) onRefreshNotifications();
      } else {
        setDeletionFeedback({ text: res.message, type: 'error' });
      }
    } catch (e: any) {
      setDeletionFeedback({ text: e.message || 'Erro ao registrar solicitação.', type: 'error' });
    } finally {
      setIsSubmittingDeletion(false);
    }
  };

  const handleCancelDeletionRequest = async () => {
    if (!deletionRequest || !user?.uid) return;
    if (confirm('Deseja realmente cancelar sua solicitação de exclusão de conta?')) {
      const res = await StorageService.cancelLgpdDeletionRequest(deletionRequest.id, user.uid);
      if (res.success) {
        setDeletionRequest((prev) => (prev ? { ...prev, status: 'cancelada' } : null));
        setDeletionFeedback({ text: 'Solicitação cancelada com sucesso.', type: 'success' });
      } else {
        setDeletionFeedback({ text: res.message, type: 'error' });
      }
    }
  };

  const ageInfo = StorageService.getUserAgeInfo();

  const exportData = {
    titular: user || { modo: 'Convidado / Anônimo' },
    verificacaoIdade: {
      idadeVerificada: ageInfo.isAccepted,
      faixaEtariaPermitida: ageInfo.age > 14 ? 'Maior de 14 anos (Conforme)' : 'Pendente / Não confirmada',
      idadeCalculada: ageInfo.age || undefined,
      dataNascimentoRegistrada: ageInfo.birthdate || undefined,
      baseLegal: 'Art. 14 da LGPD (Lei nº 13.709/2018)',
    },
    consentimentoCookies: consent || { status: 'padrão' },
    preferenciasNotificacaoLgpd: notifPrefs,
    direitosGarantidos: [
      'Art. 18, I - Confirmação da existência de tratamento',
      'Art. 18, II - Acesso aos dados',
      'Art. 18, III - Correção de dados incompletos',
      'Art. 18, IV - Anonimização, bloqueio ou eliminação',
      'Art. 18, V - Portabilidade dos dados',
      'Art. 18, VI - Eliminação dos dados pessoais',
      'Art. 18, IX - Revogação do consentimento',
    ],
    dpoResponsavel: {
      nome: 'Encarregado WikiWorldWeb',
      email: 'pedrohenriquecardonaperes@gmail.com',
      marcoLegal: 'Marco Civil (Lei 12.965/2014) & LGPD (Lei 13.709/2018)',
    },
    dataExportacao: new Date().toISOString(),
  };

  const handleTogglePref = (key: keyof LgpdNotificationPreferences) => {
    const updated = {
      ...notifPrefs,
      [key]: !notifPrefs[key],
    };
    setNotifPrefs(updated);
    StorageService.saveLgpdNotificationPreferences(updated);
    setSaveFeedback('Preferências de notificação salvas.');
    setTimeout(() => setSaveFeedback(null), 2500);
  };

  const handleTestNotification = () => {
    StorageService.sendLgpdNotification(
      'Configuração LGPD Confirmada',
      'Suas preferências de notificações da LGPD foram atualizadas e este teste confirma o recebimento na central de alertas.',
      'notifyOnPrivacyUpdate',
      'success'
    );
    if (onRefreshNotifications) {
      onRefreshNotifications();
    }
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `wikizero-dados-${user?.uid || 'titular'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    if (notifPrefs.notifyOnDataPortability) {
      StorageService.sendLgpdNotification(
        'Relatório de Portabilidade Exportado',
        'Arquivo JSON com dados completos de titularidade e consentimento baixado conforme Art. 18, V da LGPD.',
        'notifyOnDataPortability',
        'info'
      );
      if (onRefreshNotifications) onRefreshNotifications();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 select-none font-sans">
      <div className="max-w-lg w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg shadow-2xl overflow-hidden animate-in zoom-in-95 text-xs flex flex-col">
        {/* Modal Header */}
        <div className="bg-[#1e293b] p-3 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2 font-mono">
            <ShieldCheck size={18} className="text-emerald-400" />
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider">
                Painel do Titular de Dados & LGPD
              </h3>
              <p className="text-[10px] text-slate-400 font-sans">
                Portabilidade, Direitos do Titular e Notificações Oficiais
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded hover:bg-slate-800 transition cursor-pointer"
            title="Fechar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-800/60 px-3 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('titular')}
            className={`pb-2 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
              activeTab === 'titular'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 bg-white/70 dark:bg-slate-900/70 rounded-t'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <UserCheck size={14} />
            <span>Titular & Portabilidade</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`pb-2 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
              activeTab === 'notifications'
                ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400 bg-white/70 dark:bg-slate-900/70 rounded-t'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Bell size={14} />
            <span>Configurar Notificações LGPD</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-3.5 text-slate-700 dark:text-slate-300 max-h-[62vh] overflow-y-auto">
          {activeTab === 'titular' && (
            <>
              {user ? (
                <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded border border-slate-200 dark:border-slate-700 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-700/60 pb-1">
                    <span className="text-slate-500">Nome:</span>
                    <span className="font-bold text-slate-900 dark:text-white font-sans">{user.displayName}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-700/60 pb-1">
                    <span className="text-slate-500">E-mail:</span>
                    <span className="text-slate-900 dark:text-white truncate max-w-[200px]">{user.email}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-700/60 pb-1">
                    <span className="text-slate-500">UID:</span>
                    <span className="text-blue-600 dark:text-blue-400 truncate max-w-[200px]">{user.uid}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-700/60 pb-1">
                    <span className="text-slate-500">Perfil:</span>
                    <span className="uppercase text-slate-900 dark:text-white font-bold">{user.role}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Faixa Etária (LGPD Art. 14):</span>
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 font-sans">
                      <CheckCircle2 size={12} />
                      {ageInfo.age > 0 ? `${ageInfo.age} anos (> 14 anos - Aprovado)` : 'Idade Verificada (> 14 anos)'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center font-mono text-[11px]">
                    <span className="text-slate-500">Modo de Navegação:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">Visitante / Anônimo</span>
                  </div>
                  <div className="flex justify-between items-center font-mono text-[11px]">
                    <span className="text-slate-500">Verificação de Idade:</span>
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 font-sans">
                      <CheckCircle2 size={12} />
                      {ageInfo.age > 0 ? `${ageInfo.age} anos (> 14 anos)` : 'Maior que 14 anos'}
                    </span>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-950/40 p-3 rounded border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200">
                <h4 className="font-bold font-mono text-[11px] uppercase mb-0.5 flex items-center gap-1.5">
                  <Download size={13} />
                  <span>Portabilidade de Dados (Art. 18, V)</span>
                </h4>
                <p className="text-[11px]">
                  Baixe uma cópia integral legível por máquina contendo todos os dados, metadados e configurações de privacidade vinculados à sua identidade.
                </p>
              </div>

              <div className="bg-purple-50 dark:bg-purple-950/40 p-3 rounded border border-purple-200 dark:border-purple-800 text-xs text-purple-900 dark:text-purple-200">
                <h4 className="font-bold font-mono text-[11px] uppercase mb-0.5 flex items-center gap-1.5">
                  <Info size={13} />
                  <span>Retificação de Nome (Art. 18, III)</span>
                </h4>
                <p className="text-[11px] leading-relaxed">
                  Para conformidade com a LGPD e o Marco Civil da Internet, a alteração e retificação cadastral de nome de usuário é realizada exclusivamente por um <strong>Administrador</strong>, garantindo a integridade dos registros e a cadeia de autoria dos verbetes.
                </p>
              </div>

              {/* Mensagem de Feedback de Exclusão */}
              {deletionFeedback && (
                <div
                  className={`p-2.5 rounded border text-xs flex items-start gap-2 animate-in fade-in duration-200 ${
                    deletionFeedback.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                      : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-800 dark:text-red-200'
                  }`}
                >
                  {deletionFeedback.type === 'success' ? (
                    <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                  ) : (
                    <AlertTriangle size={15} className="text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1">
                    <span>{deletionFeedback.text}</span>
                  </div>
                  <button
                    onClick={() => setDeletionFeedback(null)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-[10px]"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Card de Solicitação de Exclusão Pendente */}
              {deletionRequest && deletionRequest.status === 'pendente' && (
                <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-lg border border-amber-300 dark:border-amber-700/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 dark:bg-amber-900/70 dark:text-amber-200 uppercase tracking-wide">
                      <Clock size={11} />
                      Solicitação Pendente de Execução pelo Administrador
                    </span>
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 font-mono">
                      {new Date(deletionRequest.requestedAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <p className="text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed">
                    Sua solicitação de eliminação definitiva (Art. 18, VI da LGPD) foi protocolada sob o protocolo{' '}
                    <strong className="font-mono text-amber-950 dark:text-amber-100">{deletionRequest.id}</strong>.
                    Quando homologada pelo Administrador, todos os seus dados pessoais serão expurgados, o seu UID
                    Google será conservado preventivamente, e a autoria das suas contribuições receberá um identificador
                    genérico.
                  </p>

                  {deletionRequest.userReason && (
                    <div className="text-[10px] bg-white/70 dark:bg-slate-900/60 p-2 rounded border border-amber-200 dark:border-amber-800 text-slate-700 dark:text-slate-300">
                      <strong>Motivo informado:</strong> {deletionRequest.userReason}
                    </div>
                  )}

                  <div className="pt-1 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={handleCancelDeletionRequest}
                      className="px-2.5 py-1 text-[11px] font-semibold text-amber-800 dark:text-amber-300 hover:text-red-700 dark:hover:text-red-400 bg-amber-100/80 dark:bg-amber-900/40 hover:bg-amber-200 rounded transition cursor-pointer flex items-center gap-1"
                    >
                      <RotateCcw size={12} />
                      <span>Cancelar Solicitação</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Formulário de Solicitação Formal de Exclusão */}
              {showDeletionForm ? (
                <div className="bg-red-50 dark:bg-red-950/40 p-3.5 rounded-lg border border-red-300 dark:border-red-800 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-300 font-bold text-xs uppercase tracking-wide">
                    <ShieldAlert size={16} />
                    <span>Solicitar Exclusão Definitiva de Conta (LGPD Art. 18, VI)</span>
                  </div>

                  <div className="space-y-1.5 text-[11px] text-red-900 dark:text-red-200 bg-white/60 dark:bg-slate-900/60 p-2.5 rounded border border-red-200 dark:border-red-900">
                    <p className="font-semibold text-red-950 dark:text-red-100">
                      Entenda as etapas e garantias do procedimento administrativo:
                    </p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>
                        <strong>Exclusão de Dados Pessoais:</strong> Nome, e-mail, biografia, foto de perfil e dados
                        cadastrais serão eliminados permanentemente da plataforma.
                      </li>
                      <li>
                        <strong>Preservação Exclusiva do UID Google:</strong> Apenas o seu identificador Google UID (
                        <code className="text-[10px] bg-red-100 dark:bg-red-900/50 px-1 py-0.5 rounded font-mono">
                          {user?.uid}
                        </code>
                        ) será retido para identificar preventivamente caso você tente criar outra conta no futuro.
                      </li>
                      <li>
                        <strong>Anonimização das Contribuições:</strong> Seus verbetes e edições permanecerão no
                        patrimônio de conhecimento livre, mas o nome do autor será retroativamente substituído pelo seu{' '}
                        <strong>UID Google</strong> (<code className="text-[10px] bg-red-100 dark:bg-red-900/50 px-1 py-0.5 rounded font-mono">{user?.uid}</code>),
                        eliminando qualquer associação ao seu nome real ou e-mail.
                      </li>
                    </ul>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Observações / Justificativa do Titular:
                    </label>
                    <textarea
                      value={deletionReasonInput}
                      onChange={(e) => setDeletionReasonInput(e.target.value)}
                      rows={2}
                      className="w-full p-2 text-xs rounded border border-red-300 dark:border-red-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-red-500 focus:outline-hidden"
                      placeholder="Descreva observações ou fundamento da solicitação de exclusão..."
                    />
                  </div>

                  <label className="flex items-start gap-2 cursor-pointer text-[11px] text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={deletionConfirmedCheckbox}
                      onChange={(e) => setDeletionConfirmedCheckbox(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-red-600 focus:ring-red-500"
                    />
                    <span>
                      Declaro que compreendo que a exclusão é definitiva e autorizo expressamente a substituição da
                      autoria em todas as minhas contribuições pelo meu UID Google.
                    </span>
                  </label>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowDeletionForm(false)}
                      disabled={isSubmittingDeletion}
                      className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmitDeletionRequest}
                      disabled={isSubmittingDeletion || !deletionConfirmedCheckbox}
                      className={`px-3 py-1.5 rounded text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition ${
                        isSubmittingDeletion || !deletionConfirmedCheckbox
                          ? 'bg-red-400 opacity-60 cursor-not-allowed'
                          : 'bg-red-600 hover:bg-red-700'
                      }`}
                    >
                      <Trash2 size={13} />
                      <span>{isSubmittingDeletion ? 'Enviando...' : 'Enviar Solicitação para a Administração'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-1 flex flex-col gap-1.5">
                  <button
                    onClick={handleDownloadJson}
                    className="w-full py-2 px-3 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <Download size={14} />
                    <span>Exportar Arquivo Completo (JSON)</span>
                  </button>

                  <button
                    onClick={onRevokeConsent}
                    className="w-full py-2 px-3 rounded bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <RotateCcw size={14} />
                    <span>Revogar Consentimento de Cookies</span>
                  </button>

                  {user && !user.isGuest ? (
                    <button
                      onClick={() => setShowDeletionForm(true)}
                      className="w-full py-2 px-3 rounded bg-red-600 hover:bg-red-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Trash2 size={14} />
                      <span>Solicitar Exclusão da Conta (Art. 18, VI)</span>
                    </button>
                  ) : (
                    <div className="p-2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 text-center text-[10px]">
                      A exclusão de conta está disponível para usuários registrados e autenticados via Google.
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-3.5">
              <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-lg border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
                <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                <div className="text-[11px] space-y-1 leading-relaxed">
                  <span className="font-bold block text-xs">Configuração de Alertas e Notificações da LGPD</span>
                  <p>
                    Controle exatamente quais eventos de privacidade, consentimento e segurança do Marco Civil disparam avisos oficiais no sino de notificações do seu aplicativo.
                  </p>
                </div>
              </div>

              {saveFeedback && (
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 rounded flex items-center gap-1.5 text-xs animate-in fade-in duration-200">
                  <Check size={13} className="text-emerald-600 dark:text-emerald-400" />
                  <span>{saveFeedback}</span>
                </div>
              )}

              {/* Toggles List */}
              <div className="space-y-2">
                {/* 1. Terms and Age */}
                <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-between gap-3">
                  <div className="pr-2">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-100 block">
                      Validação de Termos e Idade (Art. 14)
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-snug">
                      Notificar quando a confirmação de maioridade (&gt; 14 anos) e aceite dos termos LGPD forem validados.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTogglePref('notifyOnTermsAccepted')}
                    className={`w-10 h-6 flex items-center rounded-full p-1 transition duration-200 cursor-pointer flex-shrink-0 ${
                      notifPrefs.notifyOnTermsAccepted ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                    aria-label="Alternar notificação de termos"
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                        notifPrefs.notifyOnTermsAccepted ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 2. Privacy Policy Updates & Revocation */}
                <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-between gap-3">
                  <div className="pr-2">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-100 block">
                      Políticas de Privacidade & Revogações
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-snug">
                      Notificar quando você revogar cookies ou quando houver atualizações na política de privacidade.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTogglePref('notifyOnPrivacyUpdate')}
                    className={`w-10 h-6 flex items-center rounded-full p-1 transition duration-200 cursor-pointer flex-shrink-0 ${
                      notifPrefs.notifyOnPrivacyUpdate ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                    aria-label="Alternar notificação de privacidade"
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                        notifPrefs.notifyOnPrivacyUpdate ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 3. Data Portability */}
                <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-between gap-3">
                  <div className="pr-2">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-100 block">
                      Portabilidade de Dados (Art. 18, V)
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-snug">
                      Registrar notificação no sininho ao solicitar ou concluir o download do arquivo de dados em JSON.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTogglePref('notifyOnDataPortability')}
                    className={`w-10 h-6 flex items-center rounded-full p-1 transition duration-200 cursor-pointer flex-shrink-0 ${
                      notifPrefs.notifyOnDataPortability ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                    aria-label="Alternar notificação de portabilidade"
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                        notifPrefs.notifyOnDataPortability ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 4. Account Changes */}
                <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-between gap-3">
                  <div className="pr-2">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-100 block">
                      Alterações Cadastrais & Perfil
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5 leading-snug">
                      Alertar sobre requisições de retificação de dados cadastrais, alteração de permissão ou exclusão de conta.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTogglePref('notifyOnAccountChanges')}
                    className={`w-10 h-6 flex items-center rounded-full p-1 transition duration-200 cursor-pointer flex-shrink-0 ${
                      notifPrefs.notifyOnAccountChanges ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                    aria-label="Alternar notificação de alterações cadastrais"
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                        notifPrefs.notifyOnAccountChanges ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Action buttons in notifications tab */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleTestNotification}
                  disabled={testSent}
                  className="flex-1 py-2 px-3 rounded bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <Send size={13} />
                  <span>{testSent ? 'Notificação Enviada!' : 'Enviar Notificação LGPD de Teste'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const defaults = {
                      notifyOnTermsAccepted: true,
                      notifyOnPrivacyUpdate: true,
                      notifyOnDataPortability: true,
                      notifyOnAccountChanges: true,
                    };
                    setNotifPrefs(defaults);
                    StorageService.saveLgpdNotificationPreferences(defaults);
                    setSaveFeedback('Configurações redefinidas para o padrão da LGPD.');
                    setTimeout(() => setSaveFeedback(null), 2500);
                  }}
                  className="py-2 px-3 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>Restaurar Padrões</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
            Lei nº 13.709/2018 (LGPD) • Encarregado DPO
          </span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

