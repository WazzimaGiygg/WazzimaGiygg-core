import React, { useState } from 'react';
import {
  Shield,
  Heart,
  Lock,
  FileText,
  Sparkles,
  WifiOff,
  CheckCircle,
  Mail,
  Copy,
  ExternalLink,
  Check,
  Zap,
  Layers,
  Database,
  ArrowRight,
  LifeBuoy,
  Smartphone,
  Tv,
  Scale,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Globe,
  Building2,
  EyeOff,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  Download,
  BookOpen,
  Presentation,
  Cpu,
} from 'lucide-react';
import { UserProfile, WikiPage, WikiArticle } from '../types';
import { formatExternalUrl } from '../utils/linkUtils';
import { GoogleReaderRevenueDonation } from './GoogleReaderRevenueDonation';
import { PWAInstallPrompt } from './PWAInstallPrompt';
import { IrregularidadesDossierModal, DossierDocType } from './IrregularidadesDossierModal';

interface InformativeViewsProps {
  user: UserProfile | null;
  pages: WikiPage[];
  articles: WikiArticle[];
  onNavigateToArticle: (id: string) => void;
  onOpenEditor: () => void;
  onOpenSmartTVModal?: () => void;
  onNavigate?: (view: any) => void;
}

// === 1. SECURITY VIEW ===
export const SecurityView: React.FC<InformativeViewsProps> = ({ user }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in select-none">
      <div className="bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-800 rounded p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="w-9 h-9 rounded bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-200 dark:border-teal-800">
            <Shield size={18} />
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif-heading text-slate-900 dark:text-white">
              Segurança e Integridade da Plataforma
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Protocolos de proteção de identidade, moderação editorial e defesa contra abusos.
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
          <div className="p-3 rounded bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <h3 className="font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-1.5 font-mono text-[11px] uppercase">
              <Lock size={13} className="text-teal-600" /> Status da Sua Sessão
            </h3>
            {user ? (
              <div className="space-y-1 text-xs">
                <p>Identidade conectada: <strong>{user.email}</strong></p>
                <p>Status de moderação: <span className="text-emerald-600 dark:text-emerald-400 font-semibold">● Conta Regular (Sem Restrições)</span></p>
                <p>Nível de permissão: <span className="uppercase font-mono bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-1 py-0.2 rounded text-[10px]">{user.role}</span></p>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Você está em modo visitante. Faça login com o Google para ter acesso à auditoria de edições.
              </p>
            )}
          </div>

          <h3 className="font-bold text-sm text-slate-900 dark:text-white pt-2 font-serif-heading">
            Mecanismos Ativos de Proteção:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-3 rounded bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-0.5">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs">🛡️ Sanitização de Wikitext</h4>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                Prevenção rigorosa contra injeção de scripts (XSS) e renderização estrita de tags MediaWiki.
              </p>
            </div>
            <div className="p-3 rounded bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-0.5">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs">🛑 Moderação e Bloqueio</h4>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                Coleção de banimento (`banned_users`) para suspender contas que praticam vandalismo editorial.
              </p>
            </div>
            <div className="p-3 rounded bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-0.5">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs">📜 Auditoria Imutável</h4>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                Registro de alterações e histórico de versões para restauração instantânea.
              </p>
            </div>
            <div className="p-3 rounded bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-0.5">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs">🔐 Criptografia em Trânsito</h4>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                Tráfego cifrado via TLS 1.3 / HTTPS com cabeçalhos HSTS de alta segurança.
              </p>
            </div>
          </div>

          {/* Official Support & Tickets Card */}
          <div className="p-3.5 rounded bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-3">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded bg-indigo-600 text-white flex-shrink-0 mt-0.5 sm:mt-0">
                <LifeBuoy size={16} />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                  Central de Suporte & Abertura de Tickets WazzimaGiygg
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                  Reporte incidentes de segurança, solicite desbloqueios ou abra um chamado técnico para os serviços WazzimaGiygg.
                </p>
              </div>
            </div>
            <a
              href={formatExternalUrl("https://support.wazzimagiygg.com/")}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5 whitespace-nowrap self-stretch sm:self-auto justify-center"
            >
              <span>Abrir Ticket</span>
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

// === 2. DONATION VIEW ===
export const DonationView: React.FC<InformativeViewsProps> = () => {
  const [copiedPix, setCopiedPix] = useState(false);
  const pixKey = 'pedrohenriquecardonaperes@gmail.com';

  const copyPix = () => {
    navigator.clipboard.writeText(pixKey);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in select-none">
      <div className="bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-800 rounded p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="w-9 h-9 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-500 flex items-center justify-center border border-rose-200 dark:border-rose-800">
            <Heart size={18} />
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif-heading text-slate-900 dark:text-white">
              Apoie o Projeto WikiWorldWeb
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Mantido por voluntários e financiado pela comunidade sem anúncios comerciais invasivos.
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
          <p>
            A <strong>WikiWorldWeb</strong> é uma iniciativa independente dedicada a fornecer infraestrutura gratuita para o conhecimento livre. Seus donativos ajudam a cobrir custos de servidores, domínio, tráfego de dados e desenvolvimento contínuo de novas funcionalidades.
          </p>

          {/* Google Reader Revenue Manager (Subscribe with Google) CTA Doação */}
          <div className="py-1">
            <GoogleReaderRevenueDonation
              variant="card"
              title="Doação com Google Reader Revenue Manager"
              description="Apoie o projeto com apenas 1 clique utilizando a plataforma segura de contribuições do Google. Clique no botão de chamada para ação abaixo para abrir o botão de doação oficial."
            />
          </div>

          {/* PIX Box */}
          <div className="p-4 rounded bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5 font-mono text-xs">
                <span>💸</span> Doação via PIX (Brasil)
              </h3>
              <span className="text-[10px] font-semibold bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300 px-1.5 py-0.2 rounded">
                Instantâneo
              </span>
            </div>
            <p className="text-[11px] text-rose-800 dark:text-rose-300">
              Chave PIX Oficial (E-mail do mantenedor do repositório):
            </p>
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-2 rounded border border-rose-200 dark:border-rose-800">
              <code className="font-mono text-xs text-slate-900 dark:text-slate-100 flex-1 truncate">
                {pixKey}
              </code>
              <button
                onClick={copyPix}
                className="px-2.5 py-1 text-xs font-semibold rounded bg-rose-600 hover:bg-rose-700 text-white transition flex items-center gap-1 shadow-xs"
              >
                {copiedPix ? <Check size={12} /> : <Copy size={12} />}
                {copiedPix ? 'Copiado!' : 'Copiar Chave'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
            <a
              href={formatExternalUrl("https://support.wazzimagiygg.com/")}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 hover:border-indigo-500 transition flex items-center justify-between group"
            >
              <div>
                <span className="font-bold block text-slate-900 dark:text-white text-xs flex items-center gap-1">
                  <LifeBuoy size={13} className="text-indigo-600 dark:text-indigo-400" />
                  Suporte & Tickets
                </span>
                <span className="text-slate-500 dark:text-slate-400 text-[10px]">Atendimento dos serviços WazzimaGiygg</span>
              </div>
              <ExternalLink size={14} className="text-indigo-400 group-hover:text-indigo-600" />
            </a>

            <a
              href={formatExternalUrl("https://github.com/WazzimaGiygg/Wiki-alternative")}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 transition flex items-center justify-between group"
            >
              <div>
                <span className="font-bold block text-slate-900 dark:text-white text-xs">⭐ Estrela no GitHub</span>
                <span className="text-slate-500 text-[10px]">Apoie com seu feedback no código aberto</span>
              </div>
              <ExternalLink size={14} className="text-slate-400 group-hover:text-blue-600" />
            </a>

            <div className="p-3 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="font-bold block text-slate-900 dark:text-white text-xs">🤝 Contribuição Editorial</span>
              <span className="text-slate-500 text-[10px]">Crie novos artigos e expanda o acervo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// === 3. PRIVACY POLICY VIEW (LGPD) ===
export const PrivacyPolicyView: React.FC<InformativeViewsProps> = ({ onNavigate }) => {
  const [isDossierModalOpen, setIsDossierModalOpen] = useState(false);
  const [dossierDoc, setDossierDoc] = useState<DossierDocType>('irregularidades');

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in select-none">
      <div className="bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-800 rounded p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="w-9 h-9 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200 dark:border-blue-800">
            <Lock size={18} />
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif-heading text-slate-900 dark:text-white">
              Política de Privacidade e Proteção de Dados (LGPD)
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Conformidade total com a Lei nº 13.709/2018, Marco Civil da Internet (Lei nº 12.965/2014) e padrões internacionais de proteção ao cidadão.
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-wiki-body">
          {/* 1. Identificação do Controlador */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-serif-heading mb-1">
              1. Identificação do Controlador
            </h3>
            <p>
              O projeto <strong>WikiWorldWeb</strong> opera sob a governança comunitária de <em>WazzimaGiygg</em>. O encarregado oficial pelo tratamento de dados pessoais (Data Protection Officer - DPO) pode ser acionado diretamente no e-mail: <code>pedrohenriquecardonaperes@gmail.com</code>.
            </p>
          </div>

          {/* 2. Dados Coletados */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-serif-heading mb-1">
              2. Dados Pessoais Coletados e Finalidades
            </h3>
            <ul className="list-disc pl-4 space-y-1">
              <li><strong>Autenticação Google:</strong> nome, e-mail e foto para atribuição de autoria pública e prevenção contra vandalismo.</li>
              <li><strong>Identificador Criptográfico (UID):</strong> chave primária de associação com o banco de dados Firestore.</li>
              <li><strong>Registros de Acesso (Logs):</strong> data, hora e metadados coletados conforme exigência legal do Art. 15 do Marco Civil da Internet.</li>
            </ul>
          </div>

          {/* 3. Direitos do Titular */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-serif-heading mb-1">
              3. Seus Direitos (Art. 18 da LGPD) e Atendimento
            </h3>
            <p>
              Você pode exercer a qualquer momento seus direitos de confirmação de tratamento, acesso, retificação, portabilidade, anonimização, bloqueio ou eliminação através do botão <strong>"Meus Dados"</strong> no menu de navegação ou abrindo um chamado formal com a equipe de privacidade na <a href={formatExternalUrl("https://support.wazzimagiygg.com/")} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 font-bold underline">Central de Tickets WazzimaGiygg</a>.
            </p>
          </div>

          {/* Dossiê Oficial em PDF sobre as Violações */}
          <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 dark:from-rose-950/40 dark:via-slate-900 dark:to-amber-950/40 border-2 border-rose-300 dark:border-rose-800 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-10 h-10 rounded-lg bg-rose-600 text-white flex items-center justify-center shadow-xs shrink-0 mt-0.5">
                  <FileText size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <span className="text-[10px] font-mono font-bold uppercase bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 px-1.5 py-0.5 rounded">
                      Documento Oficial em PDF
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded">
                      LGPD • GDPR • Marco Civil
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white font-serif-heading">
                    Irregularidades da Wikipédia e Wikimedia Foundation
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setDossierDoc('irregularidades');
                    setIsDossierModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <BookOpen size={13} />
                  <span>Ler Dossiê</span>
                </button>

                <a
                  href="/Irregularidades%20da%20Wikip%C3%A9dia%20e%20Wikimedia%20Foundation.pdf"
                  download="Irregularidades da Wikipédia e Wikimedia Foundation.pdf"
                  className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Download size={13} />
                  <span>Baixar PDF (23 KB)</span>
                </a>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Consulte a íntegra do documento técnico-jurídico que demonstra as infrações continuadas praticadas pela Wikipédia e Wikimedia Foundation: exposição ilícita de endereços IP de internautas (Art. 10/15 do Marco Civil), recusa de submissão à jurisdição brasileira e à ANPD (Art. 3º e 11), inobservância dos direitos dos titulares e criação do humilhante Efeito Streisand (Art. 18 da LGPD), além de afronta ao direito ao esquecimento e normas de transferência internacional do GDPR europeu.
            </p>
          </div>

          {/* Dossiê Especial: Calúnia por parte de Chronus V2 */}
          <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-red-50 via-rose-50 to-orange-50 dark:from-red-950/40 dark:via-slate-900 dark:to-orange-950/40 border-2 border-red-300 dark:border-red-800 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-rose-700 to-red-600 text-white flex items-center justify-center shadow-xs shrink-0 mt-0.5">
                  <Scale size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <span className="text-[10px] font-mono font-bold uppercase bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200 px-1.5 py-0.5 rounded">
                      Dossiê 47 Páginas (V2)
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded">
                      Arts. 138-140 & 147-A CP • UCOC
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white font-serif-heading">
                    Calúnia por parte de Chronus V2: Dossiê de Violações Penais, Stalking e Moderação Abusiva
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setDossierDoc('chronus');
                    setIsDossierModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <BookOpen size={13} />
                  <span>Ler Dossiê V2</span>
                </button>

                <a
                  href="/Cal%C3%BAnia%20por%20parte%20de%20Chronus%20V2.pdf"
                  download="Calúnia por parte de Chronus V2.pdf"
                  className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Download size={13} />
                  <span>Baixar PDF (V2)</span>
                </a>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Auditoria técnico-jurídica pormenorizada de 47 páginas que detalha a prática de crimes contra a honra (calúnia com falsa imputação de crimes informáticos, difamação e injúria com majorante de alcance na internet), perseguição/stalking (Art. 147-A CP), quebra de sigilo telemático, bloqueios geográficos de ASNs e violações graves ao Código Universal de Conduta (UCOC) da Wikimedia Foundation cometidas pelo moderador Chronus contra o titular Pedro Henrique Cardona Peres (WazzimaGiygg).
            </p>
          </div>

          {/* Dossiê Especial 3: Apresentação Institucional (Accountability) */}
          <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50 dark:from-purple-950/40 dark:via-slate-900 dark:to-pink-950/40 border-2 border-purple-300 dark:border-purple-800 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-purple-700 to-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0 mt-0.5">
                  <Presentation size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <span className="text-[10px] font-mono font-bold uppercase bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-1.5 py-0.5 rounded">
                      Dossiê de Apresentação Oficial
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded">
                      15 Slides Executivos • WMF
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white font-serif-heading">
                    Wikimedia Institutional Accountability Dossier: O Caso Chronus
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setDossierDoc('apresentacao');
                    setIsDossierModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <BookOpen size={13} />
                  <span>Ler Apresentação</span>
                </button>

                <a
                  href="/Wikimedia_Institutional_Accountability_Dossier.pdf"
                  download="Wikimedia_Institutional_Accountability_Dossier.pdf"
                  className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
                >
                  <Download size={13} />
                  <span>Baixar PDF (15 Slides)</span>
                </a>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Apresentação executiva em 15 lâminas estruturadas detalhando as falhas sistêmicas na moderação da Wikipédia Lusófona, quebra de sigilo de denúncias confidenciais (whistleblower), violações da LGPD e Marco Civil da Internet, além das exigências mandatórias de due process sob o Digital Services Act (DSA - Regulamento UE 2022/2065).
            </p>
          </div>

          {/* 4. SEÇÃO PRINCIPAL: POR QUE A WIKIWORLDWEB SEGUE A LGPD E A WIKIPÉDIA NÃO */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold text-sm font-serif-heading">
              <Scale size={18} />
              <h3>4. Por que a WikiWorldWeb segue as regras da LGPD e a Wikipédia (Wikimedia Foundation) não?</h3>
            </div>

            <p>
              A conformidade com a <strong>Lei Geral de Proteção de Dados Pessoais (LGPD - Lei nº 13.709/2018)</strong> é um dos maiores divisores de águas entre a <strong>WikiWorldWeb</strong> e a enciclopédia tradicional <strong>Wikipédia</strong>. Essa discrepância decorre de fundamentos de jurisdição territorial, estrutura jurídica internacional e filosofias divergentes quanto à prevalência da privacidade do indivíduo:
            </p>

            <div className="space-y-3 pt-1">
              {/* Ponto 1: Jurisdição e Sede Internacional */}
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs">
                  <Building2 size={15} className="text-blue-600 dark:text-blue-400" />
                  <span>A. Sede Internacional e Jurisdição Territorial (Art. 3º da LGPD)</span>
                </div>
                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                  <p>
                    <strong>Por que a Wikipédia não segue:</strong> A Wikipédia é gerida pela <em>Wikimedia Foundation Inc. (WMF)</em>, entidade sem fins lucrativos sediada em São Francisco, Califórnia (Estados Unidos). A WMF não possui sede, filial, escritório ou representação jurídica no Brasil. Diante de notificações e contestações extrajudiciais movidas por cidadãos brasileiros com base na LGPD, a Wikimedia Foundation habitualmente sustenta que está fora da jurisdição direta do Brasil, invocando as proteções da legislação federal dos EUA (em especial a Seção 230 do <em>Communications Decency Act</em> de 1996 e a Primeira Emenda à Constituição americana), demandando cartas rogatórias ou decisões em tribunais norte-americanos para qualquer cumprimento.
                  </p>
                  <p>
                    <strong>Como a WikiWorldWeb atua:</strong> A WikiWorldWeb possui governança comunitária orientada à comunidade lusófona e brasileira. Submetemo-nos expressamente à jurisdição brasileira e ao <strong>Art. 3º da LGPD</strong> — que estabelece a aplicação obrigatória da lei a qualquer operação de tratamento realizada no território nacional ou que tenha por objetivo a oferta ou o fornecimento de serviços a pessoas localizadas no Brasil. Reconhecemos a autoridade fiscalizatória da <strong>Autoridade Nacional de Proteção de Dados (ANPD)</strong> e dos tribunais brasileiros.
                  </p>
                </div>
              </div>

              {/* Ponto 2: Exposição de IPs Públicos */}
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs">
                  <EyeOff size={15} className="text-emerald-600 dark:text-emerald-400" />
                  <span>B. Exposição Pública de Endereços IP vs. Confidencialidade e Marco Civil</span>
                </div>
                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                  <p>
                    <strong>Na Wikipédia:</strong> Qualquer usuário que edita ou cria um artigo sem estar logado tem o seu <strong>endereço de IP completo exposto publicamente</strong> no histórico permanente de revisões da página, acessível a qualquer leitor e a motores de busca. Sob a ótica da LGPD e das autoridades de proteção de dados, o endereço IP é um dado pessoal, pois viabiliza a identificação do provedor de acesso, localização geográfica e eventualmente a identidade civil do usuário. Essa exposição pública deliberada viola os princípios da <em>segurança</em>, da <em>prevenção</em> e da <em>privacidade desde a concepção (Privacy by Design)</em>, sujeitando internautas a rastreamento indevido e perseguições (*doxxing*).
                  </p>
                  <p>
                    <strong>Na WikiWorldWeb:</strong> Adotamos o princípio fundamental de que nenhum endereço IP ou metadado técnico de usuário é jamais divulgado abertamente no histórico ou em registros públicos. Os dados técnicos de conexão são mantidos em sigilo estrito e criptografados, sendo armazenados exclusivamente nos parâmetros mandatórios do <strong>Art. 15 do Marco Civil da Internet (Lei nº 12.965/2014)</strong> para fins exclusivos de segurança da aplicação e fornecimento estritamente sob ordem judicial específica.
                  </p>
                </div>
              </div>

              {/* Ponto 3: Direitos do Titular e DPO */}
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs">
                  <UserCheck size={15} className="text-purple-600 dark:text-purple-400" />
                  <span>C. Encarregado de Dados (DPO) e Atendimento aos Direitos do Titular (Art. 18 e 41)</span>
                </div>
                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                  <p>
                    <strong>Na Wikipédia:</strong> A Wikimedia Foundation não possui Encarregado pelo Tratamento de Dados Pessoais (DPO) nos termos do Art. 41 da LGPD para interlocução com titulares brasileiros e a ANPD. Pedidos de cidadãos para retificar informações inverídicas, anonimizar biografias ou excluir dados pessoais costumam ser jogados em fóruns públicos de votação da comunidade de voluntários ("páginas para eliminar"), provocando o chamado <em>Efeito Streisand</em> (amplificação do dano e humilhação pública) ou são indeferidos sob o dogma de "registro histórico perpétuo".
                  </p>
                  <p>
                    <strong>Na WikiWorldWeb:</strong> Mantemos um DPO oficial formalmente identificado (<code>pedrohenriquecardonaperes@gmail.com</code>) e uma central de tickets estruturada. O titular brasileiro dispõe de um canal seguro e confidencial para requerer retificação, anonimização, bloqueio ou eliminação de seus dados, sem exposição vexatória e com prazos compatíveis com a regulamentação da ANPD.
                  </p>
                </div>
              </div>

              {/* Ponto 4: Dados Sensíveis, Menores e Supressão (Oversight) */}
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-xs">
                  <ShieldAlert size={15} className="text-rose-600 dark:text-rose-400" />
                  <span>D. Dados Sensíveis (Art. 11), Proteção a Menores (Art. 14) e Supressão Definitiva</span>
                </div>
                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                  <p>
                    <strong>Na Wikipédia:</strong> Informações íntimas, detalhes médicos, acusações policiais em andamento e dados de familiares ou crianças ligadas a personalidades públicas são frequentemente mantidos em artigos biográficos se houver mera citação em reportagens jornalísticas, sem ponderação de dados sensíveis ou tutela ao melhor interesse da criança (ECA).
                  </p>
                  <p>
                    <strong>Na WikiWorldWeb:</strong> Nossas <strong>Regras de Ética de Edição (Special:EditingEthics)</strong> impõem tolerância zero a doxxing (CPFs, endereços, telefones), blindagem absoluta a crianças e adolescentes (Art. 14 da LGPD) e rigor probatório para dados sensíveis (Art. 11). Contamos com a ferramenta de <strong>Supressão e Oversight</strong>, que expurga dados violadores diretamente do banco de dados, impossibilitando que continuem gravados em logs ou versões antigas de histórico.
                  </p>
                </div>
              </div>
            </div>

            {/* Quadro Comparativo Resumo */}
            <div className="pt-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono mb-2 flex items-center gap-1.5">
                <Scale size={14} className="text-blue-600 dark:text-blue-400" />
                <span>Quadro Comparativo: WikiWorldWeb vs. Wikipédia (Wikimedia Foundation)</span>
              </h4>

              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700">
                      <th className="p-2.5 font-bold">Diretriz / Requisito Legal</th>
                      <th className="p-2.5 font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/30">
                        WikiWorldWeb (WazzimaGiygg)
                      </th>
                      <th className="p-2.5 font-bold text-slate-600 dark:text-slate-400">
                        Wikipédia (Wikimedia Foundation)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-[11px]">
                    <tr>
                      <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200">
                        Jurisdição e Submissão à LGPD (Art. 3º)
                      </td>
                      <td className="p-2.5 text-emerald-700 dark:text-emerald-300 font-medium bg-emerald-50/40 dark:bg-emerald-950/20">
                        Sim. Reconhece expressamente a LGPD e a autoridade da ANPD.
                      </td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-400">
                        Não. Sediada nos EUA; alega extraterritorialidade e aplica leis norte-americanas (Seção 230 do CDA).
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200">
                        Exposição Pública de Endereço IP
                      </td>
                      <td className="p-2.5 text-emerald-700 dark:text-emerald-300 font-medium bg-emerald-50/40 dark:bg-emerald-950/20">
                        Nunca. IPs são protegidos e tratados sob o sigilo do Marco Civil (Art. 15).
                      </td>
                      <td className="p-2.5 text-rose-600 dark:text-rose-400">
                        Sim. IPs de editores não logados são gravados e expostos publicamente no histórico mundial.
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200">
                        Encarregado de Dados (DPO) Oficial
                      </td>
                      <td className="p-2.5 text-emerald-700 dark:text-emerald-300 font-medium bg-emerald-50/40 dark:bg-emerald-950/20">
                        Sim. Canal direto: <code>pedrohenriquecardonaperes@gmail.com</code>.
                      </td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-400">
                        Não possui DPO designado para a LGPD brasileira.
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200">
                        Exercício dos Direitos do Titular (Art. 18)
                      </td>
                      <td className="p-2.5 text-emerald-700 dark:text-emerald-300 font-medium bg-emerald-50/40 dark:bg-emerald-950/20">
                        Painel "Meus Dados" e canal de tickets sigiloso sem exposição pública.
                      </td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-400">
                        Discussões públicas comunitárias (fóruns/PE) ou recusa sob alegação de registro imutável.
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200">
                        Dados Sensíveis e Menores (Arts. 11 e 14)
                      </td>
                      <td className="p-2.5 text-emerald-700 dark:text-emerald-300 font-medium bg-emerald-50/40 dark:bg-emerald-950/20">
                        Rigor absoluto; vedada exposição de menores sem notoriedade autônoma.
                      </td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-400">
                        Critérios flexíveis guiados por reportagens de terceiros e consensos comunitários.
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-semibold text-slate-800 dark:text-slate-200">
                        Expurgo de Dados (Oversight / Supressão)
                      </td>
                      <td className="p-2.5 text-emerald-700 dark:text-emerald-300 font-medium bg-emerald-50/40 dark:bg-emerald-950/20">
                        Protocolo de expurgo permanente ativado para violações de privacidade.
                      </td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-400">
                        Ferramenta restrita a administradores globais para casos criminais extremos.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 5. SEÇÃO: O MARCO REGULATÓRIO EUROPEU DE DADOS E SUA IMPORTÂNCIA GLOBAL */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold text-sm font-serif-heading">
                <Lock size={18} />
                <h3>5. O Marco Regulatório Europeu de Dados e a Importância do Efeito Bruxelas</h3>
              </div>

              <p>
                As normas promulgadas pela <strong>União Europeia</strong> estabeleceram o mais sofisticado e protetivo ecossistema regulatório digital do planeta. Por meio do fenômeno jurídico-econômico denominado <strong>Efeito Bruxelas (Brussels Effect)</strong>, as regras da UE tornaram-se o padrão técnico mandatório para as corporações globais de internet:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {/* GDPR */}
                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-900 dark:text-indigo-200 text-xs">GDPR (Reg. UE 2016/679)</span>
                    <span className="text-[9px] font-mono px-1 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold">PRIVACIDADE</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    Consagra a autodeterminação informacional com os princípios de minimização, exatidão, limitação da finalidade, direito ao esquecimento (Art. 17), portabilidade e veto a perfis automatizados discriminatórios.
                  </p>
                </div>

                {/* DSA */}
                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-900 dark:text-blue-200 text-xs">Digital Services Act (DSA - 2022/2065)</span>
                    <span className="text-[9px] font-mono px-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold">PLATAFORMAS</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    Extingue os <em>dark patterns</em> (interfaces indutoras de erro), proíbe anúncios direcionados com base em dados sensíveis ou direcionados a crianças e exige devido processo legal na moderação de conteúdo.
                  </p>
                </div>

                {/* DMA */}
                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 dark:text-emerald-200 text-xs">Digital Markets Act (DMA - 2022/1925)</span>
                    <span className="text-[9px] font-mono px-1 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-bold">CONCORRÊNCIA</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    Combate os monopólios das Big Techs (<em>Gatekeepers</em>), proibindo o cruzamento forçado de dados entre serviços distintos da mesma corporação e garantindo interoperabilidade entre mensageiros.
                  </p>
                </div>

                {/* EU AI Act */}
                <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-900 dark:text-purple-200 text-xs">EU AI Act (Reg. UE 2024/1689)</span>
                    <span className="text-[9px] font-mono px-1 rounded bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 font-bold">IA & ÉTICA</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    Primeiro marco global para Inteligência Artificial: bane pontuação social e manipulação subliminar, regula sistemas de alto risco e exige rotulagem obrigatória de <em>deepfakes</em>.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 text-[11px] text-slate-700 dark:text-slate-300">
                <strong>Por que essas leis são vitais?</strong> Elas asseguram que a inovação tecnológica não ocorra à custa da exploração psicológica de vulneráveis, resgatando a soberania da pessoa sobre sua pegada digital e desmantelando assimetrias predatórias de mercado.
              </div>
            </div>

            {/* 6. SEÇÃO: TRATADOS INTERNACIONAIS E LIBERDADE DE EXPRESSÃO */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold text-sm font-serif-heading">
                <Globe size={18} />
                <h3>6. Tratados de Direito Internacional e a Salvaguarda da Liberdade de Expressão</h3>
              </div>

              <p>
                A liberdade de pensamento e de comunicação é um direito humano universal consagrado nos mais solenes instrumentos do Direito Internacional. A WikiWorldWeb adere estritamente aos tratados globais que protegem o direito inalienável de buscar, receber e difundir informações:
              </p>

              <div className="space-y-2.5 pt-1">
                {/* DUDH Art. 19 */}
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    <span>Declaração Universal dos Direitos Humanos (DUDH / 1948) — Artigo 19</span>
                  </div>
                  <p className="text-[11px] italic font-serif text-slate-800 dark:text-slate-200 bg-white/70 dark:bg-slate-900/60 p-2 rounded border-l-2 border-blue-600">
                    "Todo ser humano tem direito à liberdade de opinião e expressão; este direito inclui a liberdade de, sem interferência, ter opiniões e de procurar, receber e transmitir informações e ideias por quaisquer meios e independentemente de fronteiras."
                  </p>
                </div>

                {/* PIDCP Art. 19 e Teste Tripartite */}
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 space-y-1.5">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                      <span>Pacto Internacional sobre os Direitos Civis e Políticos (PIDCP / 1966) — Artigo 19</span>
                    </div>
                    <span className="text-[9px] font-mono px-1 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold">
                      TESTE TRIPARTITE
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    O Comitê de Direitos Humanos da ONU (Comentário Geral nº 34) firmou que qualquer restrição à liberdade de expressão só é admissível se obedecer estrita e cumulativamente a 3 requisitos: <strong>1. Legalidade Estrita</strong> (prevista em lei formal clara e prévia); <strong>2. Finalidade Legítima</strong> (respeito aos direitos alheios ou ordem pública); e <strong>3. Necessidade e Proporcionalidade</strong> (medida menos gravosa indispensável numa democracia). Veda-se qualquer censura genérica de sites.
                  </p>
                </div>

                {/* Pacto de San José Art. 13 */}
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 space-y-1">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                    <span>Convenção Americana sobre Direitos Humanos (Pacto de San José / 1969) — Artigo 13</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Veda categoricamente a <strong>censura prévia</strong> (Art. 13.2) e proíbe mecanismos indiretos de cerceamento (Art. 13.3) praticados por governos ou conglomerados de mídia. Eventuais ilícitos respondem apenas por responsabilidade ulterior legalmente tipificada.
                  </p>
                </div>
              </div>

              {/* Convivência e harmonia */}
              <div className="p-3.5 rounded-lg bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/30 dark:via-teal-950/30 dark:to-cyan-950/30 border border-emerald-200 dark:border-emerald-800/60 text-[11px] text-slate-700 dark:text-slate-300 space-y-1">
                <div className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5 font-mono">
                  <Scale size={14} className="text-emerald-600" />
                  <span>A Dialética Virtuosa: Privacidade como Pré-Condição da Liberdade de Expressão</span>
                </div>
                <p>
                  A proteção de dados pessoais e o sigilo técnico de metadados não são opositores da livre expressão, mas o seu escudo protetor indispensável. Sem garantias robustas de privacidade contra a espionagem e o <em>doxxing</em>, o medo da retaliação estatal ou corporativa impõe a autocensura aos criadores do saber. Proteger a privacidade é defender a liberdade do pensamento.
                </p>
              </div>
            </div>

            {/* Quick action buttons */}
            {onNavigate && (
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  onClick={() => onNavigate('editing-ethics')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>Ver Regras de Ética de Edição (LGPD & GDPR)</span>
                </button>
                <button
                  onClick={() => onNavigate('mydata')}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold hover:bg-blue-100 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <UserCheck size={14} className="text-blue-600" />
                  <span>Acessar Painel "Meus Dados" (Art. 18)</span>
                </button>
              </div>
            )}
          </div>

          {/* Suporte e Central de Tickets */}
          <div className="p-3 rounded bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3">
            <div className="flex items-center gap-2">
              <LifeBuoy size={16} className="text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
              <span className="text-[11px] text-slate-700 dark:text-slate-300">
                Dúvidas sobre o tratamento de seus dados ou requisições formais à governança WazzimaGiygg?
              </span>
            </div>
            <a
              href={formatExternalUrl("https://support.wazzimagiygg.com/")}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 text-xs font-semibold rounded bg-indigo-600 hover:bg-indigo-700 text-white transition flex items-center gap-1 shadow-xs whitespace-nowrap self-start sm:self-auto"
            >
              <span>Central de Tickets & Suporte</span>
              <ExternalLink size={11} />
            </a>
          </div>
        </div>
      </div>

      {/* Modal de Leitura Integral do Dossiê e Visualização do PDF */}
      <IrregularidadesDossierModal
        isOpen={isDossierModalOpen}
        onClose={() => setIsDossierModalOpen(false)}
        initialDocument={dossierDoc}
      />
    </div>
  );
};

// === 4. TERMS OF USE VIEW ===
export const TermsOfUseView: React.FC<InformativeViewsProps> = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in select-none">
      <div className="bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-800 rounded p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="w-9 h-9 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
            <FileText size={18} />
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif-heading text-slate-900 dark:text-white">
              Termos de Uso e Licenciamento
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Diretrizes editoriais e licença GNU General Public License v3.0.
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-wiki-body">
          <p>
            Ao utilizar, publicar ou editar artigos na <strong>WikiWorldWeb</strong>, você concorda em cumprir com as diretrizes de convivência e licenciamento livre.
          </p>

          <h3 className="text-sm font-bold text-slate-900 dark:text-white font-serif-heading">1. Princípio da Verificabilidade</h3>
          <p>
            Todo o conteúdo publicado deve ser redigido de forma neutra, factual e, sempre que possível, acompanhado de referências e fontes fidedignas.
          </p>

          <h3 className="text-sm font-bold text-slate-900 dark:text-white font-serif-heading">2. Licença GNU GPL v3.0</h3>
          <p>
            O código-fonte e os módulos do software são distribuídos sob a <strong>GNU General Public License v3.0</strong>. Você é livre para estudar, modificar e redistribuir cópias do software, desde que as modificações permaneçam sob os mesmos termos de liberdade.
          </p>
        </div>
      </div>
    </div>
  );
};

// === 5. BETA 2026 MODERN MODE VIEW ===
export const BetaModeView: React.FC<InformativeViewsProps> = ({
  pages,
  articles,
  onNavigateToArticle,
  onOpenEditor,
}) => {
  return (
    <div className="max-w-6xl mx-auto space-y-5 animate-in fade-in select-none">
      <div className="bg-[#1e293b] text-white rounded p-5 sm:p-7 shadow-xs relative overflow-hidden border border-slate-700">
        <div className="relative z-10 space-y-2 max-w-3xl">
          <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold font-mono inline-flex items-center gap-1 uppercase">
            <Sparkles size={11} className="text-amber-300" /> Experiência Beta 2026
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif-heading tracking-tight leading-tight">
            Navegação Semântica e Hipertextual Fluida
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
            Visualizador interativo de grafos e conexões entre artigos com rendering instantâneo de Wikitexto.
          </p>
          <div className="pt-2 flex flex-wrap gap-2">
            <button
              onClick={onOpenEditor}
              className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition flex items-center gap-1.5"
            >
              <Zap size={13} /> Abrir Editor Wikitexto
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic graph nodes representation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {articles.map((art) => (
          <div
            key={art.id}
            onClick={() => onNavigateToArticle(art.id)}
            className="p-3.5 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 hover:border-blue-500 transition cursor-pointer group flex flex-col justify-between shadow-xs"
          >
            <div>
              <div className="flex items-center justify-between text-[10px] text-blue-600 dark:text-blue-400 mb-1 font-mono">
                <span>#{art.pageUid}</span>
                <span>v{art.versao || 1}.0</span>
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white font-serif-heading group-hover:text-blue-600 transition">
                {art.titulo}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-3 leading-relaxed">
                {art.resumo || art.descricao.slice(0, 120)}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>{art.autor}</span>
              <ArrowRight size={13} className="text-blue-500 group-hover:translate-x-0.5 transition" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// === 6. OFFLINE MODE VIEW ===
export const OfflineModeView: React.FC<InformativeViewsProps> = ({ articles, pages, onOpenSmartTVModal }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in select-none">
      <div className="bg-white dark:bg-[#0f172a] border border-slate-300 dark:border-slate-800 rounded p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="w-9 h-9 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800">
            <WifiOff size={18} />
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif-heading text-slate-900 dark:text-white">
              Modo Offline e Cache Local
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Armazenamento em memória local (LocalStorage / IndexedDB) garantindo disponibilidade contínua.
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
          <div className="p-3 rounded bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2.5">
            <CheckCircle size={18} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-emerald-900 dark:text-emerald-200 text-xs">
                Todos os artigos estão salvos localmente!
              </h3>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                Você pode continuar navegando, lendo e criando rascunhos mesmo sem sinal de internet.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
            <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 text-[10px] uppercase font-mono block">Coleções em Cache:</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white">{pages.length}</span>
            </div>
            <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 text-[10px] uppercase font-mono block">Artigos em Cache:</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white">{articles.length}</span>
            </div>
            <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 col-span-2 sm:col-span-1">
              <span className="text-slate-400 text-[10px] uppercase font-mono block">Sincronização:</span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-mono">Ativo & Reativo</span>
            </div>
          </div>

          {/* Android App & PWA Installation Card */}
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-200 dark:border-blue-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Aplicativo WikiWorldWeb para Celular Android
                </h4>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Instale o WikiWorldWeb como aplicativo no seu smartphone Android. Ele funciona como um app nativo, ocupando menos de 3MB e oferecendo acesso total offline.
              </p>
            </div>
            <div className="shrink-0 w-full sm:w-auto">
              <PWAInstallPrompt buttonStyle="header" />
            </div>
          </div>

          {/* Smart TV App Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border border-indigo-200 dark:border-indigo-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Tv className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Aplicativo WikiWorldWeb para Smart TV (10-Foot UI)
                </h4>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Acesse a enciclopédia no sofá com tipografia para TV, navegação por controle remoto, sintetizador de voz e compatibilidade com Samsung Tizen, LG webOS, Android TV e Fire TV.
              </p>
            </div>
            <div className="shrink-0 w-full sm:w-auto">
              <button
                onClick={onOpenSmartTVModal}
                className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Tv size={14} />
                <span>Abrir no Modo Smart TV</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
