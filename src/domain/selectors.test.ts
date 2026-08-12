import { describe, expect, it } from 'vitest';
import { selectCases } from './selectCases';

describe('selectors', () => {
  it('ставит отраслевой кейс с совпадающим продуктом выше остальных', () => expect(selectCases('automotive', ['calltracking', 'analytics'])[0].id).toBe('jetour'));
});
