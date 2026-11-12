import React, { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Calendar,
  User,
  Shield,
  Download,
  Copy,
  Check,
  ExternalLink,
  History,
  Layers,
  ArrowLeft,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Edit3,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Upload,
  Link2,
  Info,
  Scale,
} from 'lucide-react';
import { WikiFile, WikiFileVersion, UserProfile, WikiArticle } from '../types';
import { FileStorageService, LICENSE_DEFINITIONS } from '../services/fileStorageService';
import { parseWikitext } from '../utils/wikitextParser';
import { buildUidPermalink } from '../utils/urlRouter';

interface FilePageViewProps {
  fileName: string;
  articles: WikiArticle[];
  user: UserProfile | null;
  onNavigateToArticle: (articleId: string) => void;
  onNavigateToUpload: (targetName?: string) => void;
  onNavigateToGallery: () => void;
  onNotify?: (message: string, type: 'success' | 'warning' | 'info') => void;
}

export const FilePageView: React.FC<FilePageViewProps> = ({
  fileName,
  articles,
  user,
  onNavigateToArticle,
  onNavigateToUpload,
  onNavigateToGallery,
  onNotify,
}) => {
  const [file, setFile] = useState<WikiFile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedThumbSize, setSelectedThumbSize] = useState<'sm' | 'md' | 'lg' | 'orig'>('orig');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showNewVersionModal, setShowNewVersionModal] = useState<boolean>(false);

  // New version form state
  const [newVersionFile, setNewVersionFile] = useState<File | null>(null);
  const [newVersionComment, setNewVersionComment] = useState<string>('Carregamento de nova versão');
  const [isUploadingVersion, setIsUploadingVersion] = useState<boolean>(false);
  const [versionError, setVersionError] = useState<string | null>(null);

  // Load file details
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const found = await FileStorageService.getFileByName(fileName);
      setFile(found);
      setIsLoading(false);
    };
    load();
  }, [fileName]);

  // Compute backlinks / global file usage in all wiki articles
  const fileUsage = useMemo(() => {
    if (!file) return [];
    return FileStorageService.getFileUsage(file.name, articles);
  }, [file, articles]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleUploadNewVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersionFile || !file || !user) return;

    setIsUploadingVersion(true);
    setVersionError(null);

    try {
      const result = await FileStorageService.uploadFile(
        {
          file: newVersionFile,
          targetName: file.name,
          description: file.description,
          license: file.license,
          licenseDetails: file.licenseDetails,
          fairUseJustification: file.fairUseJustification,
          author: file.author,
          source: file.source,
          categories: file.categories,
          comment: newVersionComment || 'Nova versão do ficheiro',
        },
        user,
        false
      );

      if (!result.success || !result.file) {
        setVersionError(result.error || 'Erro ao carregar nova versão.');
      } else {
        setFile(result.file);
        setShowNewVersionModal(false);
        setNewVersionFile(null);
        if (onNotify) {
          onNotify(`Nova versão do ficheiro "${file.name}" salva com sucesso!`, 'success');
        }
      }
    } catch (err: any) {
      setVersionError(err.message || 'Erro inesperado ao carregar nova versão.');
    } finally {
      setIsUploadingVersion(false);
    }
  };

  const handleDeleteFile = async () => {
    if (!file) return;
    if (!window.confirm(`Tem certeza que deseja excluir permanentemente o ficheiro "${file.name}"?`)) {
      return;
    }

    try {
      await FileStorageService.deleteFile(file.id, user);
      if (onNotify) {
        onNotify(`Ficheiro "${file.name}" excluído.`, 'info');
      }
      onNavigateToGallery();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir ficheiro.');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-4"></div>
        <p className="text-sm text-slate-500 font-mono">Carregando detalhes do ficheiro...</p>
      </div>
    );
  }

  if (!file) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="p-4 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 inline-block mb-4">
          <AlertTriangle className="w-10 h-10" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 font-serif-heading mb-2">
          Ficheiro não encontrado
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6">
          O ficheiro <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{fileName}</code> ainda não foi carregado na enciclopédia WikiWorldWeb.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => onNavigateToUpload(fileName)}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 shadow-xs transition"
          >
            <Upload className="w-4 h-4" />
            <span>Carregar este ficheiro agora</span>
          </button>
          <button
            onClick={onNavigateToGallery}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition"
          >
            Voltar para a Galeria
          </button>
        </div>
      </div>
    );
  }

  const currentDisplayUrl =
    selectedThumbSize === 'sm'
      ? file.thumbnails?.sm || file.url
      : selectedThumbSize === 'md'
      ? file.thumbnails?.md || file.url
      : selectedThumbSize === 'lg'
      ? file.thumbnails?.lg || file.url
      : file.url;

  const licenseDef = LICENSE_DEFINITIONS[file.license] || LICENSE_DEFINITIONS['cc-by-sa-4.0'];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Top Breadcrumb & Actions */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono mb-1">
            <button onClick={onNavigateToGallery} className="hover:text-blue-600 hover:underline flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Ficheiros</span>
            </button>
            <span>/</span>
            <span className="text-blue-600 dark:text-blue-400 font-bold">{file.name}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 font-serif-heading flex items-center gap-2.5 break-all">
            <ImageIcon className="w-7 h-7 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>Arquivo:{file.name}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-1">
            {file.width} × {file.height} pixels • {FileStorageService.formatBytes(file.sizeBytes)} • Formato {file.mimeType}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* UID Permalink Button */}
          <button
            onClick={() => {
              const permalink = buildUidPermalink(`File:${file.name}`);
              navigator.clipboard.writeText(permalink);
              setCopiedKey('uid-permalink');
              setTimeout(() => setCopiedKey(null), 2000);
            }}
            title={`Copiar Link Permanente UID (?uid=File:${file.name})`}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition flex items-center gap-1.5 font-mono shadow-xs"
          >
            <Link2 className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">UID:</span>
            <span>File:{file.name}</span>
            {copiedKey === 'uid-permalink' ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          <button
            onClick={() => setShowNewVersionModal(true)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition flex items-center gap-1.5 shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 text-blue-600" />
            <span>Carregar nova versão</span>
          </button>

          <a
            href={file.url}
            download={file.name}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar Imagem</span>
          </a>

          {user && (user.role === 'admin' || user.role === 'moderador') && (
            <button
              onClick={handleDeleteFile}
              className="p-1.5 rounded-lg border border-red-200 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
              title="Excluir ficheiro permanentemente"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* MULTIMEDIA VIEWER & THUMBNAIL SELECTOR */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs mb-8">
        {/* Viewer Toolbar */}
        <div className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 font-mono">
            <span className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] mr-1">Miniaturas:</span>
            <button
              onClick={() => setSelectedThumbSize('sm')}
              className={`px-2 py-0.5 rounded font-semibold transition ${selectedThumbSize === 'sm' ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300'}`}
            >
              180px (Pequena)
            </button>
            <button
              onClick={() => setSelectedThumbSize('md')}
              className={`px-2 py-0.5 rounded font-semibold transition ${selectedThumbSize === 'md' ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300'}`}
            >
              380px (Média)
            </button>
            <button
              onClick={() => setSelectedThumbSize('lg')}
              className={`px-2 py-0.5 rounded font-semibold transition ${selectedThumbSize === 'lg' ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300'}`}
            >
              800px (Grande)
            </button>
            <button
              onClick={() => setSelectedThumbSize('orig')}
              className={`px-2 py-0.5 rounded font-semibold transition ${selectedThumbSize === 'orig' ? 'bg-blue-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300'}`}
            >
              Original ({file.width}×{file.height})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoomLevel((prev) => Math.max(0.5, prev - 0.25))}
              className="p-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300"
              title="Diminuir Zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((prev) => Math.min(3, prev + 0.25))}
              className="p-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300"
              title="Aumentar Zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300"
              title="Resetar Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300"
              title="Alternar Tela Cheia"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Image Canvas Container */}
        <div
          className={`p-6 flex items-center justify-center overflow-auto ${
            isFullscreen ? 'fixed inset-0 z-50 bg-slate-950/95 p-12' : 'min-h-[360px] max-h-[580px] bg-slate-100/70 dark:bg-slate-950/70'
          }`}
          style={{
            backgroundImage:
              'radial-gradient(circle, rgba(150, 150, 150, 0.15) 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        >
          {isFullscreen && (
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-mono font-bold"
            >
              Fechar Tela Cheia [ESC]
            </button>
          )}

          <img
            src={currentDisplayUrl}
            alt={file.description || file.name}
            style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.15s ease' }}
            className="max-h-[500px] w-auto max-w-full object-contain rounded shadow-md border border-slate-200 dark:border-slate-800"
          />
        </div>

        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>Resolução exibida: {selectedThumbSize.toUpperCase()}</span>
          <span>Armazenamento: {file.storageProvider === 'firebase_storage' ? 'Firebase Cloud Storage' : 'WikiWorldWeb Local Storage'}</span>
        </div>
      </div>

      {/* QUICK WIKITEXT EMBED SYNTAX */}
      <div className="bg-gradient-to-r from-blue-50/60 to-indigo-50/40 dark:from-slate-900 dark:to-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800/80 p-5 shadow-xs mb-8">
        <h2 className="text-xs font-bold font-mono text-blue-900 dark:text-blue-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <CodeIcon />
          <span>Sintaxe Wikitexto para Inserir esta Imagem nos Artigos</span>
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
          Copie qualquer uma das opções abaixo e cole diretamente no corpo de um artigo:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Opção 1: Miniatura Padrão */}
          <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shadow-xs">
            <div className="font-mono text-xs text-slate-800 dark:text-slate-200 break-all select-all">
              [[Arquivo:{file.name}|thumb|Legenda da imagem]]
            </div>
            <button
              onClick={() => handleCopy(`[[Arquivo:${file.name}|thumb|Legenda da imagem]]`, 'syntax-thumb')}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition shrink-0"
              title="Copiar sintaxe"
            >
              {copiedKey === 'syntax-thumb' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Opção 2: Largura Customizada com Alinhamento */}
          <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shadow-xs">
            <div className="font-mono text-xs text-slate-800 dark:text-slate-200 break-all select-all">
              [[Arquivo:{file.name}|300px|centro|thumb|Legenda]]
            </div>
            <button
              onClick={() => handleCopy(`[[Arquivo:${file.name}|300px|centro|thumb|Legenda]]`, 'syntax-center')}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition shrink-0"
              title="Copiar sintaxe"
            >
              {copiedKey === 'syntax-center' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* SUMMARY & METADATA TABLE */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs mb-8">
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">
            Sumário e Metadados do Ficheiro
          </h2>
        </div>

        <table className="w-full text-xs text-left border-collapse">
          <tbody>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-850/50 w-1/4 align-top">
                Descrição
              </th>
              <td className="py-2.5 px-4 text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                {file.description}
              </td>
            </tr>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-850/50 w-1/4 align-top">
                Data de Envio
              </th>
              <td className="py-2.5 px-4 text-slate-800 dark:text-slate-200 font-mono">
                {new Date(file.uploadedAt).toLocaleString('pt-BR')}
              </td>
            </tr>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-850/50 w-1/4 align-top">
                Autor / Criador
              </th>
              <td className="py-2.5 px-4 text-slate-800 dark:text-slate-200">
                {file.author}
              </td>
            </tr>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-850/50 w-1/4 align-top">
                Fonte / Origem
              </th>
              <td className="py-2.5 px-4 text-slate-800 dark:text-slate-200">
                {file.source.startsWith('http') ? (
                  <a href={file.source} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1">
                    <span>{file.source}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  file.source
                )}
              </td>
            </tr>
            <tr className="border-b border-slate-200 dark:border-slate-800">
              <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-850/50 w-1/4 align-top">
                Carregado por
              </th>
              <td className="py-2.5 px-4 text-slate-800 dark:text-slate-200 font-mono">
                {file.uploadedBy}
              </td>
            </tr>
            {file.categories && file.categories.length > 0 && (
              <tr>
                <th className="py-2.5 px-4 font-semibold text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-850/50 w-1/4 align-top">
                  Categorias
                </th>
                <td className="py-2.5 px-4 text-slate-800 dark:text-slate-200 flex flex-wrap gap-1.5">
                  {file.categories.map((c, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono text-[11px] border border-blue-200 dark:border-blue-800">
                      {c}
                    </span>
                  ))}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* OFFICIAL LICENSING BOX */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs mb-8 space-y-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 shrink-0 mt-0.5">
            <Scale className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Licenciamento & Direitos Autorais
              </h2>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${licenseDef.isFree ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'}`}>
                {licenseDef.badge}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">
              {licenseDef.label}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
              {file.licenseDetails || licenseDef.legalText}
            </p>

            {file.fairUseJustification && (
              <div className="mt-3 p-3 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 text-xs">
                <strong className="text-amber-900 dark:text-amber-300 block mb-0.5 font-mono uppercase text-[10px]">
                  Justificativa de Uso Justo (Fair Use):
                </strong>
                <p className="text-amber-800 dark:text-amber-200 leading-relaxed">
                  {file.fairUseJustification}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* WikiWorldWeb Independence Badge */}
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-850/80 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400">
          <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span>
            <strong>Conformidade Editorial WikiWorldWeb:</strong> Este ficheiro possui origem independente auditada, sem vínculos com o Wikimedia Commons ou espelhamento da Wikipédia.
          </span>
        </div>
      </div>

      {/* FILE VERSION HISTORY */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs mb-8">
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">
              Histórico do Ficheiro ({file.history?.length || 1} versão(ões))
            </h2>
          </div>
          <button
            onClick={() => setShowNewVersionModal(true)}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Carregar nova versão</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                <th className="py-2 px-3">Versão</th>
                <th className="py-2 px-3">Data/Hora</th>
                <th className="py-2 px-3">Miniatura</th>
                <th className="py-2 px-3">Dimensões</th>
                <th className="py-2 px-3">Tamanho</th>
                <th className="py-2 px-3">Utilizador</th>
                <th className="py-2 px-3">Comentário</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {(file.history && file.history.length > 0 ? file.history : [
                {
                  id: 'ver-current',
                  versionNumber: 1,
                  url: file.url,
                  thumbnails: file.thumbnails,
                  sizeBytes: file.sizeBytes,
                  width: file.width,
                  height: file.height,
                  uploadedBy: file.uploadedBy,
                  uploadedAt: file.uploadedAt,
                  comment: 'Envio original do ficheiro.',
                }
              ]).map((ver, idx) => (
                <tr key={ver.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-850/60">
                  <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                    v{ver.versionNumber || (file.history?.length || 1) - idx}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {new Date(ver.uploadedAt).toLocaleString('pt-BR')}
                  </td>
                  <td className="py-2.5 px-3">
                    <img
                      src={ver.thumbnails?.sm || ver.url}
                      alt="Thumbnail"
                      className="w-12 h-10 object-cover rounded border border-slate-200 dark:border-slate-700"
                    />
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                    {ver.width} × {ver.height}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400">
                    {FileStorageService.formatBytes(ver.sizeBytes)}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-800 dark:text-slate-200 font-semibold">
                    {ver.uploadedBy}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 italic">
                    {ver.comment || 'Sem comentário'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* GLOBAL FILE USAGE (PÁGINAS QUE USAM ESTE FICHEIRO) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider font-mono">
              Páginas que utilizam este ficheiro ({fileUsage.length})
            </h2>
          </div>
        </div>

        <div className="p-5">
          {fileUsage.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                As seguintes páginas contêm ligações ou referências diretas a este ficheiro:
              </p>
              <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                {fileUsage.map(({ article, snippet, count }, idx) => (
                  <div key={article.id || idx} className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-850 flex items-start justify-between gap-3">
                    <div>
                      <button
                        onClick={() => onNavigateToArticle(article.id)}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline font-serif-heading text-left flex items-center gap-1.5"
                      >
                        <span>{article.titulo}</span>
                        {count > 1 && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {count} ocorrências
                          </span>
                        )}
                      </button>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-1 leading-snug">
                        {snippet}
                      </p>
                    </div>
                    <button
                      onClick={() => onNavigateToArticle(article.id)}
                      className="px-2.5 py-1 text-xs rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition shrink-0"
                    >
                      Acessar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-850/60 border border-slate-200 dark:border-slate-800 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                Nenhuma página utiliza este ficheiro atualmente.
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Você pode inseri-lo em qualquer artigo editando-o e inserindo a sintaxe <code className="font-mono bg-slate-200 dark:bg-slate-800 px-1 rounded">[[Arquivo:{file.name}|thumb|legenda]]</code>.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: CARREGAR NOVA VERSÃO */}
      {showNewVersionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-serif-heading flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              <span>Carregar nova versão de {file.name}</span>
            </h3>

            {versionError && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
                {versionError}
              </div>
            )}

            <form onSubmit={handleUploadNewVersion} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Selecione o novo arquivo de imagem <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  required
                  accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                  onChange={(e) => e.target.files && e.target.files.length > 0 && setNewVersionFile(e.target.files[0])}
                  className="w-full text-xs text-slate-700 dark:text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Resumo da alteração / Motivo da nova versão
                </label>
                <input
                  type="text"
                  value={newVersionComment}
                  onChange={(e) => setNewVersionComment(e.target.value)}
                  placeholder="Ex: Correção de cores, maior resolução, etc."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewVersionModal(false);
                    setNewVersionFile(null);
                  }}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isUploadingVersion || !newVersionFile}
                  className={`px-4 py-2 text-xs font-bold rounded-lg text-white transition flex items-center gap-1.5 shadow-xs ${
                    isUploadingVersion || !newVersionFile
                      ? 'bg-slate-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isUploadingVersion ? 'Enviando...' : 'Salvar Nova Versão'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

function CodeIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}
