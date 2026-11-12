import React, { useState, useEffect, useMemo } from 'react';
import {
  Image as ImageIcon,
  Upload,
  Search,
  Filter,
  Grid,
  List,
  Calendar,
  User,
  Shield,
  FileCheck,
  Sparkles,
  Layers,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { WikiFile, WikiFileLicense, UserProfile } from '../types';
import { FileStorageService, LICENSE_DEFINITIONS } from '../services/fileStorageService';

interface FilesGalleryViewProps {
  user: UserProfile | null;
  onNavigateToFile: (fileName: string) => void;
  onNavigateToUpload: () => void;
}

export const FilesGalleryView: React.FC<FilesGalleryViewProps> = ({
  user,
  onNavigateToFile,
  onNavigateToUpload,
}) => {
  const [files, setFiles] = useState<WikiFile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLicense, setSelectedLicense] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'name-asc' | 'size-desc'>('date-desc');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const data = await FileStorageService.getFiles();
      setFiles(data);
      setIsLoading(false);
    };
    load();
  }, []);

  const filteredFiles = useMemo(() => {
    return files
      .filter((f) => {
        const matchesQuery =
          !searchQuery.trim() ||
          f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (f.categories && f.categories.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase())));

        const matchesLicense = selectedLicense === 'all' || f.license === selectedLicense;

        return matchesQuery && matchesLicense;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') {
          return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
        }
        if (sortBy === 'date-asc') {
          return new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
        }
        if (sortBy === 'name-asc') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'size-desc') {
          return b.sizeBytes - a.sizeBytes;
        }
        return 0;
      });
  }, [files, searchQuery, selectedLicense, sortBy]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono mb-1">
            <span>Especial</span>
            <span>/</span>
            <span className="text-blue-600 dark:text-blue-400 font-bold">Ficheiros e Mídias</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 font-serif-heading flex items-center gap-2.5">
            <ImageIcon className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            <span>Galeria de Ficheiros ({files.length})</span>
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Repositório de imagens, diagramas e mídias licenciadas da enciclopédia WikiWorldWeb.
          </p>
        </div>

        <button
          onClick={onNavigateToUpload}
          className="px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition flex items-center gap-1.5 shadow-xs"
        >
          <Upload className="w-4 h-4" />
          <span>Carregar Novo Ficheiro</span>
        </button>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome de ficheiro, autor, descrição..."
            className="w-full pl-9 pr-3.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={selectedLicense}
            onChange={(e) => setSelectedLicense(e.target.value)}
            className="py-1.5 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="all">Todas as Licenças</option>
            <option value="cc-by-sa-4.0">CC BY-SA 4.0</option>
            <option value="cc-by-4.0">CC BY 4.0</option>
            <option value="cc0-public-domain">Domínio Público</option>
            <option value="gfdl">GFDL</option>
            <option value="fair-use">Uso Justo (Fair Use)</option>
            <option value="own-work">Trabalho Próprio</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="py-1.5 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            <option value="date-desc">Mais Recentes</option>
            <option value="date-asc">Mais Antigos</option>
            <option value="name-asc">Nome (A-Z)</option>
            <option value="size-desc">Maior Tamanho</option>
          </select>

          <div className="border-l border-slate-300 dark:border-slate-700 pl-2 flex items-center gap-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition ${viewMode === 'grid' ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600'}`}
              title="Exibição em Grade"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition ${viewMode === 'table' ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600'}`}
              title="Exibição em Tabela"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-16 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-4"></div>
          <p className="text-xs text-slate-500 font-mono">Carregando catálogo de ficheiros...</p>
        </div>
      ) : filteredFiles.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-xs">
          <ImageIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">Nenhum ficheiro encontrado</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto mb-4">
            Não foram encontrados ficheiros correspondentes aos filtros selecionados.
          </p>
          <button
            onClick={onNavigateToUpload}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs inline-flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4" />
            <span>Enviar o primeiro ficheiro</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredFiles.map((file) => {
            const lic = LICENSE_DEFINITIONS[file.license] || LICENSE_DEFINITIONS['cc-by-sa-4.0'];
            return (
              <div
                key={file.id}
                onClick={() => onNavigateToFile(file.name)}
                className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition cursor-pointer flex flex-col"
              >
                {/* Thumbnail Preview with Checkerboard */}
                <div
                  className="h-44 bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-2 relative overflow-hidden border-b border-slate-100 dark:border-slate-800"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle, rgba(150, 150, 150, 0.15) 1px, transparent 1px)',
                    backgroundSize: '12px 12px',
                  }}
                >
                  <img
                    src={file.thumbnails?.md || file.url}
                    alt={file.name}
                    className="max-h-full max-w-full object-contain rounded group-hover:scale-105 transition-transform duration-200"
                    loading="lazy"
                  />
                  <span
                    className={`absolute top-2 right-2 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded uppercase shadow-xs ${
                      lic.isFree
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-600 text-white'
                    }`}
                  >
                    {lic.badge}
                  </span>
                </div>

                {/* Details */}
                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition font-mono truncate" title={file.name}>
                      {file.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-snug">
                      {file.description || 'Sem descrição.'}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>{file.width}×{file.height}</span>
                    <span>{FileStorageService.formatBytes(file.sizeBytes)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                <th className="py-2.5 px-4">Miniatura</th>
                <th className="py-2.5 px-4">Nome do Ficheiro</th>
                <th className="py-2.5 px-4">Dimensões</th>
                <th className="py-2.5 px-4">Tamanho</th>
                <th className="py-2.5 px-4">Licença</th>
                <th className="py-2.5 px-4">Enviado por</th>
                <th className="py-2.5 px-4">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredFiles.map((file) => {
                const lic = LICENSE_DEFINITIONS[file.license] || LICENSE_DEFINITIONS['cc-by-sa-4.0'];
                return (
                  <tr
                    key={file.id}
                    onClick={() => onNavigateToFile(file.name)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-850/60 cursor-pointer transition"
                  >
                    <td className="py-2 px-4">
                      <img
                        src={file.thumbnails?.sm || file.url}
                        alt={file.name}
                        className="w-10 h-8 object-cover rounded border border-slate-200 dark:border-slate-700"
                      />
                    </td>
                    <td className="py-2 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {file.name}
                    </td>
                    <td className="py-2 px-4 font-mono text-slate-600 dark:text-slate-400">
                      {file.width} × {file.height}
                    </td>
                    <td className="py-2 px-4 font-mono text-slate-600 dark:text-slate-400">
                      {FileStorageService.formatBytes(file.sizeBytes)}
                    </td>
                    <td className="py-2 px-4">
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${lic.isFree ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'}`}>
                        {lic.badge}
                      </span>
                    </td>
                    <td className="py-2 px-4 font-mono text-slate-700 dark:text-slate-300">
                      {file.uploadedBy}
                    </td>
                    <td className="py-2 px-4 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(file.uploadedAt).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
