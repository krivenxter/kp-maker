import casesData from '../data/cases.json';

export type CaseItem = (typeof casesData)[number];

export function selectCases(industry: string, productIds: string[], limit = 3): CaseItem[] {
  return [...casesData]
    .map((item) => ({
      item,
      score: (item.industry === industry ? 4 : 0) + item.products.filter((id) => productIds.includes(id)).length * 2,
    }))
    .sort((a, b) => b.score - a.score || a.item.company.localeCompare(b.item.company, 'ru'))
    .slice(0, limit)
    .map(({ item }) => item);
}
