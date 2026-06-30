const { STATES, EVENTS, transition, isActionRequired, isSilenced } = require('../src/alarm/fsm');
const assert = require('assert');

describe('Alarm FSM — ISA-18.2 state machine', () => {
  describe('transition()', () => {
    const cases = [
      // Normal transitions
      [STATES.NORMAL,               EVENTS.ALARM_RAISED,       STATES.UNACK,                true],
      [STATES.NORMAL,               EVENTS.SUPPRESS,           STATES.SUPPRESSED_BY_DESIGN, true],
      [STATES.NORMAL,               EVENTS.OOS_ENTER,          STATES.OUT_OF_SERVICE,       true],
      // Unack transitions
      [STATES.UNACK,                EVENTS.OPERATOR_ACK,       STATES.ACK,                  true],
      [STATES.UNACK,                EVENTS.ALARM_CLEARED,      STATES.RTN_UNACK,            true],
      [STATES.UNACK,                EVENTS.OPERATOR_SHELVE,    STATES.SHELVED,              true],
      // Ack transitions
      [STATES.ACK,                  EVENTS.ALARM_CLEARED,      STATES.NORMAL,               true],
      [STATES.ACK,                  EVENTS.ALARM_RAISED,       STATES.UNACK,                true],
      // RTN_UNACK
      [STATES.RTN_UNACK,            EVENTS.OPERATOR_ACK,       STATES.NORMAL,              true],
      // Shelved
      [STATES.SHELVED,              EVENTS.SHELVE_EXPIRED,     STATES.UNACK,               true],
      [STATES.SHELVED,              EVENTS.OPERATOR_UNSHELVE,  STATES.UNACK,               true],
      // Suppressed
      [STATES.SUPPRESSED_BY_DESIGN, EVENTS.UNSUPPRESS,         STATES.NORMAL,              true],
      // Out of service
      [STATES.OUT_OF_SERVICE,       EVENTS.OOS_EXIT,           STATES.NORMAL,              true],
    ];

    for (const [from, event, expected, changed] of cases) {
      it(`${from} + ${event} → ${expected}`, () => {
        const result = transition(from, event);
        assert.strictEqual(result.state, expected);
        assert.strictEqual(result.changed, changed);
      });
    }

    it('unrecognised event is a no-op', () => {
      const r = transition(STATES.NORMAL, 'BOGUS_EVENT');
      assert.strictEqual(r.state, STATES.NORMAL);
      assert.strictEqual(r.changed, false);
    });

    it('unknown state with unknown event is a no-op (does not throw)', () => {
      const r = transition('BOGUS_STATE', 'BOGUS_EVENT');
      assert.strictEqual(r.state, 'BOGUS_STATE');
      assert.strictEqual(r.changed, false);
    });
  });

  describe('isActionRequired()', () => {
    it('true for UNACK', ()     => assert.ok(isActionRequired(STATES.UNACK)));
    it('true for RTN_UNACK', () => assert.ok(isActionRequired(STATES.RTN_UNACK)));
    it('false for ACK', ()      => assert.ok(!isActionRequired(STATES.ACK)));
    it('false for NORMAL', ()   => assert.ok(!isActionRequired(STATES.NORMAL)));
  });

  describe('isSilenced()', () => {
    it('true for SHELVED', ()               => assert.ok(isSilenced(STATES.SHELVED)));
    it('true for SUPPRESSED_BY_DESIGN', ()  => assert.ok(isSilenced(STATES.SUPPRESSED_BY_DESIGN)));
    it('true for OUT_OF_SERVICE', ()        => assert.ok(isSilenced(STATES.OUT_OF_SERVICE)));
    it('false for UNACK', ()                => assert.ok(!isSilenced(STATES.UNACK)));
    it('false for NORMAL', ()               => assert.ok(!isSilenced(STATES.NORMAL)));
  });
});
