# myanglish

Myanmar (Burmese) text → readable English-letter URL slugs. Zero dependencies, ESM + CJS, typed.

```sh
npm install myanglish
```

```ts
import { slugify } from 'myanglish'

slugify('မြန်မာ')               // 'myan-ma'
slugify('ကျောင်း')              // 'kyaung'
slugify('ရန်ကုန်')              // 'yan-kun'
slugify('English Grammar ၂၀၂၆') // 'english-grammar-2026'
```

- Myanmar script is romanized phonetically, syllable by syllable (medials, killed finals, stacked consonants).
- Myanmar digits become Latin digits; Latin letters and digits pass through.
- Output is always `a-z0-9` joined by single `-`. Input with nothing to slug returns `''`. Supply your own fallback.
- Idempotent: an existing ASCII slug comes back unchanged.

Burmese romanization is editorial, not deterministic. This gives a sensible default, not an official transliteration, so let people override it where it matters.

## Releasing

GitHub Actions publishes on a version tag (npm trusted publishing, no token):

```sh
npm version patch   # bumps package.json, commits, tags vX.Y.Z
git push --follow-tags
```

## License

MIT
