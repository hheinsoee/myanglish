import { test } from 'node:test'
import assert from 'node:assert/strict'
import { slugify } from '../dist/index.js'

test('romanizes Myanmar syllables', () => {
  assert.equal(slugify('မြန်မာ'), 'myan-ma') // y-medial + killed final
  assert.equal(slugify('ကျောင်း'), 'kyaung') // palatal onset, aw+ng → aung
  assert.equal(slugify('ရန်ကုန်'), 'yan-kun')
})

test('stacked consonants split across syllables', () => {
  assert.equal(slugify('သင်္ချာ'), 'thing-cha')
  assert.equal(slugify('အင်္ဂလိပ်'), 'ing-ga-lit')
})

test('mixed Latin, Myanmar digits and punctuation', () => {
  assert.equal(slugify('English Grammar ၂၀၂၆'), 'english-grammar-2026')
  assert.equal(slugify('  Hello,  World!  '), 'hello-world')
})

test('nothing sluggable yields empty string', () => {
  assert.equal(slugify(''), '')
  assert.equal(slugify('!!!'), '')
})

test('ASCII slugs are idempotent', () => {
  const s = slugify('မပုံစာအုပ်ဆိုင်')
  assert.equal(slugify(s), s)
})
