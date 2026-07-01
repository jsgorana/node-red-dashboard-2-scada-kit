export const BINDING_SCHEMA = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'ScadaBindingConfig',
  type: 'object',
  required: ['bindings'],
  additionalProperties: false,
  properties: {
    bindings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['selector', 'source', 'target'],
        additionalProperties: false,
        properties: {
          id:       { type: 'string' },
          selector: { type: 'string', minLength: 1 },
          source:   { type: 'string', minLength: 1 },
          target: {
            type: 'object',
            required: ['type'],
            additionalProperties: false,
            properties: {
              type: { type: 'string', enum: ['text', 'attribute', 'style', 'transform', 'visibility', 'level'] },
              name: { type: 'string' },
              axis: { type: 'string', enum: ['x', 'y'] },
              max:  { type: 'number' },
            },
          },
          transform: {
            type: 'object',
            additionalProperties: false,
            properties: {
              scale: {
                type: 'object',
                required: ['in', 'out'],
                properties: {
                  in:  { type: 'array', items: { type: 'number' }, minItems: 2, maxItems: 2 },
                  out: { type: 'array', items: { type: 'number' }, minItems: 2, maxItems: 2 },
                },
              },
              valueMap:   { type: 'object', additionalProperties: { type: 'string' } },
              thresholds: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['op', 'value', 'result'],
                  properties: {
                    op:     { type: 'string', enum: ['>', '>=', '<', '<=', '==', '!='] },
                    value:  { oneOf: [{ type: 'number' }, { type: 'string' }] },
                    result: { type: 'string' },
                  },
                },
              },
              format: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  decimals: { type: 'integer', minimum: 0, maximum: 10 },
                  prefix:   { type: 'string' },
                  suffix:   { type: 'string' },
                },
              },
              default: { type: 'string' },
              quality: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  onBad:       { type: 'string' },
                  onUncertain: { type: 'string' },
                  onStale:     { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    events: {
      type: 'array',
      items: {
        type: 'object',
        required: ['selector', 'action', 'emit'],
        additionalProperties: false,
        properties: {
          selector: { type: 'string', minLength: 1 },
          action:   { type: 'string', enum: ['click', 'dblclick', 'pointerdown', 'pointerup', 'focus', 'blur'] },
          emit: {
            type: 'object',
            required: ['topic'],
            additionalProperties: true,
            properties: {
              topic:   { type: 'string' },
              payload: {},
            },
          },
        },
      },
    },
  },
}
