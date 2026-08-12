import { describe, expect, it } from 'vitest';
import { blankProposal, demoFixtures } from '../data/demoFixtures';
import { restoreDraft, serializeDraft } from './draftStorage';

describe('draft storage', () => {
  it('восстанавливает незавершённую форму без полной валидации', () => {
    const proposal = structuredClone(blankProposal);
    proposal.client.name = 'Н';
    proposal.project.goal = '';
    const restored = restoreDraft(serializeDraft(proposal, new Date('2026-08-12T10:00:00.000Z')), demoFixtures[0].proposal);
    expect(restored?.proposal.client.name).toBe('Н');
    expect(restored?.proposal.project.goal).toBe('');
    expect(restored?.savedAt).toBe('2026-08-12T10:00:00.000Z');
  });

  it('мигрирует старую одиночную метрику кейса', () => {
    const proposal = structuredClone(demoFixtures[0].proposal) as unknown as Record<string, unknown>;
    proposal.customCases = [{ id: 'legacy', company: 'Компания', description: 'Описание кейса', metric: { value: '+10%', label: 'рост обращений' }, url: '' }];
    proposal.caseIds = [];
    const restored = restoreDraft(JSON.stringify(proposal), blankProposal);
    expect(restored?.proposal.customCases?.[0].metrics).toEqual([{ value: '+10%', label: 'рост обращений' }]);
  });

  it('отклоняет повреждённый черновик', () => {
    expect(restoreDraft('{broken', blankProposal)).toBeUndefined();
  });
});
