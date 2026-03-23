import { describe, expect, it } from 'vitest';
import { sortByDate, sortByOrder } from '../../src/utils/sorting';

describe('sortByOrder', () => {
  it('returns a new array sorted ascending by order without mutating the input', () => {
    const items = [
      { id: 'third', order: 3 },
      { id: 'first', order: 1 },
      { id: 'second', order: 2 },
    ];
    const original = [...items];

    const sorted = sortByOrder(items);

    expect(sorted).toEqual([
      { id: 'first', order: 1 },
      { id: 'second', order: 2 },
      { id: 'third', order: 3 },
    ]);
    expect(sorted).not.toBe(items);
    expect(items).toEqual(original);
  });
});

describe('sortByDate', () => {
  it('returns a new array sorted ascending by ISO date without mutating the input', () => {
    const items = [
      { id: 'late', date: '2026-03-10' },
      { id: 'early-a', date: '2026-01-02' },
      { id: 'early-b', date: '2026-01-02' },
    ];
    const original = [...items];

    const sorted = sortByDate(items);

    expect(sorted).toEqual([
      { id: 'early-a', date: '2026-01-02' },
      { id: 'early-b', date: '2026-01-02' },
      { id: 'late', date: '2026-03-10' },
    ]);
    expect(sorted).not.toBe(items);
    expect(items).toEqual(original);
  });
});
