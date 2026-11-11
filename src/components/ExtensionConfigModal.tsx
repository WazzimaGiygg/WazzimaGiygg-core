import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  ShieldCheck,
  Check,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  Lock,
  Globe,
  LifeBuoy,
  Power,
  FileCode,
  Save,
  Info
} from 'lucide-react';
import { WikiExtension } from '../data/notMediaWikiData';

interface ExtensionConfigModalProps {
  isOpen: boolean;
  extension: WikiExtension | null;
  onClose: () => void;
  onSaveConfig: (extensionId: string, newConfig: Record<string, any>, updatedMetadata?: Partial<WikiExtension>) => Promise<boolean>;
  isBureaucrat: boolean;
  currentUserEmail?: string;
}

export default function ExtensionConfigModal({
  isOpen,
  extension,
  onClose,
  onSaveConfig,
  isBureaucrat,
  currentUserEmail
}: ExtensionConfigModalProps) {
  if (!isOpen || !extension) return null;

  // Local state for configuration
  const [config, setConfig] = useState<Record<string, any>>(extension.config || {});
  const [namePt, setNamePt] = useState(extension.namePt || extension.name);
  const [description, setDescription] = useState(extension.description || '');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; isError: boolean } | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'config' | 'code' | 'metadata'>('config');
  const [fileCode, setFileCode] = useState<string>(extension.files?.[0]?.content || '');

  useEffect(() => {
    if (extension) {
      setConfig(extension.config || {});
      setNamePt(extension.namePt || extension.name);
      setDescription(extension.description || '');
      setFileCode(extension.files?.[0]?.content || '');
      setFeedback(null);
    }
  }, [extension]);

  const handleConfigChange = (key: string, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleRestoreDefaults = () => {
    if (extension.id === 'ext-support-tickets') {
      setConfig({
        supportUrl: 'https://support.wazzimagiygg.com/',
        openMode: 'redirect',
        buttonLabel: 'Suporte & Tickets WZZM',
        openInNewTab: true
      });
      setFeedback({ message: 'Valores padrão do Suporte & Tickets restaurados.', isError: false });
    } else if (extension.id === 'ext-external-redirector') {
      setConfig({
        enabled: true,
        redirectBaseUrl: 'https://wazzimagiygg.com/rv/?uid=',
        appendUid: true,
        showNoticeModal: true,
        whitelistDomains: [
          'wazzimagiygg.com',
          'notmediawiki.wazzimagiygg.com',
          'bemtevi.wazzimagiygg.com',
          'support.wazzimagiygg.com'
        ]
      });
      setFeedback({ message: 'Valores padrão do Redirecionador restaurados.', isError: false });
    } else if (extension.id === 'ext-maintenance-mode') {
      setConfig({
        isMaintenanceActive: false,
        maintenanceMessage: 'O portal WazzimaGiygg encontra-se em manutenção programada para atualização de infraestrutura, auditoria forense e sincronização de dados.',
        estimatedReturn: 'Retorno previsto em breve',
        allowedBurocrataEmail: 'pedrohenriquecardonaperes@gmail.com'
      });
      setFeedback({ message: 'Valores padrão do Modo de Manutenção restaurados.', isError: false });
    } else {
      setFeedback({ message: 'Configuração genérica redefinida.', isError: false });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBureaucrat) {
      setFeedback({
        message: 'Apenas o Burocrata oficial (pedrohenriquecardonaperes@gmail.com) tem permissão para alterar configurações.',
        isError: true
      });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      const updatedMetadata: Partial<WikiExtension> = {
        namePt,
        description
      };

      if (activeSubTab === 'code' && fileCode) {
        updatedMetadata.files = [
          {
            name: extension.files?.[0]?.name || 'index.ts',
            size: fileCode.length,
            sha256: '', // Will be calculated by server
            content: fileCode,
            mimeType: 'application/typescript'
          }
        ];
      }

      const success = await onSaveConfig(extension.id, config, updatedMetadata);
      if (success) {
        setFeedback({ message: '✓ Configurações salvas e assinadas criptograficamente com sucesso!', isError: false });
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setFeedback({ message: 'Erro ao salvar configurações no servidor.', isError: true });
      }
    } catch (err: any) {
      setFeedback({ message: err?.message || 'Erro inesperado ao salvar.', isError: true });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FAF9F5] border-4 border-[#141414] max-w-2xl w-full max-h-[90vh] flex flex-col shadow-[10px_10px_0px_0px_rgba(20,20,20,1)]">
        {/* Header */}
        <div className="bg-[#141414] text-white p-4 flex items-center justify-between border-b-2 border-stone-800">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-amber-400" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-editorial text-lg font-bold tracking-tight">
                  Configurações da Extensão: {extension.namePt || extension.name}
                </h3>
                <span className="bg-stone-800 text-stone-300 font-mono text-[10px] px-2 py-0.5 border border-stone-700">
                  {extension.id}
                </span>
              </div>
              <p className="text-[11px] font-mono text-stone-400">
                Dispositivo de Governança de Extensões (3.05.3.a)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-stone-800 text-stone-300 hover:text-white transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-tab navigation */}
        <div className="bg-stone-200 border-b-2 border-[#141414] px-4 pt-2 flex items-center gap-1 font-mono text-xs">
          <button
            onClick={() => setActiveSubTab('config')}
            className={`px-3 py-1.5 font-bold border-t-2 border-x-2 border-[#141414] -mb-[2px] transition-colors ${
              activeSubTab === 'config' ? 'bg-[#FAF9F5] text-stone-950' : 'bg-stone-300 text-stone-600 hover:bg-stone-200'
            }`}
          >
            ⚙️ Parâmetros Operacionais
          </button>
          <button
            onClick={() => setActiveSubTab('metadata')}
            className={`px-3 py-1.5 font-bold border-t-2 border-x-2 border-[#141414] -mb-[2px] transition-colors ${
              activeSubTab === 'metadata' ? 'bg-[#FAF9F5] text-stone-950' : 'bg-stone-300 text-stone-600 hover:bg-stone-200'
            }`}
          >
            📝 Metadados & Título
          </button>
          <button
            onClick={() => setActiveSubTab('code')}
            className={`px-3 py-1.5 font-bold border-t-2 border-x-2 border-[#141414] -mb-[2px] transition-colors ${
              activeSubTab === 'code' ? 'bg-[#FAF9F5] text-stone-950' : 'bg-stone-300 text-stone-600 hover:bg-stone-200'
            }`}
          >
            💻 Código TypeScript ({extension.files?.[0]?.name || 'index.ts'})
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Bureaucrat Permission Notice */}
          {!isBureaucrat && (
            <div className="p-3 bg-amber-50 border-2 border-amber-600 font-mono text-xs text-amber-900 flex items-start gap-2 shadow-[2px_2px_0px_0px_rgba(217,119,6,1)]">
              <Lock className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Modo Somente Leitura:</strong> Apenas o Burocrata oficial autenticado (
                <code className="bg-amber-100 px-1 py-0.5">pedrohenriquecardonaperes@gmail.com</code>) possui autorização
                para salvar alterações e atualizar o hash criptográfico desta extensão.
              </div>
            </div>
          )}

          {/* Feedback Banner */}
          {feedback && (
            <div
              className={`p-3 border-2 font-mono text-xs flex items-center justify-between ${
                feedback.isError
                  ? 'bg-red-50 border-red-600 text-red-950 shadow-[2px_2px_0px_0px_rgba(220,38,38,1)]'
                  : 'bg-emerald-50 border-emerald-600 text-emerald-950 shadow-[2px_2px_0px_0px_rgba(5,150,105,1)]'
              }`}
            >
              <div className="flex items-center gap-2">
                {feedback.isError ? <AlertTriangle className="w-4 h-4 text-red-700" /> : <Check className="w-4 h-4 text-emerald-700" />}
                <span>{feedback.message}</span>
              </div>
              <button onClick={() => setFeedback(null)} className="text-stone-500 hover:text-stone-900">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* TAB 1: OPERATIONAL CONFIG */}
          {activeSubTab === 'config' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* SPECIAL CASE 1: SUPPORT & TICKETS (3.05.3.b) */}
              {extension.id === 'ext-support-tickets' && (
                <div className="space-y-4">
                  <div className="p-4 bg-sky-50 border-2 border-sky-600 shadow-[3px_3px_0px_0px_rgba(2,132,199,1)]">
                    <div className="flex items-center gap-2 text-sky-950 font-bold text-sm mb-1">
                      <LifeBuoy className="w-4 h-4 text-sky-700" />
                      <span>Extensão de Suporte e Tickets (3.05.3.b)</span>
                    </div>
                    <p className="text-xs text-sky-900 leading-relaxed font-serif">
                      Transforma a funcionalidade de Suporte e Tickets em extensão configurável. Permite alterar o link do suporte
                      externo (o padrão é <code className="bg-sky-100 font-mono font-bold px-1">https://support.wazzimagiygg.com/</code>)
                      ou chavear para atendimento interno.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-stone-800 mb-1">
                      Link Oficial do Suporte (supportUrl):
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={config.supportUrl ?? 'https://support.wazzimagiygg.com/'}
                        onChange={(e) => handleConfigChange('supportUrl', e.target.value)}
                        placeholder="https://support.wazzimagiygg.com/"
                        disabled={!isBureaucrat}
                        className="flex-1 px-3 py-2 border-2 border-[#141414] font-mono text-xs bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <a
                        href={config.supportUrl || 'https://support.wazzimagiygg.com/'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 bg-stone-200 hover:bg-stone-300 border-2 border-stone-800 text-stone-900 text-xs font-mono font-bold flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        title="Testar Link de Suporte"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Testar
                      </a>
                    </div>
                    <span className="text-[10px] font-mono text-stone-500 mt-1 block">
                      URL padrão regulamentar: <strong>https://support.wazzimagiygg.com/</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-mono font-bold uppercase tracking-wider text-stone-800 mb-1">
                        Modo de Abertura:
                      </label>
                      <select
                        value={config.openMode ?? 'redirect'}
                        onChange={(e) => handleConfigChange('openMode', e.target.value)}
                        disabled={!isBureaucrat}
                        className="w-full px-3 py-2 border-2 border-[#141414] font-mono text-xs bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      >
                        <option value="redirect">Redirecionamento para URL configurada (Padrão)</option>
                        <option value="internal">Aba Interna de Ouvidoria & Tickets</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-bold uppercase tracking-wider text-stone-800 mb-1">
                        Rótulo do Botão / Aba:
                      </label>
                      <input
                        type="text"
                        value={config.buttonLabel ?? 'Suporte & Tickets WZZM'}
                        onChange={(e) => handleConfigChange('buttonLabel', e.target.value)}
                        disabled={!isBureaucrat}
                        className="w-full px-3 py-2 border-2 border-[#141414] font-mono text-xs bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-stone-100 border border-stone-300">
                    <input
                      type="checkbox"
                      id="openInNewTabCheck"
                      checked={config.openInNewTab ?? true}
                      onChange={(e) => handleConfigChange('openInNewTab', e.target.checked)}
                      disabled={!isBureaucrat}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-stone-400 rounded"
                    />
                    <label htmlFor="openInNewTabCheck" className="text-xs font-mono text-stone-800 cursor-pointer">
                      Abrir link de suporte em uma nova aba do navegador (<code className="font-bold">_blank</code>)
                    </label>
                  </div>
                </div>
              )}

              {/* SPECIAL CASE 2: EXTERNAL REDIRECTOR (3.05.3.c) */}
              {extension.id === 'ext-external-redirector' && (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 border-2 border-amber-600 shadow-[3px_3px_0px_0px_rgba(217,119,6,1)]">
                    <div className="flex items-center gap-2 text-amber-950 font-bold text-sm mb-1">
                      <Globe className="w-4 h-4 text-amber-700" />
                      <span>Extensão Redirecionador de Links Externos com UID (3.05.3.c)</span>
                    </div>
                    <p className="text-xs text-amber-900 leading-relaxed font-serif">
                      Transforma o redirecionamento de links externos em extensão oficial. Permite desativar o redirecionador
                      ou alterar o link do UID redirecionador (padrão:{' '}
                      <code className="bg-amber-100 font-mono font-bold px-1">https://wazzimagiygg.com/rv/?uid=</code>).
                    </p>
                  </div>

                  <div className="p-4 bg-white border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
                    <div>
                      <div className="font-mono text-xs font-bold text-stone-950 uppercase flex items-center gap-2">
                        <Power className={`w-4 h-4 ${config.enabled ? 'text-emerald-600' : 'text-red-500'}`} />
                        Status do Redirecionador:
                      </div>
                      <p className="text-[11px] font-mono text-stone-600 mt-0.5">
                        {config.enabled
                          ? 'Ativo: Todos os links externos passam pelo UID Redirecionador.'
                          : 'Desativado: Links externos abrem diretamente no navegador sem passar por rv/?uid='}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleConfigChange('enabled', !config.enabled)}
                      disabled={!isBureaucrat}
                      className={`px-4 py-2 font-mono text-xs font-bold uppercase border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer transition-colors ${
                        config.enabled
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      {config.enabled ? '✓ ATIVADO' : '✕ DESATIVADO'}
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-stone-800 mb-1">
                      Link do UID Redirecionador (redirectBaseUrl):
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={config.redirectBaseUrl ?? 'https://wazzimagiygg.com/rv/?uid='}
                        onChange={(e) => handleConfigChange('redirectBaseUrl', e.target.value)}
                        placeholder="https://wazzimagiygg.com/rv/?uid="
                        disabled={!isBureaucrat}
                        className="flex-1 px-3 py-2 border-2 border-[#141414] font-mono text-xs bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const base = config.redirectBaseUrl || 'https://wazzimagiygg.com/rv/?uid=';
                          const testUrl = `${base}usr_pedro_cardona_official&dest=${encodeURIComponent('https://example.org')}`;
                          window.open(testUrl, '_blank');
                        }}
                        className="px-3 py-2 bg-stone-200 hover:bg-stone-300 border-2 border-stone-800 text-stone-900 text-xs font-mono font-bold flex items-center gap-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer"
                        title="Simular Redirecionamento com UID"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Testar
                      </button>
                    </div>
                    <span className="text-[10px] font-mono text-stone-500 mt-1 block">
                      URL padrão regulamentar: <strong>https://wazzimagiygg.com/rv/?uid=</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center gap-2 p-3 bg-stone-100 border border-stone-300">
                      <input
                        type="checkbox"
                        id="appendUidCheck"
                        checked={config.appendUid ?? true}
                        onChange={(e) => handleConfigChange('appendUid', e.target.checked)}
                        disabled={!isBureaucrat}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-stone-400 rounded"
                      />
                      <label htmlFor="appendUidCheck" className="text-xs font-mono text-stone-800 cursor-pointer">
                        Anexar UID do visitante ao redirecionar
                      </label>
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-stone-100 border border-stone-300">
                      <input
                        type="checkbox"
                        id="showNoticeModalCheck"
                        checked={config.showNoticeModal ?? true}
                        onChange={(e) => handleConfigChange('showNoticeModal', e.target.checked)}
                        disabled={!isBureaucrat}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-stone-400 rounded"
                      />
                      <label htmlFor="showNoticeModalCheck" className="text-xs font-mono text-stone-800 cursor-pointer">
                        Exibir aviso de segurança antes de sair
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-stone-800 mb-1">
                      Domínios Isentos de Redirecionamento (Whitelist - separados por vírgula):
                    </label>
                    <textarea
                      rows={2}
                      value={Array.isArray(config.whitelistDomains) ? config.whitelistDomains.join(', ') : (config.whitelistDomains || '')}
                      onChange={(e) =>
                        handleConfigChange(
                          'whitelistDomains',
                          e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                        )
                      }
                      disabled={!isBureaucrat}
                      className="w-full px-3 py-2 border-2 border-[#141414] font-mono text-xs bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      placeholder="wazzimagiygg.com, notmediawiki.wazzimagiygg.com, bemtevi.wazzimagiygg.com, support.wazzimagiygg.com"
                    />
                  </div>
                </div>
              )}

              {/* SPECIAL CASE 3: MAINTENANCE MODE (3.05.3.e) */}
              {extension.id === 'ext-maintenance-mode' && (
                <div className="space-y-4">
                  <div className="p-4 bg-rose-50 border-2 border-rose-600 shadow-[3px_3px_0px_0px_rgba(225,29,72,1)]">
                    <div className="flex items-center gap-2 text-rose-950 font-bold text-sm mb-1">
                      <Lock className="w-4 h-4 text-rose-700" />
                      <span>Extensão Modo de Manutenção do Sistema (3.05.3.e)</span>
                    </div>
                    <p className="text-xs text-rose-900 leading-relaxed font-serif">
                      Define quando o site está em manutenção. Quando ativo, apenas o Burocrata oficial (
                      <code className="bg-rose-100 font-mono font-bold px-1">pedrohenriquecardonaperes@gmail.com</code>)
                      pode acessar às configurações do Site via autenticação Google. Todos os outros usuários veem a tela de manutenção.
                    </p>
                  </div>

                  <div className="p-4 bg-white border-2 border-stone-800 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between">
                    <div>
                      <div className="font-mono text-xs font-bold text-stone-950 uppercase flex items-center gap-2">
                        <Power className={`w-4 h-4 ${config.isMaintenanceActive ? 'text-rose-600' : 'text-stone-400'}`} />
                        Estado da Manutenção do Portal:
                      </div>
                      <p className="text-[11px] font-mono text-stone-600 mt-0.5">
                        {config.isMaintenanceActive
                          ? '⚠️ ATIVO: Apenas o Burocrata com login Google pode navegar e gerenciar o site.'
                          : '✓ INATIVO: Portal público acessível normalmente a todos os usuários.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleConfigChange('isMaintenanceActive', !config.isMaintenanceActive)}
                      disabled={!isBureaucrat}
                      className={`px-4 py-2 font-mono text-xs font-bold uppercase border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer transition-colors ${
                        config.isMaintenanceActive
                          ? 'bg-rose-600 text-white hover:bg-rose-700 animate-pulse'
                          : 'bg-stone-300 text-stone-800 hover:bg-stone-400'
                      }`}
                    >
                      {config.isMaintenanceActive ? '🔴 MANUTENÇÃO ATIVA' : '⚪ DESATIVADA'}
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-mono font-bold uppercase tracking-wider text-stone-800 mb-1">
                      Mensagem Pública de Manutenção:
                    </label>
                    <textarea
                      rows={3}
                      value={
                        config.maintenanceMessage ??
                        'O portal WazzimaGiygg encontra-se em manutenção programada para atualização de infraestrutura, auditoria forense e sincronização de dados.'
                      }
                      onChange={(e) => handleConfigChange('maintenanceMessage', e.target.value)}
                      disabled={!isBureaucrat}
                      className="w-full px-3 py-2 border-2 border-[#141414] font-mono text-xs bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                      placeholder="Mensagem exibida aos visitantes durante a manutenção..."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-mono font-bold uppercase tracking-wider text-stone-800 mb-1">
                        Previsão Estimada de Retorno:
                      </label>
                      <input
                        type="text"
                        value={config.estimatedReturn ?? 'Retorno previsto em breve'}
                        onChange={(e) => handleConfigChange('estimatedReturn', e.target.value)}
                        disabled={!isBureaucrat}
                        className="w-full px-3 py-2 border-2 border-[#141414] font-mono text-xs bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        placeholder="Ex: 2 horas, Hoje às 18h..."
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-bold uppercase tracking-wider text-stone-800 mb-1">
                        Burocrata Autorizado (Google Auth):
                      </label>
                      <input
                        type="text"
                        value="pedrohenriquecardonaperes@gmail.com"
                        readOnly
                        className="w-full px-3 py-2 border-2 border-stone-300 font-mono text-xs bg-stone-100 text-stone-600 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* GENERIC EXTENSION CONFIG (VisualEditor, Math, Cite, Parsoid, etc.) */}
              {extension.id !== 'ext-support-tickets' &&
                extension.id !== 'ext-external-redirector' &&
                extension.id !== 'ext-maintenance-mode' && (
                  <div className="space-y-4">
                    <div className="p-3 bg-stone-100 border border-stone-300 font-mono text-xs text-stone-700">
                      Edição dos parâmetros JSON para a extensão <strong>{extension.name}</strong>.
                    </div>
                    <div>
                      <label className="block text-xs font-mono font-bold uppercase tracking-wider text-stone-800 mb-1">
                        Objeto de Configuração (JSON):
                      </label>
                      <textarea
                        rows={8}
                        value={JSON.stringify(config, null, 2)}
                        onChange={(e) => {
                          try {
                            const parsed = JSON.parse(e.target.value);
                            setConfig(parsed);
                          } catch {
                            // Let user type
                          }
                        }}
                        disabled={!isBureaucrat}
                        className="w-full px-3 py-2 border-2 border-[#141414] font-mono text-xs bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
                      />
                    </div>
                  </div>
                )}
            </form>
          )}

          {/* TAB 2: METADATA & TITLES */}
          {activeSubTab === 'metadata' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-stone-800 mb-1">
                  Título em Português:
                </label>
                <input
                  type="text"
                  value={namePt}
                  onChange={(e) => setNamePt(e.target.value)}
                  disabled={!isBureaucrat}
                  className="w-full px-3 py-2 border-2 border-[#141414] font-mono text-xs bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-stone-800 mb-1">
                  Descrição da Extensão:
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={!isBureaucrat}
                  className="w-full px-3 py-2 border-2 border-[#141414] font-mono text-xs bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                />
              </div>

              <div className="p-3 bg-stone-100 border border-stone-300 font-mono text-xs space-y-1 text-stone-600">
                <div><strong>ID Técnico:</strong> {extension.id}</div>
                <div><strong>Versão:</strong> {extension.version}</div>
                <div><strong>Autor:</strong> {extension.author}</div>
                <div><strong>Categoria:</strong> {extension.category}</div>
                <div><strong>Domínio de Origem:</strong> {extension.originDomain}</div>
              </div>
            </div>
          )}

          {/* TAB 3: CODE VIEW & EDIT */}
          {activeSubTab === 'code' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-stone-800 flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-stone-700" />
                  Arquivo: {extension.files?.[0]?.name || 'index.ts'}
                </span>
                <span className="text-stone-500">
                  {fileCode.length} bytes • {fileCode.split('\n').length} linhas
                </span>
              </div>
              <textarea
                rows={14}
                value={fileCode}
                onChange={(e) => setFileCode(e.target.value)}
                disabled={!isBureaucrat}
                className="w-full p-3 border-2 border-[#141414] font-mono text-[11px] bg-stone-900 text-emerald-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
                spellCheck={false}
              />
              <p className="text-[10px] font-mono text-stone-500">
                A alteração do código fonte aciona automaticamente o analisador estático (Dispositivo 3.05.9.b) e
                recalcula o hash SHA-256 no salvamento.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-stone-100 border-t-2 border-[#141414] p-4 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs">
          <button
            type="button"
            onClick={handleRestoreDefaults}
            disabled={!isBureaucrat || isSaving}
            className="text-stone-600 hover:text-stone-900 font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Restaurar Padrões da Extensão
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold border-2 border-stone-400 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isBureaucrat || isSaving}
              className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 cursor-pointer disabled:opacity-50 active:translate-x-0.5 active:translate-y-0.5"
            >
              <Save className="w-4 h-4 text-amber-400" />
              <span>{isSaving ? 'Salvando & Assinando...' : 'Salvar Configurações'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
