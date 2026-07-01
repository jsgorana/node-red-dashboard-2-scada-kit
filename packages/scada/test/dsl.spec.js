import assert from 'node:assert'
import { describe, it } from 'vitest'
import { evaluate, applyScale, applyThresholds, applyFormat } from '../lib/dsl/evaluator.js'
import { parse } from '../lib/dsl/parser.js'

describe('DSL evaluator — transform pipeline', () => {
  describe('applyScale()', () => {
    it('maps 0–100 input to 0–1 output', () => {
      assert.strictEqual(applyScale(50, { in: [0, 100], out: [0, 1] }), 0.5);
    });
    it('clamps correctly at boundaries', () => {
      assert.strictEqual(applyScale(0,   { in: [0, 100], out: [0, 1] }), 0);
      assert.strictEqual(applyScale(100, { in: [0, 100], out: [0, 1] }), 1);
    });
    it('handles inverted output range', () => {
      assert.strictEqual(applyScale(0, { in: [0, 100], out: [1, 0] }), 1);
    });
  });

  describe('applyThresholds()', () => {
    const thresholds = [
      { op: '>', value: 90, result: 'hmi-alarm-high' },
      { op: '>', value: 70, result: 'hmi-alarm-med' },
    ];
    it('first match wins', () => assert.strictEqual(applyThresholds(95, thresholds), 'hmi-alarm-high'));
    it('second match when first misses', () => assert.strictEqual(applyThresholds(80, thresholds), 'hmi-alarm-med'));
    it('null when no match', () => assert.strictEqual(applyThresholds(50, thresholds), null));
  });

  describe('applyFormat()', () => {
    it('rounds to decimals', () => assert.strictEqual(applyFormat(12.456, { decimals: 1 }), '12.5'));
    it('adds prefix and suffix', () => assert.strictEqual(applyFormat(12, { prefix: '~', suffix: ' A' }), '~12 A'));
    it('decimals + suffix', () => assert.strictEqual(applyFormat(12.4, { decimals: 1, suffix: ' A' }), '12.4 A'));
  });

  describe('evaluate() — full pipeline (SRS §3.4 worked examples)', () => {
    it('pass-through: no transform', () => {
      const b = { transform: {} };
      assert.strictEqual(evaluate(b, { value: 42, quality: 'good' }), '42');
    });

    it('valueMap: true → running colour', () => {
      const b = { transform: { valueMap: { 'true': 'var(--hmi-running)', 'false': 'var(--hmi-stopped)' }, default: 'var(--hmi-nofeedback)' } };
      assert.strictEqual(evaluate(b, { value: true, quality: 'good' }), 'var(--hmi-running)');
      assert.strictEqual(evaluate(b, { value: false, quality: 'good' }), 'var(--hmi-stopped)');
    });

    it('scale → format: tank level 67.2% → "67.2 %"', () => {
      const b = { transform: { scale: { in: [0, 100], out: [0, 100] }, format: { decimals: 1, suffix: ' %' } } };
      assert.strictEqual(evaluate(b, { value: 67.2, quality: 'good' }), '67.2 %');
    });

    it('thresholds: amps > 18 → alarm class', () => {
      const b = { transform: { thresholds: [{ op: '>', value: 18, result: 'hmi-alarm-high' }], format: { decimals: 1, suffix: ' A' } } };
      // Over threshold — thresholds produce a string, format is skipped (not numeric)
      assert.strictEqual(evaluate(b, { value: 19, quality: 'good' }), 'hmi-alarm-high');
      // Under threshold — format applied
      assert.strictEqual(evaluate(b, { value: 12.4, quality: 'good' }), '12.4 A');
    });

    it('quality override: bad quality → nofeedback colour', () => {
      const b = { transform: { valueMap: { 'true': 'var(--hmi-running)' }, quality: { onBad: 'var(--hmi-nofeedback)' } } };
      assert.strictEqual(evaluate(b, { value: true, quality: 'bad' }), 'var(--hmi-nofeedback)');
    });

    it('quality override: uncertain → specific colour', () => {
      const b = { transform: { quality: { onBad: 'gray', onUncertain: 'yellow' } } };
      assert.strictEqual(evaluate(b, { value: 1, quality: 'uncertain' }), 'yellow');
    });

    it('null tagValue → returns default', () => {
      const b = { transform: { default: 'var(--hmi-nofeedback)' } };
      assert.strictEqual(evaluate(b, null), 'var(--hmi-nofeedback)');
    });

    it('does not throw on malformed config', () => {
      assert.doesNotThrow(() => evaluate({}, { value: 1, quality: 'good' }));
    });
  });
});

describe('DSL parser — schema validation', () => {
  it('accepts a valid minimal binding config', () => {
    const config = {
      bindings: [
        { selector: '#P101_body', source: 'P101.run', target: { type: 'style', name: 'fill' } },
      ],
    };
    const { valid, errors } = parse(config);
    assert.ok(valid, errors.join(', '));
  });

  it('rejects missing required fields', () => {
    const { valid } = parse({ bindings: [{ selector: '#x' }] });
    assert.ok(!valid);
  });

  it('rejects unknown target type', () => {
    const { valid } = parse({ bindings: [{ selector: '#x', source: 'tag', target: { type: 'bogus' } }] });
    assert.ok(!valid);
  });

  it('accepts event bindings', () => {
    const config = {
      bindings: [],
      events: [{ selector: '#P101', action: 'click', emit: { topic: 'open-faceplate', payload: { equip: 'P101' } } }],
    };
    const { valid } = parse(config);
    assert.ok(valid);
  });
});
