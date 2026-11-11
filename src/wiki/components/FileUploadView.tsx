import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Sparkles,
  Info,
  Shield,
  Layers,
  ArrowRight,
  RefreshCw,
  Copy,
  Check,
  Server,
  Cloud,
  HardDrive,
  ExternalLink,
  ShieldAlert,
  Ban,
  FileWarning,
} from 'lucide-react';
import { UserProfile, WikiFileLicense, UploadFileInput, WikiFile } from '../types';
import { FileStorageService, LICENSE_DEFINITIONS, WIKIZERO_UPLOAD_RULES } from '../services/fileStorageService';

interface FileUploadViewProps {
  user: UserProfile | null;
  initialTargetName?: string;
  onNavigateToFile: (fileName: string) => void;
  onNavigateToGallery: () => void;
  onNotify?: (message: string, type: 'success' | 'warning' | 'info') => void;
}

export const FileUploadView: React.FC<FileUploadViewProps> = ({
  user,
  initialTargetName = '',
  onNavigateToFile,
  onNavigateToGallery,
  onNotify,
}) => {
  // Form State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [targetName, setTargetName] = useState<string>(() => {
    return initialTargetName.replace(/^(?:Arquivo|Ficheiro|File|Imagem|Image):/i, '').replace(/\s+/g, '_');
  });
  const [description, setDescription] = useState<string>('');
  const [license, setLicense] = useState<WikiFileLicense>('cc-by-sa-4.0');
  const [licenseDetails, setLicenseDetails] = useState<string>('');
  const [fairUseJustification, setFairUseJustification] = useState<string>('');
  const [author, setAuthor] = useState<string>(() => {
    return user ? (user.displayName || user.username || '') : '';
  });
  const [source, setSource] = useState<string>('Trabalho próprio');
  const [categoriesText, setCategoriesText] = useState<string>('Ficheiros da WikiWorldWeb');
  const [uploadComment, setUploadComment] = useState<string>('Envio inicial do ficheiro');
  const [agreedToIndependentPolicy, setAgreedToIndependentPolicy] = useState<boolean>(false);

  // Firebase Storage Plan State (Spark vs Blaze)
  const [firebasePlan, setFirebasePlan] = useState<'spark' | 'blaze'>(() => FileStorageService.getFirebasePlan());
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successFile, setSuccessFile] = useState<WikiFile | null>(null);
  const [isCopiedWikitext, setIsCopiedWikitext] = useState<boolean>(false);

  // Drag & Drop
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize initialTargetName
  useEffect(() => {
    if (initialTargetName) {
      setTargetName(initialTargetName.replace(/^(?:Arquivo|Ficheiro|File|Imagem|Image):/i, '').replace(/\s+/g, '_'));
    }
  }, [initialTargetName]);

  // Real-time Wikimedia / Wikipedia violation detector
  const detectedBannedSource = useMemo(() => {
    const text = `${source} ${author} ${description} ${licenseDetails} ${targetName}`.toLowerCase();
    const banned = [
      'wikimedia',
      'commons.wikimedia',
      'upload.wikimedia',
      'wikipedia',
      'wikipédia',
      'wikimedia foundation',
      'wiki commons',
      'wikicommons',
      'wikidata',
      'wikisource',
    ];
    return banned.find((b) => text.includes(b)) || null;
  }, [source, author, description, licenseDetails, targetName]);

  const handlePlanToggle = (plan: 'spark' | 'blaze') => {
    setFirebasePlan(plan);
    FileStorageService.setFirebasePlan(plan);
    setErrorMessage(null);
  };

  const handleFileSelect = (file: File) => {
    // Validar tipo de arquivo
    const validMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!validMimes.includes(file.type) && !file.name.match(/\.(jpe?g|png|gif|webp|svg)$/i)) {
      setErrorMessage('Formato de arquivo não suportado. Por favor, envie imagens nos formatos PNG, JPG, JPEG, GIF, SVG ou WebP.');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('O arquivo excede o limite máximo permitido de 25 MB.');
      return;
    }

    setSelectedFile(file);
    setErrorMessage(null);

    // Auto preencher targetName se vazio
    if (!targetName) {
      const sanitized = file.name.replace(/\s+/g, '_').replace(/[/\\#?%<>[\]|^`{}]/g, '');
      setTargetName(sanitized);
    }

    // Gerar preview e dimensões
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      setPreviewUrl(url);

      const img = new Image();
      img.onload = () => {
        setDimensions({ width: img.naturalWidth || 800, height: img.naturalHeight || 600 });
      };
      img.onerror = () => {
        setDimensions({ width: 800, height: 600 });
      };
      img.src = url;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedFile) {
      setErrorMessage('Por favor, selecione um arquivo de imagem para enviar.');
      return;
    }

    if (!user || user.role === 'convidado') {
      setErrorMessage('É necessário estar registrado e logado para enviar ficheiros à WikiWorldWeb.');
      return;
    }

    if (!targetName.trim()) {
      setErrorMessage('O nome do arquivo de destino é obrigatório.');
      return;
    }

    if (!author.trim()) {
      setErrorMessage('O campo Autor / Criador da obra é obrigatório.');
      return;
    }

    if (!source.trim()) {
      setErrorMessage('O campo Fonte / Origem do ficheiro é obrigatório.');
      return;
    }

    // Verificação de Regras de Não Uso da Wikimedia / Wikipédia
    if (detectedBannedSource) {
      setErrorMessage(
        'Upload Recusado: Detectada menção ou origem vinculada à Wikimedia Commons / Wikipédia. A política da WikiWorldWeb proíbe expressamente a importação de imagens ou textos desses repositórios.'
      );
      return;
    }

    if (!agreedToIndependentPolicy) {
      setErrorMessage(
        'É obrigatório declarar ciência e conformidade com a Política de Independência de Conteúdo e Não Importação da Wikimedia Commons/Wikipédia.'
      );
      return;
    }

    if (license === 'fair-use' && (!fairUseJustification || fairUseJustification.trim().length < 15)) {
      setErrorMessage('Para a licença de Uso Justo (Fair Use), é obrigatório fornecer uma justificativa detalhada de uso aceitável (mínimo 15 caracteres).');
      return;
    }

    // Se o plano configurado for Spark e o usuário estiver no modo cloud restrito:
    if (firebasePlan === 'spark') {
      const sparkError = FileStorageService.getSparkPlanErrorMessage();
      setErrorMessage(sparkError);
      return;
    }

    setIsUploading(true);

    try {
      const categories = categoriesText
        .split(',')
        .map((c) => c.trim())
        .filter((c) => c.length > 0);

      const input: UploadFileInput = {
        file: selectedFile,
        targetName: targetName.trim(),
        description: description.trim() || `Imagem ${targetName} enviada para a enciclopédia WikiWorldWeb.`,
        license,
        licenseDetails: licenseDetails.trim(),
        fairUseJustification: fairUseJustification.trim(),
        author: author.trim(),
        source: source.trim(),
        categories,
        comment: uploadComment.trim() || 'Envio inicial do ficheiro',
      };

      const result = await FileStorageService.uploadFile(input, user, false);

      if (!result.success || !result.file) {
        setErrorMessage(result.error || 'Ocorreu um erro ao processar o upload.');
      } else {
        setSuccessFile(result.file);
        if (onNotify) {
          onNotify(`Ficheiro "${result.file.name}" carregado com sucesso! Miniaturas geradas.`, 'success');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro inesperado durante o upload.');
    } finally {
      setIsUploading(false);
    }
  };

  const copyWikitext = (name: string) => {
    const code = `[[Arquivo:${name}|thumb|Legenda da imagem]]`;
    navigator.clipboard.writeText(code);
    setIsCopiedWikitext(true);
    setTimeout(() => setIsCopiedWikitext(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Breadcrumbs & Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono mb-1">
            <span>Especial</span>
            <span>/</span>
            <span className="text-blue-600 dark:text-blue-400 font-bold">Carregar Ficheiro</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 font-serif-heading flex items-center gap-2.5">
            <Upload className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            <span>Carregamento de Ficheiros</span>
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Envie imagens e documentos multimídia autônomos para os artigos da WikiWorldWeb.
          </p>
        </div>

        <button
          onClick={onNavigateToGallery}
          className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition flex items-center gap-1.5 shadow-xs"
        >
          <ImageIcon className="w-4 h-4 text-slate-500" />
          <span>Ver Galeria de Ficheiros</span>
        </button>
      </div>

      {/* PAINEL DE REGRAS MANDATÓRIAS (PROIBIÇÃO DE WIKIMEDIA COMMONS & WIKIPÉDIA) */}
      <div className="mb-6 rounded-xl border-2 border-rose-300 dark:border-rose-900/70 bg-gradient-to-br from-rose-50/70 via-white to-amber-50/50 dark:from-rose-950/30 dark:via-slate-900 dark:to-amber-950/20 p-5 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 shrink-0 mt-0.5 border border-rose-200 dark:border-rose-800">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-rose-950 dark:text-rose-200 uppercase tracking-wider font-mono flex items-center gap-2">
                <span>Diretrizes e Regras Rígidas de Carregamento</span>
                <span className="px-2 py-0.5 text-[10px] rounded-full bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100 font-sans font-bold">
                  Política Editorial Estrita
                </span>
              </h2>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              Para preservar a total soberania, originalidade e independência da WikiWorldWeb, estabelecem-se as seguintes regras vinculativas para todos os utilizadores:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
              <div className="p-3 rounded-lg bg-white/80 dark:bg-slate-850/80 border border-rose-200 dark:border-rose-900/50 space-y-1">
                <div className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5 font-mono text-[11px] uppercase">
                  <Ban className="w-4 h-4 text-rose-600" /> Proibição de Wikimedia Commons
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-snug">
                  É <strong>estritamente proibido</strong> importar, espelhar ou enviar imagens, ilustrações ou arquivos copiados diretamente do <em>Wikimedia Commons</em> (<code className="font-mono text-[10px]">commons.wikimedia.org</code>).
                </p>
              </div>

              <div className="p-3 rounded-lg bg-white/80 dark:bg-slate-850/80 border border-rose-200 dark:border-rose-900/50 space-y-1">
                <div className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5 font-mono text-[11px] uppercase">
                  <Ban className="w-4 h-4 text-rose-600" /> Proibição de Dados da Wikipédia
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-snug">
                  É <strong>vedado</strong> copiar descrições, metadados, fichas ou conteúdos textuais da <em>Wikipédia</em> ou de outros projetos da <em>Wikimedia Foundation</em>. Todas as informações devem ser autônomas.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-white/80 dark:bg-slate-850/80 border border-emerald-200 dark:border-emerald-900/50 space-y-1">
                <div className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 font-mono text-[11px] uppercase">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Fontes e Acervos Permitidos
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-snug">
                  São permitidos: fotografias autorais (trabalho próprio), acervos de domínio público de órgãos governamentais/museus, dados abertos oficiais e mídias sob licenças livres com fonte primária comprovada.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-white/80 dark:bg-slate-850/80 border border-indigo-200 dark:border-indigo-900/50 space-y-1">
                <div className="font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5 font-mono text-[11px] uppercase">
                  <Shield className="w-4 h-4 text-indigo-600" /> Responsabilidade do Usuário
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-snug">
                  O autor do upload assume integral responsabilidade legal e editorial pela veracidade das fontes, direitos autorais declarados e observância da Lei nº 9.610/98.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FIREBASE PLAN BANNER (SPARK VS BLAZE NOTIFICATION) */}
      <div className="mb-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-blue-50/40 dark:from-slate-900 dark:to-blue-950/20 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-lg ${firebasePlan === 'blaze' ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300'}`}>
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Infraestrutura de Armazenamento Firebase:
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border font-mono ${firebasePlan === 'blaze' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border-amber-300 dark:border-amber-700'}`}>
                  {firebasePlan === 'blaze' ? 'Plano Blaze (Ativo / Nuvem)' : 'Plano Spark (Cota Gratuita / Restrito)'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                {firebasePlan === 'blaze'
                  ? 'O plano Firebase Blaze está ativo com armazenamento persistente em nuvem e geração automática de miniaturas otimizadas.'
                  : 'Nota: O plano Firebase Spark recusa uploads diretos de ficheiros de mídia no servidor por restrição de cota. Alterne para o plano Blaze para liberar o armazenamento.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <button
              type="button"
              onClick={() => handlePlanToggle('spark')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${firebasePlan === 'spark' ? 'bg-amber-600 text-white border-amber-700 shadow-xs' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50'}`}
            >
              Simular Plano Spark
            </button>
            <button
              type="button"
              onClick={() => handlePlanToggle('blaze')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition ${firebasePlan === 'blaze' ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50'}`}
            >
              Ativar Plano Blaze
            </button>
          </div>
        </div>
      </div>

      {/* SUCESSO DE UPLOAD */}
      {successFile && (
        <div className="mb-8 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 p-6 text-slate-800 dark:text-slate-200 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-start gap-3.5">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h2 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
                Ficheiro enviado com sucesso!
              </h2>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1">
                O arquivo <strong className="font-mono">{successFile.name}</strong> foi registrado e as miniaturas em diferentes tamanhos (150px, 320px, 800px) foram geradas em conformidade com as políticas da WikiWorldWeb.
              </p>

              {/* Wikitext Syntax Box */}
              <div className="mt-4 p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="font-mono text-xs text-slate-800 dark:text-slate-200 break-all select-all">
                  [[Arquivo:{successFile.name}|thumb|{successFile.description.slice(0, 40)}...]]
                </div>
                <button
                  type="button"
                  onClick={() => copyWikitext(successFile.name)}
                  className="px-3 py-1.5 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition shrink-0 shadow-xs"
                >
                  {isCopiedWikitext ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopiedWikitext ? 'Copiado!' : 'Copiar Sintaxe'}</span>
                </button>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onNavigateToFile(successFile.name)}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1.5 shadow-xs"
                >
                  <span>Ver Página do Ficheiro</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSuccessFile(null);
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    setTargetName('');
                    setDescription('');
                    setAgreedToIndependentPolicy(false);
                  }}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition"
                >
                  Carregar Outro Ficheiro
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ERRO PADRONIZADO */}
      {errorMessage && (
        <div className="mb-6 rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 p-4 text-red-900 dark:text-red-200 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <span className="font-bold block mb-1">Erro no Processamento:</span>
            <p className="leading-relaxed font-sans">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* DETECÇÃO EM TEMPO REAL DE ORIGEM PROIBIDA (COMMONS / WIKIPEDIA) */}
      {detectedBannedSource && (
        <div className="mb-6 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 p-4 text-rose-900 dark:text-rose-200 flex items-start gap-3 shadow-xs">
          <Ban className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <span className="font-bold block mb-1">
              ⚠️ Violação de Política: Origem Proibida Detectada ({detectedBannedSource})
            </span>
            <p className="leading-relaxed font-sans">
              Você inseriu termos ou links associados ao <strong>Wikimedia Commons</strong> ou à <strong>Wikipédia</strong>. As regras da WikiWorldWeb vetam expressamente mídias importadas dessas fontes. Por favor, utilize fotografias autorais, fontes abertas independentes ou arquivos do acervo público.
            </p>
          </div>
        </div>
      )}

      {/* FORMULÁRIO PRINCIPAL */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 1. SELEÇÃO DE ARQUIVO E ARRASTAR & SOLTAR */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider font-mono flex items-center gap-2 mb-4">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs">
              1
            </span>
            <span>Arquivo Fonte e Pré-visualização</span>
          </h2>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
              isDragging
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                : selectedFile
                ? 'border-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/10'
                : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 bg-slate-50/50 dark:bg-slate-850/50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files && e.target.files.length > 0 && handleFileSelect(e.target.files[0])}
              accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
              className="hidden"
            />

            {previewUrl ? (
              <div className="flex flex-col items-center gap-3">
                <div className="relative group max-h-56 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-1">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="max-h-52 w-auto object-contain rounded"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold rounded">
                    Clique para trocar de arquivo
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {selectedFile?.name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    {selectedFile && FileStorageService.formatBytes(selectedFile.size)} • {dimensions ? `${dimensions.width} × ${dimensions.height} px` : 'Calculando...'}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="p-3.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Arraste e solte o arquivo aqui, ou <span className="text-blue-600 dark:text-blue-400 underline">procure no seu dispositivo</span>
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Formatos suportados: PNG, JPG, GIF, SVG, WebP (Máximo: 25 MB)
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 2. INFORMAÇÕES BÁSICAS DO ARQUIVO */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider font-mono flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs">
              2
            </span>
            <span>Identificação e Descrição</span>
          </h2>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Nome do Ficheiro de Destino <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-mono text-slate-400 select-none">
                Arquivo:
              </span>
              <input
                type="text"
                value={targetName}
                onChange={(e) => setTargetName(e.target.value.replace(/\s+/g, '_'))}
                placeholder="Exemplo_Fotografia_Praca_da_Se.jpg"
                required
                className="w-full pl-20 pr-3.5 py-2 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Este será o título identificador da página do ficheiro na WikiWorldWeb (ex: <code className="font-mono">[[Arquivo:{targetName || 'Exemplo.png'}]]</code>).
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Descrição / Resumo do Conteúdo
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Descreva o que a imagem retrata de forma autônoma (não copie de artigos da Wikipédia)..."
              className="w-full p-3 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Categorias (separadas por vírgula)
            </label>
            <input
              type="text"
              value={categoriesText}
              onChange={(e) => setCategoriesText(e.target.value)}
              placeholder="Fotografia, São Paulo, História do Brasil"
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* 3. LICENÇA E ATRIBUIÇÃO (OBRIGATÓRIO) */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider font-mono flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs">
              3
            </span>
            <span>Licenciamento e Atribuição Legal</span>
          </h2>
          <span className="text-[11px] font-bold text-red-600 dark:text-red-400 uppercase font-mono tracking-wider">
            Obrigatório
          </span>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Selecione a Licença de Direitos Autorais <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(Object.keys(LICENSE_DEFINITIONS) as WikiFileLicense[]).map((licKey) => {
              const lic = LICENSE_DEFINITIONS[licKey];
              const isSelected = license === licKey;

              return (
                <label
                  key={licKey}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition select-none ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 ring-1 ring-blue-600'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/40 dark:bg-slate-855/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="license"
                    value={licKey}
                    checked={isSelected}
                    onChange={() => setLicense(licKey)}
                    className="mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {lic.label}
                      </span>
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ${lic.isFree ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'}`}>
                        {lic.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                      {lic.description}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Autor / Criador Original <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Nome do fotógrafo, artista ou detentor dos direitos"
              required
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Fonte / Origem da Obra <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Ex: Trabalho próprio, Acervo Público Estadual, etc. (Não use Wikimedia)"
              required
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Justificativa de Fair Use (Condicional) */}
        {license === 'fair-use' && (
          <div className="p-3.5 rounded-lg border border-amber-300 dark:border-amber-700/80 bg-amber-50/50 dark:bg-amber-950/20 animate-in fade-in duration-150">
            <label className="block text-xs font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider mb-1">
              Justificativa Obrigatória de Uso Justo (Fair Use) <span className="text-red-500">*</span>
            </label>
            <textarea
              value={fairUseJustification}
              onChange={(e) => setFairUseJustification(e.target.value)}
              rows={2}
              placeholder="Explique por que esta imagem com direitos reservados é necessária para o artigo e por que não há alternativa livre equivalente..."
              required
              className="w-full p-2.5 text-xs rounded border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
            <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1">
              A WikiWorldWeb respeita rigorosamente a Lei de Direitos Autorais (Lei 9.610/98) e convenções internacionais de fair use.
            </p>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            Notas Adicionais de Licença / Detalhes Legais
          </label>
          <input
            type="text"
            value={licenseDetails}
            onChange={(e) => setLicenseDetails(e.target.value)}
            placeholder="Ex: Foto registrada sob protocolo #12345 no Acervo Público..."
            className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* 4. TERMO DE CONFORMIDADE OBRIGATÓRIO (DECLARAÇÃO DE INDEPENDÊNCIA) */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700/80">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreedToIndependentPolicy}
              onChange={(e) => setAgreedToIndependentPolicy(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <div className="text-xs text-slate-800 dark:text-slate-200 leading-snug">
              <span className="font-bold text-rose-700 dark:text-rose-400 block mb-0.5">
                Declaração Mandatória de Autonomia e Não Importação:
              </span>
              <span>
                Declaro formalmente sob responsabilidade legal que este ficheiro e suas informações <strong>NÃO foram importados do Wikimedia Commons</strong>, da <strong>Wikipédia</strong> ou de qualquer entidade da Wikimedia Foundation. Atesto que os créditos, fonte primária e licença são fidedignos e autônomos conforme as regras da WikiWorldWeb.
              </span>
            </div>
          </label>
        </div>
      </div>

      {/* 5. COMENTÁRIO DE ENVIO E SUBMIT */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-1/2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            Resumo / Comentário do Envio
          </label>
          <input
            type="text"
            value={uploadComment}
            onChange={(e) => setUploadComment(e.target.value)}
            placeholder="Ex: Upload inicial da fotografia em alta resolução"
            className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={onNavigateToGallery}
            className="px-4 py-2.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isUploading || !selectedFile || !agreedToIndependentPolicy || !!detectedBannedSource}
            className={`px-6 py-2.5 text-xs font-bold rounded-lg text-white transition flex items-center gap-2 shadow-sm ${
              isUploading || !selectedFile || !agreedToIndependentPolicy || !!detectedBannedSource
                ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-75'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isUploading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Processando & Gerando Miniaturas...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Carregar Ficheiro</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  </div>
  );
};
