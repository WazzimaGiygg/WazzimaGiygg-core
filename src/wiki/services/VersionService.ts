/**
 * @file VersionService.ts
 * @description Serviço de histórico e versionamento de páginas para o WikiZero no Firestore.
 * Armazena cada revisão como um documento imutável na subcoleção `/pages/{pageId}/versions/`.
 * Oferece suporte a consultas de histórico, visualização de revisões pontuais e reversão atômica.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  orderBy,
  where,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { getDb, getAuthSafe, handleFirestoreError, OperationType } from './firebase';
import { Version, Page } from '../types';

const PAGES_COLLECTION = 'pages';
const VERSIONS_SUBCOLLECTION = 'versions';
const LOCAL_STORAGE_VERSIONS_KEY = 'wikizero_page_versions_v1';

export class VersionService {
  /**
   * Salva uma nova versão (revisão) do artigo na subcoleção /pages/{pageId}/versions.
   * Incrementa automaticamente o número da versão e atualiza o documento pai da página.
   *
   * @param pageId ID único da página (ex: "main:pagina_principal")
   * @param content Novo conteúdo em wikitext/HTML
   * @param userId ID do usuário/editor autor da alteração
   * @param userName Nome de exibição do autor
   * @param comment Resumo da edição / justificativa da alteração
   * @param explicitPreviousVersion Número opcional da versão anterior
   * @returns A nova versão criada
   */
  public static async saveVersion(
    pageId: string,
    content: string,
    userId: string,
    userName: string,
    comment: string,
    explicitPreviousVersion?: number | null
  ): Promise<Version> {
    if (!pageId || !pageId.trim()) {
      throw new Error('O ID da página (pageId) é obrigatório para registrar a versão.');
    }

    const cleanPageId = pageId.trim();
    const cleanComment = comment?.trim() || 'Edição sem sumário';
    const timestamp = new Date().toISOString();

    // 1. Determina a versão mais recente
    let currentVersionNumber = 0;
    let previousVersion: number | null = explicitPreviousVersion ?? null;

    try {
      const db = getDb();
      const pageDocRef = doc(db, PAGES_COLLECTION, cleanPageId);
      const pageSnap = await getDoc(pageDocRef);

      if (pageSnap.exists()) {
        const pageData = pageSnap.data() as Page;
        currentVersionNumber = pageData.version || 0;
        if (previousVersion === null && currentVersionNumber > 0) {
          previousVersion = currentVersionNumber;
        }
      } else {
        // Consulta a subcoleção diretamente caso o documento pai não tenha o contador
        const versionsRef = collection(db, PAGES_COLLECTION, cleanPageId, VERSIONS_SUBCOLLECTION);
        const q = query(versionsRef, orderBy('versionNumber', 'desc'), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const latestDoc = snap.docs[0].data() as Version;
          currentVersionNumber = latestDoc.versionNumber || 0;
          if (previousVersion === null) {
            previousVersion = currentVersionNumber;
          }
        }
      }
    } catch (err) {
      console.warn('[VersionService] Não foi possível consultar última versão no Firestore, usando cache local:', err);
      const localList = this.getFromLocalCache(cleanPageId);
      if (localList.length > 0) {
        currentVersionNumber = Math.max(...localList.map((v) => v.versionNumber));
        if (previousVersion === null) {
          previousVersion = currentVersionNumber;
        }
      }
    }

    const newVersionNumber = currentVersionNumber + 1;
    const versionDocId = `v_${newVersionNumber}`;

    const newVersion: Version = {
      id: versionDocId,
      pageId: cleanPageId,
      versionNumber: newVersionNumber,
      content,
      userName: userName || 'Editor WikiZero',
      userId: userId || 'anonymous',
      timestamp,
      comment: cleanComment,
      previousVersion: previousVersion !== null && previousVersion > 0 ? previousVersion : null,
    };

    // Atualiza cache local
    this.saveToLocalCache(cleanPageId, newVersion);

    // Grava na subcoleção do Firestore e atualiza o documento da página
    try {
      const db = getDb();
      const pageDocRef = doc(db, PAGES_COLLECTION, cleanPageId);
      const versionDocRef = doc(db, PAGES_COLLECTION, cleanPageId, VERSIONS_SUBCOLLECTION, versionDocId);

      await setDoc(versionDocRef, {
        ...newVersion,
        _serverTimestamp: serverTimestamp(),
      });

      // Atualiza o documento pai com a versão atualizada e novo timestamp
      try {
        await updateDoc(pageDocRef, {
          content,
          version: newVersionNumber,
          updatedAt: timestamp,
          authorUid: userId,
          authorName: userName,
          _serverTimestamp: serverTimestamp(),
        });
      } catch (pageUpdateErr) {
        console.warn('[VersionService] Documento pai da página não pôde ser atualizado via updateDoc (pode não existir ainda):', pageUpdateErr);
      }

      return newVersion;
    } catch (error) {
      console.warn('[VersionService] Erro ao salvar versão no Firestore, utilizando dados do cache local:', error);
      if (error instanceof Error && error.message.includes('permission')) {
        handleFirestoreError(
          error,
          OperationType.CREATE,
          `${PAGES_COLLECTION}/${cleanPageId}/${VERSIONS_SUBCOLLECTION}/${versionDocId}`
        );
      }
      return newVersion;
    }
  }

  /**
   * Obtém uma versão específica de uma página pelo seu número de revisão.
   *
   * @param pageId ID da página
   * @param versionNumber Número da versão desejada
   * @returns O objeto Version correspondente ou null
   */
  public static async getVersion(pageId: string, versionNumber: number): Promise<Version | null> {
    if (!pageId || !versionNumber) return null;

    const cleanPageId = pageId.trim();
    const versionDocId = `v_${versionNumber}`;

    // 1. Tenta buscar direto no Firestore pelo ID do documento
    try {
      const db = getDb();
      const docRef = doc(db, PAGES_COLLECTION, cleanPageId, VERSIONS_SUBCOLLECTION, versionDocId);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const data = snap.data() as Version;
        this.saveToLocalCache(cleanPageId, data);
        return data;
      }

      // Consulta por campo versionNumber caso o ID tenha formato diferente
      const versionsRef = collection(db, PAGES_COLLECTION, cleanPageId, VERSIONS_SUBCOLLECTION);
      const q = query(versionsRef, where('versionNumber', '==', versionNumber), limit(1));
      const qSnap = await getDocs(q);

      if (!qSnap.empty) {
        const data = qSnap.docs[0].data() as Version;
        this.saveToLocalCache(cleanPageId, data);
        return data;
      }
    } catch (error) {
      console.warn('[VersionService] Erro ao obter versão no Firestore, buscando no cache local:', error);
    }

    // 2. Fallback para cache local
    const localList = this.getFromLocalCache(cleanPageId);
    const found = localList.find((v) => v.versionNumber === versionNumber);
    return found || null;
  }

  /**
   * Lista todas as versões de uma página ordenadas da mais recente para a mais antiga.
   *
   * @param pageId ID da página
   * @returns Lista de versões da página (ordenadas descrescente por versionNumber)
   */
  public static async getVersions(pageId: string): Promise<Version[]> {
    if (!pageId || !pageId.trim()) return [];

    const cleanPageId = pageId.trim();

    try {
      const db = getDb();
      const versionsRef = collection(db, PAGES_COLLECTION, cleanPageId, VERSIONS_SUBCOLLECTION);
      const q = query(versionsRef, orderBy('versionNumber', 'desc'));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const versions = snap.docs.map((d) => d.data() as Version);
        // Atualiza cache local
        versions.forEach((v) => this.saveToLocalCache(cleanPageId, v));
        return versions;
      }
    } catch (error) {
      console.warn('[VersionService] Erro ao listar versões do Firestore, utilizando cache local:', error);
    }

    const localList = this.getFromLocalCache(cleanPageId);
    return localList.sort((a, b) => b.versionNumber - a.versionNumber);
  }

  /**
   * Restaura o artigo para o conteúdo de uma versão anterior, criando uma nova versão (revisão).
   * Segue a filosofia do MediaWiki onde reversões não apagam o histórico, mas criam um novo ponto no tempo.
   *
   * @param pageId ID da página
   * @param targetVersionNumber Número da versão a ser restaurada
   * @param userId ID do usuário executando a reversão
   * @param userName Nome do usuário
   * @param userComment Justificativa opcional para a reversão
   * @returns A nova versão criada a partir do conteúdo restaurado
   */
  public static async revertToVersion(
    pageId: string,
    targetVersionNumber: number,
    userId: string,
    userName: string,
    userComment?: string
  ): Promise<Version> {
    const targetVersion = await this.getVersion(pageId, targetVersionNumber);
    if (!targetVersion) {
      throw new Error(`A versão #${targetVersionNumber} da página "${pageId}" não foi encontrada para reversão.`);
    }

    const revertReason = userComment?.trim()
      ? `Revertido para a versão #${targetVersionNumber}: ${userComment.trim()}`
      : `Reversão para a revisão #${targetVersionNumber} feita por ${targetVersion.userName}`;

    // Cria uma nova versão com o conteúdo exato da versão restaurada
    const newVersion = await this.saveVersion(
      pageId,
      targetVersion.content,
      userId,
      userName,
      revertReason,
      targetVersionNumber
    );

    console.info(`[VersionService] Página "${pageId}" revertida com sucesso para o estado da versão #${targetVersionNumber}.`);
    return newVersion;
  }

  // ==========================================
  // CACHE LOCAL E PERSISTÊNCIA OFFLINE
  // ==========================================

  private static getAllLocalCache(): Record<string, Version[]> {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_VERSIONS_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // Ignora erro de parse
    }
    return {};
  }

  private static getFromLocalCache(pageId: string): Version[] {
    const all = this.getAllLocalCache();
    return all[pageId] || [];
  }

  private static saveToLocalCache(pageId: string, version: Version): void {
    const all = this.getAllLocalCache();
    const list = all[pageId] || [];
    const index = list.findIndex((v) => v.versionNumber === version.versionNumber);

    if (index >= 0) {
      list[index] = version;
    } else {
      list.push(version);
    }

    all[pageId] = list;
    try {
      localStorage.setItem(LOCAL_STORAGE_VERSIONS_KEY, JSON.stringify(all));
    } catch {
      // Quota de localStorage
    }
  }
}
