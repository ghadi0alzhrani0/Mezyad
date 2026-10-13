import test from 'node:test';
import assert from 'node:assert/strict';
import {validMoney, toCents} from '../src/money.js';

test('money validation', () => {
 assert.equal(validMoney(10.25), true);
 assert.equal(validMoney(10.001), false);
 assert.equal(validMoney(0), false);
 assert.equal(validMoney('10.25'), false);
 assert.equal(toCents('0.29'), 29);
 assert.equal(toCents('0.10') + toCents('0.20'), 30);
});
