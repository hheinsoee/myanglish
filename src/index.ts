/**
 * Slug helpers.
 *
 * Slugs are kept ASCII (romanized) for SEO + shareability and to avoid the
 * Unicode-normalization fragility that makes raw Myanmar slugs break in URLs.
 * `slugify` transliterates Myanmar script to a readable phonetic Latin form,
 * passes Latin/digits straight through, and emits a clean `a-z0-9-` slug.
 *
 * The transliteration is an approximation (Burmese romanization is editorial,
 * not deterministic) — it produces a sensible default that staff can override.
 */

// Initial-consonant sounds (inherent vowel handled by the rhyme builder).
const ONSET: Record<string, string> = {
  '\u1000': 'k', '\u1001': 'kh', '\u1002': 'g', '\u1003': 'g', '\u1004': 'ng',
  '\u1005': 's', '\u1006': 'hs', '\u1007': 'z', '\u1008': 'z', '\u1009': 'ny', '\u100A': 'ny',
  '\u100B': 't', '\u100C': 'ht', '\u100D': 'd', '\u100E': 'd', '\u100F': 'n',
  '\u1010': 't', '\u1011': 'ht', '\u1012': 'd', '\u1013': 'd', '\u1014': 'n',
  '\u1015': 'p', '\u1016': 'ph', '\u1017': 'b', '\u1018': 'b', '\u1019': 'm',
  '\u101A': 'y', '\u101B': 'y', '\u101C': 'l', '\u101D': 'w', '\u101E': 'th',
  '\u101F': 'h', '\u1020': 'l', '\u1021': '',
}

// Independent vowels (standalone vowel letters).
const INDEP: Record<string, string> = {
  '\u1021': 'a', '\u1023': 'i', '\u1024': 'i', '\u1025': 'u',
  '\u1026': 'u', '\u1027': 'e', '\u1029': 'aw', '\u102A': 'aw',
}

// Final (killed) consonant sounds.
const FINAL: Record<string, string> = {
  '\u1000': 'k', '\u1001': 'k', '\u1004': 'ng', '\u1005': 't', '\u1006': 't',
  '\u1009': 'in', '\u100A': 'i', '\u100B': 't', '\u100C': 't', '\u100F': 'n',
  '\u1010': 't', '\u1011': 't', '\u1012': 't', '\u1014': 'n', '\u1015': 't',
  '\u1016': 't', '\u1017': 't', '\u1018': 't', '\u1019': 'm', '\u101C': 'l',
}

// Palatalized onsets when a y-medial (\u103B / \u103C) follows.
const PALATAL: Record<string, string> = {
  k: 'ky', kh: 'ch', g: 'gy', ng: 'ny', p: 'py', ph: 'ch', b: 'by', m: 'my',
}

const isCons = (c: string): boolean => c >= '\u1000' && c <= '\u1021'
const isMyDigit = (c: string): boolean => c >= '\u1040' && c <= '\u1049'

/** Length (in code points) of the Myanmar syllable starting at `start`. */
function syllableLength(cps: string[], start: number): number {
  let i = start + 1
  while (i < cps.length) {
    const c = cps[i]
    if (c >= '\u103B' && c <= '\u103E') { i++; continue } // medials
    if ((c >= '\u102B' && c <= '\u1032') || c === '\u1036' || c === '\u1037' || c === '\u1038') { i++; continue } // vowels + tones
    if (c === '\u103A') { i++; continue } // asat on base
    break
  }
  // final consonant + asat (killed) closes this syllable
  if (i < cps.length && isCons(cps[i]) && cps[i + 1] === '\u103A') i += 2
  // stacked consonant: the first consonant is this syllable's final, the
  // virama + next consonant open the following syllable
  else if (i < cps.length && isCons(cps[i]) && cps[i + 1] === '\u1039') i += 1
  return i - start
}

/** Romanize a single Myanmar syllable (array of its code points). */
function romanizeSyllable(cps: string[]): string {
  let i = 0
  let onset = ONSET[cps[i]] !== undefined ? ONSET[cps[i]] : ''
  i++

  let medY = false, medW = false, medH = false
  while (i < cps.length) {
    const c = cps[i]
    if (c === '\u103B' || c === '\u103C') { medY = true; i++ }
    else if (c === '\u103D') { medW = true; i++ }
    else if (c === '\u103E') { medH = true; i++ }
    else break
  }
  if (medY) onset = PALATAL[onset] ?? onset + 'y'
  if (medH) onset = 'h' + onset
  if (medW) onset += 'w'

  let eSign = false, aSign = false, iSign = false, uSign = false, aiSign = false, anus = false
  for (; i < cps.length; i++) {
    const c = cps[i]
    if (c === '\u1031') eSign = true
    else if (c === '\u102C' || c === '\u102B') aSign = true
    else if (c === '\u102D' || c === '\u102E') iSign = true
    else if (c === '\u102F' || c === '\u1030') uSign = true
    else if (c === '\u1032') aiSign = true
    else if (c === '\u1036') anus = true
    else if (c === '\u1037' || c === '\u1038') { /* tone marks: drop */ }
    else break
  }

  let final = ''
  let finalChar = ''
  if (i < cps.length && isCons(cps[i]) && cps[i + 1] === '\u103A') {
    finalChar = cps[i]
    final = FINAL[finalChar] !== undefined ? FINAL[finalChar] : ''
    i += 2
  } else if (i < cps.length && isCons(cps[i]) && cps[i + 1] === '\u1039') {
    finalChar = cps[i]
    final = FINAL[finalChar] !== undefined ? FINAL[finalChar] : ''
    i += 1
  }

  let rhyme: string
  if (eSign && aSign) rhyme = 'aw'
  else if (iSign && uSign) rhyme = 'o'
  else if (eSign) rhyme = 'e'
  else if (aSign) rhyme = 'a'
  else if (iSign) rhyme = 'i'
  else if (uSign) rhyme = 'u'
  else if (aiSign) rhyme = 'ai'
  else rhyme = 'a'
  if (anus) rhyme += 'n'

  // s-class final (\u1005 \u1006) raises an inherent 'a' to 'i' → "chit", "sit"
  if ((finalChar === '\u1005' || finalChar === '\u1006') && rhyme === 'a') rhyme = 'i'

  // Nasal/stop final vowel-coloring tweaks for readability.
  if (final === 'ng') {
    if (rhyme === 'aw') rhyme = 'au'
    else if (rhyme === 'a') rhyme = 'i'
    rhyme += 'ng'
    final = ''
  } else if (final && rhyme === 'aw') {
    rhyme = 'au'
  }

  return onset + rhyme + final
}

/** Transliterate a string (Myanmar + Latin + digits) to a lowercase ASCII slug. */
export function slugify(input: string): string {
  const cps = [...(input ?? '').normalize('NFC')]
  const tokens: string[] = []
  let i = 0
  while (i < cps.length) {
    const c = cps[i]
    if (isCons(c)) {
      const len = syllableLength(cps, i)
      tokens.push(romanizeSyllable(cps.slice(i, i + len)))
      i += len
    } else if (isMyDigit(c)) {
      let j = i
      let num = ''
      while (j < cps.length && isMyDigit(cps[j])) { num += String(cps[j].codePointAt(0)! - 0x1040); j++ }
      tokens.push(num)
      i = j
    } else if (INDEP[c] !== undefined) {
      tokens.push(INDEP[c])
      i++
    } else if (/[a-zA-Z0-9]/.test(c)) {
      let j = i
      while (j < cps.length && /[a-zA-Z0-9]/.test(cps[j])) j++
      tokens.push(cps.slice(i, j).join(''))
      i = j
    } else if (c === '\u1039') {
      i++ // stray virama
    } else {
      tokens.push(' ')
      i++
    }
  }
  return tokens
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
