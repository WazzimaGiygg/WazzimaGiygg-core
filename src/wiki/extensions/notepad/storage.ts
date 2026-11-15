// src/extensions/notepad/storage.ts
import { collection, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import { encodeWkwdwz, decodeWkwdwz, type WkwdwzEnvelope, type WkwdwzNote } from "./wkwdwz";

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export type UploadResult =
  | { status: "created"; docId: string; revision: number }
  | { status: "updated"; docId: string; revision: number }
  | { status: "conflict"; docId: string; remote: WkwdwzNote; local: WkwdwzNote };

export async function uploadWkwdwz(
  db: Firestore,
  uid: string,
  envelope: WkwdwzEnvelope,
): Promise<UploadResult> {
  const localHash = await sha256(JSON.stringify(envelope.payload));
  const remoteRef = envelope.sync
    ? doc(db, "users", envelope.sync.ownerUid, "notepad", envelope.sync.docId)
    : null;

  // Caso 1: arquivo novo (nunca subiu)
  if (!remoteRef) {
    const newRef = doc(collection(db, "users", uid, "notepad"));
    const revision = 1;
    await setDoc(newRef, {
      ...envelope.payload,
      revision,
      contentHash: localHash,
      updatedAt: new Date().toISOString(),
    });
    return { status: "created", docId: newRef.id, revision };
  }

  // Caso 2: arquivo com sync — checar conflito
  const snap = await getDoc(remoteRef);
  if (!snap.exists()) {
    // Remoto desapareceu (TTL, deleção). Recriar com o mesmo docId.
    await setDoc(remoteRef, {
      ...envelope.payload,
      revision: (envelope.sync?.revision ?? 0) + 1,
      contentHash: localHash,
      updatedAt: new Date().toISOString(),
    });
    return { status: "updated", docId: remoteRef.id, revision: (envelope.sync?.revision ?? 0) + 1 };
  }

  const remote = snap.data() as WkwdwzNote & { contentHash: string; revision: number };

  // Conflito: remoto mudou desde a última sync do arquivo local
  if (remote.contentHash !== envelope.sync?.contentHash) {
    return { status: "conflict", docId: remoteRef.id, remote, local: envelope.payload };
  }

  // Sem conflito: atualizar
  const revision = remote.revision + 1;
  await updateDoc(remoteRef, {
    ...envelope.payload,
    revision,
    contentHash: localHash,
    updatedAt: new Date().toISOString(),
  });
  return { status: "updated", docId: remoteRef.id, revision };
}
