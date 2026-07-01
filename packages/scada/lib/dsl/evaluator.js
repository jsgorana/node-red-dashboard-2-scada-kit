/** Apply the full transform pipeline. Returns the final string/value to set on the DOM target. */
export function evaluate(binding, tagValue) {
  try {
    const t = binding.transform || {}
    const tv = (tagValue !== null && tagValue !== undefined && typeof tagValue === 'object')
      ? tagValue
      : { value: tagValue, quality: 'good' }

    if (tv.value === null || tv.value === undefined) return t.default ?? null

    let value = tv.value

    if (t.scale)      value = applyScale(value, t.scale)
    if (t.valueMap) {
      const mapped = t.valueMap[String(value)]
      if (mapped !== undefined) value = mapped
    }
    if (t.thresholds?.length) {
      const hit = applyThresholds(value, t.thresholds)
      if (hit !== null) value = hit
    }
    if (t.format && typeof value === 'number') value = applyFormat(value, t.format)
    if (value === null || value === undefined)  value = t.default ?? null

    if (tv.quality !== 'good' && t.quality) {
      const q = t.quality
      if (tv.quality === 'uncertain' && q.onUncertain !== undefined) return q.onUncertain
      if (tv.quality === 'stale'     && q.onStale     !== undefined) return q.onStale
      if (q.onBad !== undefined) return q.onBad
    }

    return value !== null && value !== undefined ? String(value) : null
  } catch {
    return binding.transform?.default ?? null
  }
}

/** Linear interpolation from input range to output range. */
export function applyScale(value, scaleConfig) {
  const [inMin, inMax] = scaleConfig.in
  const [outMin, outMax] = scaleConfig.out
  if (inMax === inMin) return outMin
  return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin
}

/** Return the first matching threshold result, or null. */
export function applyThresholds(value, thresholds) {
  for (const t of thresholds) {
    if ((t.op === '>'  && value >  t.value) ||
        (t.op === '>=' && value >= t.value) ||
        (t.op === '<'  && value <  t.value) ||
        (t.op === '<=' && value <= t.value) ||
        (t.op === '==' && value == t.value) ||
        (t.op === '!=' && value != t.value)) return t.result
  }
  return null
}

/** Apply decimal rounding and prefix/suffix. */
export function applyFormat(value, fmt) {
  let s = (fmt.decimals !== undefined) ? Number(value).toFixed(fmt.decimals) : String(value)
  if (fmt.prefix) s = fmt.prefix + s
  if (fmt.suffix) s = s + fmt.suffix
  return s
}
