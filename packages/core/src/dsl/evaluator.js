/**
 * Tag-binding DSL evaluator.
 * Applies the transform pipeline in fixed order: scale → valueMap → thresholds → format → default → quality.
 */

/** Apply the full transform pipeline. Returns the final string/value to set on the DOM target. */
function evaluate(binding, tagValue) {
  try {
    const t = binding.transform || {};

    // Normalise raw scalar to TagValue shape
    const tv = (tagValue !== null && tagValue !== undefined && typeof tagValue === 'object')
      ? tagValue
      : { value: tagValue, quality: 'good' };

    // Null/missing tag — return default immediately
    if (tv.value === null || tv.value === undefined) {
      return t.default ?? null;
    }

    let value = tv.value;

    // 1. Scale
    if (t.scale) value = applyScale(value, t.scale);

    // 2. valueMap
    if (t.valueMap) {
      const mapped = t.valueMap[String(value)];
      if (mapped !== undefined) value = mapped;
    }

    // 3. Thresholds
    if (t.thresholds && t.thresholds.length) {
      const hit = applyThresholds(value, t.thresholds);
      if (hit !== null) value = hit;
    }

    // 4. Format (only if still numeric after scale; skip if thresholds/valueMap produced a string)
    if (t.format && typeof value === 'number') value = applyFormat(value, t.format);

    // 5. Default (if pipeline left value as null/undefined)
    if (value === null || value === undefined) value = t.default ?? null;

    // 6. Quality override — runs last, overrides everything
    if (tv.quality !== 'good' && t.quality) {
      const q = t.quality;
      if (tv.quality === 'uncertain' && q.onUncertain !== undefined) return q.onUncertain;
      if (tv.quality === 'stale'     && q.onStale     !== undefined) return q.onStale;
      if (q.onBad !== undefined) return q.onBad;
    }

    return value !== null && value !== undefined ? String(value) : null;
  } catch {
    return binding.transform?.default ?? null;
  }
}

/** Linear interpolation from input range to output range. */
function applyScale(value, scaleConfig) {
  const [inMin, inMax] = scaleConfig.in;
  const [outMin, outMax] = scaleConfig.out;
  if (inMax === inMin) return outMin;
  return ((value - inMin) / (inMax - inMin)) * (outMax - outMin) + outMin;
}

/** Return the first matching threshold's result, or null if none match. */
function applyThresholds(value, thresholds) {
  for (const t of thresholds) {
    /* eslint-disable eqeqeq */
    if ((t.op === '>'  && value >  t.value) ||
        (t.op === '>=' && value >= t.value) ||
        (t.op === '<'  && value <  t.value) ||
        (t.op === '<=' && value <= t.value) ||
        (t.op === '==' && value == t.value) ||
        (t.op === '!=' && value != t.value)) {
      return t.result;
    }
    /* eslint-enable eqeqeq */
  }
  return null;
}

/** Apply decimal rounding and prefix/suffix. */
function applyFormat(value, fmt) {
  let s = (fmt.decimals !== undefined) ? Number(value).toFixed(fmt.decimals) : String(value);
  if (fmt.prefix) s = fmt.prefix + s;
  if (fmt.suffix) s = s + fmt.suffix;
  return s;
}

module.exports = { evaluate, applyScale, applyThresholds, applyFormat };
