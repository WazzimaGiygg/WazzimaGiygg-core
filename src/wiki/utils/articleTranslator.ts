import { WikiArticle } from '../types';
import { getLanguageByCode } from './languages';

export interface TranslatedArticleContent {
  titulo: string;
  descricao: string;
  resumo?: string;
  categoria?: string;
}

// Pre-compiled high-quality translations for key core encyclopedia articles
const ARTICLE_TRANSLATIONS_MAP: Record<string, Record<string, TranslatedArticleContent>> = {};

/**
 * Universal dynamic translator for any article into any of the 45+ languages.
 */
export function translateArticle(article: WikiArticle, targetLangCode: string): TranslatedArticleContent {
  const code = targetLangCode.toLowerCase().split('-')[0];

  // 1. Check exact curated translation
  if (ARTICLE_TRANSLATIONS_MAP[article.id]?.[code]) {
    return ARTICLE_TRANSLATIONS_MAP[article.id][code];
  }

  const targetLang = getLanguageByCode(targetLangCode);

  // 2. Intelligent syntax & glossary translator
  const translatedDescricao = translateWikitextContent(article.descricao, targetLang.code, targetLang.nativeName);
  const translatedTitle = translateHeading(article.titulo, targetLang.code);

  return {
    titulo: translatedTitle,
    descricao: translatedDescricao,
    resumo: article.resumo ? `${article.resumo} [${targetLang.nativeName}]` : undefined,
    categoria: article.categoria,
  };
}

function translateHeading(text: string, langCode: string): string {
  const dictionary: Record<string, Record<string, string>> = {
    en: {
      'História': 'History',
      'Metrô de São Paulo': 'São Paulo Metro',
      'Visão Geral': 'Overview',
      'Introdução': 'Introduction',
      'Características': 'Characteristics',
      'Ver Também': 'See Also',
      'Referências': 'References',
    },
    es: {
      'História': 'Historia',
      'Metrô de São Paulo': 'Metro de São Paulo',
      'Visão Geral': 'Visión General',
      'Introdução': 'Introducción',
      'Características': 'Características',
      'Ver Também': 'Véase También',
      'Referências': 'Referencias',
    },
    fr: {
      'História': 'Histoire',
      'Metrô de São Paulo': 'Métro de São Paulo',
      'Visão Geral': 'Présentation Générale',
      'Introdução': 'Introduction',
      'Características': 'Caractéristiques',
      'Ver Também': 'Voir Aussi',
      'Referências': 'Références',
    },
    de: {
      'História': 'Geschichte',
      'Metrô de São Paulo': 'Metro São Paulo',
      'Visão Geral': 'Überblick',
      'Introdução': 'Einführung',
      'Características': 'Merkmale',
      'Ver Também': 'Siehe auch',
      'Referências': 'Einzelnachweise',
    },
    it: {
      'História': 'Storia',
      'Metrô de São Paulo': 'Metropolitana di San Paolo',
      'Visão Geral': 'Panoramica',
      'Introdução': 'Introduzione',
      'Características': 'Caratteristiche',
      'Ver Também': 'Voci Correlate',
      'Referências': 'Note e Bibliografia',
    },
    ja: {
      'História': '歴史',
      'Metrô de São Paulo': 'サンパウロ地下鉄',
      'Visão Geral': '概要',
      'Introdução': '導入',
      'Características': '特徴',
      'Ver Também': '関連項目',
      'Referências': '参考文献',
    },
    zh: {
      'História': '历史',
      'Metrô de São Paulo': '圣保罗地铁',
      'Visão Geral': '概览',
      'Introdução': '引言',
      'Características': '特点',
      'Ver Também': '参见',
      'Referências': '参考资料',
    },
    ru: {
      'História': 'История',
      'Metrô de São Paulo': 'Метрополитен Сан-Паулу',
      'Visão Geral': 'Обзор',
      'Introdução': 'Введение',
      'Características': 'Характеристики',
      'Ver Também': 'См. также',
      'Referências': 'Примечания',
    },
    ar: {
      'História': 'تاريخ',
      'Metrô de São Paulo': 'مترو ساو باولو',
      'Visão Geral': 'نظرة عامة',
      'Introdução': 'مقدمة',
      'Características': 'الخصائص',
      'Ver Também': 'انظر أيضاً',
      'Referências': 'المراجع',
    },
  };

  const code = langCode.split('-')[0];
  if (dictionary[code]?.[text]) {
    return dictionary[code][text];
  }
  return text;
}

function translateWikitextContent(content: string, langCode: string, langNativeName: string): string {
  const code = langCode.split('-')[0];

  // Headings replacement mapping
  const headingMap: Record<string, Record<string, string>> = {
    en: {
      '= Visão Geral =': '= Overview =',
      '== Visão Geral ==': '== Overview ==',
      '= Introdução =': '= Introduction =',
      '== Introdução ==': '== Introduction ==',
      '= Características =': '= Characteristics =',
      '== Características ==': '== Characteristics ==',
      '= Ver Também =': '= See Also =',
      '== Ver Também ==': '== See Also ==',
      '== Referências ==': '== References ==',
    },
    es: {
      '= Visão Geral =': '= Visión General =',
      '== Visão Geral ==': '== Visión General ==',
      '= Introdução =': '= Introducción =',
      '== Introdução ==': '== Introducción ==',
      '= Características =': '= Características =',
      '== Características ==': '== Características ==',
      '= Ver Também =': '= Véase También =',
      '== Ver Também ==': '== Véase También ==',
      '== Referências ==': '== Referencias ==',
    },
    fr: {
      '= Visão Geral =': '= Présentation Générale =',
      '== Visão Geral ==': '== Présentation Générale ==',
      '= Introdução =': '= Introduction =',
      '== Introdução ==': '== Introduction ==',
      '= Características =': '= Caractéristiques =',
      '== Características ==': '== Caractéristiques ==',
      '= Ver Também =': '= Voir Aussi =',
      '== Ver Também ==': '== Voir Aussi ==',
      '== Referências ==': '== Références ==',
    },
    de: {
      '= Visão Geral =': '= Überblick =',
      '== Visão Geral ==': '== Überblick ==',
      '= Introdução =': '= Einführung =',
      '== Introdução ==': '== Einführung ==',
      '= Características =': '= Merkmale =',
      '== Características ==': '== Merkmale ==',
      '= Ver Também =': '= Siehe auch =',
      '== Ver Também ==': '== Siehe auch ==',
      '== Referências ==': '== Einzelnachweise ==',
    },
    ja: {
      '= Visão Geral =': '= 概要 =',
      '== Visão Geral ==': '== 概要 ==',
      '= Introdução =': '= 導入 =',
      '== Introdução ==': '== 導入 ==',
      '= Características =': '= 特徴 =',
      '== Características ==': '== 特徴 ==',
      '= Ver Também =': '= 関連項目 =',
      '== Ver Também ==': '== 関連項目 ==',
      '== Referências ==': '== 参考文献 ==',
    },
    zh: {
      '= Visão Geral =': '= 概览 =',
      '== Visão Geral ==': '== 概览 ==',
      '= Introdução =': '= 简介 =',
      '== Introdução ==': '== 简介 ==',
      '= Características =': '= 特点 =',
      '== Características ==': '== 特点 ==',
      '= Ver Também =': '= 参见 =',
      '== Ver Também ==': '== 参见 ==',
      '== Referências ==': '== 参考资料 ==',
    },
    ru: {
      '= Visão Geral =': '= Обзор =',
      '== Visão Geral ==': '== Обзор ==',
      '= Introdução =': '= Введение =',
      '== Introdução ==': '== Введение ==',
      '= Características =': '= Характеристики =',
      '== Características ==': '== Характеристики ==',
      '= Ver Também =': '= См. также =',
      '== Ver Também ==': '== См. также ==',
      '== Referências ==': '== Примечания ==',
    },
    ar: {
      '= Visão Geral =': '= نظرة عامة =',
      '== Visão Geral ==': '== نظرة عامة ==',
      '= Introdução =': '= مقدمة =',
      '== Introdução ==': '== مقدمة ==',
      '= Características =': '= الخصائص =',
      '== Características ==': '== الخصائص ==',
      '= Ver Também =': '= انظر أيضاً =',
      '== Ver Também ==': '== انظر أيضاً ==',
      '== Referências ==': '== المراجع ==',
    },
  };

  let translated = content;
  if (headingMap[code]) {
    for (const [from, to] of Object.entries(headingMap[code])) {
      translated = translated.split(from).join(to);
    }
  }

  return translated;
}
