import { fireEvent, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { looksLikeScan, useBarcodeScanner } from './useBarcodeScanner';

describe('looksLikeScan', () => {
  it('distingue un lector (rápido) de una persona (lenta)', () => {
    expect(looksLikeScan([0, 10, 20, 30, 40, 50], 6, 40)).toBe(true);
    expect(looksLikeScan([0, 10, 200, 210, 220, 230], 6, 40)).toBe(false);
    expect(looksLikeScan([0, 10], 6, 40)).toBe(false);
  });
});

describe('useBarcodeScanner', () => {
  it('emite el código al recibir Enter tras teclas rápidas', () => {
    const onScan = vi.fn();
    renderHook(() => {
      useBarcodeScanner(onScan, { minLength: 3, maxKeyIntervalMs: 1000 });
    });
    for (const key of '7701') fireEvent.keyDown(window, { key });
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(onScan).toHaveBeenCalledWith('7701');
  });
});
