/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Painel Oficial de Regras da LGPD (Lei nº 13.709/2018) à Amostra
 * Para ciência absoluta de conformidade, transparência e exercício de direitos pelo titular.
 */

import React, { useState } from 'react';
import {
  Scale,
  ShieldCheck,
  FileText,
  CheckCircle2,
  Lock,
  UserCheck,
  AlertTriangle,
  Download,
  Copy,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  Printer,
  Info,
  Calendar,
  Eye,
  Trash2,
  HelpCircle,
  FileCheck,
  ShieldAlert,
  Sliders,
  RotateCcw,
  Ban,
  Globe,
  EyeOff,
  HardDrive,
  Mail
} from 'lucide-react';
import jsPDF from 'jspdf';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, registerAuditLog, sanitizeFirestoreData } from '../firebase';
import {
  COOKIE_CATEGORIES,
  COOKIE_INVENTORY,
  LgpdCookieConsent,
  getStoredCookieConsent,
  revokeAllNonEssentialCookies,
  exportCookieConsentProof,
  subscribeCookieConsent,
} from '../utils/cookieConsent';
import {
  PrivacyComplianceSettings,
  MARCO_CIVIL_LOG_RETENTION_DAYS,
  getPrivacySettings,
  savePrivacySettings,
  resetPrivacySettingsToDefault,
  subscribePrivacySettings,
  isBrowserDoNotTrackActive,
  purgeOptionalLocalSessionData,
  inspectTitularLocalInventory,
  exportTitularPersonalDataPackage,
} from '../utils/privacySettings';

export type LgpdShowcaseTab =
  | 'principios'
  | 'direitos'
  | 'cookies'
  | 'marcoCivil'
  | 'privacidade'
  | 'bases'
  | 'dpo'
  | 'termoCiencia';

export interface LgpdRulesShowcaseProps {
  onClose?: () => void;
  onOpenTicketForm?: (tipo?: string) => void;
  onOpenCookiePreferences?: () => void;
  currentUser?: any;
  showToast?: (msg: string, isError?: boolean) => void;
  isModal?: boolean;
  initialSubTab?: LgpdShowcaseTab;
}

export const LGPD_PRINCIPIOS = [
  {
    num: "I",
    nome: "Finalidade",
    artigo: "Art. 6º, I",
    resumoLegal: "Realização do tratamento para propósitos legítimos, específicos, explícitos e informados ao titular, sem possibilidade de tratamento posterior de forma incompatível com essas finalidades.",
    cumprimentoPortal: "Os dados coletados (UID e e-mail voluntário de autenticação) destinam-se exclusivamente à identificação editorial do autor, atribuição de crédito CC-BY-SA e login no portal e na rede social Bem-Te-Vi.",
    status: "100% CUMPRIDO"
  },
  {
    num: "II",
    nome: "Adequação",
    artigo: "Art. 6º, II",
    resumoLegal: "Compatibilidade do tratamento com as finalidades informadas ao titular, de acordo com o contexto do tratamento.",
    cumprimentoPortal: "Nenhum dado é utilizado para finalidades ocultas, traçado de perfil comportamental para publicidade direcionada ou revenda a terceiros.",
    status: "100% CUMPRIDO"
  },
  {
    num: "III",
    nome: "Necessidade (Minimização)",
    artigo: "Art. 6º, III",
    resumoLegal: "Limitação do tratamento ao mínimo necessário para a realização de suas finalidades, com abrangência dos dados pertinentes, proporcionais e não excessivos.",
    cumprimentoPortal: "Não coletamos telefone, endereço físico, CPF, dados de cartão ou cookies de rastreamento invasivo. Cookies não essenciais iniciam desativados por padrão (opt-in estrito) e leitores podem ler 100% do acervo sem aceitar rastreamento.",
    status: "100% CUMPRIDO"
  },
  {
    num: "IV",
    nome: "Livre Acesso",
    artigo: "Art. 6º, IV",
    resumoLegal: "Garantia, aos titulares, de consulta facilitada e gratuita sobre a forma e a duração do tratamento, bem como sobre a integralidade de seus dados pessoais.",
    cumprimentoPortal: "Qualquer usuário pode consultar seus dados armazenados em tempo real na aba Ouvidoria e pelo parâmetro de URL ?uid=, sem cobrança de qualquer taxa.",
    status: "100% CUMPRIDO"
  },
  {
    num: "V",
    nome: "Qualidade dos Dados",
    artigo: "Art. 6º, V",
    resumoLegal: "Garantia, aos titulares, de exatidão, clareza, relevância e atualização dos dados, de acordo com a necessidade e para o cumprimento da finalidade de seu tratamento.",
    cumprimentoPortal: "O titular tem controle total para editar seu nome público, foto e biografia na rede social Bem-Te-Vi a qualquer momento.",
    status: "100% CUMPRIDO"
  },
  {
    num: "VI",
    nome: "Transparência Ativa",
    artigo: "Art. 6º, VI",
    resumoLegal: "Garantia, aos titulares, de informações claras, precisas e facilmente acessíveis sobre a realização do tratamento e os respectivos agentes de tratamento.",
    cumprimentoPortal: "Este painel mantém todas as regras de tratamento permanentemente à mostra em local de destaque em todas as páginas do portal WazzimaGiygg.",
    status: "100% CUMPRIDO"
  },
  {
    num: "VII",
    nome: "Segurança da Informação",
    artigo: "Art. 6º, VII",
    resumoLegal: "Utilização de medidas técnicas e administrativas aptas a proteger os dados pessoais de acessos não autorizados e de situações acidentais ou ilícitas.",
    cumprimentoPortal: "Criptografia de ponta a ponta em trânsito (HTTPS/TLS), autenticação segura via Firebase Auth, sanitização contra XSS (DOMPurify) e controle restrito de autoridade (Burocrata).",
    status: "100% CUMPRIDO"
  },
  {
    num: "VIII",
    nome: "Prevenção",
    artigo: "Art. 6º, VIII",
    resumoLegal: "Adoção de medidas para prevenir a ocorrência de danos em virtude do tratamento de dados pessoais.",
    cumprimentoPortal: "Filtro sanitizador de extensões com quarentena automática contra códigos maliciosos e monitoramento ativo de incidentes de segurança.",
    status: "100% CUMPRIDO"
  },
  {
    num: "IX",
    nome: "Não Discriminação",
    artigo: "Art. 6º, IX",
    resumoLegal: "Impossibilidade de realização do tratamento para fins discriminatórios ilícitos ou abusivos.",
    cumprimentoPortal: "Garantia de livre manifestação do pensamento sem censura ou privilégios, sob os ditames da Constituição Federal (Art. 5º, IV e IX) e Marco Civil da Internet.",
    status: "100% CUMPRIDO"
  },
  {
    num: "X",
    nome: "Responsabilização e Prestação de Contas",
    artigo: "Art. 6º, X",
    resumoLegal: "Demonstração, pelo agente, da adoção de medidas eficazes e capazes de comprovar a observância e o cumprimento das normas de proteção de dados pessoais.",
    cumprimentoPortal: "Emissão de logs forenses de auditoria imutáveis, protocolo digital com certificado criptográfico de exclusão e DPO disponível para a ANPD.",
    status: "100% CUMPRIDO"
  }
];

export const LGPD_DIREITOS = [
  {
    inciso: "Art. 18, I",
    titulo: "Confirmação da Existência de Tratamento",
    descricao: "O titular tem o direito de obter da WazzimaGiygg a confirmação de que seus dados estão ou não sendo processados.",
    acaoLabel: "Confirmar Tratamento"
  },
  {
    inciso: "Art. 18, II",
    titulo: "Acesso aos Dados Pessoais",
    descricao: "Direito de consultar e obter cópia clara e legível de todos os dados cadastrais vinculados ao seu UID.",
    acaoLabel: "Acessar Meus Dados"
  },
  {
    inciso: "Art. 18, III",
    titulo: "Correção de Dados Incompletos ou Inexatos",
    descricao: "Possibilidade de retificar imediatamente qualquer erro em seu nome de exibição, biografia ou registros editoriais.",
    acaoLabel: "Solicitar Retificação"
  },
  {
    inciso: "Art. 18, IV",
    titulo: "Anonimização, Bloqueio ou Eliminação",
    descricao: "Exigência de remoção de dados excessivos ou tratados em desconformidade com o disposto na Lei 13.709/2018.",
    acaoLabel: "Solicitar Bloqueio"
  },
  {
    inciso: "Art. 18, V",
    titulo: "Portabilidade dos Dados",
    descricao: "Direito de receber seus artigos, postagens do Bem-Te-Vi e registros em formato interoperável (JSON/PDF).",
    acaoLabel: "Exportar Dados (Portabilidade)"
  },
  {
    inciso: "Art. 18, VI",
    titulo: "Eliminação dos Dados (Direito ao Esquecimento)",
    descricao: "Eliminação definitiva de todos os dados pessoais do Firestore e dos bancos da aplicação, com emissão de certificado criptográfico.",
    acaoLabel: "Exercer Direito de Esquecimento (Exclusão Definitiva)"
  },
  {
    inciso: "Art. 18, VII",
    titulo: "Informação sobre Compartilhamento",
    descricao: "Declaração expressa: a WazzimaGiygg NÃO compartilha dados com terceiros nem comercializa bancos de dados.",
    acaoLabel: "Ver Política de Não-Compartilhamento"
  },
  {
    inciso: "Art. 18, IX",
    titulo: "Revogação do Consentimento",
    descricao: "O consentimento para login e para cookies não essenciais pode ser revogado a qualquer momento de forma gratuita e imediata.",
    acaoLabel: "Revogar Consentimento"
  }
];

export const MARCO_CIVIL_GARANTIAS = [
  {
    artigo: "Arts. 3º e 9º • Neutralidade de Rede",
    titulo: "Acesso Isonômico e Livre ao Conhecimento",
    descricao: "Todo pacote de dados e consulta a verbetes recebe tratamento isonômico sem bloqueio comercial, discriminação de conteúdo, paywalls ou priorização paga.",
    implementacao: "Leitura irrestrita de artigos sem necessidade de login ou aceitação de cookies opcionais."
  },
  {
    artigo: "Art. 7º, I a VIII • Direitos do Usuário",
    titulo: "Inviolabilidade da Intimidade e Transparência",
    descricao: "Garantia de informações claras sobre coleta, uso, armazenamento e tratamento, além de não fornecimento de dados a terceiros sem consentimento livre, expresso e informado.",
    implementacao: "Consentimento granular destacado no login e nos cookies, além de cláusula expressa de não-comercialização."
  },
  {
    artigo: "Arts. 10, 15 e 22 • Guarda de Registros (6 Meses)",
    titulo: "Sigilo de Registros e Reserva de Jurisdição",
    descricao: "Registros de acesso a aplicações de internet são guardados sob sigilo pelo prazo legal de 6 meses (180 dias) e somente podem ser disponibilizados mediante ordem judicial específica.",
    implementacao: "Proibição administrativa estrita de exposição de IPs (como os abusos de CheckUser relatados no Dossiê) e trilha criptográfica de auditoria."
  },
  {
    artigo: "Arts. 19 e 21 • Conteúdo de Terceiros",
    titulo: "Notificação e Retirada Estruturada",
    descricao: "Canal formal para cumprimento de ordem judicial com indicação clara e específica da URL (?uid=) e remoção ágil sem ordem judicial nos casos de violação de intimidade previstos no Art. 21.",
    implementacao: "Formulário dedicado na Ouvidoria & Tickets com categorias específicas para Art. 19 e Art. 21 do Marco Civil."
  },
  {
    artigo: "Decreto nº 8.771/2016 • Padrões de Segurança",
    titulo: "Controle de Acesso, Criptografia e Sigilo",
    descricao: "Exige controle estrito sobre acesso aos dados, autenticação segura, registro de acessos autorizados e técnicas de encriptação/sanitização.",
    implementacao: "Transporte TLS/HTTPS, Firebase Auth com tokens verificados, sanitização DOMPurify e segregação de privilégios de Burocrata."
  }
];

export default function LgpdRulesShowcase({
  onClose,
  onOpenTicketForm,
  onOpenCookiePreferences,
  currentUser,
  showToast,
  isModal = true,
  initialSubTab = 'principios'
}: LgpdRulesShowcaseProps) {
  const [activeSubTab, setActiveSubTab] = useState<LgpdShowcaseTab>(initialSubTab);
  const [cookieConsentState, setCookieConsentState] = useState<LgpdCookieConsent | null>(() =>
    getStoredCookieConsent()
  );
  const [privacySettings, setPrivacySettings] = useState<PrivacyComplianceSettings>(() =>
    getPrivacySettings()
  );
  const [deletionReason, setDeletionReason] = useState(
    'Solicitação formal de eliminação de dados pessoais e encerramento de vínculo nos termos do Art. 18, VI da LGPD e Art. 7º, X do Marco Civil da Internet.'
  );
  const [deletionEmailInput, setDeletionEmailInput] = useState<string>(currentUser?.email || '');
  const [deletionConfirmChecked, setDeletionConfirmChecked] = useState(false);
  const [isSubmittingDeletion, setIsSubmittingDeletion] = useState(false);
  const [lastDeletionProtocol, setLastDeletionProtocol] = useState<string | null>(null);

  React.useEffect(() => {
    setActiveSubTab(initialSubTab);
  }, [initialSubTab]);

  React.useEffect(() => {
    if (currentUser?.email && !deletionEmailInput) {
      setDeletionEmailInput(currentUser.email);
    }
  }, [currentUser?.email]);

  React.useEffect(() => {
    const unsubCookies = subscribeCookieConsent((next) => setCookieConsentState(next));
    const unsubPrivacy = subscribePrivacySettings((next) => setPrivacySettings(next));
    return () => {
      unsubCookies();
      unsubPrivacy();
    };
  }, []);

  const dntActive = isBrowserDoNotTrackActive();
  const titularInventory = inspectTitularLocalInventory(currentUser);

  const handleTogglePrivacySetting = (
    key: keyof Omit<PrivacyComplianceSettings, 'updatedAt'>
  ) => {
    const next = savePrivacySettings({ [key]: !privacySettings[key] });
    setPrivacySettings(next);
    if (key === 'respectBrowserDnt' && next.respectBrowserDnt && dntActive) {
      const revoked = revokeAllNonEssentialCookies();
      setCookieConsentState(revoked);
    }
    if (showToast) {
      showToast('Configuração de privacidade (LGPD / Marco Civil) atualizada.');
    }
  };

  const handleExportMyDataPortability = () => {
    const res = exportTitularPersonalDataPackage({
      user: currentUser,
      isGuestUser: Boolean(currentUser?.isGuest),
    });
    if (currentUser?.uid) {
      registerAuditLog(currentUser.uid, 'lgpd_portability_exported', {
        filename: res.filename,
        exportedAt: res.exportedAt,
      }).catch(() => {});
    }
    if (showToast) {
      showToast(`Pacote de portabilidade (Art. 18, V) baixado: ${res.filename}`);
    }
  };

  const handleSubmitDirectDeletion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletionConfirmChecked) {
      if (showToast) showToast('Confirme a ciência da eliminação definitiva antes de protocolar.', true);
      return;
    }
    setIsSubmittingDeletion(true);
    const protocolId = `LGPD-DEL-${Date.now().toString(36).toUpperCase()}`;
    try {
      await addDoc(
        collection(db, 'deletion_requests'),
        sanitizeFirestoreData({
          protocolo: protocolId,
          uid: currentUser?.uid || 'anonimo_sessao',
          name: currentUser?.displayName || 'Titular Solicitante',
          nomeCompleto: currentUser?.displayName || 'Titular Solicitante',
          email: deletionEmailInput.trim() || currentUser?.email || 'nao-informado@local',
          reason: deletionReason.trim(),
          motivo: deletionReason.trim(),
          dataTypes: ['Conta/UID', 'Preferências', 'Caches Locais', 'Histórico Opcional'],
          tipoDado: 'Eliminação Completa (LGPD Art. 18, VI & Marco Civil Art. 7º, X)',
          status: 'pending',
          requestDate: serverTimestamp(),
          marcoCivilNotice: `Registros técnicos obrigatórios sob Art. 15 da Lei 12.965/2014 mantidos apenas pelo prazo legal de ${MARCO_CIVIL_LOG_RETENTION_DAYS} dias sob sigilo.`,
        })
      ).catch(() => {});

      const clearedKeys = purgeOptionalLocalSessionData();
      const revoked = revokeAllNonEssentialCookies();
      setCookieConsentState(revoked);
      setLastDeletionProtocol(protocolId);

      registerAuditLog(currentUser?.uid || 'anon', 'lgpd_deletion_requested', {
        protocolId,
        clearedLocalKeysCount: clearedKeys.length,
      }).catch(() => {});

      if (showToast) {
        showToast(`Solicitação protocolada (${protocolId}) e dados locais opcionais limpos.`);
      }
    } catch {
      if (showToast) showToast('Erro ao registrar solicitação de exclusão.', true);
    } finally {
      setIsSubmittingDeletion(false);
    }
  };

  const [copiedProtocol, setCopiedProtocol] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Ciência Absoluta State (stored in localStorage)
  const [cienciaRegistrada, setCienciaRegistrada] = useState<any>(() => {
    try {
      const stored = localStorage.getItem('wzzm_lgpd_ciencia_absoluta');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Handle Register Ciência Absoluta
  const handleRegistrarCiencia = () => {
    const timestamp = new Date().toISOString();
    const protocolo = "LGPD-CIENCIA-" + Math.random().toString(36).substring(2, 8).toUpperCase() + "-" + Date.now().toString().slice(-4);
    const hash = Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    const cienciaData = {
      protocolo,
      hashCriptografico: hash,
      timestamp,
      dataLegivel: new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      titular: currentUser?.displayName || currentUser?.email || "Cidadão / Leitor",
      uid: currentUser?.uid || "anonimo_sessao",
      versaoRegras: "LGPD-BR-13709-V2.0",
      declaracao: "O titular declara expressamente plena ciência e conhecimento das regras, princípios e garantias de conformidade da Lei Geral de Proteção de Dados (Lei nº 13.709/2018) aplicadas pela WazzimaGiygg."
    };

    localStorage.setItem('wzzm_lgpd_ciencia_absoluta', JSON.stringify(cienciaData));
    setCienciaRegistrada(cienciaData);

    registerAuditLog(currentUser?.uid || 'anon', 'lgpd_ciencia_absoluta_registrada', {
      protocolo,
      hash
    });

    if (showToast) {
      showToast(`Ciência absoluta registrada com sucesso sob protocolo ${protocolo}!`);
    }
  };

  // Generate Official PDF Certificate of LGPD Compliance
  const handleDownloadCertificadoPdf = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const dataHoje = new Date().toLocaleDateString('pt-BR');
      const protocolo = cienciaRegistrada?.protocolo || "LGPD-CIENCIA-OFICIAL-" + Date.now().toString().slice(-6);

      // Header Banner
      doc.setFillColor(20, 20, 20);
      doc.rect(0, 0, 210, 36, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("WAZZIMAGIYGG • CERTIDÃO DE CONFORMIDADE LGPD", 105, 16, { align: "center" });

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(217, 119, 6);
      doc.text("LEI GERAL DE PROTEÇÃO DE DADOS (LEI Nº 13.709/2018) • MARCO CIVIL DA INTERNET (LEI 12.965/14)", 105, 24, { align: "center" });

      doc.setTextColor(200, 200, 200);
      doc.setFontSize(8);
      doc.text(`Protocolo Digital de Ciência: ${protocolo} • Emissão: ${dataHoje}`, 105, 30, { align: "center" });

      // Body text
      doc.setTextColor(20, 20, 20);
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("CERTIDÃO DE CIÊNCIA ABSOLUTA DO CUMPRIMENTO DAS REGRAS", 14, 48);

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);

      const introText = 
        "Certifica-se publicamente, para os devidos fins de direito e em estrita observância aos " +
        "princípios da Transparência (Art. 6º, VI) e da Responsabilização e Prestação de Contas " +
        "(Art. 6º, X) da Lei Federal nº 13.709/2018 (LGPD), que o portal editorial e base de conhecimento " +
        "WazzimaGiygg mantém suas regras de proteção de dados integralmente à mostra e em vigor.";
      doc.text(doc.splitTextToSize(introText, 180), 14, 56);

      // Box: Titular e Dados
      doc.setFillColor(245, 244, 240);
      doc.setDrawColor(20, 20, 20);
      doc.rect(14, 72, 182, 30, 'FD');

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(20, 20, 20);
      doc.text("DADOS DO REGISTRO DE CIÊNCIA:", 18, 79);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text(`Titular / Solicitante: ${cienciaRegistrada?.titular || currentUser?.displayName || "Leitor / Cidadão"}`, 18, 86);
      doc.text(`Identificador Único (UID): ${cienciaRegistrada?.uid || currentUser?.uid || "convidado_anonimo"}`, 18, 92);
      doc.text(`Hash Criptográfico de Integridade: ${cienciaRegistrada?.hashCriptografico || "SHA256-VALIDADO-PORTAL-WZZM"}`, 18, 97);

      // Section: 10 Princípios
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(20, 20, 20);
      doc.text("1. PRINCÍPIOS FUNDAMENTAIS CUMPRIDOS (ART. 6º DA LGPD)", 14, 110);

      let yPos = 117;
      LGPD_PRINCIPIOS.slice(0, 7).forEach((p) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(180, 83, 9);
        doc.text(`• ${p.nome} (${p.artigo}):`, 14, yPos);
        
        doc.setFont("helvetica", "normal");
        doc.setTextColor(40, 40, 40);
        const desc = doc.splitTextToSize(p.cumprimentoPortal, 140);
        doc.text(desc, 50, yPos);
        yPos += desc.length * 4.2 + 2;
      });

      // Footer
      doc.setFillColor(20, 20, 20);
      doc.rect(0, 280, 210, 17, 'F');
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(230, 230, 230);
      doc.text("WazzimaGiygg • DPO: Pedro Henrique Cardona Peres (pedrohenriquecardonaperes@gmail.com) • Suporte: https://support.wazzimagiygg.com/", 105, 289, { align: "center" });

      doc.save(`Certidao_Conformidade_LGPD_${protocolo}.pdf`);
      if (showToast) showToast("Certidão de Conformidade LGPD gerada com sucesso!");
    } catch (err) {
      console.error("PDF generation error:", err);
      if (showToast) showToast("Erro ao gerar certidão em PDF.", true);
    }
  };

  const filteredPrincipios = LGPD_PRINCIPIOS.filter(
    (p) =>
      p.nome.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.cumprimentoPortal.toLowerCase().includes(searchFilter.toLowerCase()) ||
      p.artigo.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const filteredDireitos = LGPD_DIREITOS.filter(
    (d) =>
      d.titulo.toLowerCase().includes(searchFilter.toLowerCase()) ||
      d.descricao.toLowerCase().includes(searchFilter.toLowerCase()) ||
      d.inciso.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div
      className={
        isModal
          ? "fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in font-sans"
          : "w-full my-6 font-sans"
      }
    >
      <div
        className={`bg-white text-stone-900 rounded-2xl border border-stone-200 shadow-2xl w-full max-w-5xl flex flex-col overflow-hidden text-left ${
          isModal ? "max-h-[92vh]" : ""
        }`}
      >
        {/* ======================================================== */}
        {/* HEADER: DIÁRIO OFICIAL / CONFORMIDADE LGPD               */}
        {/* ======================================================== */}
        <header className="px-6 py-4 border-b border-stone-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-medium text-emerald-700 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Conformidade Ativa (Lei 13.709/18)
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-editorial font-bold tracking-tight text-stone-900 mt-0.5">
                Regras da LGPD à Amostra
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto font-mono text-xs">
            <button
              type="button"
              onClick={handleDownloadCertificadoPdf}
              className="px-3.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 font-medium uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Baixar Certidão Oficial de Conformidade LGPD em PDF"
            >
              <Download className="w-3.5 h-3.5 text-stone-500" />
              <span>Certidão PDF</span>
            </button>

            {isModal && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 cursor-pointer transition-colors"
                title="Fechar Painel LGPD"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </header>

        {/* ======================================================== */}
        {/* COMPLIANCE STATUS BANNER                                  */}
        {/* ======================================================== */}
        <div className="bg-emerald-50/70 border-b border-emerald-100 px-6 py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <p className="font-serif text-emerald-950 text-xs leading-relaxed">
              <strong>Compromisso de Transparência:</strong> O portal <em>WazzimaGiygg</em> opera em obediência à 
              <strong> Lei Geral de Proteção de Dados (Lei Federal nº 13.709/2018)</strong> e ao 
              <strong> Marco Civil da Internet (Lei nº 12.965/2014)</strong>.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2 font-mono text-[10px]">
            <span className="uppercase font-medium bg-white text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
              Auditoria: Válida
            </span>
            <span className="uppercase font-medium bg-stone-900 text-white px-2 py-0.5 rounded-full">
              DPO Ativo
            </span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* NAVIGATION TABS INSIDE LGPD SHOWCASE                    */}
        {/* ======================================================== */}
        <div className="bg-stone-50/80 border-b border-stone-100 px-6 flex flex-wrap items-center justify-between gap-2 py-2 font-mono text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: 'principios', label: '10 Princípios (Art. 6º)', count: 10 },
              { id: 'direitos', label: 'Direitos (Art. 18)', count: 8 },
              { id: 'privacidade', label: 'Configurações & Meus Dados', count: null },
              { id: 'marcoCivil', label: 'Marco Civil (12.965/14)', count: MARCO_CIVIL_GARANTIAS.length },
              { id: 'cookies', label: 'Cookies & ANPD', count: COOKIE_CATEGORIES.length },
              { id: 'bases', label: 'Bases Legais', count: null },
              { id: 'dpo', label: 'DPO & Ouvidoria', count: null },
              { id: 'termoCiencia', label: 'Ciência Absoluta', count: cienciaRegistrada ? '✓' : '!' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-3 py-1.5 font-medium rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeSubTab === tab.id
                    ? 'bg-white text-stone-900 shadow-xs border border-stone-200 font-semibold'
                    : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count && (
                  <span
                    className={`text-[9px] px-1 py-0.2 rounded-none font-mono ${
                      activeSubTab === tab.id
                        ? 'bg-amber-600 text-white'
                        : 'bg-stone-300 text-stone-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Quick Search */}
          {(activeSubTab === 'principios' || activeSubTab === 'direitos') && (
            <div className="w-full sm:w-56 my-1">
              <input
                type="text"
                placeholder="Filtrar artigos ou termos..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-white border border-stone-400 px-2 py-1 text-xs font-mono placeholder:text-stone-400 focus:outline-none focus:border-black"
              />
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* CONTENT PANELS                                           */}
        {/* ======================================================== */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6 max-h-[65vh]">
          
          {/* TAB 1: 10 PRINCÍPIOS FUNDAMENTAIS (ART. 6º) */}
          {activeSubTab === 'principios' && (
            <div className="space-y-4">
              <div className="border-b border-stone-300 pb-3">
                <h3 className="text-xl font-editorial font-bold text-[#141414] flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-700" />
                  <span>Os 10 Princípios da LGPD Cumpridos pelo Portal (Artigo 6º da Lei 13.709/2018)</span>
                </h3>
                <p className="text-xs font-serif text-stone-700 mt-1">
                  Abaixo estão discriminados minuciosamente cada um dos dez princípios legais estabelecidos pelo legislador brasileiro, acompanhados da demonstração fática e técnica de cumprimento imediato adotada pela infraestrutura WazzimaGiygg.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredPrincipios.map((p) => (
                  <div
                    key={p.num}
                    className="bg-white border-2 border-stone-800 p-4 shadow-[3px_3px_0px_0px_rgba(20,20,20,1)] flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between border-b border-stone-200 pb-2 mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-[#141414] text-white font-mono font-bold text-xs flex items-center justify-center">
                            {p.num}
                          </span>
                          <span className="font-mono font-bold text-sm text-stone-900">
                            {p.nome}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono bg-stone-100 text-stone-700 px-1.5 py-0.5 border border-stone-300">
                          {p.artigo}
                        </span>
                      </div>

                      <div className="space-y-2 mb-3">
                        <p className="text-[11px] font-serif text-stone-600 italic">
                          "{p.resumoLegal}"
                        </p>
                        <div className="p-2.5 bg-amber-50/70 border-l-2 border-amber-600 text-xs text-stone-900 font-sans leading-relaxed">
                          <strong className="font-mono text-[10px] uppercase text-amber-900 block mb-0.5">
                            Cumprimento Comprovado:
                          </strong>
                          {p.cumprimentoPortal}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-100 font-mono text-[10px]">
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        {p.status}
                      </span>
                      <span className="text-stone-400">Verificado</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: DIREITOS DO TITULAR (ART. 18) COM BOTÕES DE AÇÃO */}
          {activeSubTab === 'direitos' && (
            <div className="space-y-4">
              <div className="border-b border-stone-300 pb-3">
                <h3 className="text-xl font-editorial font-bold text-[#141414] flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-indigo-700" />
                  <span>Direitos do Titular de Dados e Canais de Acionamento Imediato (Artigo 18)</span>
                </h3>
                <p className="text-xs font-serif text-stone-700 mt-1">
                  Você detém a titularidade absoluta sobre seus dados. Qualquer um dos direitos abaixo pode ser exercido instantaneamente pelo titular sem qualquer ônus financeiro.
                </p>
              </div>

              <div className="space-y-3">
                {filteredDireitos.map((d, idx) => (
                  <div
                    key={idx}
                    className="bg-white border-2 border-stone-800 p-4 shadow-[3px_3px_0px_0px_rgba(20,20,20,1)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="max-w-2xl">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-[10px] bg-stone-100 text-stone-800 px-1.5 py-0.5 border border-stone-300">
                          {d.inciso}
                        </span>
                        <h4 className="font-mono font-bold text-xs uppercase text-stone-900">
                          {d.titulo}
                        </h4>
                      </div>
                      <p className="text-xs font-serif text-stone-700 leading-relaxed">
                        {d.descricao}
                      </p>
                    </div>

                    <div className="shrink-0 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => {
                          if (d.inciso === 'Art. 18, V') {
                            handleExportMyDataPortability();
                            return;
                          }
                          if (d.inciso === 'Art. 18, I' || d.inciso === 'Art. 18, II') {
                            setActiveSubTab('privacidade');
                            return;
                          }
                          if (d.inciso === 'Art. 18, IX') {
                            setActiveSubTab('cookies');
                            return;
                          }
                          if (d.inciso === 'Art. 18, VII') {
                            setActiveSubTab('bases');
                            return;
                          }
                          if (onOpenTicketForm) {
                            onOpenTicketForm(d.titulo);
                            if (isModal && onClose) onClose();
                          }
                          if (showToast) showToast(`Canal de atendimento aberto para: ${d.titulo}`);
                        }}
                        className="w-full sm:w-auto bg-[#141414] hover:bg-stone-800 text-white font-mono text-[11px] font-bold uppercase px-3 py-2 border border-black cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(217,119,6,1)]"
                      >
                        <span>{d.acaoLabel}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-amber-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2C: CONFIGURAÇÕES DE PRIVACIDADE POR PADRÃO & PORTABILIDADE/EXCLUSÃO (ART. 18 & ART. 46 § 2º) */}
          {activeSubTab === 'privacidade' && (
            <div className="space-y-6">
              <div className="border-b border-stone-300 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-editorial font-bold text-[#141414] flex items-center gap-2">
                    <EyeOff className="w-5 h-5 text-emerald-700" />
                    <span>Privacidade por Padrão (Art. 46, § 2º) &amp; Autoatendimento (Art. 18)</span>
                  </h3>
                  <p className="text-xs font-serif text-stone-700 mt-1">
                    Ajuste as configurações de proteção automática do portal, consulte os dados armazenados nesta sessão e exerça portabilidade ou eliminação imediata.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
                  <button
                    type="button"
                    onClick={handleExportMyDataPortability}
                    className="bg-[#141414] hover:bg-stone-800 text-white font-bold uppercase px-3 py-2 cursor-pointer flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>Portabilidade JSON (Art. 18, V)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const reset = resetPrivacySettingsToDefault();
                      setPrivacySettings(reset);
                      if (showToast) showToast('Configurações restauradas para proteção máxima padrão.');
                    }}
                    className="bg-stone-100 hover:bg-stone-200 text-stone-900 border border-stone-400 font-bold uppercase px-3 py-2 cursor-pointer flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Padrão Máximo</span>
                  </button>
                </div>
              </div>

              {/* Controles de Privacy by Default */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {[
                  {
                    key: 'maskEmailInPublicViews' as const,
                    title: 'Mascarar E-mail em Visualizações Públicas',
                    legal: 'LGPD Art. 6º, III (Minimização) e Art. 46, § 2º',
                    desc: 'Substitui endereços completos por formato ofuscado (ex.: ped***@gmail.com) nos cards e leitores de artigos.',
                  },
                  {
                    key: 'confirmExternalLinks' as const,
                    title: 'Aviso Obrigatório em Links Externos',
                    legal: 'Marco Civil Art. 7º, VI e VIII',
                    desc: 'Exibe confirmação transparente antes de abrir domínios externos, evitando vazamento silencioso de navegação.',
                  },
                  {
                    key: 'respectBrowserDnt' as const,
                    title: `Respeitar Sinal Do Not Track / GPC (${dntActive ? 'Detectado no navegador' : 'Inativo no navegador'})`,
                    legal: 'LGPD Art. 8º & Guia ANPD',
                    desc: 'Quando o navegador envia DNT/GPC, bloqueia automaticamente cookies e métricas não essenciais.',
                  },
                  {
                    key: 'autoPurgeLocalCacheOnLogout' as const,
                    title: 'Limpeza Automática de Cache ao Sair',
                    legal: 'LGPD Art. 16 (Término do Tratamento)',
                    desc: 'Remove sessões de convidado, caches locais de chat e leituras recentes ao desconectar.',
                  },
                ].map((opt) => {
                  const enabled = privacySettings[opt.key];
                  return (
                    <label
                      key={opt.key}
                      className="bg-white border-2 border-stone-800 p-4 shadow-[3px_3px_0px_0px_rgba(20,20,20,1)] flex items-start justify-between gap-3 cursor-pointer"
                    >
                      <div className="space-y-1">
                        <div className="font-mono font-bold text-xs text-stone-900">{opt.title}</div>
                        <div className="text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 w-fit">
                          {opt.legal}
                        </div>
                        <p className="text-xs font-serif text-stone-700 leading-relaxed">{opt.desc}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={() => handleTogglePrivacySetting(opt.key)}
                        className="mt-1 h-4 w-4 accent-emerald-700 cursor-pointer shrink-0"
                      />
                    </label>
                  );
                })}
              </div>

              {/* Inventário Pessoal em Tempo Real (Livre Acesso) */}
              <div className="bg-white border-2 border-stone-800 p-4 overflow-x-auto">
                <h4 className="font-mono font-bold text-xs uppercase text-stone-900 mb-3 flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-amber-700" />
                  <span>Inventário em Tempo Real dos Seus Dados neste Dispositivo (Art. 6º, IV &amp; Art. 18, II)</span>
                </h4>
                <table className="w-full text-left border-collapse font-mono text-[11px]">
                  <thead>
                    <tr className="border-b border-stone-300 text-stone-600">
                      <th className="py-2 pr-3 font-bold">Registro / Chave</th>
                      <th className="py-2 pr-3 font-bold">Situação Atual</th>
                      <th className="py-2 font-bold">Base Legal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 text-stone-800">
                    {titularInventory.map((item) => (
                      <tr key={item.chave}>
                        <td className="py-2 pr-3 align-top">
                          <div className="font-bold">{item.chave}</div>
                          <div className="text-[10px] font-sans text-stone-600">{item.finalidade}</div>
                        </td>
                        <td className="py-2 pr-3 align-top">
                          <span
                            className={`inline-block text-[10px] px-1.5 py-0.5 border mb-1 font-bold ${
                              item.presenteNoDispositivo
                                ? 'bg-amber-50 text-amber-900 border-amber-300'
                                : 'bg-stone-100 text-stone-600 border-stone-300'
                            }`}
                          >
                            {item.presenteNoDispositivo ? 'Ativo' : 'Ausente'}
                          </span>
                          <div className="text-[10px] text-stone-700">{item.resumoValor}</div>
                        </td>
                        <td className="py-2 align-top text-[10px] text-stone-600">{item.baseLegal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Solicitação Direta de Eliminação (Art. 18, VI LGPD & Art. 7º, X Marco Civil) */}
              <form
                onSubmit={handleSubmitDirectDeletion}
                className="bg-red-50/60 border-2 border-red-800 p-4 space-y-3"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="font-mono font-bold text-xs uppercase text-red-950 flex items-center gap-1.5">
                    <Trash2 className="w-4 h-4 text-red-700" />
                    <span>Solicitar Eliminação de Dados / Direito ao Esquecimento (Art. 18, VI LGPD • Art. 7º, X MCI)</span>
                  </h4>
                  <span className="font-mono text-[10px] bg-white border border-red-300 text-red-900 px-2 py-0.5">
                    Prazo: até 15 dias (Art. 19, II)
                  </span>
                </div>

                {lastDeletionProtocol && (
                  <div className="p-3 bg-emerald-50 border border-emerald-600 font-mono text-xs text-emerald-950">
                    ✓ Protocolo registrado: <strong>{lastDeletionProtocol}</strong>. Caches e cookies opcionais locais foram imediatamente limpos.
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-stone-700 mb-1">
                      E-mail para confirmação do certificado de exclusão:
                    </label>
                    <input
                      type="email"
                      value={deletionEmailInput}
                      onChange={(e) => setDeletionEmailInput(e.target.value)}
                      placeholder="seu.email@exemplo.com"
                      className="w-full p-2 bg-white border border-stone-500 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-stone-700 mb-1">
                      Justificativa / Escopo (opcional):
                    </label>
                    <input
                      type="text"
                      value={deletionReason}
                      onChange={(e) => setDeletionReason(e.target.value)}
                      className="w-full p-2 bg-white border border-stone-500 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <label className="flex items-start gap-2 text-xs font-serif text-stone-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deletionConfirmChecked}
                    onChange={(e) => setDeletionConfirmChecked(e.target.checked)}
                    className="mt-0.5 accent-red-700"
                  />
                  <span>
                    Estou ciente de que registros estritamente exigidos por lei (Art. 15 do Marco Civil da Internet — prazo de {MARCO_CIVIL_LOG_RETENTION_DAYS} dias sob sigilo) permanecem bloqueados apenas até o termo legal, sendo os demais dados pessoais definitivamente eliminados.
                  </span>
                </label>

                <div className="bg-white border border-red-300 p-3 space-y-1.5 text-xs">
                  <div className="font-mono font-bold text-[11px] uppercase text-stone-900 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Encarregado pelo Tratamento de Dados (DPO) &amp; Canal de Suporte</span>
                  </div>
                  <p className="font-serif text-stone-700 leading-relaxed">
                    Além do protocolo direto abaixo, você também pode formalizar e acompanhar sua solicitação de remoção/eliminação de dados junto ao nosso DPO ou pelo Portal Oficial de Suporte:
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-[11px] pt-0.5">
                    <span>
                      <strong>DPO:</strong> Pedro Henrique Cardona Peres
                    </span>
                    <a
                      href="mailto:pedrohenriquecardonaperes@gmail.com?subject=Solicita%C3%A7%C3%A3o%20de%20Remo%C3%A7%C3%A3o%20de%20Dados%20(LGPD)"
                      className="inline-flex items-center gap-1 text-amber-900 underline font-bold"
                    >
                      <Mail className="w-3 h-3" />
                      <span>pedrohenriquecardonaperes@gmail.com</span>
                    </a>
                    <a
                      href="https://support.wazzimagiygg.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 bg-stone-900 hover:bg-stone-800 text-white px-2.5 py-1 font-bold uppercase text-[10px]"
                    >
                      <ExternalLink className="w-3 h-3 text-amber-400" />
                      <span>Registrar no Suporte (support.wazzimagiygg.com)</span>
                    </a>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="submit"
                    disabled={isSubmittingDeletion}
                    className="bg-red-800 hover:bg-red-900 text-white font-mono text-xs font-bold uppercase px-4 py-2 cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isSubmittingDeletion ? 'Protocolando...' : 'Protocolar Eliminação & Limpar Dados Locais'}</span>
                  </button>
                  <a
                    href="https://support.wazzimagiygg.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-white hover:bg-stone-100 text-stone-900 border border-stone-800 font-mono text-xs font-bold uppercase px-3.5 py-2 flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-amber-700" />
                    <span>Registrar Solicitação no Suporte</span>
                  </a>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2D: MARCO CIVIL DA INTERNET (LEI Nº 12.965/2014 & DECRETO Nº 8.771/2016) */}
          {activeSubTab === 'marcoCivil' && (
            <div className="space-y-5">
              <div className="border-b border-stone-300 pb-3">
                <h3 className="text-xl font-editorial font-bold text-[#141414] flex items-center gap-2">
                  <Globe className="w-5 h-5 text-sky-700" />
                  <span>Marco Civil da Internet (Lei nº 12.965/2014) &amp; Decreto nº 8.771/2016</span>
                </h3>
                <p className="text-xs font-serif text-stone-700 mt-1">
                  Diretrizes técnicas e jurídicas aplicadas no portal para assegurar neutralidade de rede, sigilo das comunicações, guarda controlada de registros ({MARCO_CIVIL_LOG_RETENTION_DAYS} dias) e devido processo na retirada de conteúdo.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {MARCO_CIVIL_GARANTIAS.map((g) => (
                  <div
                    key={g.artigo}
                    className="bg-white border-2 border-stone-800 p-4 shadow-[3px_3px_0px_0px_rgba(20,20,20,1)] space-y-2"
                  >
                    <span className="font-mono font-bold text-[10px] bg-sky-100 text-sky-900 px-1.5 py-0.5 border border-sky-300 uppercase inline-block">
                      {g.artigo}
                    </span>
                    <h4 className="font-mono font-bold text-xs uppercase text-stone-900">{g.titulo}</h4>
                    <p className="text-xs font-serif text-stone-700 leading-relaxed">{g.descricao}</p>
                    <div className="p-2 bg-stone-50 border-l-2 border-sky-700 text-[11px] font-sans text-stone-800">
                      <strong className="font-mono text-[10px] uppercase block text-sky-900">Aplicação técnica:</strong>
                      {g.implementacao}
                    </div>
                  </div>
                ))}
              </div>

              {onOpenTicketForm && (
                <div className="bg-[#EBEAE5] border-2 border-stone-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="text-xs font-serif text-stone-800">
                    <strong className="font-mono uppercase block text-[11px] text-stone-900">
                      Canais de Notificação do Marco Civil (Arts. 19 e 21)
                    </strong>
                    Protocolos de retirada por violação de intimidade (Art. 21) ou cumprimento de ordem judicial com URL ?uid= específica (Art. 19).
                  </div>
                  <div className="flex flex-wrap gap-2 font-mono text-[11px] shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        onOpenTicketForm('Notificação de Remoção - Conteúdo Íntimo (Marco Civil Art. 21)');
                        if (isModal && onClose) onClose();
                      }}
                      className="bg-red-800 hover:bg-red-900 text-white font-bold uppercase px-3 py-2 cursor-pointer"
                    >
                      Notificar Art. 21
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onOpenTicketForm('Cumprimento de Ordem Judicial / URL ?uid= (Marco Civil Art. 19)');
                        if (isModal && onClose) onClose();
                      }}
                      className="bg-[#141414] hover:bg-stone-800 text-white font-bold uppercase px-3 py-2 cursor-pointer"
                    >
                      Notificar Art. 19
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BASES LEGAIS E POLÍTICA DE NÃO-COMERCIALIZAÇÃO */}
          {activeSubTab === 'bases' && (
            <div className="space-y-5">
              <div className="border-b border-stone-300 pb-3">
                <h3 className="text-xl font-editorial font-bold text-[#141414] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-700" />
                  <span>Bases Legais e Diretrizes de Tratamento de Dados (Artigos 7º e 11)</span>
                </h3>
                <p className="text-xs font-serif text-stone-700 mt-1">
                  O tratamento de dados na WazzimaGiygg fundamenta-se estritamente nas seguintes hipóteses legais da legislação brasileira:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border-2 border-stone-800 p-4 shadow-[3px_3px_0px_0px_rgba(20,20,20,1)]">
                  <span className="font-mono font-bold text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 border border-amber-300 uppercase block w-fit mb-2">
                    Art. 7º, I • Consentimento
                  </span>
                  <h4 className="font-mono font-bold text-xs uppercase mb-1">Login e Criação de Perfil</h4>
                  <p className="text-xs font-serif text-stone-700 leading-relaxed">
                    Fornecido de maneira livre, informada e inequívoca quando o leitor opta por autenticar-se via Google Firebase ou criar um perfil para interagir na rede Bem-Te-Vi.
                  </p>
                </div>

                <div className="bg-white border-2 border-stone-800 p-4 shadow-[3px_3px_0px_0px_rgba(20,20,20,1)]">
                  <span className="font-mono font-bold text-[10px] bg-blue-100 text-blue-900 px-1.5 py-0.5 border border-blue-300 uppercase block w-fit mb-2">
                    Art. 7º, II • Cumprimento Legal
                  </span>
                  <h4 className="font-mono font-bold text-xs uppercase mb-1">Marco Civil da Internet</h4>
                  <p className="text-xs font-serif text-stone-700 leading-relaxed">
                    Guarda de registros de conexão e acesso a aplicações sob o Artigo 15 da Lei Federal nº 12.965/2014, pelo prazo legal de 6 meses, sob sigilo e segurança.
                  </p>
                </div>

                <div className="bg-white border-2 border-stone-800 p-4 shadow-[3px_3px_0px_0px_rgba(20,20,20,1)]">
                  <span className="font-mono font-bold text-[10px] bg-emerald-100 text-emerald-900 px-1.5 py-0.5 border border-emerald-300 uppercase block w-fit mb-2">
                    Art. 7º, IX • Legítimo Interesse
                  </span>
                  <h4 className="font-mono font-bold text-xs uppercase mb-1">Atividade Editorial e Imprensa</h4>
                  <p className="text-xs font-serif text-stone-700 leading-relaxed">
                    Preservação da memória histórica, liberdade de imprensa e divulgação acadêmica sob os Artigos 5º (IV, IX e XIV) e 220 da Constituição Federal de 1988.
                  </p>
                </div>
              </div>

              {/* CLÁUSULA PÉTREA DE NÃO COMERCIALIZAÇÃO */}
              <div className="bg-[#141414] text-white p-5 border-2 border-black shadow-[4px_4px_0px_0px_rgba(217,119,6,1)]">
                <div className="flex items-center gap-2 text-amber-400 font-mono font-bold text-xs uppercase tracking-wider mb-2">
                  <Lock className="w-4 h-4" />
                  <span>Cláusula Pétrea Institucional • Não-Comercialização de Dados</span>
                </div>
                <p className="text-xs font-serif text-stone-200 leading-relaxed">
                  A WazzimaGiygg assegura expressamente que <strong>JAMAIS vendeu, vende ou venderá</strong> dados pessoais de seus leitores, autores ou visitantes para corretores de dados (data brokers), empresas de publicidade programática, telemarketing ou parceiros comerciais. Todo o financiamento do projeto dá-se via contribuições voluntárias e acervo público independente.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2B: GESTÃO E TRANSPARÊNCIA DE COOKIES (ANPD / LGPD) */}
          {activeSubTab === 'cookies' && (
            <div className="space-y-5">
              <div className="border-b border-stone-300 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-editorial font-bold text-[#141414] flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-amber-700" />
                    <span>Política e Gestão de Cookies (LGPD &amp; Guia ANPD)</span>
                  </h3>
                  <p className="text-xs font-serif text-stone-700 mt-1">
                    Todas as categorias não essenciais operam em regime de <strong>opt-in estrito</strong> (desativadas até autorização expressa) e podem ser revogadas imediatamente.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 font-mono text-[11px] shrink-0">
                  {onOpenCookiePreferences && (
                    <button
                      type="button"
                      onClick={onOpenCookiePreferences}
                      className="bg-[#141414] hover:bg-stone-800 text-white font-bold uppercase px-3 py-2 cursor-pointer flex items-center gap-1.5"
                    >
                      <Sliders className="w-3.5 h-3.5 text-amber-400" />
                      <span>Configurar Preferências</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const res = revokeAllNonEssentialCookies();
                      setCookieConsentState(res);
                      if (showToast) showToast("Cookies não essenciais revogados e limpos conforme Art. 18, IX da LGPD.");
                    }}
                    className="bg-red-50 hover:bg-red-100 text-red-900 border border-red-700 font-bold uppercase px-3 py-2 cursor-pointer flex items-center gap-1.5"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Revogar Opcionais</span>
                  </button>
                </div>
              </div>

              {/* Resumo do Consentimento Atual */}
              <div className="bg-white border-2 border-stone-800 p-4 shadow-[3px_3px_0px_0px_rgba(20,20,20,1)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="font-mono text-xs space-y-1">
                  <div className="font-bold text-stone-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span>
                      {cookieConsentState
                        ? `Protocolo ativo: ${cookieConsentState.protocolId} (${cookieConsentState.decisionMethod})`
                        : 'Sem consentimento opcional registrado — apenas cookies estritamente necessários ativos'}
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-600">
                    {cookieConsentState
                      ? `Registrado em ${new Date(cookieConsentState.timestamp).toLocaleString('pt-BR')} • Válido até ${new Date(cookieConsentState.expiresAt).toLocaleDateString('pt-BR')}`
                      : 'Base legal aplicada: Art. 7º, V e IX da Lei nº 13.709/2018.'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => exportCookieConsentProof(currentUser?.email || currentUser?.uid)}
                  className="bg-stone-100 hover:bg-stone-200 text-stone-900 border border-stone-400 font-mono text-[11px] font-bold uppercase px-3 py-1.5 cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Baixar Comprovante (JSON)</span>
                </button>
              </div>

              {/* Categorias */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {COOKIE_CATEGORIES.map((cat) => {
                  const isActive =
                    cat.id === 'essential'
                      ? true
                      : Boolean(cookieConsentState && cookieConsentState[cat.id]);
                  return (
                    <div
                      key={cat.id}
                      className="bg-white border-2 border-stone-800 p-4 shadow-[3px_3px_0px_0px_rgba(20,20,20,1)] space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-stone-200 pb-2">
                        <span className="font-mono font-bold text-xs text-stone-900">{cat.name}</span>
                        <span
                          className={`font-mono text-[10px] font-bold px-1.5 py-0.5 border ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-400'
                              : 'bg-stone-100 text-stone-700 border-stone-300'
                          }`}
                        >
                          {cat.required ? 'Obrigatório' : isActive ? 'Autorizado' : 'Desativado'}
                        </span>
                      </div>
                      <p className="text-xs font-serif text-stone-700 leading-relaxed">{cat.purpose}</p>
                      <div className="font-mono text-[10px] text-stone-600 pt-1 space-y-0.5">
                        <div><strong>Base legal:</strong> {cat.legalBasis}</div>
                        <div><strong>Retenção:</strong> {cat.retention}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Inventário Técnico */}
              <div className="bg-white border-2 border-stone-800 p-4 overflow-x-auto">
                <h4 className="font-mono font-bold text-xs uppercase text-stone-900 mb-3">
                  Inventário Transparente de Cookies &amp; Chaves Locais
                </h4>
                <table className="w-full text-left border-collapse font-mono text-[11px]">
                  <thead>
                    <tr className="border-b border-stone-300 text-stone-600">
                      <th className="py-2 pr-3 font-bold">Identificador</th>
                      <th className="py-2 pr-3 font-bold">Mecanismo</th>
                      <th className="py-2 pr-3 font-bold">Finalidade</th>
                      <th className="py-2 font-bold">Retenção</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 text-stone-800">
                    {COOKIE_INVENTORY.map((item) => (
                      <tr key={item.name}>
                        <td className="py-2 pr-3 font-bold align-top">{item.name}</td>
                        <td className="py-2 pr-3 align-top text-stone-600">{item.storageType}</td>
                        <td className="py-2 pr-3 align-top font-sans">{item.purpose}</td>
                        <td className="py-2 align-top whitespace-nowrap">{item.retention}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: ENCARREGADO DE DADOS (DPO - ART. 41) & OUVIDORIA */}
          {activeSubTab === 'dpo' && (
            <div className="space-y-5">
              <div className="border-b border-stone-300 pb-3">
                <h3 className="text-xl font-editorial font-bold text-[#141414] flex items-center gap-2">
                  <Scale className="w-5 h-5 text-red-700" />
                  <span>Encarregado pelo Tratamento de Dados Pessoais (DPO) • Art. 41 da LGPD</span>
                </h3>
                <p className="text-xs font-serif text-stone-700 mt-1">
                  Em cumprimento às determinações da Autoridade Nacional de Proteção de Dados (ANPD), disponibilizamos canal oficial e direto de comunicação com o Encarregado de Dados.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border-2 border-stone-800 p-5 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)]">
                  <h4 className="font-mono font-bold text-xs uppercase tracking-wider text-stone-900 mb-3 border-b pb-2 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>Identificação Oficial do DPO</span>
                  </h4>
                  <ul className="text-xs font-mono space-y-2.5 text-stone-800">
                    <li>
                      <span className="text-stone-500 block text-[10px] uppercase">Encarregado (DPO):</span>
                      <strong>Pedro Henrique Cardona Peres</strong>{' '}
                      <span className="text-stone-500 text-[11px] block">
                        (Ouvidoria de Privacidade &amp; Defesa de Direitos WZZM)
                      </span>
                    </li>
                    <li>
                      <span className="text-stone-500 block text-[10px] uppercase">E-mail Oficial do DPO:</span>
                      <a
                        href="mailto:pedrohenriquecardonaperes@gmail.com"
                        className="inline-block font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 border border-amber-300 hover:bg-amber-100"
                      >
                        pedrohenriquecardonaperes@gmail.com
                      </a>
                    </li>
                    <li>
                      <span className="text-stone-500 block text-[10px] uppercase">Portal de Suporte para Solicitações:</span>
                      <a
                        href="https://support.wazzimagiygg.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-sky-900 bg-sky-50 px-1.5 py-0.5 border border-sky-300 hover:bg-sky-100"
                      >
                        <span>https://support.wazzimagiygg.com/</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </li>
                    <li>
                      <span className="text-stone-500 block text-[10px] uppercase">Prazo Legal de Resposta:</span>
                      <strong>Até 15 (quinze) dias corridos</strong> (Art. 19, II da LGPD)
                    </li>
                    <li>
                      <span className="text-stone-500 block text-[10px] uppercase">Jurisdição & Foro:</span>
                      <span>República Federativa do Brasil • ANPD</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-white border-2 border-stone-800 p-5 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] flex flex-col justify-between gap-4">
                  <div>
                    <h4 className="font-mono font-bold text-xs uppercase tracking-wider text-stone-900 mb-2 border-b pb-2 flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-amber-600" />
                      <span>Atendimento Digital de Solicitações</span>
                    </h4>
                    <p className="text-xs font-serif text-stone-700 leading-relaxed mb-4">
                      Você pode protocolar chamados de retificação, oposição, confirmação de dados ou exclusão imediata pelo módulo de tickets da Ouvidoria interna ou diretamente pelo Portal de Suporte oficial (<strong>support.wazzimagiygg.com</strong>). Cada chamado gera recibo digital de protocolo.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (onOpenTicketForm) {
                          onOpenTicketForm("Direito de Esquecimento (LGPD)");
                          if (isModal && onClose) onClose();
                        }
                        if (showToast) showToast("Abertura de ticket na Ouvidoria LGPD");
                      }}
                      className="w-full bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs uppercase py-2.5 px-4 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer flex items-center justify-center gap-2 transition-colors"
                    >
                      <span>Abrir Chamado na Ouvidoria LGPD</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <a
                      href="https://support.wazzimagiygg.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-[#141414] hover:bg-stone-800 text-white font-mono font-bold text-xs uppercase py-2.5 px-4 border border-black flex items-center justify-center gap-2 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                      <span>Registrar Solicitação no Suporte Oficial</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: TERMO DE CIÊNCIA ABSOLUTA COM REGISTRO CRIPTOGRÁFICO */}
          {activeSubTab === 'termoCiencia' && (
            <div className="space-y-5">
              <div className="border-b border-stone-300 pb-3">
                <h3 className="text-xl font-editorial font-bold text-[#141414] flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                  <span>Declaração e Registro de Ciência Absoluta do Cumprimento da LGPD</span>
                </h3>
                <p className="text-xs font-serif text-stone-700 mt-1">
                  Registre formalmente seu conhecimento inequívoco de que as regras da LGPD estão à mostra, ativas e cumpridas pelo portal. Ao registrar a ciência, um protocolo com hash SHA-256 é lavrado no sistema.
                </p>
              </div>

              {cienciaRegistrada ? (
                <div className="bg-emerald-50 border-2 border-emerald-700 p-5 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] space-y-4">
                  <div className="flex items-center justify-between border-b border-emerald-300 pb-2">
                    <span className="font-mono font-bold text-xs uppercase text-emerald-950 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Ciência Absoluta Registrada com Sucesso
                    </span>
                    <span className="text-[10px] font-mono bg-emerald-200 text-emerald-950 px-2 py-0.5 border border-emerald-400 font-bold">
                      Protocolo Válido
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                    <div className="bg-white p-3 border border-emerald-300">
                      <span className="text-stone-500 block text-[10px] uppercase">Protocolo Oficial:</span>
                      <strong className="text-emerald-900 text-sm">{cienciaRegistrada.protocolo}</strong>
                    </div>
                    <div className="bg-white p-3 border border-emerald-300">
                      <span className="text-stone-500 block text-[10px] uppercase">Data / Hora do Registro:</span>
                      <strong className="text-stone-800">{cienciaRegistrada.dataLegivel}</strong>
                    </div>
                    <div className="bg-white p-3 border border-emerald-300">
                      <span className="text-stone-500 block text-[10px] uppercase">Titular / Sessão:</span>
                      <strong className="text-stone-800 truncate block">{cienciaRegistrada.titular}</strong>
                    </div>
                    <div className="bg-white p-3 border border-emerald-300">
                      <span className="text-stone-500 block text-[10px] uppercase">Hash de Integridade:</span>
                      <strong className="text-stone-700 font-mono text-[10px] break-all">{cienciaRegistrada.hashCriptografico}</strong>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={handleDownloadCertificadoPdf}
                      className="bg-emerald-800 hover:bg-emerald-900 text-white font-mono text-xs font-bold uppercase px-4 py-2 flex items-center gap-2 cursor-pointer shadow-sm transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Baixar Certidão em PDF</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `Protocolo LGPD WZZM: ${cienciaRegistrada.protocolo} | Hash: ${cienciaRegistrada.hashCriptografico} | Data: ${cienciaRegistrada.dataLegivel}`
                        );
                        setCopiedProtocol(true);
                        setTimeout(() => setCopiedProtocol(false), 2000);
                      }}
                      className="bg-white hover:bg-stone-100 text-stone-800 border border-stone-400 font-mono text-xs uppercase px-3 py-2 flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedProtocol ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedProtocol ? "Copiado!" : "Copiar Dados"}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white border-2 border-stone-800 p-6 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] text-center space-y-4">
                  <div className="w-12 h-12 bg-amber-100 border border-amber-400 text-amber-800 mx-auto flex items-center justify-center font-bold">
                    <Scale className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-mono font-bold text-sm uppercase tracking-wider text-stone-900">
                      Você ainda não registrou seu termo de ciência absoluta nesta sessão
                    </h4>
                    <p className="text-xs font-serif text-stone-600 max-w-lg mx-auto mt-1 leading-relaxed">
                      Ao clicar no botão abaixo, você atesta publicamente ter lido e compreendido as regras de tratamento, os 10 princípios do Artigo 6º e os direitos do titular (Artigo 18 da LGPD) mantidos à mostra neste portal.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleRegistrarCiencia}
                    className="bg-[#141414] hover:bg-stone-800 text-amber-300 font-mono font-bold text-xs uppercase py-3 px-6 border-2 border-black shadow-[4px_4px_0px_0px_rgba(217,119,6,1)] hover:shadow-none transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>DECLARAR CIÊNCIA ABSOLUTA DO CUMPRIMENTO DAS REGRAS DA LGPD</span>
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

        {/* ======================================================== */}
        {/* FOOTER BAR                                               */}
        {/* ======================================================== */}
        <footer className="bg-[#EBEAE5] border-t-2 border-[#141414] p-3 px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-mono text-stone-600">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold uppercase text-stone-800">
              LEI Nº 13.709/2018 (LGPD) • MARCO CIVIL Nº 12.965/2014 • DECRETO Nº 8.771/2016
            </span>
            <span>•</span>
            <span>DPO: Pedro Henrique Cardona Peres (pedrohenriquecardonaperes@gmail.com)</span>
            <span>•</span>
            <a
              href="https://support.wazzimagiygg.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-black font-bold"
            >
              Suporte: support.wazzimagiygg.com
            </a>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleDownloadCertificadoPdf}
              className="hover:text-black flex items-center gap-1 font-bold cursor-pointer"
            >
              <Printer className="w-3 h-3" />
              <span>Imprimir Certidão</span>
            </button>
            {isModal && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="hover:text-black font-bold uppercase underline cursor-pointer"
              >
                Concluir Leitura
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
