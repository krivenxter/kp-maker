import { describe, expect, it } from 'vitest';
import { demoFixtures } from '../data/demoFixtures';
import { proposalSchema } from './proposal';

describe('schemas', () => {
  it('принимает валидный ProposalDocument', () => expect(proposalSchema.safeParse(demoFixtures[0].proposal).success).toBe(true));
  it('отклоняет слишком длинный cover subtitle', () => {
    const proposal = structuredClone(demoFixtures[0].proposal);
    proposal.cover.subtitle = 'x'.repeat(131);
    expect(proposalSchema.safeParse(proposal).success).toBe(false);
  });
});
