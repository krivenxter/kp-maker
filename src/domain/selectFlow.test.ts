import { describe, expect, it } from 'vitest';
import { selectFlow } from './selectFlow';

describe('selectFlow', () => {
  it('сохраняет пояснения и связь с иконкой продукта для готового сценария', () => {
    const flow = selectFlow(['calltracking', 'analytics']);
    expect(flow.steps.every((step) => step.title && step.description && step.productId)).toBe(true);
    expect(flow.benefits.every((benefit) => benefit.title && benefit.description && benefit.productId)).toBe(true);
  });

  it('собирает пояснения из данных продукта для любого состава КП', () => {
    const flow = selectFlow(['email-tracking']);
    expect(flow.steps[0].description).toBeTruthy();
    expect(flow.steps[0].productId).toBe('email-tracking');
    expect(flow.benefits[0].description).toBeTruthy();
  });
});
