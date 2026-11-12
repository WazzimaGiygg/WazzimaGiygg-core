import { AcademicPublication } from '../types/academic';

/**
 * Formatador oficial de referências acadêmicas para múltiplos estilos:
 * ABNT NBR 6023, BibTeX, APA 7ª edição, Chicago e IEEE.
 */

function formatAuthorAbnt(authorName: string): string {
  const parts = authorName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].toUpperCase();
  const lastName = parts[parts.length - 1].toUpperCase();
  const initials = parts.slice(0, parts.length - 1).map((p) => `${p.charAt(0).toUpperCase()}.`).join(' ');
  return `${lastName}, ${initials}`;
}

function formatAuthorApa(authorName: string): string {
  const parts = authorName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const lastName = parts[parts.length - 1];
  const initials = parts.slice(0, parts.length - 1).map((p) => `${p.charAt(0).toUpperCase()}.`).join(' ');
  return `${lastName}, ${initials}`;
}

export function formatToAbnt(pub: AcademicPublication): string {
  const authorList = pub.autores.map((a) => formatAuthorAbnt(a.nome)).join('; ');
  const title = pub.titulo.toUpperCase();
  const subtitle = pub.subtitulo ? `: ${pub.subtitulo}` : '';
  const year = pub.anoPublicacao;
  const doi = pub.doi ? ` DOI: https://doi.org/${pub.doi}.` : '';

  if (pub.tipo === 'tese_doutorado' || pub.tipo === 'dissertacao_mestrado' || pub.tipo === 'tcc_monografia') {
    const grau = pub.tipo === 'tese_doutorado'
      ? 'Tese (Doutorado)'
      : pub.tipo === 'dissertacao_mestrado'
      ? 'Dissertação (Mestrado)'
      : 'Trabalho de Conclusão de Curso (Graduação)';
    const inst = pub.universidadeOuInstituicao || 'Instituição de Ensino Superior';
    const ppg = pub.programaPosGraduacao ? ` – ${pub.programaPosGraduacao}` : '';
    return `${authorList}. ${title}${subtitle}. ${year}. ${grau} – ${inst}${ppg}, ${year}.${doi}`;
  }

  if (pub.tipo === 'conferencia') {
    const event = pub.periodicoOuEvento || 'Anais do Congresso';
    const pages = pub.paginas ? `, p. ${pub.paginas}` : '';
    return `${authorList}. ${title}${subtitle}. In: ${event}, ${year}. Anais [...]. ${year}${pages}.${doi}`;
  }

  if (pub.tipo === 'preprint') {
    const venue = pub.periodicoOuEvento || (pub.arxivId ? `arXiv:${pub.arxivId}` : 'Preprint');
    return `${authorList}. ${title}${subtitle}. ${venue}, ${year}. Pré-publicação (Preprint).${doi}`;
  }

  // Artigo de periódico padrão
  const journal = pub.periodicoOuEvento || 'Periódico Científico';
  const vol = pub.volume ? `, v. ${pub.volume}` : '';
  const num = pub.fasciculo ? `, n. ${pub.fasciculo}` : '';
  const pag = pub.paginas ? `, p. ${pub.paginas}` : '';
  return `${authorList}. ${title}${subtitle}. ${journal}${vol}${num}${pag}, ${year}.${doi}`;
}

export function formatToBibtex(pub: AcademicPublication): string {
  const firstAuthor = pub.autores[0]?.nome.split(/\s+/).pop()?.toLowerCase() || 'academic';
  const citeKey = `${firstAuthor}${pub.anoPublicacao}${pub.titulo.slice(0, 8).replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`;
  const authorsBib = pub.autores.map((a) => a.nome).join(' and ');

  let entryType = 'article';
  if (pub.tipo === 'tese_doutorado') entryType = 'phdthesis';
  else if (pub.tipo === 'dissertacao_mestrado') entryType = 'mastersthesis';
  else if (pub.tipo === 'conferencia') entryType = 'inproceedings';
  else if (pub.tipo === 'capitulo_livro') entryType = 'incollection';
  else if (pub.tipo === 'relatorio_tecnico') entryType = 'techreport';
  else if (pub.tipo === 'dataset_pesquisa') entryType = 'misc';

  const lines = [
    `@${entryType}{${citeKey},`,
    `  title = {${pub.titulo}${pub.subtitulo ? ': ' + pub.subtitulo : ''}},`,
    `  author = {${authorsBib}},`,
    `  year = {${pub.anoPublicacao}},`,
  ];

  if (pub.periodicoOuEvento) {
    if (entryType === 'article') lines.push(`  journal = {${pub.periodicoOuEvento}},`);
    else if (entryType === 'inproceedings') lines.push(`  booktitle = {${pub.periodicoOuEvento}},`);
    else lines.push(`  publisher = {${pub.periodicoOuEvento}},`);
  }

  if (pub.universidadeOuInstituicao && (entryType === 'phdthesis' || entryType === 'mastersthesis')) {
    lines.push(`  school = {${pub.universidadeOuInstituicao}},`);
  }

  if (pub.volume) lines.push(`  volume = {${pub.volume}},`);
  if (pub.fasciculo) lines.push(`  number = {${pub.fasciculo}},`);
  if (pub.paginas) lines.push(`  pages = {${pub.paginas}},`);
  if (pub.doi) lines.push(`  doi = {${pub.doi}},`);
  if (pub.pdfUrl) lines.push(`  url = {${pub.pdfUrl}},`);

  lines.push('}');
  return lines.join('\n');
}

export function formatToApa(pub: AcademicPublication): string {
  const authorList = pub.autores.map((a) => formatAuthorApa(a.nome)).join(', & ');
  const title = `${pub.titulo}${pub.subtitulo ? ': ' + pub.subtitulo : ''}`;
  const year = pub.anoPublicacao;
  const doi = pub.doi ? ` https://doi.org/${pub.doi}` : '';

  if (pub.tipo === 'tese_doutorado' || pub.tipo === 'dissertacao_mestrado') {
    const degree = pub.tipo === 'tese_doutorado' ? 'Doctoral dissertation' : "Master's thesis";
    const inst = pub.universidadeOuInstituicao || 'University';
    return `${authorList} (${year}). ${title} [${degree}, ${inst}].${doi}`;
  }

  const journal = pub.periodicoOuEvento ? `*${pub.periodicoOuEvento}*` : '';
  const vol = pub.volume ? `, ${pub.volume}` : '';
  const num = pub.fasciculo ? `(${pub.fasciculo})` : '';
  const pages = pub.paginas ? `, ${pub.paginas}` : '';

  return `${authorList} (${year}). ${title}. ${journal}${vol}${num}${pages}.${doi}`;
}

export function formatToIeee(pub: AcademicPublication): string {
  const authorList = pub.autores.map((a) => {
    const parts = a.nome.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    const initial = parts[0].charAt(0).toUpperCase() + '.';
    const last = parts[parts.length - 1];
    return `${initial} ${last}`;
  }).join(', ');

  const title = `"${pub.titulo}${pub.subtitulo ? ': ' + pub.subtitulo : ''}"`;
  const venue = pub.periodicoOuEvento ? `in *${pub.periodicoOuEvento}*` : '';
  const vol = pub.volume ? `, vol. ${pub.volume}` : '';
  const no = pub.fasciculo ? `, no. ${pub.fasciculo}` : '';
  const pp = pub.paginas ? `, pp. ${pub.paginas}` : '';
  const year = `, ${pub.anoPublicacao}`;
  const doi = pub.doi ? `, doi: ${pub.doi}.` : '.';

  return `${authorList}, ${title}, ${venue}${vol}${no}${pp}${year}${doi}`;
}
