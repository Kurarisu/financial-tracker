import test from 'node:test';
import assert from 'node:assert/strict';
import { formatCurrency, normalizeTransactionType } from './finance-helpers.mjs';

test('formatCurrency formats Indonesian Rupiah values', () => {
  assert.equal(formatCurrency(1250000), 'Rp 1.250.000');
  assert.equal(formatCurrency('2500000'), 'Rp 2.500.000');
});

test('normalizeTransactionType keeps supported values and falls back to expense', () => {
  assert.equal(normalizeTransactionType('income'), 'income');
  assert.equal(normalizeTransactionType('transfer'), 'transfer');
  assert.equal(normalizeTransactionType('unknown'), 'expense');
});
