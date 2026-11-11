/**
 * Citation & References Validator for Wikitext
 * Validates citation markers (<ref>, <ref name="..."/>, {{reflist}}, etc.)
 * and detects inconsistencies, broken named references, and missing references sections.
 */

export interface CitationIssue {
  id: string;
  type:
    | 'missing_references_section'
    | 'undefined_named_ref'
    | 'empty_references_section'
    | 'unclosed_ref_tag'
    | 'conflicting_named_ref'
    | 'empty_ref_tag'
    | 'heading_ref_tag';
  severity: 'error' | 'warning';
  title: string;
  description: string;
  refName?: string;
  matchText?: string;
  line?: number;
  startIndex?: number;
  endIndex?: number;
  autoFixAvailable?: boolean;
}

export interface CitationReferenceEntry {
  index: number;
  name?: string;
  content: string;
  reusedCount: number;
  line?: number;
}

export interface CitationValidationResult {
  isValid: boolean;
  totalCitations: number;
  definedCitations: number;
  reusedInvocations: number;
  hasReferencesSection: boolean;
  issues: CitationIssue[];
  referencesList: CitationReferenceEntry[];
}

function getLineNumber(text: string, charIndex: number): number {
  if (charIndex <= 0) return 1;
  return text.substring(0, Math.min(charIndex, text.length)).split('\n').length;
}

export function validateWikitextCitations(wikitext: string): CitationValidationResult {
  const issues: CitationIssue[] = [];
  const text = wikitext || '';

  // 1. Check for references section presence
  const hasReferencesSection = /(?:==\s*Refer[êe]ncias\s*==|==\s*Referencias\s*==|<references\s*\/>|\{\{reflist\}\}|\{\{Reflist\}\})/i.test(
    text
  );

  // 2. Detect unclosed or stray <ref> tags with line detection
  interface TagToken {
    isOpening: boolean;
    index: number;
    text: string;
    line: number;
  }
  const tagTokens: TagToken[] = [];
  const refTagRegex = /<\/?ref(?:\s+[^>]*)?>/gi;
  let tagMatch: RegExpExecArray | null;

  while ((tagMatch = refTagRegex.exec(text)) !== null) {
    const rawTag = tagMatch[0];
    const isSelfClosing = rawTag.endsWith('/>');
    const isClosing = rawTag.startsWith('</');
    if (isSelfClosing) continue; // ignore self-closing tags
    tagTokens.push({
      isOpening: !isClosing,
      index: tagMatch.index,
      text: rawTag,
      line: getLineNumber(text, tagMatch.index),
    });
  }

  const openStack: TagToken[] = [];
  tagTokens.forEach((token) => {
    if (token.isOpening) {
      openStack.push(token);
    } else {
      if (openStack.length > 0) {
        openStack.pop();
      } else {
        issues.push({
          id: `stray-close-ref-${token.index}`,
          type: 'unclosed_ref_tag',
          severity: 'error',
          title: 'Marcador </ref> sem tag de abertura',
          description: `Tag de fechamento </ref> encontrada na linha ${token.line} sem nenhuma tag <ref> de abertura prévia correspondente.`,
          matchText: token.text,
          line: token.line,
          startIndex: token.index,
          endIndex: token.index + token.text.length,
          autoFixAvailable: true,
        });
      }
    }
  });

  openStack.forEach((unclosed) => {
    issues.push({
      id: `unclosed-ref-${unclosed.index}`,
      type: 'unclosed_ref_tag',
      severity: 'error',
      title: 'Marcador <ref> não fechado',
      description: `O marcador "${unclosed.text}" na linha ${unclosed.line} não possui a correspondente tag de fechamento </ref>.`,
      matchText: unclosed.text,
      line: unclosed.line,
      startIndex: unclosed.index,
      endIndex: unclosed.index + unclosed.text.length,
      autoFixAvailable: true,
    });
  });

  // 3. Extract defined references with content: <ref name="...">content</ref> or <ref>content</ref>
  const definedRefsMap = new Map<string, { contents: string[]; lines: number[] }>();
  const referencesList: CitationReferenceEntry[] = [];
  let globalIndex = 0;

  const standardRefRegex = /<ref(?:\s+name=["']([^"']+)["'])?\s*>([\s\S]*?)<\/ref>/gi;
  let match: RegExpExecArray | null;

  while ((match = standardRefRegex.exec(text)) !== null) {
    const name = match[1]?.trim();
    const content = match[2]?.trim() || '';
    const line = getLineNumber(text, match.index);

    if (!content && !name) {
      issues.push({
        id: `empty-ref-${match.index}`,
        type: 'empty_ref_tag',
        severity: 'warning',
        title: 'Citação vazia detectada',
        description: `Na linha ${line}, um marcador <ref></ref> foi inserido sem nenhum conteúdo textual ou identificador.`,
        matchText: match[0],
        line,
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        autoFixAvailable: true,
      });
      continue;
    }

    if (name) {
      if (!definedRefsMap.has(name)) {
        definedRefsMap.set(name, { contents: [], lines: [] });
        globalIndex++;
        referencesList.push({
          index: globalIndex,
          name,
          content,
          reusedCount: 0,
          line,
        });
      }
      const entry = definedRefsMap.get(name)!;
      entry.contents.push(content);
      entry.lines.push(line);
    } else {
      globalIndex++;
      referencesList.push({
        index: globalIndex,
        content,
        reusedCount: 0,
        line,
      });
    }
  }

  // 4. Extract self-closing reused references: <ref name="xyz" />
  const selfClosingRegex = /<ref\s+name=["']([^"']+)["']\s*\/>/gi;
  const selfClosingNames: string[] = [];

  while ((match = selfClosingRegex.exec(text)) !== null) {
    const name = match[1]?.trim();
    if (name) {
      selfClosingNames.push(name);
      // Check if definition exists in referencesList
      const entry = referencesList.find((r) => r.name === name);
      if (entry) {
        entry.reusedCount++;
      } else {
        const line = getLineNumber(text, match.index);
        issues.push({
          id: `undefined-named-ref-${name}-${match.index}`,
          type: 'undefined_named_ref',
          severity: 'error',
          title: `Marcador de citação sem definição: "${name}"`,
          description: `O marcador <ref name="${name}" /> na linha ${line} foi invocado no texto, mas não existe nenhuma definição <ref name="${name}">Conteúdo</ref> no artigo para compor a seção de referências.`,
          refName: name,
          matchText: match[0],
          line,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          autoFixAvailable: true,
        });
      }
    }
  }

  // 5. Check for conflicting duplicate definitions of same ref name
  definedRefsMap.forEach(({ contents, lines }, name) => {
    if (contents.length > 1) {
      const first = contents[0];
      const hasConflict = contents.some((c) => c !== first && c.length > 0);
      if (hasConflict) {
        issues.push({
          id: `conflicting-ref-${name}`,
          type: 'conflicting_named_ref',
          severity: 'warning',
          title: `Definições conflitantes para "${name}"`,
          description: `A referência com nome "${name}" foi definida ${contents.length} vezes com conteúdos divergentes (linhas ${lines.join(', ')}). Apenas a primeira definição será usada na lista de notas.`,
          refName: name,
          line: lines[0],
        });
      }
    }
  });

  // 6. Check for citations inside section headings (MediaWiki antipattern)
  const headingRefRegex = /^(={1,6})[^\n]*?<ref[\s\S]*?(?:\/>|<\/ref>)[^\n]*?\1/gmi;
  let hMatch: RegExpExecArray | null;
  while ((hMatch = headingRefRegex.exec(text)) !== null) {
    const line = getLineNumber(text, hMatch.index);
    issues.push({
      id: `heading-ref-${hMatch.index}`,
      type: 'heading_ref_tag',
      severity: 'warning',
      title: 'Citação inserida dentro de cabeçalho de seção',
      description: `Na linha ${line}, há um marcador de citação dentro do título da seção. Mova a citação para o corpo do parágrafo para manter as âncoras do índice limpas.`,
      matchText: hMatch[0],
      line,
      startIndex: hMatch.index,
      endIndex: hMatch.index + hMatch[0].length,
      autoFixAvailable: false,
    });
  }

  const totalCitations = referencesList.length + selfClosingNames.length;

  // 7. Check for missing References section when citations exist
  if (totalCitations > 0 && !hasReferencesSection) {
    issues.push({
      id: 'missing-references-section',
      type: 'missing_references_section',
      severity: 'error',
      title: 'Seção de Referências ausente',
      description: `O artigo possui ${totalCitations} marcador(es) de citação no corpo do texto, mas não contém a seção "== Referências ==" com o marcador {{reflist}} para exibi-los no rodapé.`,
      line: text.split('\n').length,
      startIndex: text.length,
      endIndex: text.length,
      autoFixAvailable: true,
    });
  }

  // 8. Check for empty References section when no citations exist
  if (totalCitations === 0 && hasReferencesSection && text.trim().length > 50) {
    const refSecMatch = /(?:==\s*Refer[êe]ncias\s*==|==\s*Referencias\s*==|<references\s*\/>|\{\{reflist\}\})/i.exec(text);
    const line = refSecMatch ? getLineNumber(text, refSecMatch.index) : undefined;
    issues.push({
      id: 'empty-references-section',
      type: 'empty_references_section',
      severity: 'warning',
      title: 'Seção de Referências sem citações no texto',
      description: 'A seção de "== Referências ==" está presente no final do artigo, porém nenhum marcador <ref> foi inserido no corpo do texto.',
      line,
      startIndex: refSecMatch?.index,
      endIndex: refSecMatch ? refSecMatch.index + refSecMatch[0].length : undefined,
    });
  }

  const isValid = issues.filter((i) => i.severity === 'error').length === 0;

  return {
    isValid,
    totalCitations,
    definedCitations: referencesList.length,
    reusedInvocations: selfClosingNames.length,
    hasReferencesSection,
    issues,
    referencesList,
  };
}

/**
 * Automatically fixes common citation issues
 */
export function autoFixCitationIssue(
  wikitext: string,
  issue: CitationIssue
): string {
  let content = wikitext;

  if (issue.type === 'missing_references_section') {
    // Append standard references section
    content = `${content.trimEnd()}\n\n== Referências ==\n{{reflist}}`;
  } else if (issue.type === 'unclosed_ref_tag') {
    if (issue.matchText && issue.matchText.startsWith('</')) {
      // Remove stray </ref>
      if (issue.startIndex !== undefined && issue.endIndex !== undefined) {
        content = content.substring(0, issue.startIndex) + content.substring(issue.endIndex);
      } else {
        content = content.replace('</ref>', '');
      }
    } else {
      // Close open ref tag
      content = `${content.trimEnd()}</ref>`;
    }
  } else if (issue.type === 'empty_ref_tag') {
    // Remove empty <ref></ref>
    content = content.replace(/<ref\s*>\s*<\/ref>/g, '');
  } else if (issue.type === 'undefined_named_ref' && issue.refName) {
    // Replace the first orphan <ref name="..." /> with a complete definition
    const target = new RegExp(`<ref\\s+name=["']${issue.refName}["']\\s*\\/>`, 'i');
    content = content.replace(
      target,
      `<ref name="${issue.refName}">Fonte a especificar para ${issue.refName}</ref>`
    );
  }

  return content;
}

export interface FixCitationsResult {
  updatedWikitext: string;
  fixedCount: number;
  addedPlaceholdersCount: number;
  addedReferencesSection: boolean;
  fixedIssuesDescriptions: string[];
}

/**
 * Automatically cross-references all citation tags with the 'References' section
 * and adds any missing entries as placeholders at the bottom.
 */
export function fixAllCitationsWithPlaceholders(wikitext: string): FixCitationsResult {
  let content = wikitext || '';
  let fixedCount = 0;
  let addedPlaceholdersCount = 0;
  let addedReferencesSection = false;
  const descriptions: string[] = [];

  // 1. Cross-reference: find all named refs defined, all named refs invoked self-closing, and all anonymous refs
  const definedNames = new Set<string>();
  const definedRefRegex = /<ref(?:\s+name=["']([^"']+)["'])?\s*>([\s\S]*?)<\/ref>/gi;
  let match: RegExpExecArray | null;

  while ((match = definedRefRegex.exec(content)) !== null) {
    const name = match[1]?.trim();
    if (name) {
      definedNames.add(name);
    }
  }

  // 2. Find all invoked self-closing references: <ref name="xyz" />
  const selfClosingRegex = /<ref\s+name=["']([^"']+)["']\s*\/>/gi;
  const missingNames: string[] = [];
  while ((match = selfClosingRegex.exec(content)) !== null) {
    const name = match[1]?.trim();
    if (name && !definedNames.has(name) && !missingNames.includes(name)) {
      missingNames.push(name);
    }
  }

  // 3. Fix unclosed <ref> tags
  const openRefRegex = /<ref(?:\s+[^>]*?[^\/])?>/gi;
  const closeRefRegex = /<\/ref>/gi;
  const openCount = (content.match(openRefRegex) || []).length;
  const closeCount = (content.match(closeRefRegex) || []).length;
  if (openCount > closeCount) {
    const missingCloses = openCount - closeCount;
    content = `${content.trimEnd()}${Array(missingCloses).fill('</ref>').join('')}`;
    fixedCount += missingCloses;
    descriptions.push(`${missingCloses} tag(s) <ref> não fechada(s) foram fechadas com </ref>.`);
  }

  // 4. Fix empty <ref></ref> tags
  if (/<ref\s*>\s*<\/ref>/i.test(content)) {
    const emptyCount = (content.match(/<ref\s*>\s*<\/ref>/gi) || []).length;
    content = content.replace(
      /<ref\s*>\s*<\/ref>/gi,
      '<ref>Fonte a especificar (autor, obra, ano)</ref>'
    );
    fixedCount += emptyCount;
    descriptions.push(`${emptyCount} citação(ões) vazia(s) preenchida(s) com texto de espaço reservado.`);
  }

  // 5. For each missing named reference tag:
  // Convert the first invocation to a definition so MediaWiki parser can link it:
  missingNames.forEach((name) => {
    const target = new RegExp(`<ref\\s+name=["']${name}["']\\s*\\/>`, 'i');
    content = content.replace(
      target,
      `<ref name="${name}">Fonte pendente para "${name}" (ver detalhes nas referências)</ref>`
    );
    definedNames.add(name);
    fixedCount++;
  });

  // 6. Cross-reference all citation tags with the 'References' section
  const refSectionRegex = /(?:==\s*Refer[êe]ncias\s*==|==\s*Referencias\s*==|==\s*References\s*==)/i;
  const hasRefSection = refSectionRegex.test(content);
  const hasReflist = /(?:\{\{reflist\}\}|\{\{Reflist\}\}|<references\s*\/?>)/i.test(content);

  // If References section does not exist:
  if (!hasRefSection) {
    // Build full References section at the bottom with {{reflist}} and placeholders if needed
    let bottomSection = '\n\n== Referências ==\n{{reflist}}';
    if (missingNames.length > 0) {
      bottomSection += '\n\n<!-- Fontes e Citações Pendentes (Placeholders Adicionados Automaticamente): -->\n';
      missingNames.forEach((name) => {
        bottomSection += `* '''${name}''': [Preencher autor, publicação, link ou ano da fonte para "${name}"]\n`;
        addedPlaceholdersCount++;
      });
    }
    content = `${content.trimEnd()}${bottomSection}`;
    addedReferencesSection = true;
    fixedCount++;
    descriptions.push('Seção "== Referências ==" com {{reflist}} adicionada ao final do artigo.');
    if (missingNames.length > 0) {
      descriptions.push(`${missingNames.length} entrada(s) de espaço reservado adicionada(s) para tags sem definição.`);
    }
  } else {
    // References section exists
    if (!hasReflist) {
      // Insert {{reflist}} right under == Referências ==
      content = content.replace(
        refSectionRegex,
        (m) => `${m}\n{{reflist}}`
      );
      fixedCount++;
      descriptions.push('Marcador {{reflist}} adicionado dentro da seção de Referências.');
    }

    // If there were missing named refs, append placeholder entries at the bottom of the References section
    if (missingNames.length > 0) {
      let placeholdersText = '\n\n<!-- Fontes e Citações Pendentes (Placeholders Adicionados Automaticamente): -->\n';
      missingNames.forEach((name) => {
        placeholdersText += `* '''${name}''': [Preencher autor, publicação, link ou ano da fonte para "${name}"]\n`;
        addedPlaceholdersCount++;
      });
      content = `${content.trimEnd()}${placeholdersText}`;
      descriptions.push(`${missingNames.length} entrada(s) de espaço reservado adicionada(s) na seção de Referências.`);
    }
  }

  if (fixedCount === 0 && !hasRefSection) {
    content = `${content.trimEnd()}\n\n== Referências ==\n{{reflist}}`;
    addedReferencesSection = true;
    fixedCount = 1;
    descriptions.push('Seção de Referências verificada e {{reflist}} assegurado.');
  }

  return {
    updatedWikitext: content,
    fixedCount,
    addedPlaceholdersCount,
    addedReferencesSection,
    fixedIssuesDescriptions: descriptions,
  };
}
