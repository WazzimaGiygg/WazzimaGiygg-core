/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Integração de serviços WikiZero / WikiWazzimaGiygg com o banco de dados original Firestore.
 */

import { Firestore } from 'firebase/firestore';
import { db, auth } from '../../firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const currentUser = auth?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUser?.uid ?? null,
      email: currentUser?.email ?? null,
    },
    operationType,
    path,
  };

  console.error('[Firestore Error]:', JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}

export function getDb(): Firestore {
  return db;
}

export function getDbSafe(): Firestore | null {
  return db;
}

export function getAuthSafe() {
  return auth;
}
