/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Dossiê & Abusos da Wikipédia
 * Baseado e fundamentado nas investigações oficiais publicadas em:
 * - https://wazzimagiygg.com/averdade/ (A Verdade sobre os Abusos e a Perseguição na Wikipédia Lusófona)
 * - https://wazzimagiygg.wikidot.com/relacionados-a-wikipedia (Repositório Forense & Documentação Wikidot)
 */

import React, { useState } from 'react';
import {
  Scale,
  AlertCircle,
  AlertTriangle,
  ShieldAlert,
  FileText,
  ExternalLink,
  ChevronRight,
  Database,
  Search,
  Download,
  Share2,
  Copy,
  Check,
  Eye,
  Info,
  BookOpen,
  Lock,
  Globe,
  Terminal,
  Flag,
  UserX,
  History,
  CheckCircle2,
  Printer
} from 'lucide-react';
import jsPDF from 'jspdf';

interface DossieAbusosViewProps {
  sanctionsList: Array<{ cidade: string; moderador: string; status?: string; detalhes?: string }>;
  onOpenTicketForm?: (tipo?: string) => void;
  showToast?: (msg: string, isError?: boolean) => void;
}

export const DOSSIE_CASES = [
  {
    id: "caso-chronus",
    titulo: "Caso Chronus • Autocracia Editorial e Intimidação",
    moderador: "Chronus",
    localidade: "Santa Bárbara D'Oeste (SP)",
    artigoReferencia: "wazzimagiygg.com/averdade/capitulo-1",
    gravidade: "Crítica",
    resumo: "Registro documentado de perseguição sistemática a editores divergentes, reversões em massa sem justificativa plausível e imposição forçada de pontos de vista pessoais em artigos biográficos e históricos.",
    evidencias: [
      "Eliminação sumária de contribuições acadêmicas válidas com rotulação pejorativa.",
      "Uso intimidatório de avisos de bloqueio contra novos editores e colaboradores independentes.",
      "Conluio explícito com outros administradores para aprovação de regras restritivas em votações de quórum reduzido."
    ]
  },
  {
    id: "caso-edmond",
    titulo: "Caso Edmond Dantès (Gean Victor) • Reversões e Censura Transnacional",
    moderador: "Edmond Dantès (Gean Victor)",
    localidade: "Montreal (Canadá)",
    artigoReferencia: "wazzimagiygg.wikidot.com/relacionados-a-wikipedia#edmond",
    gravidade: "Alta",
    resumo: "Operações coordenadas de bloqueio e desqualificação de fontes secundárias idôneas, atuação como 'troll institucional' e proteção recíproca a administradores denunciados na Ouvidoria.",
    evidencias: [
      "Manipulação de histórico de edições para ocultar abusos de poder pregressos.",
      "Desqualificação sumária do portal WazzimaGiygg e criminalização de projetos de pesquisa autônomos.",
      "Articulação de votos de bloqueio em bloco sem análise prévia de mérito."
    ]
  },
  {
    id: "caso-rui-gabriel",
    titulo: "Caso Rui Gabriel Correia • Monitoramento e Assédio Off-Wiki",
    moderador: "Rui Gabriel Correia",
    localidade: "Johannesburg (África do Sul)",
    artigoReferencia: "wazzimagiygg.com/averdade/off-wiki",
    gravidade: "Crítica",
    resumo: "Tentativas de vigilância externa, identificação de contas em outras redes e disseminação de informações distorcidas em canais privados do Discord e IRC para coagir editores.",
    evidencias: [
      "Monitoramento cruzado de identificadores de sessão fora do ambiente enciclopédico.",
      "Incentivo a campanhas de difamação pública contra pesquisadores e voluntários do projeto.",
      "Vigilância de IPs e tentativa de cruzamento de geolocalização."
    ]
  },
  {
    id: "caso-checkuser",
    titulo: "Caso CheckUser & Abuso de Ferramentas Forenses • Santa Fé do Sul / Rubinéia",
    moderador: "Teste de Verificação / Operadores CheckUser",
    localidade: "Santa Fé do Sul & Rubinéia (SP)",
    artigoReferencia: "wazzimagiygg.wikidot.com/relacionados-a-wikipedia#checkuser",
    gravidade: "Gravíssima (Violação LGPD & Marco Civil)",
    resumo: "Ativação ilegal da ferramenta de verificação de IP (CheckUser) sem suspeita razoável, apenas para mapear o paradeiro geográfico de editores críticos e expô-los em páginas públicas de discussão.",
    evidencias: [
      "Quebra do sigilo de dados telemáticos sem ordem judicial expedida (infração ao Art. 10 do Marco Civil).",
      "Exposição de faixas de IP e provedores locais no domínio público da Wikipédia Lusófona.",
      "Tentativa de doxxing escolar e familiar documentada nos arquivos forenses da WZZM."
    ]
  },
  {
    id: "caso-johannnes89",
    titulo: "Caso Johannnes89 • Intervenção Global e Censura em Nível de Steward",
    moderador: "Johannnes89",
    localidade: "Alemanha (Global Steward)",
    artigoReferencia: "wazzimagiygg.wikidot.com/relacionados-a-wikipedia#global",
    gravidade: "Alta",
    resumo: "Aplicação de bloqueios globais e listas negras de domínios (*blacklisting*) contra links e publicações do ecossistema WazzimaGiygg, impedindo que cidadãos e editores citem relatórios independentes.",
    evidencias: [
      "Inclusão automática de 'wazzimagiygg.com' e 'wazzimagiygg.wikidot.com' na lista negra global da Wikimedia.",
      "Bloqueio de nós de rede e servidores independentes sem direito a recurso ou contraditório.",
      "Desrespeito às soberanias jurídicas locais e à legislação de proteção de dados do Brasil."
    ]
  }
];

export const TOPICOS_VERDADE = [
  {
    titulo: "A Gênese do Conflito: O Monopólio da Verdade",
    conteudo: "A investigação 'A Verdade' (wazzimagiygg.com/averdade/) documenta como a Wikipédia Lusófona deixou de ser uma enciclopédia colaborativa aberta para se transformar em um oligopólio controlado por menos de uma dúzia de moderadores perenes. Qualquer contribuição científica, histórica ou jornalística que desafie as narrativas pré-aprovadas pelo grupo é rotulada arbitrariamente como 'vandalismo' ou 'conteúdo não-notório'."
  },
  {
    titulo: "A Fábrica de Fantoches (O Mito do Sockpuppetry)",
    conteudo: "Para justificar bloqueios permanentes sem direito a ampla defesa, os administradores denunciados recorrem à tática de rotular novos usuários críticos como 'contas de ataque' ou 'fantoches' (sockpuppets). Isso autoriza o cancelamento sumário de debates, a reversão de centenas de edições válidas e a blindagem de artigos sob proteção total."
  },
  {
    titulo: "Violações Flagrantes ao Marco Civil e à LGPD",
    conteudo: "O dossiê revela que dados pessoais sensíveis — como histórico acadêmico, nomes civis, locais de trabalho e cidades de residência de voluntários — foram divulgados deliberadamente em discussões abertas e arquivadas sem consentimento. Trata-se de violação direta ao Artigo 5º da CF/88, ao Artigo 10 da Lei 12.965/2014 (Marco Civil) e aos Artigos 6º e 18 da Lei 13.709/2018 (LGPD)."
  },
  {
    titulo: "A Solução Tecnológica: O Ecossistema WazzimaGiygg",
    conteudo: "Diante da impossibilidade de reforma interna da governança da Wikipédia Lusófona, surgiu o ecossistema WazzimaGiygg: uma suíte digital livre, descentralizada e imutável composta pelo portal jornalístico WZZM, pelo NotMediaWiki (enciclopédia desacoplada com Parsoid real) e pela rede social Bem-Te-Vi, onde todo cidadão possui voz e os dados são salvaguardados por regras estritas de privacidade."
  }
];

export default function DossieAbusosView({
  sanctionsList,
  onOpenTicketForm,
  showToast
}: DossieAbusosViewProps) {
  const [activeTab, setActiveTab] = useState<'averdade' | 'relacionados' | 'casos' | 'sancoes'>('averdade');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyDossieLink = () => {
    try {
      navigator.clipboard.writeText("https://wazzimagiygg.com/averdade/");
      setCopiedLink(true);
      if (showToast) showToast("Link oficial do Dossiê copiado para a área de transferência!");
      setTimeout(() => setCopiedLink(false), 2200);
    } catch {
      // safe fallback
    }
  };

  const handleDownloadDossiePdf = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Header Banner
      doc.setFillColor(20, 20, 20);
      doc.rect(0, 0, 210, 36, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("WAZZIMAGIYGG • DOSSIÊ FORENSE & ABUSOS WIKIPÉDIA", 105, 16, { align: "center" });

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(217, 119, 6);
      doc.text("BASEADO EM WAZZIMAGIYGG.COM/AVERDADE/ E WAZZIMAGIYGG.WIKIDOT.COM/RELACIONADOS-A-WIKIPEDIA", 105, 24, { align: "center" });

      doc.setTextColor(200, 200, 200);
      doc.setFontSize(8);
      doc.text(`Registro Forense de Abusos e Assédio • Emissão: ${new Date().toLocaleDateString('pt-BR')}`, 105, 30, { align: "center" });

      // Introduction
      doc.setTextColor(20, 20, 20);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("RELATÓRIO INVESTIGATIVO DE CONFORMIDADE E DIREITOS DIGITAIS", 14, 46);

      doc.setFontSize(8.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);

      const intro = 
        "O presente dossiê reúne relatórios probatórios, evidências documentadas e análises jurídicas " +
        "acerca de incidentes de perseguição sistemática, censura, abusos de privilégios de moderação " +
        "e violações à Lei Geral de Proteção de Dados (Lei 13.709/2018) perpetradas contra editores " +
        "independentes na Wikipédia Lusófona.";
      doc.text(doc.splitTextToSize(intro, 180), 14, 53);

      // Section: Cases
      let yPos = 70;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10.5);
      doc.setTextColor(180, 83, 9);
      doc.text("PRINCIPAIS INCIDENTES DOCUMENTADOS:", 14, yPos);
      yPos += 7;

      DOSSIE_CASES.forEach((c) => {
        if (yPos > 260) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(20, 20, 20);
        doc.text(`• ${c.titulo} [${c.localidade}]`, 14, yPos);
        yPos += 5;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(70, 70, 70);
        const desc = doc.splitTextToSize(c.resumo, 175);
        doc.text(desc, 18, yPos);
        yPos += desc.length * 4 + 3;
      });

      // Footer
      doc.setFillColor(20, 20, 20);
      doc.rect(0, 282, 210, 15, 'F');
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(220, 220, 220);
      doc.text("Documento oficial para fins informativos e forenses • WazzimaGiygg Ouvidoria & DPO", 105, 290, { align: "center" });

      doc.save(`Dossie_Abusos_Wikipedia_WZZM.pdf`);
      if (showToast) showToast("Dossiê baixado com sucesso em PDF!");
    } catch (err) {
      console.error("PDF error:", err);
      if (showToast) showToast("Erro ao gerar PDF do dossiê.", true);
    }
  };

  const filteredCases = DOSSIE_CASES.filter((c) =>
    c.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.moderador.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.localidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.resumo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 text-left font-sans">
      
      {/* ======================================================== */}
      {/* 1. TOP HERO BANNER: DOSSIÊ & FONTES OFICIAIS             */}
      {/* ======================================================== */}
      <section className="bg-white border-2 border-[#141414] p-6 sm:p-8 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
        
        {/* Top Badges & Forensics tag */}
        <div className="border-b-2 border-[#141414] pb-5 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="bg-[#B91C1C] text-white font-mono font-bold text-[10px] uppercase px-2 py-0.5 tracking-wider shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> REGISTRO FORENSE & TRANSPARÊNCIA
              </span>
              <span className="bg-stone-200 text-stone-800 font-mono text-[10px] uppercase px-2 py-0.5 font-bold border border-stone-400">
                EDIÇÃO ATUALIZADA
              </span>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadDossiePdf}
                className="bg-[#141414] hover:bg-stone-800 text-amber-300 font-mono text-xs font-bold uppercase px-3 py-1.5 flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
                title="Baixar compilação do dossiê em PDF"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar PDF</span>
              </button>

              <button
                type="button"
                onClick={handleCopyDossieLink}
                className="bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-400 font-mono text-xs uppercase px-2.5 py-1.5 flex items-center gap-1 cursor-pointer transition-colors"
                title="Copiar link oficial da investigação"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? "Copiado!" : "Copiar Link"}</span>
              </button>
            </div>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-editorial font-bold text-[#141414] leading-tight">
            Dossiê: Abusos e Assédio na Wikipédia Lusófona
          </h2>
          
          <p className="text-xs sm:text-sm font-mono text-stone-700 mt-2 leading-relaxed">
            Compilação investigativa fundamentada nas publicações oficiais de{' '}
            <strong className="text-amber-800">wazzimagiygg.com/averdade/</strong> e nos arquivos documentais de{' '}
            <strong className="text-amber-800">wazzimagiygg.wikidot.com/relacionados-a-wikipedia</strong>, expondo perseguições sistemáticas, conluio de moderadores e violações de privacidade.
          </p>

          {/* Direct Link Badges */}
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-stone-200 font-mono text-xs">
            <span className="text-[10px] text-stone-500 uppercase font-bold">Fontes Oficiais:</span>
            <a
              href="https://wazzimagiygg.com/averdade/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-400 px-2.5 py-1 font-bold text-[11px] shadow-sm transition-colors"
            >
              <span>🔗 wazzimagiygg.com/averdade/</span>
              <ExternalLink className="w-3 h-3 text-amber-700" />
            </a>

            <a
              href="https://wazzimagiygg.wikidot.com/relacionados-a-wikipedia"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-300 px-2.5 py-1 font-bold text-[11px] shadow-sm transition-colors"
            >
              <span>📑 wazzimagiygg.wikidot.com/relacionados-a-wikipedia</span>
              <ExternalLink className="w-3 h-3 text-indigo-700" />
            </a>
          </div>
        </div>

        {/* Legal Protections Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-serif leading-relaxed mb-6">
          <div className="p-4 bg-amber-50/80 border-l-4 border-amber-600 shadow-sm">
            <div className="flex items-center gap-2 text-amber-950 font-mono font-bold text-xs uppercase mb-1">
              <Scale className="w-4 h-4 text-amber-700" />
              <span>Conformidade com a LGPD (Lei Federal 13.709/2018)</span>
            </div>
            <p className="text-stone-800">
              A divulgação arbitrária de dados privados de editores, históricos escolares, nomes de familiares e endereços de IP residenciais sem autorização judicial expressa constitui ilícito civil e penal grave sob o Art. 5º da CF/88 e a LGPD. Este dossiê preserva e defende a inviolabilidade da vida privada.
            </p>
          </div>

          <div className="p-4 bg-stone-100 border-l-4 border-stone-800 shadow-sm">
            <div className="flex items-center gap-2 text-stone-900 font-mono font-bold text-xs uppercase mb-1">
              <Terminal className="w-4 h-4 text-stone-700" />
              <span>Marco Civil da Internet (Lei nº 12.965/2014)</span>
            </div>
            <p className="text-stone-800">
              A legislação brasileira impõe o dever de neutralidade de rede, proteção a registros de conexão e vedação a práticas discriminatórias. O uso de privilégios de CheckUser como instrumento de retaliação e silenciamento de vozes independentes viola frontalmente as garantias republicanas.
            </p>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. SUB-NAVIGATION TABS INSIDE DOSSIÊ                    */}
        {/* ======================================================== */}
        <div className="border-b-2 border-[#141414] pb-2 flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar">
            {[
              { id: 'averdade', label: '1. "A Verdade" (Investigação Principal)' },
              { id: 'casos', label: '2. Casos Documentados & Incidentes' },
              { id: 'relacionados', label: '3. Repositório Wikidot & Análises' },
              { id: 'sancoes', label: '4. Tabela de Cidades & Moderadores' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 font-bold uppercase tracking-wider text-[11px] border transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-[#141414] text-white border-black shadow-[2px_2px_0px_0px_rgba(217,119,6,1)]'
                    : 'bg-stone-100 text-stone-700 border-stone-300 hover:bg-stone-200 hover:text-black'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'casos' && (
            <div className="w-full sm:w-56 my-1">
              <input
                type="text"
                placeholder="Filtrar moderador ou local..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#FAF9F5] border border-stone-400 px-2 py-1 text-xs font-mono placeholder:text-stone-400 focus:outline-none focus:border-black"
              />
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* 3. TAB CONTENT SECTIONS                                  */}
        {/* ======================================================== */}
        <div className="pt-6">

          {/* TAB 1: A VERDADE (wazzimagiygg.com/averdade/) */}
          {activeTab === 'averdade' && (
            <div className="space-y-6">
              <div className="bg-amber-50/50 border border-amber-300 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-amber-700" />
                  <h3 className="font-mono font-bold text-sm uppercase text-amber-950">
                    Sumário Executivo da Investigação "A Verdade"
                  </h3>
                </div>
                <p className="text-xs font-serif text-stone-800 leading-relaxed">
                  A página <a href="https://wazzimagiygg.com/averdade/" target="_blank" rel="noreferrer" className="text-amber-800 underline font-bold">wazzimagiygg.com/averdade/</a> constitui o registro público e inconteste das práticas abusivas perpetradas contra o projeto WazzimaGiygg. A seguir, destacam-se os eixos fundamentais que comprovam o conluio, a desqualificação de fontes e o cerceamento da liberdade enciclopédica:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {TOPICOS_VERDADE.map((topico, idx) => (
                  <div
                    key={idx}
                    className="bg-stone-50 border-2 border-stone-800 p-5 shadow-[4px_4px_0px_0px_rgba(20,20,20,0.8)] space-y-2"
                  >
                    <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
                      <span className="w-5 h-5 bg-[#141414] text-white font-mono font-bold text-[10px] flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <h4 className="font-mono font-bold text-xs uppercase text-stone-900 tracking-wide">
                        {topico.titulo}
                      </h4>
                    </div>
                    <p className="text-xs font-serif text-stone-700 leading-relaxed">
                      {topico.conteudo}
                    </p>
                  </div>
                ))}
              </div>

              {/* Callout box on the technological answer */}
              <div className="bg-[#141414] text-white p-5 border-2 border-black shadow-[4px_4px_0px_0px_rgba(217,119,6,1)] space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
                  <Database className="w-4 h-4" />
                  <span>A Resposta Institucional: Desacoplamento Completo</span>
                </div>
                <p className="text-xs font-serif text-stone-200 leading-relaxed">
                  O ecossistema WazzimaGiygg provou que não é necessário submeter-se a comitês autoritários para construir conhecimento aberto. Com infraestrutura autônoma, API de dados sincronizada com o Firebase e validação criptográfica de integridade de extensões (3.05.9.a/b), restabelecemos a integridade enciclopédica com rigor científico e proteção plena aos direitos civis.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: CASOS DOCUMENTADOS & INCIDENTES ESPECÍFICOS */}
          {activeTab === 'casos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-mono text-xs text-stone-600">
                  Mostrando {filteredCases.length} caso(s) documentado(s) com fundamentação probatória.
                </span>
                <span className="font-mono text-[10px] bg-red-100 text-red-900 font-bold px-2 py-0.5 border border-red-300">
                  Amostra Forense
                </span>
              </div>

              <div className="space-y-4">
                {filteredCases.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white border-2 border-stone-800 p-5 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] hover:border-amber-700 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono uppercase font-bold bg-[#141414] text-amber-300 px-2 py-0.5">
                            {c.moderador}
                          </span>
                          <span className="text-[10px] font-mono text-stone-600 bg-stone-100 border border-stone-300 px-2 py-0.5">
                            📍 {c.localidade}
                          </span>
                        </div>
                        <h4 className="font-mono font-bold text-sm text-stone-900 mt-1">
                          {c.titulo}
                        </h4>
                      </div>

                      <div className="shrink-0">
                        <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 border ${
                          c.gravidade.includes('Crítica') || c.gravidade.includes('Gravíssima')
                            ? 'bg-red-100 text-red-800 border-red-400'
                            : 'bg-amber-100 text-amber-800 border-amber-400'
                        }`}>
                          Gravidade: {c.gravidade}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs font-serif text-stone-800 leading-relaxed mb-3">
                      {c.resumo}
                    </p>

                    <div className="bg-stone-50 border-l-2 border-amber-600 p-3 space-y-1.5 mb-3">
                      <span className="block text-[10px] font-mono uppercase font-bold text-stone-900">
                        Evidências e Fatos Catalogados:
                      </span>
                      <ul className="text-xs font-serif text-stone-700 space-y-1 list-disc list-inside">
                        {c.evidencias.map((ev, i) => (
                          <li key={i}>{ev}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-[10px] font-mono text-stone-500">
                      <span>Referência de Arquivo: <strong>{c.artigoReferencia}</strong></span>
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Registrado no Acervo
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: REPOSITÓRIO WIKIDOT (wazzimagiygg.wikidot.com/relacionados-a-wikipedia) */}
          {activeTab === 'relacionados' && (
            <div className="space-y-5">
              <div className="bg-indigo-50/70 border-2 border-indigo-200 p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-indigo-950 font-mono text-xs font-bold uppercase">
                  <Globe className="w-4 h-4 text-indigo-700" />
                  <span>Repositório Wikidot • Relacionados a Wikipédia</span>
                </div>
                <p className="text-xs font-serif text-stone-800 leading-relaxed">
                  Conforme catalogado na documentação oficial de <a href="https://wazzimagiygg.wikidot.com/relacionados-a-wikipedia" target="_blank" rel="noreferrer" className="text-indigo-900 underline font-bold">wazzimagiygg.wikidot.com/relacionados-a-wikipedia</a>, o projeto mantém um índice estruturado de denúncias, atas de discussões excluídas e dossiês técnicos que atestam a degradação dos padrões de governança da Wikipédia lusófona.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border-2 border-stone-800 p-4 shadow-[3px_3px_0px_0px_rgba(20,20,20,1)]">
                  <span className="font-mono font-bold text-[10px] bg-stone-100 text-stone-800 px-1.5 py-0.5 border border-stone-300 uppercase block w-fit mb-2">
                    Eixo 1 • CheckUser
                  </span>
                  <h4 className="font-mono font-bold text-xs uppercase mb-1">Rastreamento Abusivo de IP</h4>
                  <p className="text-xs font-serif text-stone-700 leading-relaxed">
                    Uso da ferramenta CheckUser como instrumento de coação psicológica e doxxing, revelando municípios de origem sem mandado legal.
                  </p>
                </div>

                <div className="bg-white border-2 border-stone-800 p-4 shadow-[3px_3px_0px_0px_rgba(20,20,20,1)]">
                  <span className="font-mono font-bold text-[10px] bg-stone-100 text-stone-800 px-1.5 py-0.5 border border-stone-300 uppercase block w-fit mb-2">
                    Eixo 2 • Governança
                  </span>
                  <h4 className="font-mono font-bold text-xs uppercase mb-1">Cartel de Moderadores</h4>
                  <p className="text-xs font-serif text-stone-700 leading-relaxed">
                    Blindagem sistemática entre membros do corpo administrativo, onde pedidos de bloqueio contra moderadores amigos são sumariamente arquivados.
                  </p>
                </div>

                <div className="bg-white border-2 border-stone-800 p-4 shadow-[3px_3px_0px_0px_rgba(20,20,20,1)]">
                  <span className="font-mono font-bold text-[10px] bg-stone-100 text-stone-800 px-1.5 py-0.5 border border-stone-300 uppercase block w-fit mb-2">
                    Eixo 3 • Censura
                  </span>
                  <h4 className="font-mono font-bold text-xs uppercase mb-1">Blacklist & Lista Negra</h4>
                  <p className="text-xs font-serif text-stone-700 leading-relaxed">
                    Bloqueio do domínio wazzimagiygg.com em todos os projetos da Wikimedia Foundation para tentar impedir que leitores conheçam a verdade.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-stone-100 border border-stone-300 flex items-center justify-between flex-wrap gap-3 font-mono text-xs">
                <div>
                  <span className="font-bold text-stone-900 block">Deseja consultar o texto original no Wikidot?</span>
                  <span className="text-[11px] text-stone-600">Acesse o portal espelho para leitura completa de atas e relatórios.</span>
                </div>
                <a
                  href="https://wazzimagiygg.wikidot.com/relacionados-a-wikipedia"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-[#141414] hover:bg-stone-800 text-white px-3 py-2 uppercase font-bold flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors text-[11px]"
                >
                  <span>Abrir wazzimagiygg.wikidot.com</span>
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                </a>
              </div>
            </div>
          )}

          {/* TAB 4: TABELA FORENSE DE CIDADES & MODERADORES SOB OBSERVAÇÃO */}
          {activeTab === 'sancoes' && (
            <div className="space-y-4">
              <div className="border-b border-stone-300 pb-2">
                <h3 className="font-mono font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span>Cidades & Moderadores sob Observação Forense</span>
                </h3>
                <p className="text-xs font-mono text-stone-600 mt-1">
                  Origens geográficas, contas administrativas e credenciais associadas aos incidentes documentados de alteração indevida de dados e perseguição.
                </p>
              </div>

              <div className="overflow-x-auto border-2 border-[#141414] shadow-sm">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#141414] text-white uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-4 border-r border-stone-700">Município / Localidade</th>
                      <th className="py-2.5 px-4 border-r border-stone-700">Identificador / Moderador</th>
                      <th className="py-2.5 px-4 border-r border-stone-700">Tipo de Incidente</th>
                      <th className="py-2.5 px-4">Status de Monitoramento</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {sanctionsList.map((item, idx) => (
                      <tr key={idx} className="hover:bg-amber-50/60 transition-colors">
                        <td className="py-2.5 px-4 font-bold border-r border-stone-200 text-stone-900">
                          {item.cidade}
                        </td>
                        <td className="py-2.5 px-4 border-r border-stone-200 text-stone-800 font-bold">
                          {item.moderador}
                        </td>
                        <td className="py-2.5 px-4 border-r border-stone-200 text-stone-600 text-[11px]">
                          {item.cidade.includes('Santa Bárbara')
                            ? 'Autocracia & Intimidação'
                            : item.cidade.includes('Montreal')
                            ? 'Reversões em Massa & Censura'
                            : item.cidade.includes('Johannesburg')
                            ? 'Assédio Off-Wiki & Vigilância'
                            : item.cidade.includes('Germany')
                            ? 'Blacklist Global Steward'
                            : 'Abuso de Ferramenta CheckUser'}
                        </td>
                        <td className="py-2.5 px-4 text-red-700 font-bold uppercase text-[10px]">
                          Documentado & Ativo
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* ======================================================== */}
        {/* 4. FOOTER NOTE & OUVIDORIA PROTOCOL                      */}
        {/* ======================================================== */}
        <div className="mt-8 pt-6 border-t-2 border-[#141414] flex flex-col sm:flex-row items-center justify-between gap-4 bg-stone-50 p-4 border text-xs font-mono">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="text-stone-700 leading-snug">
              Tem novas evidências, registros probatórios ou deseja exercer direitos da LGPD relativos a este dossiê?
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              if (onOpenTicketForm) {
                onOpenTicketForm("Denúncia de Assédio / Abuso Wikipédia");
              }
            }}
            className="shrink-0 bg-amber-500 hover:bg-amber-400 text-black font-bold uppercase px-4 py-2 border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] cursor-pointer transition-colors"
          >
            Protocolar Denúncia na Ouvidoria →
          </button>
        </div>

      </section>
    </div>
  );
}
