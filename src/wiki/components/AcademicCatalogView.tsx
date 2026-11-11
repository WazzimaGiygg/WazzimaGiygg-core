import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  Search,
  Plus,
  FileText,
  BookOpen,
  Award,
  ExternalLink,
  Share2,
  Copy,
  Check,
  Download,
  Filter,
  RefreshCw,
  Database,
  Building,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  MessageSquare,
  ShieldCheck,
  Star,
  Users,
  BarChart2,
  Lock,
  Globe,
  Tag,
  Trash2,
  Edit3,
  Link as LinkIcon,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import {
  AcademicPublication,
  AcademicPublicationType,
  AcademicAccessStatus,
  AcademicAuthor,
  AcademicPeerReview,
  ResearcherProfile,
  ResearchEthicsCommitteeInfo,
} from '../types/academic';
import { AcademicService } from '../services/academicService';
import { ResearchEthicsBadge } from './ResearchEthicsBadge';
import { ResearchEthicsFormSection } from './ResearchEthicsFormSection';
import {
  formatToAbnt,
  formatToBibtex,
  formatToApa,
  formatToIeee,
} from '../utils/citationFormatter';

interface AcademicCatalogViewProps {
  currentUser?: any;
  onNavigateToArticle?: (title: string) => void;
  onNavigateBack?: () => void;
}

const PUBLICATION_TYPE_LABELS: Record<AcademicPublicationType, { label: string; icon: string; badgeColor: string }> = {
  artigo_periodico: { label: 'Artigo em Periódico', icon: '📄', badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
  livro_academico: { label: 'Livro Acadêmico / Científico', icon: '📚', badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' },
  preprint: { label: 'Preprint / Pré-publicação', icon: '⚡', badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  conferencia: { label: 'Anais de Congresso', icon: '🏛️', badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
  tese_doutorado: { label: 'Tese de Doutorado', icon: '🎓', badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  dissertacao_mestrado: { label: 'Dissertação de Mestrado', icon: '📜', badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 border-teal-200 dark:border-teal-800' },
  tcc_monografia: { label: 'Monografia / TCC', icon: '📑', badgeColor: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700' },
  capitulo_livro: { label: 'Capítulo de Livro', icon: '📖', badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' },
  relatorio_tecnico: { label: 'Relatório Técnico', icon: '📊', badgeColor: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-200 dark:border-sky-800' },
  dataset_pesquisa: { label: 'Dataset Científico', icon: '💾', badgeColor: 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300 border-violet-200 dark:border-violet-800' },
  patente: { label: 'Patente Tecnológica', icon: '💡', badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800' },
};

const CNPQ_AREAS = [
  'Todas as Áreas',
  'Ciências Exatas e da Terra',
  'Ciências Biológicas',
  'Engenharias',
  'Ciências da Saúde',
  'Ciências Agrárias',
  'Ciências Sociais Aplicadas',
  'Ciências Humanas',
  'Linguística, Letras e Artes',
  'Multidisciplinar',
];

export const AcademicCatalogView: React.FC<AcademicCatalogViewProps> = ({
  currentUser,
  onNavigateToArticle,
  onNavigateBack,
}) => {
  // Estado Principal
  const [publications, setPublications] = useState<AcademicPublication[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'repositorio' | 'pesquisadores' | 'submissao' | 'metricas'>('repositorio');
  const [selectedPub, setSelectedPub] = useState<AcademicPublication | null>(null);

  // Filtros de Pesquisa (Estilo Google Acadêmico)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('todos');
  const [selectedArea, setSelectedArea] = useState<string>('Todas as Áreas');
  const [selectedYearFilter, setSelectedYearFilter] = useState<string>('todos');
  const [onlyOpenAccess, setOnlyOpenAccess] = useState(false);
  const [selectedEthicsFilter, setSelectedEthicsFilter] = useState<string>('todos');
  const [sortBy, setSortBy] = useState<'relevancia' | 'citacoes' | 'ano'>('relevancia');

  // Sincronização Firebase
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Modal de Citação
  const [citationModalPub, setCitationModalPub] = useState<AcademicPublication | null>(null);
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  // Modal de Adicionar Citação
  const [citeActionPub, setCiteActionPub] = useState<AcademicPublication | null>(null);
  const [newCiteTitle, setNewCiteTitle] = useState('');
  const [newCiteVenue, setNewCiteVenue] = useState('');
  const [newCiteYear, setNewCiteYear] = useState<number>(new Date().getFullYear());
  const [newCiteAuthors, setNewCiteAuthors] = useState('');

  // Pareceres / Peer Review
  const [peerReviews, setPeerReviews] = useState<AcademicPeerReview[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReviewTitle, setNewReviewTitle] = useState('');
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewDecision, setNewReviewDecision] = useState<'aceito_sem_restricoes' | 'aceito_com_revisoes_menores' | 'necessita_revisao_maior' | 'rejeitado' | 'recomendado'>('recomendado');
  const [reviewRating, setReviewRating] = useState(5);

  // Formulário de Submissão de Produção Acadêmica
  const [isEditing, setIsEditing] = useState(false);
  const [formId, setFormId] = useState<string | null>(null);
  const [formTipo, setFormTipo] = useState<AcademicPublicationType>('artigo_periodico');
  const [formTitulo, setFormTitulo] = useState('');
  const [formSubtitulo, setFormSubtitulo] = useState('');
  const [formTituloIngles, setFormTituloIngles] = useState('');
  const [formAutoresStr, setFormAutoresStr] = useState('');
  const [formUniversidade, setFormUniversidade] = useState('');
  const [formPrograma, setFormPrograma] = useState('');
  const [formPeriodico, setFormPeriodico] = useState('');
  const [formVolume, setFormVolume] = useState('');
  const [formFasciculo, setFormFasciculo] = useState('');
  const [formPaginas, setFormPaginas] = useState('');
  const [formAno, setFormAno] = useState<number>(new Date().getFullYear());
  const [formDoi, setFormDoi] = useState('');
  const [formArxiv, setFormArxiv] = useState('');
  const [formResumo, setFormResumo] = useState('');
  const [formResumoIngles, setFormResumoIngles] = useState('');
  const [formPalavrasChaveStr, setFormPalavrasChaveStr] = useState('');
  const [formAreaCnpq, setFormAreaCnpq] = useState('Ciências Exatas e da Terra');
  const [formFomento, setFormFomento] = useState('');
  const [formProcessoFomento, setFormProcessoFomento] = useState('');
  const [formAcesso, setFormAcesso] = useState<AcademicAccessStatus>('open_access');
  const [formPdfUrl, setFormPdfUrl] = useState('');
  const [formRepositorioUrl, setFormRepositorioUrl] = useState('');
  const [formCodigoUrl, setFormCodigoUrl] = useState('');
  const [formArtigoWiki, setFormArtigoWiki] = useState('');
  const [formCitacoesIniciais, setFormCitacoesIniciais] = useState<number>(0);
  const [formComiteEtica, setFormComiteEtica] = useState<ResearchEthicsCommitteeInfo | undefined>(undefined);

  // Subscrição em Tempo Real ao Firebase
  useEffect(() => {
    setLoading(true);
    const unsubscribe = AcademicService.subscribeToPublications((data) => {
      setPublications(data);
      setLoading(false);
      setLastSyncTime(new Date().toLocaleTimeString());
    });
    return () => unsubscribe();
  }, []);

  // Carregar pareceres quando uma publicação for selecionada
  useEffect(() => {
    if (selectedPub) {
      AcademicService.getPeerReviews(selectedPub.id).then(setPeerReviews);
    } else {
      setPeerReviews([]);
      setShowReviewForm(false);
    }
  }, [selectedPub]);

  // Sincronizar com Firebase sob demanda
  const handleSyncFirebase = async () => {
    setIsSyncing(true);
    try {
      const res = await AcademicService.importFromFirebase();
      setPublications(res.publications);
      setLastSyncTime(new Date().toLocaleTimeString());
      setNotificationMsg(`Sincronização com Cloud Firestore concluída! ${res.count} publicações acadêmicas ativas.`);
      setTimeout(() => setNotificationMsg(null), 4000);
    } catch (err: any) {
      setNotificationMsg(`Falha na sincronização: ${err?.message || 'Erro de conexão'}`);
      setTimeout(() => setNotificationMsg(null), 4500);
    } finally {
      setIsSyncing(false);
    }
  };

  // Filtragem e Busca Acadêmica
  const filteredPublications = useMemo(() => {
    return publications.filter((p) => {
      // Busca textual ampla
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inTitle = p.titulo.toLowerCase().includes(q) || (p.subtitulo && p.subtitulo.toLowerCase().includes(q));
        const inResumo = p.resumo.toLowerCase().includes(q) || (p.resumoIngles && p.resumoIngles.toLowerCase().includes(q));
        const inAuthors = p.autores.some((a) => a.nome.toLowerCase().includes(q) || (a.filiacao && a.filiacao.toLowerCase().includes(q)));
        const inVenue = p.periodicoOuEvento && p.periodicoOuEvento.toLowerCase().includes(q);
        const inUniv = p.universidadeOuInstituicao && p.universidadeOuInstituicao.toLowerCase().includes(q);
        const inDoi = p.doi && p.doi.toLowerCase().includes(q);
        const inKeywords = p.palavrasChave.some((k) => k.toLowerCase().includes(q));
        if (!inTitle && !inResumo && !inAuthors && !inVenue && !inUniv && !inDoi && !inKeywords) {
          return false;
        }
      }

      // Tipo de Obra
      if (selectedType !== 'todos' && p.tipo !== selectedType) {
        return false;
      }

      // Grande Área CNPq
      if (selectedArea !== 'Todas as Áreas' && p.areaConhecimentoCnpq !== selectedArea) {
        return false;
      }

      // Acesso Aberto
      if (onlyOpenAccess && p.statusAcesso !== 'open_access' && p.statusAcesso !== 'green_open_access') {
        return false;
      }

      // Comitê de Ética em Pesquisa com Seres Humanos
      if (selectedEthicsFilter === 'aprovado' && p.comiteEtica?.statusEtica !== 'aprovado') {
        return false;
      }
      if (selectedEthicsFilter === 'dispensado' && p.comiteEtica?.statusEtica !== 'dispensado') {
        return false;
      }
      if (selectedEthicsFilter === 'com_humanos' && !p.comiteEtica?.envolveSeresHumanos) {
        return false;
      }

      // Filtro de Ano
      const currentYear = new Date().getFullYear();
      if (selectedYearFilter === 'desde_2026' && p.anoPublicacao < 2026) return false;
      if (selectedYearFilter === 'desde_2025' && p.anoPublicacao < 2025) return false;
      if (selectedYearFilter === 'desde_2022' && p.anoPublicacao < 2022) return false;
      if (selectedYearFilter === 'desde_2020' && p.anoPublicacao < 2020) return false;

      return true;
    }).sort((a, b) => {
      if (sortBy === 'citacoes') return (b.totalCitacoes || 0) - (a.totalCitacoes || 0);
      if (sortBy === 'ano') return b.anoPublicacao - a.anoPublicacao;
      // Relevância: pondera citações e recência
      const scoreA = (a.totalCitacoes || 0) * 2 + (a.anoPublicacao >= 2024 ? 5 : 0);
      const scoreB = (b.totalCitacoes || 0) * 2 + (b.anoPublicacao >= 2024 ? 5 : 0);
      return scoreB - scoreA;
    });
  }, [publications, searchQuery, selectedType, selectedArea, onlyOpenAccess, selectedEthicsFilter, selectedYearFilter, sortBy]);

  // Perfis de Pesquisadores (Google Acadêmico)
  const researcherProfiles = useMemo(() => {
    return AcademicService.computeResearcherProfiles(publications);
  }, [publications]);

  // Handlers do Formulário de Submissão
  const handleOpenNewSubmission = () => {
    setIsEditing(false);
    setFormId(null);
    setFormTipo('artigo_periodico');
    setFormTitulo('');
    setFormSubtitulo('');
    setFormTituloIngles('');
    setFormAutoresStr(currentUser?.displayName || currentUser?.email ? `${currentUser.displayName || currentUser.email} (Autor)` : '');
    setFormUniversidade('Universidade de São Paulo (USP)');
    setFormPrograma('');
    setFormPeriodico('');
    setFormVolume('');
    setFormFasciculo('');
    setFormPaginas('');
    setFormAno(new Date().getFullYear());
    setFormDoi('');
    setFormArxiv('');
    setFormResumo('');
    setFormResumoIngles('');
    setFormPalavrasChaveStr('');
    setFormAreaCnpq('Ciências Exatas e da Terra');
    setFormFomento('');
    setFormProcessoFomento('');
    setFormAcesso('open_access');
    setFormPdfUrl('');
    setFormRepositorioUrl('');
    setFormCodigoUrl('');
    setFormArtigoWiki('');
    setFormCitacoesIniciais(0);
    setFormComiteEtica(undefined);
    setActiveTab('submissao');
  };

  const handleEditSubmission = (pub: AcademicPublication) => {
    setIsEditing(true);
    setFormId(pub.id);
    setFormTipo(pub.tipo);
    setFormTitulo(pub.titulo);
    setFormSubtitulo(pub.subtitulo || '');
    setFormTituloIngles(pub.tituloIngles || '');
    setFormAutoresStr(pub.autores.map((a) => `${a.nome}${a.filiacao ? ` (${a.filiacao})` : ''}`).join('; '));
    setFormUniversidade(pub.universidadeOuInstituicao || '');
    setFormPrograma(pub.programaPosGraduacao || '');
    setFormPeriodico(pub.periodicoOuEvento || '');
    setFormVolume(pub.volume || '');
    setFormFasciculo(pub.fasciculo || '');
    setFormPaginas(pub.paginas || '');
    setFormAno(pub.anoPublicacao);
    setFormDoi(pub.doi || '');
    setFormArxiv(pub.arxivId || '');
    setFormResumo(pub.resumo);
    setFormResumoIngles(pub.resumoIngles || '');
    setFormPalavrasChaveStr(pub.palavrasChave.join(', '));
    setFormAreaCnpq(pub.areaConhecimentoCnpq || 'Ciências Exatas e da Terra');
    setFormFomento(pub.agenciaFomento || '');
    setFormProcessoFomento(pub.processoFomento || '');
    setFormAcesso(pub.statusAcesso);
    setFormPdfUrl(pub.pdfUrl || '');
    setFormRepositorioUrl(pub.repositorioUrl || '');
    setFormCodigoUrl(pub.codigoOuDadosUrl || '');
    setFormArtigoWiki(pub.artigoWikiVinculadoTitulo || '');
    setFormCitacoesIniciais(pub.totalCitacoes || 0);
    setFormComiteEtica(pub.comiteEtica);
    setActiveTab('submissao');
  };

  const handleSaveSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitulo.trim() || !formResumo.trim()) {
      alert('Por favor, informe ao menos o Título e o Resumo (Abstract) da publicação.');
      return;
    }

    // Processa autores
    const parsedAuthors: AcademicAuthor[] = formAutoresStr
      .split(';')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const match = item.match(/^(.*?)(?:\s*\((.*?)\))?$/);
        const name = match ? match[1].trim() : item;
        const filiacao = match && match[2] ? match[2].trim() : formUniversidade || undefined;
        return { nome: name, filiacao };
      });

    if (parsedAuthors.length === 0) {
      parsedAuthors.push({
        nome: currentUser?.displayName || currentUser?.email || 'Autor Independente',
        filiacao: formUniversidade || 'Instituição Acadêmica',
      });
    }

    const parsedKeywords = formPalavrasChaveStr
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    try {
      const saved = await AcademicService.savePublication({
        id: formId || undefined,
        tipo: formTipo,
        titulo: formTitulo,
        subtitulo: formSubtitulo || undefined,
        tituloIngles: formTituloIngles || undefined,
        autores: parsedAuthors,
        universidadeOuInstituicao: formUniversidade || undefined,
        programaPosGraduacao: formPrograma || undefined,
        periodicoOuEvento: formPeriodico || undefined,
        volume: formVolume || undefined,
        fasciculo: formFasciculo || undefined,
        paginas: formPaginas || undefined,
        anoPublicacao: Number(formAno) || new Date().getFullYear(),
        doi: formDoi || undefined,
        arxivId: formArxiv || undefined,
        resumo: formResumo,
        resumoIngles: formResumoIngles || undefined,
        palavrasChave: parsedKeywords,
        areaConhecimentoCnpq: formAreaCnpq,
        agenciaFomento: formFomento || undefined,
        processoFomento: formProcessoFomento || undefined,
        statusAcesso: formAcesso,
        pdfUrl: formPdfUrl || undefined,
        repositorioUrl: formRepositorioUrl || undefined,
        codigoOuDadosUrl: formCodigoUrl || undefined,
        artigoWikiVinculadoTitulo: formArtigoWiki || undefined,
        totalCitacoes: formCitacoesIniciais,
        statusRevisao: formTipo === 'preprint' ? 'preprint_open' : 'peer_reviewed',
        comiteEtica: formComiteEtica,
        submittedByUid: currentUser?.uid,
        submittedByName: currentUser?.displayName || currentUser?.email,
      });

      setSelectedPub(saved);
      setActiveTab('repositorio');
      setNotificationMsg(
        isEditing
          ? 'Publicação acadêmica atualizada com sucesso no Cloud Firestore!'
          : 'Nova produção científica submetida e indexada no Cloud Firestore!'
      );
      setTimeout(() => setNotificationMsg(null), 4000);
    } catch (err) {
      console.error('Erro ao salvar produção acadêmica:', err);
      alert('Erro ao gravar publicação no Firebase.');
    }
  };

  const handleDeletePublication = async (id: string) => {
    if (!confirm('Deseja realmente remover esta produção científica do repositório acadêmico e do Firebase?')) return;
    try {
      await AcademicService.deletePublication(id);
      if (selectedPub?.id === id) setSelectedPub(null);
      setNotificationMsg('Publicação excluída com sucesso do Cloud Firestore.');
      setTimeout(() => setNotificationMsg(null), 3500);
    } catch (err) {
      console.error('Erro ao excluir:', err);
    }
  };

  // Cópia de Formatos de Citação
  const handleCopyCitation = (format: 'abnt' | 'bibtex' | 'apa' | 'ieee') => {
    if (!citationModalPub) return;
    let text = '';
    if (format === 'abnt') text = formatToAbnt(citationModalPub);
    else if (format === 'bibtex') text = formatToBibtex(citationModalPub);
    else if (format === 'apa') text = formatToApa(citationModalPub);
    else if (format === 'ieee') text = formatToIeee(citationModalPub);

    navigator.clipboard.writeText(text);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2500);
  };

  const handleDownloadBibtex = (pub: AcademicPublication) => {
    const bib = formatToBibtex(pub);
    const blob = new Blob([bib], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `citacao_${pub.id}.bib`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Adicionar Citação Recebida
  const handleSaveNewCitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!citeActionPub || !newCiteTitle.trim()) return;

    await AcademicService.addCitation(citeActionPub.id, {
      titulo: newCiteTitle.trim(),
      ano: newCiteYear,
      veiculo: newCiteVenue.trim() || 'Periódico Científico',
      autores: newCiteAuthors.trim() || undefined,
    });

    setCiteActionPub(null);
    setNewCiteTitle('');
    setNewCiteVenue('');
    setNewCiteAuthors('');
    setNotificationMsg('Citação registrada com sucesso! Métrica atualizada no Google Acadêmico.');
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  // Enviar Parecer de Revisão por Pares Aberta
  const handleSavePeerReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPub || !newReviewText.trim()) return;

    try {
      const review = await AcademicService.addPeerReview({
        publicationId: selectedPub.id,
        reviewerUid: currentUser?.uid || 'anon',
        reviewerName: currentUser?.displayName || currentUser?.email || 'Pesquisador(a) Convidado(a)',
        reviewerFiliacao: 'Comunidade Acadêmica WikiWorldWeb',
        tituloParecer: newReviewTitle.trim() || 'Avaliação por Pares Aberta',
        parecerTexto: newReviewText.trim(),
        parecerDecisao: newReviewDecision,
        notaRigorMetodologico: reviewRating,
        notaOriginalidade: reviewRating,
        notaClareza: reviewRating,
        notaRelevancia: reviewRating,
      });

      setPeerReviews((prev) => [review, ...prev]);
      setShowReviewForm(false);
      setNewReviewTitle('');
      setNewReviewText('');
      setNotificationMsg('Parecer acadêmico publicado e arquivado no Cloud Firestore!');
      setTimeout(() => setNotificationMsg(null), 3500);
    } catch (err) {
      console.error('Erro ao enviar parecer:', err);
    }
  };

  return (
    <div id="wiki-academic-repository" className="max-w-7xl mx-auto px-4 sm:px-6 py-8 text-slate-800 dark:text-slate-100 font-sans">
      {/* Topo / Banner Institucional Acadêmico */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-800 text-white shadow-md">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 dark:text-slate-50 tracking-tight">
                  Wiki Universitário
                </h1>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-mono">
                  Google Acadêmico & Repositórios
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                Repositório Institucional Aberto de Produção Científica: Artigos, Teses, Dissertações, Preprints, Anais e Métricas de Citação.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onNavigateBack && (
            <button
              onClick={onNavigateBack}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              Voltar ao Hub
            </button>
          )}

          <button
            onClick={handleSyncFirebase}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg border border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors shadow-xs disabled:opacity-50"
            title="Importar e sincronizar publicações diretamente do Cloud Firestore"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
            <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar com Firebase'}</span>
          </button>

          <button
            onClick={handleOpenNewSubmission}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-700 hover:bg-blue-800 text-white shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Submeter Produção Científica</span>
          </button>
        </div>
      </div>

      {/* Painel de Status de Sincronia Estrita com o Firebase */}
      <div className="mt-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-mono font-medium text-[11px]">
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span>Firebase Cloud Firestore</span>
          </div>
          <span className="text-slate-600 dark:text-slate-400">
            Repositório Estrito: <strong>Apenas trabalhos científicos reais gravados no Cloud Firestore</strong> são carregados.
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
          {lastSyncTime && (
            <span>Última sincronização: <strong>{lastSyncTime}</strong></span>
          )}
          <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
            {publications.length} produções ativas
          </span>
        </div>
      </div>

      {/* Alerta de Feedback */}
      {notificationMsg && (
        <div className="mt-4 p-3.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-200 text-xs font-medium flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Abas Principais */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mt-6 gap-2 sm:gap-6 overflow-x-auto text-xs font-medium">
        <button
          onClick={() => { setActiveTab('repositorio'); setSelectedPub(null); }}
          className={`pb-3 pt-1 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'repositorio'
              ? 'border-blue-600 text-blue-700 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Repositório de Artigos & Teses ({filteredPublications.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('pesquisadores'); setSelectedPub(null); }}
          className={`pb-3 pt-1 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'pesquisadores'
              ? 'border-blue-600 text-blue-700 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Perfis de Pesquisadores & Índice-h ({researcherProfiles.length})</span>
        </button>

        <button
          onClick={handleOpenNewSubmission}
          className={`pb-3 pt-1 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'submissao'
              ? 'border-blue-600 text-blue-700 dark:text-blue-400 font-bold'
              : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Submeter Trabalho Científico</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* ABA: REPOSITÓRIO DE ARTIGOS & TESES */}
      {/* ========================================================================= */}
      {activeTab === 'repositorio' && (
        <div className="mt-6">
          {/* Caixa de Busca Estilo Google Acadêmico */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar artigos, teses, autores, universidade, DOI, resumo ou palavras-chave..."
                className="w-full pl-11 pr-24 py-3 text-sm rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Filtros Avançados */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 mt-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Tipo de Produção
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                >
                  <option value="todos">Todos os Tipos de Obra</option>
                  <option value="artigo_periodico">Artigos em Periódicos</option>
                  <option value="livro_academico">Livros Acadêmicos / Científicos</option>
                  <option value="preprint">Preprints / Pré-publicações</option>
                  <option value="tese_doutorado">Teses de Doutorado</option>
                  <option value="dissertacao_mestrado">Dissertações de Mestrado</option>
                  <option value="conferencia">Anais de Congresso</option>
                  <option value="tcc_monografia">TCCs e Monografias</option>
                  <option value="dataset_pesquisa">Datasets Científicos</option>
                  <option value="relatorio_tecnico">Relatórios Técnicos</option>
                  <option value="patente">Patentes</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Grande Área CNPq
                </label>
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                >
                  {CNPQ_AREAS.map((area) => (
                    <option key={area} value={area}>{area}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Comitê de Ética (CEP/CONEP)
                </label>
                <select
                  value={selectedEthicsFilter}
                  onChange={(e) => setSelectedEthicsFilter(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                >
                  <option value="todos">Todos os Status Éticos</option>
                  <option value="aprovado">Aprovado pelo CEP/CONEP</option>
                  <option value="dispensado">Dispensado / Isento (Res. 510/16)</option>
                  <option value="com_humanos">Pesquisas com Seres Humanos</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Intervalo Temporal
                </label>
                <select
                  value={selectedYearFilter}
                  onChange={(e) => setSelectedYearFilter(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                >
                  <option value="todos">Qualquer Ano</option>
                  <option value="desde_2026">Desde 2026</option>
                  <option value="desde_2025">Desde 2025</option>
                  <option value="desde_2022">Desde 2022</option>
                  <option value="desde_2020">Desde 2020</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Ordenar por
                </label>
                <select
                  value={sortBy}
                  onChange={(e: any) => setSortBy(e.target.value)}
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                >
                  <option value="relevancia">Relevância Acadêmica</option>
                  <option value="citacoes">Mais Citados (Citations)</option>
                  <option value="ano">Data (Mais Recentes)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/60 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={onlyOpenAccess}
                  onChange={(e) => setOnlyOpenAccess(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-emerald-600" />
                  Apenas Trabalhos em Acesso Aberto (Open Access / Green OA)
                </span>
              </label>
            </div>
          </div>

          {/* Listagem de Resultados ou Item Selecionado */}
          {selectedPub ? (
            /* DETALHES DE UMA PUBLICAÇÃO SELECIONADA */
            <div className="mt-6 p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in">
              <button
                onClick={() => setSelectedPub(null)}
                className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline mb-4 font-semibold"
              >
                ← Voltar para lista de publicações
              </button>

              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1 min-w-[300px]">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${PUBLICATION_TYPE_LABELS[selectedPub.tipo].badgeColor}`}>
                      {PUBLICATION_TYPE_LABELS[selectedPub.tipo].icon} {PUBLICATION_TYPE_LABELS[selectedPub.tipo].label}
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      Ano: {selectedPub.anoPublicacao}
                    </span>
                    {selectedPub.statusAcesso === 'open_access' && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                        <Globe className="w-3 h-3" /> Acesso Aberto
                      </span>
                    )}
                  </div>

                  <h2 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-slate-50 leading-snug">
                    {selectedPub.titulo}
                  </h2>
                  {selectedPub.subtitulo && (
                    <p className="text-base text-slate-600 dark:text-slate-300 font-serif italic mt-1">
                      {selectedPub.subtitulo}
                    </p>
                  )}

                  {/* Autores */}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <Users className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="font-semibold">Autores:</span>
                    {selectedPub.autores.map((a, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        <strong>{a.nome}</strong>
                        {a.filiacao && <span className="text-slate-500 dark:text-slate-400">({a.filiacao})</span>}
                        {a.orcid && (
                          <a
                            href={`https://orcid.org/${a.orcid}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-emerald-600 font-mono hover:underline ml-0.5"
                            title={`ORCID: ${a.orcid}`}
                          >
                            [ORCID]
                          </a>
                        )}
                      </span>
                    ))}
                  </div>

                  {/* Instituição / Veículo */}
                  <div className="mt-2 text-xs text-slate-600 dark:text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1">
                    {selectedPub.universidadeOuInstituicao && (
                      <span className="flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-slate-500" />
                        <strong>Instituição:</strong> {selectedPub.universidadeOuInstituicao}
                      </span>
                    )}
                    {selectedPub.periodicoOuEvento && (
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                        <strong>Veículo:</strong> {selectedPub.periodicoOuEvento}
                        {selectedPub.volume && `, v. ${selectedPub.volume}`}
                        {selectedPub.fasciculo && `, n. ${selectedPub.fasciculo}`}
                        {selectedPub.paginas && `, p. ${selectedPub.paginas}`}
                      </span>
                    )}
                    {selectedPub.doi && (
                      <span className="flex items-center gap-1 font-mono text-blue-600 dark:text-blue-400">
                        <LinkIcon className="w-3.5 h-3.5" />
                        DOI:{' '}
                        <a
                          href={`https://doi.org/${selectedPub.doi}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {selectedPub.doi}
                        </a>
                      </span>
                    )}
                  </div>
                </div>

                {/* Botões de Ação Acadêmica */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setCitationModalPub(selectedPub)}
                    className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 flex items-center gap-1.5"
                  >
                    <QuoteIcon className="w-3.5 h-3.5" />
                    <span>Citar (ABNT / BibTeX / APA)</span>
                  </button>

                  <button
                    onClick={() => setCiteActionPub(selectedPub)}
                    className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Registrar Citação Recebida</span>
                  </button>

                  {selectedPub.pdfUrl && (
                    <a
                      href={selectedPub.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Manuscrito em PDF</span>
                    </a>
                  )}

                  <button
                    onClick={() => handleEditSubmission(selectedPub)}
                    className="p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    title="Editar publicação"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeletePublication(selectedPub.id)}
                    className="p-2 text-xs rounded-lg border border-rose-300 dark:border-rose-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600"
                    title="Excluir do repositório"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Resumo / Abstract */}
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  Resumo / Abstract
                </h3>
                <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-serif whitespace-pre-line">
                  {selectedPub.resumo}
                </p>

                {selectedPub.resumoIngles && (
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Abstract (English)
                    </h4>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-serif italic">
                      {selectedPub.resumoIngles}
                    </p>
                  </div>
                )}

                {/* Comitê de Ética em Pesquisa com Seres Humanos (CEP / CONEP) */}
                {selectedPub.comiteEtica && selectedPub.comiteEtica.statusEtica !== 'nao_se_aplica' && (
                  <div className="mt-4">
                    <ResearchEthicsBadge info={selectedPub.comiteEtica} variant="card" />
                  </div>
                )}

                {/* Palavras-chave */}
                {selectedPub.palavrasChave.length > 0 && (
                  <div className="mt-4 flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Palavras-chave:</span>
                    {selectedPub.palavrasChave.map((kw, i) => (
                      <span key={i} className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Seção de Métricas & Vínculo com Verbete da Enciclopédia */}
              <div className="mt-6 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span>Total de Citações: <strong>{selectedPub.totalCitacoes}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-blue-500" />
                    <span>Área: <strong>{selectedPub.areaConhecimentoCnpq}</strong></span>
                  </div>
                  {selectedPub.licenca && (
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span>Licença: <strong>{selectedPub.licenca}</strong></span>
                    </div>
                  )}
                </div>

                {selectedPub.artigoWikiVinculadoTitulo && onNavigateToArticle && (
                  <button
                    onClick={() => onNavigateToArticle(selectedPub.artigoWikiVinculadoTitulo!)}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <span>Ver Verbete Enciclopédico: <strong>{selectedPub.artigoWikiVinculadoTitulo}</strong></span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Lista de Citações Recebidas */}
              {selectedPub.citacoesLista && selectedPub.citacoesLista.length > 0 && (
                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    Trabalhos que citam esta publicação ({selectedPub.citacoesLista.length})
                  </h3>
                  <div className="mt-3 space-y-2">
                    {selectedPub.citacoesLista.map((cit, idx) => (
                      <div key={idx} className="p-2.5 rounded-md bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{cit.titulo}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {cit.autores && <span>{cit.autores} • </span>}
                          <span>{cit.veiculo} ({cit.ano})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Seção de Pareceres e Avaliação por Pares Aberta */}
              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    Avaliação por Pares Aberta & Pareceres Acadêmicos ({peerReviews.length})
                  </h3>
                  <button
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100"
                  >
                    {showReviewForm ? 'Cancelar Parecer' : '+ Emitir Parecer Científico'}
                  </button>
                </div>

                {/* Formulário de Novo Parecer */}
                {showReviewForm && (
                  <form onSubmit={handleSavePeerReview} className="mt-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold mb-1">Título do Parecer</label>
                      <input
                        type="text"
                        value={newReviewTitle}
                        onChange={(e) => setNewReviewTitle(e.target.value)}
                        placeholder="Ex: Análise crítica sobre a metodologia e rigor amostral..."
                        className="w-full p-2 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold mb-1">Recomendação / Decisão Editorial</label>
                        <select
                          value={newReviewDecision}
                          onChange={(e: any) => setNewReviewDecision(e.target.value)}
                          className="w-full p-2 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                        >
                          <option value="recomendado">Recomendado para Publicação e Uso</option>
                          <option value="aceito_sem_restricoes">Aceito sem Restrições</option>
                          <option value="aceito_com_revisoes_menores">Aceito com Revisões Menores</option>
                          <option value="necessita_revisao_maior">Necessita Revisão Maior</option>
                          <option value="rejeitado">Não Recomendado</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-semibold mb-1">Nota Geral de Rigor e Qualidade (1 a 5)</label>
                        <select
                          value={reviewRating}
                          onChange={(e) => setReviewRating(Number(e.target.value))}
                          className="w-full p-2 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700"
                        >
                          <option value={5}>⭐⭐⭐⭐⭐ (5/5) - Excelente / Padrão Internacional</option>
                          <option value={4}>⭐⭐⭐⭐ (4/5) - Muito Bom / Consistente</option>
                          <option value={3}>⭐⭐⭐ (3/5) - Bom / Satisfatório</option>
                          <option value={2}>⭐⭐ (2/5) - Regular / Falhas Metodológicas</option>
                          <option value={1}>⭐ (1/5) - Insuficiente</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Texto do Parecer Crítico</label>
                      <textarea
                        rows={4}
                        value={newReviewText}
                        onChange={(e) => setNewReviewText(e.target.value)}
                        placeholder="Descreva seu parecer acadêmico: pontos fortes, metodologia empregada, reprodutibilidade dos dados e conclusões..."
                        className="w-full p-2 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-serif"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowReviewForm(false)}
                        className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded bg-blue-700 text-white font-semibold"
                      >
                        Gravar Parecer no Firebase
                      </button>
                    </div>
                  </form>
                )}

                {/* Lista de Pareceres */}
                <div className="mt-4 space-y-3">
                  {peerReviews.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">Nenhum parecer emitido ainda para esta obra.</p>
                  ) : (
                    peerReviews.map((rev) => (
                      <div key={rev.id} className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{rev.tituloParecer}</div>
                          <span className="text-[11px] font-semibold text-emerald-600">
                            Nota: {rev.notaRigorMetodologico}/5
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Por <strong>{rev.reviewerName}</strong> ({rev.reviewerFiliacao || 'Revisor'}) • {new Date(rev.createdAt).toLocaleDateString()}
                        </div>
                        <p className="mt-2 text-slate-700 dark:text-slate-300 leading-relaxed font-serif whitespace-pre-line">
                          {rev.parecerTexto}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* LISTAGEM GERAL DE PUBLICAÇÕES (Estilo Google Acadêmico) */
            <div className="mt-6 space-y-4">
              {loading ? (
                <div className="text-center py-16 text-slate-500">
                  <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
                  <p className="text-xs">Consultando repositório acadêmico no Cloud Firestore...</p>
                </div>
              ) : publications.length === 0 ? (
                <div className="text-center py-16 rounded-xl border border-dashed border-blue-300 dark:border-blue-800/60 bg-blue-50/20 dark:bg-blue-950/10 p-8">
                  <GraduationCap className="w-12 h-12 text-blue-600/70 mx-auto mb-3" />
                  <h3 className="text-base font-serif font-bold text-slate-900 dark:text-slate-100">
                    Nenhuma produção científica cadastrada no Cloud Firestore ainda
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 max-w-lg mx-auto leading-relaxed">
                    O Wiki Universitário está operando em <strong>sincronização estrita com o Firebase</strong> (sem dados fictícios). Cadastre o primeiro artigo, tese, dissertação ou preprint abaixo.
                  </p>
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={handleOpenNewSubmission}
                      className="px-4 py-2.5 text-xs font-semibold rounded-lg bg-blue-700 text-white hover:bg-blue-800 shadow-xs flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Submeter Primeiro Trabalho Acadêmico</span>
                    </button>
                    <button
                      onClick={handleSyncFirebase}
                      disabled={isSyncing}
                      className="px-4 py-2.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-2"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>Sincronizar com Firebase</span>
                    </button>
                  </div>
                </div>
              ) : filteredPublications.length === 0 ? (
                <div className="text-center py-12 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 p-8">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Nenhuma publicação encontrada para os filtros selecionados.
                  </p>
                  <button
                    onClick={() => { setSearchQuery(''); setSelectedType('todos'); setSelectedArea('Todas as Áreas'); setSelectedYearFilter('todos'); setOnlyOpenAccess(false); }}
                    className="mt-3 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                  >
                    Redefinir todos os filtros
                  </button>
                </div>
              ) : (
                filteredPublications.map((pub) => {
                  const typeInfo = PUBLICATION_TYPE_LABELS[pub.tipo];
                  return (
                    <div
                      key={pub.id}
                      className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-shadow shadow-xs hover:shadow-sm"
                    >
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                        <div className="flex-1">
                          {/* Badges do Trabalho */}
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${typeInfo.badgeColor}`}>
                              {typeInfo.icon} {typeInfo.label}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {pub.anoPublicacao}
                            </span>
                            {pub.statusAcesso === 'open_access' && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                                <Globe className="w-2.5 h-2.5" /> PDF Aberto
                              </span>
                            )}
                            <ResearchEthicsBadge info={pub.comiteEtica} variant="badge" />
                          </div>

                          {/* Título Principal (Estilo Google Acadêmico) */}
                          <h3
                            onClick={() => setSelectedPub(pub)}
                            className="text-base sm:text-lg font-serif font-bold text-blue-700 dark:text-blue-400 hover:underline cursor-pointer leading-snug"
                          >
                            {pub.titulo}
                            {pub.subtitulo && <span className="text-slate-600 dark:text-slate-300 font-normal">: {pub.subtitulo}</span>}
                          </h3>

                          {/* Linha de Autores & Veículo (Verde estilo Google Acadêmico) */}
                          <div className="text-xs text-emerald-800 dark:text-emerald-400 mt-1 font-medium leading-relaxed">
                            <span>
                              {pub.autores.map((a) => a.nome).join(', ')}
                            </span>
                            {' - '}
                            <span className="text-slate-600 dark:text-slate-400 italic">
                              {pub.periodicoOuEvento || pub.universidadeOuInstituicao || 'Repositório Acadêmico'}
                            </span>
                            {', '}
                            <span className="text-slate-600 dark:text-slate-400">
                              {pub.anoPublicacao}
                            </span>
                            {pub.universidadeOuInstituicao && pub.periodicoOuEvento && (
                              <span className="text-slate-500 dark:text-slate-500 text-[11px]">
                                {' '}• {pub.universidadeOuInstituicao}
                              </span>
                            )}
                          </div>

                          {/* Resumo truncado */}
                          <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed font-serif">
                            {pub.resumo}
                          </p>

                          {/* Rodapé de Ações Acadêmicas */}
                          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                            <button
                              onClick={() => { setSelectedPub(pub); }}
                              className="font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 flex items-center gap-1"
                            >
                              <Award className="w-3.5 h-3.5 text-amber-500" />
                              <span>Citado por {pub.totalCitacoes}</span>
                            </button>

                            <button
                              onClick={() => setCitationModalPub(pub)}
                              className="text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1"
                            >
                              <QuoteIcon className="w-3.5 h-3.5" />
                              <span>Citar (ABNT / BibTeX)</span>
                            </button>

                            {pub.pdfUrl && (
                              <a
                                href={pub.pdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline flex items-center gap-1"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>[PDF] Manuscrito</span>
                              </a>
                            )}

                            {pub.doi && (
                              <a
                                href={`https://doi.org/${pub.doi}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-slate-500 dark:text-slate-400 hover:text-blue-600 font-mono text-[11px]"
                              >
                                doi:{pub.doi}
                              </a>
                            )}

                            <button
                              onClick={() => setSelectedPub(pub)}
                              className="ml-auto text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1"
                            >
                              <span>Ver Ficha Completa</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA: PERFIS DE PESQUISADORES & ÍNDICE H (Estilo Google Acadêmico) */}
      {/* ========================================================================= */}
      {activeTab === 'pesquisadores' && (
        <div className="mt-6">
          <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 mb-6">
            <h2 className="text-base font-serif font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Perfis de Pesquisadores & Índices Bibliométricos
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Cálculo automático de <strong>Total de Citações</strong>, <strong>Índice h (h-index)</strong> e <strong>Índice i10 (i10-index)</strong> para cada autor cadastrado nas publicações do Wiki Universitário.
            </p>
          </div>

          {researcherProfiles.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl p-6">
              <p className="text-xs text-slate-500">Nenhum perfil de pesquisador identificado ainda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {researcherProfiles.map((prof, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-serif font-bold text-slate-900 dark:text-slate-100">
                          {prof.nome}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          {prof.filiacao}
                        </p>
                        {prof.orcid && (
                          <p className="text-[11px] font-mono text-emerald-600 mt-0.5">
                            ORCID: {prof.orcid}
                          </p>
                        )}
                      </div>
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-sm shrink-0 border border-blue-200 dark:border-blue-800">
                        {prof.nome.charAt(0)}
                      </div>
                    </div>

                    {/* Tabela de Índices Estilo Google Acadêmico */}
                    <div className="mt-4 grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-center">
                      <div>
                        <div className="text-[10px] uppercase font-semibold text-slate-500">Citações</div>
                        <div className="text-base font-bold text-blue-600 dark:text-blue-400">{prof.totalCitacoes}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-semibold text-slate-500">Índice h</div>
                        <div className="text-base font-bold text-amber-600 dark:text-amber-400">{prof.indiceH}</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-semibold text-slate-500">Índice i10</div>
                        <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">{prof.indiceI10}</div>
                      </div>
                    </div>

                    {/* Áreas de Interesse */}
                    {prof.areasInteresse.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {prof.areasInteresse.map((ar, i) => (
                          <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {ar}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500">{prof.totalPublicacoes} publicações indexadas</span>
                    <button
                      onClick={() => {
                        setSearchQuery(prof.nome);
                        setActiveTab('repositorio');
                      }}
                      className="text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1"
                    >
                      <span>Ver Trabalhos</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* ABA: FORMULÁRIO DE SUBMISSÃO CIENTÍFICA (Google Scholar / Dublin Core) */}
      {/* ========================================================================= */}
      {activeTab === 'submissao' && (
        <div className="mt-6 p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs max-w-4xl mx-auto">
          <div className="mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-serif font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              {isEditing ? 'Editar Produção Científica' : 'Submeter Produção Científica ao Repositório'}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Todos os campos seguem os padrões de indexação do <strong>Google Acadêmico</strong>, <strong>Dublin Core</strong> e <strong>OAI-PMH</strong>. Gravação direta no Cloud Firestore.
            </p>
          </div>

          <form onSubmit={handleSaveSubmission} className="space-y-4 text-xs">
            {/* Tipo de Obra */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Tipo de Publicação Acadêmica *
                </label>
                <select
                  value={formTipo}
                  onChange={(e: any) => setFormTipo(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-medium"
                >
                  <option value="artigo_periodico">Artigo em Periódico Científico (Journal Paper)</option>
                  <option value="livro_academico">Livro Acadêmico / Livro Científico / Obra Autoral</option>
                  <option value="preprint">Preprint / Pré-publicação Aberta (arXiv / SciELO)</option>
                  <option value="conferencia">Artigo em Anais de Congresso / Conferência</option>
                  <option value="tese_doutorado">Tese de Doutorado (Ph.D. Dissertation)</option>
                  <option value="dissertacao_mestrado">Dissertação de Mestrado (Master's Thesis)</option>
                  <option value="tcc_monografia">Trabalho de Conclusão de Curso (TCC) / Monografia</option>
                  <option value="capitulo_livro">Capítulo de Livro Acadêmico</option>
                  <option value="relatorio_tecnico">Relatório Técnico / Whitepaper</option>
                  <option value="dataset_pesquisa">Dataset / Conjunto de Dados Científico</option>
                  <option value="patente">Patente Tecnológica</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Regime de Acesso & Licenciamento
                </label>
                <select
                  value={formAcesso}
                  onChange={(e: any) => setFormAcesso(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                >
                  <option value="open_access">Acesso Aberto (Open Access - Gold/Diamond)</option>
                  <option value="green_open_access">Acesso Aberto Institucional (Green OA / Autoarquivamento)</option>
                  <option value="restricted">Acesso Restrito / Assinatura</option>
                  <option value="embargoed">Sob Embargo Temporário</option>
                </select>
              </div>
            </div>

            {/* Título e Subtítulo */}
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Título do Trabalho Científico *
              </label>
              <input
                type="text"
                required
                value={formTitulo}
                onChange={(e) => setFormTitulo(e.target.value)}
                placeholder="Ex: Arquiteturas Descentralizadas para Repositórios de Conhecimento Científico Aberto"
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-serif"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Subtítulo (Opcional)
                </label>
                <input
                  type="text"
                  value={formSubtitulo}
                  onChange={(e) => setFormSubtitulo(e.target.value)}
                  placeholder="Ex: Uma investigação empírica de escalabilidade e resiliência"
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Título em Inglês (Para indexação internacional)
                </label>
                <input
                  type="text"
                  value={formTituloIngles}
                  onChange={(e) => setFormTituloIngles(e.target.value)}
                  placeholder="Ex: Decentralized Architectures for Open Scientific Knowledge Repositories"
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                />
              </div>
            </div>

            {/* Autores */}
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Autores e Coautores (Separados por ponto-e-vírgula ";", filiação entre parênteses) *
              </label>
              <input
                type="text"
                required
                value={formAutoresStr}
                onChange={(e) => setFormAutoresStr(e.target.value)}
                placeholder="Ex: Pedro Henrique Cardona Peres (USP); Maria Silva (Unicamp); John Doe (MIT)"
                className="w-full p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs"
              />
            </div>

            {/* Instituição, Periódico e Ano */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Universidade / Instituição de Vínculo
                </label>
                <input
                  type="text"
                  value={formUniversidade}
                  onChange={(e) => setFormUniversidade(e.target.value)}
                  placeholder="Ex: Universidade de São Paulo (USP)"
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Periódico, Revista ou Conferência
                </label>
                <input
                  type="text"
                  value={formPeriodico}
                  onChange={(e) => setFormPeriodico(e.target.value)}
                  placeholder="Ex: Nature, Anais do SBBD, IEEE TKDE"
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Ano de Publicação *
                </label>
                <input
                  type="number"
                  required
                  value={formAno}
                  onChange={(e) => setFormAno(Number(e.target.value))}
                  className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                />
              </div>
            </div>

            {/* Volume, Fascículo, Páginas */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Volume</label>
                <input
                  type="text"
                  value={formVolume}
                  onChange={(e) => setFormVolume(e.target.value)}
                  placeholder="Ex: 14"
                  className="w-full p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Fascículo / Número</label>
                <input
                  type="text"
                  value={formFasciculo}
                  onChange={(e) => setFormFasciculo(e.target.value)}
                  placeholder="Ex: 2"
                  className="w-full p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">Páginas</label>
                <input
                  type="text"
                  value={formPaginas}
                  onChange={(e) => setFormPaginas(e.target.value)}
                  placeholder="Ex: 110-135"
                  className="w-full p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                />
              </div>
            </div>

            {/* DOI e arXiv ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  DOI (Identificador de Objeto Digital)
                </label>
                <input
                  type="text"
                  value={formDoi}
                  onChange={(e) => setFormDoi(e.target.value)}
                  placeholder="Ex: 10.1145/3411764.3445523"
                  className="w-full p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  arXiv ID (Se preprint)
                </label>
                <input
                  type="text"
                  value={formArxiv}
                  onChange={(e) => setFormArxiv(e.target.value)}
                  placeholder="Ex: 2403.12345"
                  className="w-full p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs"
                />
              </div>
            </div>

            {/* Resumo (Abstract) */}
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Resumo / Abstract estruturado em Português *
              </label>
              <textarea
                rows={5}
                required
                value={formResumo}
                onChange={(e) => setFormResumo(e.target.value)}
                placeholder="Insira o resumo científico do trabalho: contextualização, objetivos, metodologia proposta, principais resultados obtidos e conclusões..."
                className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-serif leading-relaxed"
              />
            </div>

            {/* Abstract em Inglês */}
            <div>
              <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                Abstract (em Inglês - Recomendado)
              </label>
              <textarea
                rows={4}
                value={formResumoIngles}
                onChange={(e) => setFormResumoIngles(e.target.value)}
                placeholder="Abstract in English for international academic citation..."
                className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-serif leading-relaxed text-xs"
              />
            </div>

            {/* Palavras-chave e Área CNPq */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Palavras-chave (Separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={formPalavrasChaveStr}
                  onChange={(e) => setFormPalavrasChaveStr(e.target.value)}
                  placeholder="Ex: Sistemas Distribuídos, Indexação Acadêmica, Wikis, Open Access"
                  className="w-full p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Grande Área do Conhecimento (CNPq)
                </label>
                <select
                  value={formAreaCnpq}
                  onChange={(e) => setFormAreaCnpq(e.target.value)}
                  className="w-full p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                >
                  {CNPQ_AREAS.filter((a) => a !== 'Todas as Áreas').map((ar) => (
                    <option key={ar} value={ar}>{ar}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Links de Acesso Aberto e PDF */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  URL Direta do PDF do Manuscrito / Preprint
                </label>
                <input
                  type="url"
                  value={formPdfUrl}
                  onChange={(e) => setFormPdfUrl(e.target.value)}
                  placeholder="https://exemplo.org/manuscrito.pdf"
                  className="w-full p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  URL do Repositório Institucional Oficial (DSpace / Zenodo)
                </label>
                <input
                  type="url"
                  value={formRepositorioUrl}
                  onChange={(e) => setFormRepositorioUrl(e.target.value)}
                  placeholder="https://repositorio.usp.br/item/12345"
                  className="w-full p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-xs"
                />
              </div>
            </div>

            {/* Vínculo com verbete da enciclopédia & Citações Iniciais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Vincular a Verbete da Enciclopédia WikiZero
                </label>
                <input
                  type="text"
                  value={formArtigoWiki}
                  onChange={(e) => setFormArtigoWiki(e.target.value)}
                  placeholder="Ex: Computação Quântica, Inteligência Artificial"
                  className="w-full p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  Citações Iniciais Registradas (Google Acadêmico)
                </label>
                <input
                  type="number"
                  min={0}
                  value={formCitacoesIniciais}
                  onChange={(e) => setFormCitacoesIniciais(Number(e.target.value))}
                  className="w-full p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                />
              </div>
            </div>

            {/* Comitê de Ética em Pesquisa com Seres Humanos (CEP / CONEP) */}
            <div className="pt-2">
              <ResearchEthicsFormSection
                value={formComiteEtica}
                onChange={setFormComiteEtica}
                contextTitle={formTipo === 'livro_academico' ? 'Livro Acadêmico' : 'Trabalho Acadêmico'}
              />
            </div>

            {/* Botões de Ação do Formulário */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('repositorio')}
                className="px-4 py-2.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-semibold rounded-lg bg-blue-700 hover:bg-blue-800 text-white shadow-xs"
              >
                {isEditing ? 'Salvar Modificações no Firebase' : 'Gravar Produção no Cloud Firestore'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL DE CITAÇÃO CIENTÍFICA (ABNT, BibTeX, APA, IEEE) */}
      {/* ========================================================================= */}
      {citationModalPub && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  <QuoteIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-slate-900 dark:text-slate-100">
                    Citar Trabalho Científico
                  </h3>
                  <p className="text-xs text-slate-500">
                    Copie a referência formatada ou baixe o arquivo BibTeX para Overleaf/LaTeX.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCitationModalPub(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {/* Formato ABNT */}
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide">
                    ABNT NBR 6023 (Brasil)
                  </span>
                  <button
                    onClick={() => handleCopyCitation('abnt')}
                    className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600"
                  >
                    {copiedFormat === 'abnt' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedFormat === 'abnt' ? 'Copiado!' : 'Copiar ABNT'}</span>
                  </button>
                </div>
                <div className="font-serif text-slate-800 dark:text-slate-200 leading-relaxed select-all">
                  {formatToAbnt(citationModalPub)}
                </div>
              </div>

              {/* Formato APA 7th */}
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide">
                    APA 7ª Edição (American Psychological Association)
                  </span>
                  <button
                    onClick={() => handleCopyCitation('apa')}
                    className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600"
                  >
                    {copiedFormat === 'apa' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedFormat === 'apa' ? 'Copiado!' : 'Copiar APA'}</span>
                  </button>
                </div>
                <div className="font-serif text-slate-800 dark:text-slate-200 leading-relaxed select-all">
                  {formatToApa(citationModalPub)}
                </div>
              </div>

              {/* Formato BibTeX */}
              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wide">
                    BibTeX (LaTeX / Overleaf / Zotero)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownloadBibtex(citationModalPub)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 hover:underline"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar .bib</span>
                    </button>
                    <button
                      onClick={() => handleCopyCitation('bibtex')}
                      className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600"
                    >
                      {copiedFormat === 'bibtex' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedFormat === 'bibtex' ? 'Copiado!' : 'Copiar BibTeX'}</span>
                    </button>
                  </div>
                </div>
                <pre className="font-mono text-[11px] text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded border border-slate-200 dark:border-slate-800 overflow-x-auto select-all">
                  {formatToBibtex(citationModalPub)}
                </pre>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setCitationModalPub(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL PARA REGISTRAR CITAÇÃO RECEBIDA (Google Acadêmico) */}
      {/* ========================================================================= */}
      {citeActionPub && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-serif font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                Registrar Citação Recebida
              </h3>
              <button onClick={() => setCiteActionPub(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-2">
              Informe a publicação científica que citou a obra "<strong>{citeActionPub.titulo}</strong>":
            </p>

            <form onSubmit={handleSaveNewCitation} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Título do Artigo ou Tese que Citou *</label>
                <input
                  type="text"
                  required
                  value={newCiteTitle}
                  onChange={(e) => setNewCiteTitle(e.target.value)}
                  placeholder="Ex: Análise comparativa de modelos distribuídos de enciclopédias..."
                  className="w-full p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Autores do Trabalho Citador</label>
                <input
                  type="text"
                  value={newCiteAuthors}
                  onChange={(e) => setNewCiteAuthors(e.target.value)}
                  placeholder="Ex: Costa, R. & Souza, F."
                  className="w-full p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Periódico ou Evento</label>
                  <input
                    type="text"
                    value={newCiteVenue}
                    onChange={(e) => setNewCiteVenue(e.target.value)}
                    placeholder="Ex: Revista Brasileira de Computação"
                    className="w-full p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Ano da Citação</label>
                  <input
                    type="number"
                    value={newCiteYear}
                    onChange={(e) => setNewCiteYear(Number(e.target.value))}
                    className="w-full p-2 rounded bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCiteActionPub(null)}
                  className="px-3.5 py-2 rounded border border-slate-300 dark:border-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                >
                  Gravar Citação no Firebase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Ícone auxiliar de Citação
function QuoteIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
      <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z" />
    </svg>
  );
}
