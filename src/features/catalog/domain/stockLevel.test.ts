import { describe, expect, it } from 'vitest';
import { stockLevelOf } from './stockLevel';

describe('stockLevelOf', () => {
  it.each([
    [{ trackStock: false, stock: 0, lowStockThreshold: 5 }, 'untracked'],
    [{ trackStock: true, stock: -2, lowStockThreshold: 5 }, 'out'],
    [{ trackStock: true, stock: 0, lowStockThreshold: 5 }, 'out'],
    [{ trackStock: true, stock: 5, lowStockThreshold: 5 }, 'low'],
    [{ trackStock: true, stock: 6, lowStockThreshold: 5 }, 'ok'],
  ] as const)('%o → %s', (item, level) => {
    expect(stockLevelOf(item)).toBe(level);
  });
});
