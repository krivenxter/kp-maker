import { migrateProposalDocument, type ProposalDocument } from '../schemas/proposal';

export const DRAFT_STORAGE_KEY = 'calltouch-proposal-draft-v2';
export const LEGACY_DRAFT_STORAGE_KEY = 'calltouch-proposal-draft-v1';

type DraftEnvelope = {
  draftVersion: 2;
  savedAt: string;
  proposal: ProposalDocument;
};

type DraftRestoreResult = {
  proposal: ProposalDocument;
  savedAt?: string;
};

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function arrayOr<T>(value: unknown, fallback: T[]): T[] {
  return Array.isArray(value) ? value as T[] : fallback;
}

export function serializeDraft(proposal: ProposalDocument, savedAt = new Date()): string {
  const envelope: DraftEnvelope = {
    draftVersion: 2,
    savedAt: savedAt.toISOString(),
    proposal,
  };
  return JSON.stringify(envelope);
}

export function restoreDraft(serialized: string, fallback: ProposalDocument): DraftRestoreResult | undefined {
  try {
    const parsed = JSON.parse(serialized) as unknown;
    const envelope = record(parsed);
    const payload = envelope.draftVersion === 2 ? envelope.proposal : parsed;
    const migrated = record(migrateProposalDocument(payload));
    if (migrated.version !== 1) return undefined;

    const client = record(migrated.client);
    const project = record(migrated.project);
    const pricing = record(migrated.pricing);
    const cover = record(migrated.cover);
    const customManager = migrated.customManager === undefined ? undefined : record(migrated.customManager);

    const proposal = {
      ...structuredClone(fallback),
      ...migrated,
      version: 1,
      client: { ...fallback.client, ...client },
      project: {
        ...fallback.project,
        ...project,
        channels: arrayOr(project.channels, fallback.project.channels),
        integrations: arrayOr(project.integrations, fallback.project.integrations),
      },
      products: arrayOr(migrated.products, fallback.products),
      pricing: {
        ...fallback.pricing,
        ...pricing,
        plans: arrayOr(pricing.plans, fallback.pricing.plans),
      },
      caseIds: arrayOr(migrated.caseIds, fallback.caseIds),
      customCases: migrated.customCases === undefined ? undefined : arrayOr(migrated.customCases, []),
      customManager: customManager ? {
        firstName: '',
        lastName: '',
        position: '',
        email: '',
        phone: '',
        ...customManager,
      } : undefined,
      cover: {
        ...fallback.cover,
        ...cover,
      },
    } as ProposalDocument;

    return {
      proposal,
      savedAt: typeof envelope.savedAt === 'string' ? envelope.savedAt : undefined,
    };
  } catch {
    return undefined;
  }
}
