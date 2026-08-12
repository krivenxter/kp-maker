import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import brands from './brands.json';
import cases from './cases.json';
import caseCandidatesNeedsReview from './caseCandidatesNeedsReview.json';
import industries from './industries.json';
import managers from './managers.json';
import products from './products.json';
import flows from './solutionFlows.json';
import { caseLibrarySchema } from '../schemas/caseLibrary';

function expectUniqueIds(items: Array<{ id: string }>) {
  expect(new Set(items.map((item) => item.id)).size).toBe(items.length);
}

describe('целостность справочников', () => {
  it('не содержит повторяющихся ID', () => {
    [products, cases, managers, brands, industries, flows].forEach(expectUniqueIds);
    expectUniqueIds([...cases, ...caseCandidatesNeedsReview]);
  });

  it('валидирует рабочую библиотеку и очередь проверки кейсов', () => {
    expect(caseLibrarySchema.safeParse(cases).success).toBe(true);
    expect(caseLibrarySchema.safeParse(caseCandidatesNeedsReview).success).toBe(true);
    expect(cases.every((item) => item.status === 'approved' && item.verification.level === 'confirmed')).toBe(true);
    expect(caseCandidatesNeedsReview.every((item) => item.status === 'draft' && item.verification.level === 'needs-review')).toBe(true);
  });

  it('все ссылки кейсов и сценариев указывают на существующие продукты', () => {
    const ids = new Set(products.map((product) => product.id));
    for (const item of cases) item.products.forEach((id) => expect(ids.has(id)).toBe(true));
    for (const flow of flows) {
      flow.productIds.forEach((id) => expect(ids.has(id)).toBe(true));
      flow.steps.forEach((step) => expect(ids.has(step.productId)).toBe(true));
      flow.benefits.forEach((benefit) => expect(ids.has(benefit.productId)).toBe(true));
    }
  });

  it('использует безопасные адреса существующих продуктовых изображений', () => {
    for (const product of products) {
      expect(product.icon).toMatch(/^\/(?:visuals\/[a-z0-9-]+\.png|icons\/[A-Za-z0-9-]+\.svg)$/);
      expect(existsSync(resolve(process.cwd(), 'calltouch-assets', product.icon.slice(1)))).toBe(true);
    }
  });

  it('хранит существующий логотип и ссылку на источник для каждого рабочего кейса', () => {
    for (const item of cases) {
      expect(existsSync(resolve(process.cwd(), 'calltouch-assets', item.logo.slice(1)))).toBe(true);
      expect(item.url).not.toBe('не указано');
    }
    for (const item of caseCandidatesNeedsReview) {
      expect(existsSync(resolve(process.cwd(), 'calltouch-assets', item.logo.slice(1)))).toBe(true);
    }
  });

  it('хранит необходимые контакты менеджеров', () => {
    for (const manager of managers) {
      expect(manager.name.trim().length).toBeGreaterThan(3);
      expect(manager.position.trim().length).toBeGreaterThan(3);
      expect(manager.email).toMatch(/^[^@]+@[^@]+\.[^@]+$/);
      expect(manager.phone.replace(/\D/g, '').length).toBeGreaterThanOrEqual(10);
    }
  });
});
