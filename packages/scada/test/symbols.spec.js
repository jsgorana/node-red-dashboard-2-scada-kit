import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const { catalog, getSymbol, symbols } = require('../symbols')

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const srcDir = path.join(__dirname, '..', 'symbols', 'src')
const idPattern = /\bid="([^"]+)"/g

function svgIds(svg) {
  return new Set([...svg.matchAll(idPattern)].map((match) => match[1]))
}

describe('symbol catalog', () => {
  it('exports every cataloged symbol as SVG text', () => {
    for (const symbol of catalog.symbols) {
      expect(symbols[symbol.id]).toContain('<svg')
      expect(getSymbol(symbol.id)).toBe(symbols[symbol.id])
    }
  })

  it('catalog IDs match real SVG element IDs', () => {
    for (const symbol of catalog.symbols) {
      const svg = fs.readFileSync(path.join(srcDir, symbol.file), 'utf8')
      const ids = svgIds(svg)

      expect(ids.has(symbol.id)).toBe(true)
      expect(symbol.elements.length).toBeGreaterThan(0)

      for (const elementId of symbol.elements) {
        expect(ids.has(elementId), `${symbol.file} is missing ${elementId}`).toBe(true)
      }

      for (const binding of symbol.bindings) {
        expect(ids.has(binding.target), `${symbol.file} binding target missing: ${binding.target}`).toBe(true)
      }
    }
  })

  it('uses HP-HMI state tokens and non-color alarm affordances', () => {
    for (const symbol of catalog.symbols) {
      const svg = fs.readFileSync(path.join(srcDir, symbol.file), 'utf8')

      expect(svg).toContain('var(--hmi-stopped)')
      expect(svg).toContain('var(--hmi-running)')
      expect(svg).toContain('var(--hmi-alarm-high)')
      expect(svg).toContain('RUNNING')
      expect(svg).toMatch(/id="[^"]*alarm-(shape|text)"/)
    }
  })

  it('includes accessible names and descriptions for Dashboard rendering', () => {
    for (const symbol of catalog.symbols) {
      const svg = fs.readFileSync(path.join(srcDir, symbol.file), 'utf8')

      expect(svg).toContain('role="img"')
      expect(svg).toContain('<title')
      expect(svg).toContain('<desc')
      expect(svg).toContain('aria-labelledby=')
    }
  })

  it('throws for unknown symbol IDs', () => {
    expect(() => getSymbol('not-a-symbol')).toThrow('Unknown SCADA symbol')
  })
})
