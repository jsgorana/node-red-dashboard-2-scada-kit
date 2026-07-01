const fs = require('node:fs')
const path = require('node:path')

const catalog = require('./src/catalog.json')

function readSymbol(file) {
  return fs.readFileSync(path.join(__dirname, 'src', file), 'utf8')
}

const symbols = Object.fromEntries(
  catalog.symbols.map((symbol) => [symbol.id, readSymbol(symbol.file)])
)

function getSymbol(id) {
  if (!Object.prototype.hasOwnProperty.call(symbols, id)) {
    throw new Error(`Unknown SCADA symbol: ${id}`)
  }
  return symbols[id]
}

module.exports = {
  catalog,
  symbols,
  getSymbol,
}
