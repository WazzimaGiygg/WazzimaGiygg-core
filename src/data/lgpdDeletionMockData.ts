/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Integrated LGPD Art. 18 Deletion Requests Seed Data
 * Mirrored from public/admin/admintools/solicitacaodeexlusao/index.html
 */

import type { DeletionRequest } from '../firebase';

export const DELETION_REQUESTS_UPDATED_EVENT = 'wzzm:deletion-requests-updated';
const MOCK_OVERRIDES_STORAGE_KEY = 'wzzm_lgpd_deletion_mock_overrides_v1';

export const SOLICITACAO_EXCLUSAO_MOCK_REQUESTS: DeletionRequest[] = [
  {
    id: 'LGPD-REQ-9841',
    protocolo: 'LGPD-REQ-9841',
    name: 'Carlos Eduardo Silva',
    nomeCompleto: 'Carlos Eduardo Silva',
    email: 'carlos.silva@exemplo.com.br',
    phone: '+55 (11) 98765-4321',
    reason:
      'Revogação de consentimento com base no Art. 18 da LGPD. Solicito exclusão de cadastros e comentários antigos.',
    motivo:
      'Revogação de consentimento com base no Art. 18 da LGPD. Solicito exclusão de cadastros e comentários antigos.',
    dataTypes: ['Dados Cadastrais', 'Comentários no Fórum', 'Histórico de Sessão'],
    tipoDado: 'Dados Cadastrais, Comentários no Fórum, Histórico de Sessão',
    status: 'pending',
    requestDate: '2026-11-04T14:20:00.000Z',
    dataSolicitacao: '2026-11-04T14:20:00.000Z',
    ipAddress: '177.136.24.112',
    processedBy: null,
    completedAt: null,
    observacoes: ''
  },
  {
    id: 'LGPD-REQ-9832',
    protocolo: 'LGPD-REQ-9832',
    name: 'Mariana Costa Leite',
    nomeCompleto: 'Mariana Costa Leite',
    email: 'mariana.leite@usp.br',
    phone: '+55 (19) 99123-5566',
    reason:
      'Encerramento de vínculo acadêmico e anonimização de perfil em conformidade com a LGPD.',
    motivo:
      'Encerramento de vínculo acadêmico e anonimização de perfil em conformidade com a LGPD.',
    dataTypes: ['Perfil de Usuário', 'Registros de Acesso'],
    tipoDado: 'Perfil de Usuário, Registros de Acesso',
    status: 'processing',
    requestDate: '2026-11-03T09:15:00.000Z',
    dataSolicitacao: '2026-11-03T09:15:00.000Z',
    ipAddress: '200.144.12.89',
    processedBy: 'pedrohenriquecardonaperes@gmail.com',
    observacoes: 'Análise preliminar iniciada pelo Encarregado de Dados (DPO).'
  },
  {
    id: 'LGPD-REQ-9810',
    protocolo: 'LGPD-REQ-9810',
    name: 'João Batista Rocha',
    nomeCompleto: 'João Batista Rocha',
    email: 'j.rocha@advocacia.net',
    phone: '+55 (61) 98111-2233',
    reason: 'Exclusão integral de dados pessoais.',
    motivo: 'Exclusão integral de dados pessoais.',
    dataTypes: ['Dados Cadastrais'],
    tipoDado: 'Dados Cadastrais',
    status: 'completed',
    requestDate: '2026-10-28T16:45:00.000Z',
    dataSolicitacao: '2026-10-28T16:45:00.000Z',
    ipAddress: '189.40.110.5',
    processedBy: 'pedrohenriquecardonaperes@gmail.com',
    completedAt: '2026-10-29T11:00:00.000Z',
    dataConclusao: '2026-10-29T11:00:00.000Z',
    certificateId: 'LGPD-CERT-984210',
    certificadoExclusao: 'LGPD-CERT-984210',
    observacoes: 'Expurgo integral validado com emissão de certificado comprobatório.'
  }
];

type DeletionOverrideMap = Record<
  string,
  Partial<
    Pick<
      DeletionRequest,
      | 'status'
      | 'processedBy'
      | 'completedAt'
      | 'dataConclusao'
      | 'rejectedAt'
      | 'rejectionReason'
      | 'observacoes'
      | 'certificateId'
      | 'certificadoExclusao'
    >
  >
>;

function readOverrides(): DeletionOverrideMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(MOCK_OVERRIDES_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DeletionOverrideMap) : {};
  } catch {
    return {};
  }
}

export function saveLocalDeletionOverride(
  id: string,
  patch: DeletionOverrideMap[string]
) {
  if (typeof window === 'undefined') return;
  try {
    const current = readOverrides();
    current[id] = { ...(current[id] || {}), ...patch };
    window.localStorage.setItem(MOCK_OVERRIDES_STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent(DELETION_REQUESTS_UPDATED_EVENT));
  } catch {
    // Ignore storage quota errors
  }
}

export function mergeDeletionRequestsWithMock(
  liveRequests: DeletionRequest[]
): DeletionRequest[] {
  const overrides = readOverrides();
  const byId = new Map<string, DeletionRequest>();

  // 1. Seed mock records from public/admin/admintools/solicitacaodeexlusao/index.html
  for (const mockReq of SOLICITACAO_EXCLUSAO_MOCK_REQUESTS) {
    byId.set(mockReq.id, { ...mockReq });
  }

  // 2. Overlay live Firestore / backend API requests (live takes precedence on matching ID)
  for (const liveReq of liveRequests) {
    const key = liveReq.id || liveReq.protocolo;
    if (!key) continue;
    const prev = byId.get(key);
    byId.set(key, {
      ...(prev || {}),
      ...liveReq
    });
  }

  // 3. Apply any local Burocrata processing overrides made in-session
  for (const [id, req] of byId.entries()) {
    const ov = overrides[id];
    if (ov) {
      byId.set(id, { ...req, ...ov });
    }
  }

  return Array.from(byId.values()).sort((a, b) => {
    const tA = new Date(a.requestDate || a.dataSolicitacao || 0).getTime();
    const tB = new Date(b.requestDate || b.dataSolicitacao || 0).getTime();
    return tB - tA;
  });
}
