import React, { useState } from 'react';
import {
  X,
  Plus,
  Package,
  ShieldCheck,
  Check,
  AlertTriangle,
  Download,
  Code,
  Lock,
  Layers,
  Sparkles
} from 'lucide-react';
import { WikiExtension, EXISTING_EXTENSIONS_CATALOG } from '../data/notMediaWikiData';

interface AddExtensionCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  installedExtensionIds: string[];
  onAddCatalogExtension: (catalogExtensionId: string) => Promise<boolean>;
  onAddCustomExtension: (customExt: Partial<WikiExtension>) => Promise<boolean>;
  isBureaucrat: boolean;
  currentUserEmail?: string;
}

export default function AddExtensionCatalogModal({
  isOpen,
  onClose,
  installedExtensionIds,
  onAddCatalogExtension,
  onAddCustomExtension,
  isBureaucrat,
  currentUserEmail
}: AddExtensionCatalogModalProps) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'catalog' | 'custom'>('catalog');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; isError: boolean } | null>(null);

  // Custom extension form state
  const [customForm, setCustomForm] = useState({
    id: '',
    name: '',
    namePt: '',
    category: 'parser' as any,
    version: '1.0.0',
    description: '',
    code: `// Custom NotMediaWiki Extension\nexport function execute() {\n  return { success: true };\n}\n`
  });

  const handleInstallFromCatalog = async (extId: string) => {
    if (!isBureaucrat) {
      setFeedback({
        message: 'Apenas o Burocrata oficial (pedrohenriquecardonaperes@gmail.com) pode adicionar extensões.',
        isError: true
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const ok = await onAddCatalogExtension(extId);
      if (ok) {
        setFeedback({ message: '✓ Extensão adicionada com sucesso e verificada pelos dispositivos de segurança!', isError: false });
      } else {
        setFeedback({ message: 'Erro ao instalar extensão do catálogo.', isError: true });
      }
    } catch (err: any) {
      setFeedback({ message: err?.message || 'Erro inesperado.', isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBureaucrat) {
      setFeedback({
        message: 'Apenas o Burocrata oficial (pedrohenriquecardonaperes@gmail.com) pode criar extensões.',
        isError: true
      });
      return;
    }

    if (!customForm.id.trim() || !customForm.name.trim() || !customForm.code.trim()) {
      setFeedback({ message: 'ID, Nome e Código da extensão são obrigatórios.', isError: true });
      return;
    }

    const cleanId = customForm.id.startsWith('ext-') ? customForm.id : `ext-${customForm.id}`;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const newExt: Partial<WikiExtension> = {
        id: cleanId,
        name: customForm.name.trim(),
        namePt: customForm.namePt.trim() || customForm.name.trim(),
        version: customForm.version.trim() || '1.0.0',
        category: customForm.category,
        author: currentUserEmail || 'Burocrata Oficial',
        description: customForm.description.trim() || 'Extensão personalizada do ecossistema WazzimaGiygg.',
        enabled: true,
        type: 'extension',
        url: 'https://wazzimagiygg.com',
        originDomain: 'wazzimagiygg.com',
        files: [
          {
            name: `${cleanId}.ts`,
            size: customForm.code.length,
            sha256: '',
            content: customForm.code,
            mimeType: 'application/typescript'
          }
        ]
      };

      const ok = await onAddCustomExtension(newExt);
      if (ok) {
        setFeedback({ message: '✓ Extensão personalizada criada e submetida à auditoria forense com sucesso!', isError: false });
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setFeedback({ message: 'Falha ao registrar extensão personalizada.', isError: true });
      }
    } catch (err: any) {
      setFeedback({ message: err?.message || 'Erro ao criar extensão.', isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FAF9F5] border-4 border-[#141414] max-w-3xl w-full max-h-[90vh] flex flex-col shadow-[10px_10px_0px_0px_rgba(20,20,20,1)]">
        {/* Header */}
        <div className="bg-[#141414] text-white p-4 flex items-center justify-between border-b-2 border-stone-800">
          <div className="flex items-center gap-2.5">
            <Package className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-editorial text-lg font-bold tracking-tight">
                Adicionar e Gerenciar Extensões (3.05.3.a)
              </h3>
              <p className="text-[11px] font-mono text-stone-400">
                Catálogo de Extensões Oficiais & Criação Segura
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

        {/* Tab switcher */}
        <div className="bg-stone-200 border-b-2 border-[#141414] px-4 pt-2 flex items-center gap-1 font-mono text-xs">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-3 py-1.5 font-bold border-t-2 border-x-2 border-[#141414] -mb-[2px] transition-colors ${
              activeTab === 'catalog' ? 'bg-[#FAF9F5] text-stone-950' : 'bg-stone-300 text-stone-600 hover:bg-stone-200'
            }`}
          >
            📦 Catálogo de Extensões Existentes ({EXISTING_EXTENSIONS_CATALOG.length})
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-3 py-1.5 font-bold border-t-2 border-x-2 border-[#141414] -mb-[2px] transition-colors ${
              activeTab === 'custom' ? 'bg-[#FAF9F5] text-stone-950' : 'bg-stone-300 text-stone-600 hover:bg-stone-200'
            }`}
          >
            ✨ Criar Extensão Personalizada
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Bureaucrat Notice */}
          {!isBureaucrat && (
            <div className="p-3 bg-amber-50 border-2 border-amber-600 font-mono text-xs text-amber-900 flex items-start gap-2 shadow-[2px_2px_0px_0px_rgba(217,119,6,1)]">
              <Lock className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Acesso Restrito:</strong> Somente o Burocrata oficial (
                <code className="bg-amber-100 px-1 py-0.5">pedrohenriquecardonaperes@gmail.com</code>) possui autorização
                para adicionar extensões ao ecossistema.
              </div>
            </div>
          )}

          {/* Feedback */}
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

          {/* TAB 1: EXISTING CATALOG */}
          {activeTab === 'catalog' && (
            <div className="space-y-4">
              <p className="font-serif text-xs text-stone-700 leading-relaxed">
                Selecione extensões existentes pré-homologadas na arquitetura NotMediaWiki para adicioná-las ao portal.
                Cada extensão passa automaticamente pelo Dispositivo de Sincronia (3.05.9.a) e pelo Verificador Forense (3.05.9.b).
              </p>

              <div className="space-y-3 font-mono text-xs">
                {EXISTING_EXTENSIONS_CATALOG.map((item) => {
                  const isInstalled = installedExtensionIds.includes(item.id);

                  return (
                    <div
                      key={item.id}
                      className={`p-4 border-2 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isInstalled
                          ? 'border-emerald-700 bg-emerald-50/40'
                          : 'border-[#141414] bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-stone-950 font-editorial">
                            {item.namePt || item.name}
                          </span>
                          <span className="bg-stone-800 text-stone-200 text-[9px] px-1.5 py-0.5 font-bold uppercase">
                            {item.category}
                          </span>
                          <span className="bg-stone-200 text-stone-700 text-[9px] px-1 py-0.5">
                            v{item.version}
                          </span>
                          <span className="text-stone-400 text-[10px]">({item.id})</span>
                        </div>
                        <p className="font-serif text-xs text-stone-600">{item.description}</p>
                        <div className="text-[10px] text-stone-500 flex items-center gap-3 pt-0.5">
                          <span>Origem: <strong>{item.originDomain}</strong></span>
                          <span>SHA-256: <code>{item.sha256?.slice(0, 12)}...</code></span>
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        {isInstalled ? (
                          <span className="px-3 py-1.5 bg-emerald-100 border border-emerald-600 text-emerald-800 font-bold text-xs flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5" /> Instalada
                          </span>
                        ) : (
                          <button
                            onClick={() => handleInstallFromCatalog(item.id)}
                            disabled={!isBureaucrat || isSubmitting}
                            className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white font-bold uppercase tracking-wider text-xs border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1.5 cursor-pointer disabled:opacity-50 active:translate-x-0.5 active:translate-y-0.5"
                          >
                            <Download className="w-3.5 h-3.5 text-amber-400" />
                            <span>Adicionar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOM EXTENSION CREATION */}
          {activeTab === 'custom' && (
            <form onSubmit={handleCreateCustom} className="space-y-4 font-mono text-xs">
              <div className="p-3 bg-stone-100 border border-stone-300 text-stone-700 leading-relaxed font-serif">
                Desenvolva e registre uma extensão personalizada no NotMediaWiki. O arquivo será analisado pelo
                verificador estático contra ameaças críticas antes da ativação.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-stone-800 mb-1">
                    Identificador (ID - ex: ext-meurecurso):
                  </label>
                  <input
                    type="text"
                    value={customForm.id}
                    onChange={(e) => setCustomForm({ ...customForm, id: e.target.value })}
                    placeholder="ext-novofiltro"
                    disabled={!isBureaucrat}
                    className="w-full px-3 py-2 border-2 border-[#141414] bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-stone-800 mb-1">
                    Nome da Extensão:
                  </label>
                  <input
                    type="text"
                    value={customForm.name}
                    onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                    placeholder="Novo Filtro Avançado"
                    disabled={!isBureaucrat}
                    className="w-full px-3 py-2 border-2 border-[#141414] bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-stone-800 mb-1">
                    Categoria:
                  </label>
                  <select
                    value={customForm.category}
                    onChange={(e) => setCustomForm({ ...customForm, category: e.target.value as any })}
                    disabled={!isBureaucrat}
                    className="w-full px-3 py-2 border-2 border-[#141414] bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <option value="parser">Parser / Sintaxe</option>
                    <option value="ui">Interface do Usuário (UI)</option>
                    <option value="security">Segurança & Controle</option>
                    <option value="api">API & Integração</option>
                    <option value="service">Serviço / Suporte</option>
                    <option value="system">Sistema & Governança</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase text-stone-800 mb-1">
                    Versão:
                  </label>
                  <input
                    type="text"
                    value={customForm.version}
                    onChange={(e) => setCustomForm({ ...customForm, version: e.target.value })}
                    placeholder="1.0.0"
                    disabled={!isBureaucrat}
                    className="w-full px-3 py-2 border-2 border-[#141414] bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-stone-800 mb-1">
                  Descrição Curta:
                </label>
                <input
                  type="text"
                  value={customForm.description}
                  onChange={(e) => setCustomForm({ ...customForm, description: e.target.value })}
                  placeholder="Finalidade e escopo funcional da extensão..."
                  disabled={!isBureaucrat}
                  className="w-full px-3 py-2 border-2 border-[#141414] bg-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                />
              </div>

              <div>
                <label className="block font-bold uppercase text-stone-800 mb-1">
                  Código TypeScript da Extensão:
                </label>
                <textarea
                  rows={8}
                  value={customForm.code}
                  onChange={(e) => setCustomForm({ ...customForm, code: e.target.value })}
                  disabled={!isBureaucrat}
                  className="w-full p-3 border-2 border-[#141414] bg-stone-900 text-emerald-400 text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] focus:outline-none"
                  spellCheck={false}
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={!isBureaucrat || isSubmitting}
                  className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-bold uppercase tracking-wider border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>{isSubmitting ? 'Registrando...' : 'Registrar e Sincronizar Extensão'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="bg-stone-100 border-t-2 border-[#141414] p-4 flex justify-end font-mono text-xs">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold border-2 border-stone-400 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
