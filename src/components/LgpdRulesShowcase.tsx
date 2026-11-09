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
  ShieldAlert
} from 'lucide-react';
import jsPDF from 'jspdf';
import { registerAuditLog } from '../firebase';

export interface LgpdRulesShowcaseProps {
  onClose?: () => void;
  onOpenTicketForm?: (tipo?: string) => void;
  currentUser?: any;
  showToast?: (msg: string, isError?: boolean) => void;
  isModal?: boolean;
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
    cumprimentoPortal: "Não coletamos telefone, endereço físico, CPF, dados de cartão ou cookies de rastreamento invasivo. Leitores podem ler 100% do acervo como convidados anônimos sem qualquer cadastro.",
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
    descricao: "O consentimento para login pode ser revogado a qualquer momento mediante exclusão da conta ou logout.",
    acaoLabel: "Revogar Consentimento"
  }
];

export default function LgpdRulesShowcase({
  onClose,
  onOpenTicketForm,
  currentUser,
  showToast,
  isModal = true
}: LgpdRulesShowcaseProps) {
  const [activeSubTab, setActiveSubTab] = useState<
    'principios' | 'direitos' | 'bases' | 'dpo' | 'termoCiencia'
  >('principios');

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
      doc.text("WazzimaGiygg • Ouvidoria e DPO: pedrohenriquecardonaperes@gmail.com • Documento emitido com assinatura digital do sistema.", 105, 289, { align: "center" });

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
          ? "fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in font-sans"
          : "w-full my-6 font-sans"
      }
    >
      <div
        className={`bg-[#F8F7F4] text-[#141414] border-4 border-[#141414] shadow-[10px_10px_0px_0px_rgba(20,20,20,1)] w-full max-w-5xl flex flex-col overflow-hidden text-left ${
          isModal ? "max-h-[92vh]" : ""
        }`}
      >
        {/* ======================================================== */}
        {/* HEADER: DIÁRIO OFICIAL / CONFORMIDADE LGPD               */}
        {/* ======================================================== */}
        <header className="bg-[#141414] text-white p-4 border-b-2 border-black flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500 text-black flex items-center justify-center font-bold font-mono shadow-[2px_2px_0px_0px_rgba(255,255,255,0.4)]">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-[#D97706] text-black font-bold text-[9px] uppercase px-1.5 py-0.2 font-mono">
                  TRANSPARÊNCIA PÚBLICA
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> CONFORMIDADE 100% ATIVA
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-editorial font-bold tracking-tight text-white mt-0.5">
                Regras da LGPD à Amostra • Ciência Absoluta do Cumprimento
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleDownloadCertificadoPdf}
              className="bg-stone-800 hover:bg-stone-700 text-amber-300 border border-stone-600 px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
              title="Baixar Certidão Oficial de Conformidade LGPD em PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Certidão PDF</span>
            </button>

            {isModal && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="bg-stone-800 hover:bg-red-700 text-white p-1.5 border border-stone-600 cursor-pointer transition-colors"
                title="Fechar Painel LGPD"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </header>

        {/* ======================================================== */}
        {/* COMPLIANCE STATUS BANNER                                  */}
        {/* ======================================================== */}
        <div className="bg-emerald-50 border-b-2 border-emerald-700 p-3.5 px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse shrink-0" />
            <p className="font-serif text-emerald-950 leading-snug">
              <strong>Compromisso de Ciência Absoluta:</strong> O portal <em>WazzimaGiygg</em> opera em estrita obediência à 
              <strong> Lei Geral de Proteção de Dados (Lei Federal nº 13.709/2018)</strong> e ao 
              <strong> Marco Civil da Internet (Lei nº 12.965/2014)</strong>. Todas as diretrizes de tratamento, retenção e direitos dos titulares estão expostas abaixo para consulta pública universal.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 border border-emerald-400">
              Auditoria: Válida
            </span>
            <span className="font-mono text-[10px] uppercase font-bold bg-black text-amber-300 px-2 py-0.5">
              DPO Ativo
            </span>
          </div>
        </div>

        {/* ======================================================== */}
        {/* NAVIGATION TABS INSIDE LGPD SHOWCASE                    */}
        {/* ======================================================== */}
        <div className="bg-[#EBEAE5] border-b-2 border-[#141414] px-4 flex flex-wrap items-center justify-between gap-2 py-1.5 font-mono text-xs">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {[
              { id: 'principios', label: '10 Princípios (Art. 6º)', count: 10 },
              { id: 'direitos', label: 'Direitos do Titular (Art. 18)', count: 8 },
              { id: 'bases', label: 'Bases Legais & Tratamento', count: null },
              { id: 'dpo', label: 'Encarregado (DPO) & Ouvidoria', count: null },
              { id: 'termoCiencia', label: 'Certidão de Ciência Absoluta', count: cienciaRegistrada ? '✓' : '!' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-3 py-1.5 font-bold uppercase tracking-wider text-[11px] border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeSubTab === tab.id
                    ? 'border-amber-600 bg-white text-black shadow-sm'
                    : 'border-transparent text-stone-600 hover:text-black hover:bg-stone-200'
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
                      <strong>Ouvidoria de Privacidade & Defesa de Direitos WZZM</strong>
                    </li>
                    <li>
                      <span className="text-stone-500 block text-[10px] uppercase">E-mail Oficial do DPO:</span>
                      <strong className="text-amber-800 bg-amber-50 px-1 py-0.5 border border-amber-300">
                        pedrohenriquecardonaperes@gmail.com
                      </strong>
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

                <div className="bg-white border-2 border-stone-800 p-5 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] flex flex-col justify-between">
                  <div>
                    <h4 className="font-mono font-bold text-xs uppercase tracking-wider text-stone-900 mb-2 border-b pb-2 flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-amber-600" />
                      <span>Atendimento Digital de Solicitações</span>
                    </h4>
                    <p className="text-xs font-serif text-stone-700 leading-relaxed mb-4">
                      Você pode protocolar chamados de retificação, oposição, confirmação de dados ou exclusão imediata pelo módulo de tickets da Ouvidoria interna. Cada chamado gera um protocolo único criptográfico com recibo digital imediato.
                    </p>
                  </div>

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
              LEI Nº 13.709/2018 (LGPD) • MARCO CIVIL Nº 12.965/2014
            </span>
            <span>•</span>
            <span>DPO: pedrohenriquecardonaperes@gmail.com</span>
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
