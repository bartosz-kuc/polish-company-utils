# polish-company-utils

Zero-dependency validators and helpers for **Polish business identifiers** —
**NIP**, **REGON**, **PESEL**, bank account (**NRB/IBAN**) and the tax
micro-account (**mikrorachunek podatkowy**).

[![npm](https://img.shields.io/npm/v/polish-company-utils.svg)](https://www.npmjs.com/package/polish-company-utils)
[![license](https://img.shields.io/npm/l/polish-company-utils.svg)](./LICENSE)
![zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)

- **Zero dependencies**, tiny, no build step.
- Works with both `require` and `import`, ships **TypeScript types**.
- Same checksum algorithms that run in production on
  [skanfirmy.pl](https://skanfirmy.pl) — free tools to verify Polish companies
  by NIP / KRS / REGON.

## Install

```bash
npm install polish-company-utils
```

## Usage

```js
// CommonJS
const { isValidNip, isValidRegon, generateTaxMicroAccount } = require("polish-company-utils");
// …or ESM: import { isValidNip } from "polish-company-utils";

isValidNip("525-234-40-78");   // true  (separators are stripped)
isValidNip("1234567890");      // false (bad checksum)

isValidRegon("000331501");     // true  (9- or 14-digit)
isValidPesel("44051401359");   // true

// Individual tax micro-account (PIT/CIT/VAT) from a NIP or PESEL:
generateTaxMicroAccount("7393933151");
// → { nrb: "…26 digits…", iban: "PL…", type: "NIP" }
```

## API

| Function | Returns | Notes |
|---|---|---|
| `isValidNip(nip)` | `boolean` | 10-digit tax ID checksum. Accepts strings/numbers, strips separators. |
| `formatNip(nip)` | `string` | `123-456-32-18`. |
| `isValidRegon(regon)` | `boolean` | 9- or 14-digit statistical number. |
| `isValidPesel(pesel)` | `boolean` | 11-digit personal number checksum. |
| `peselInfo(pesel)` | `{ date, year, month, day, sex } \| null` | Date of birth + sex encoded in a PESEL. |
| `isValidNrb(nrb)` | `boolean` | 26-digit Polish bank account (ISO 7064 mod-97-10). Optional `PL` prefix. |
| `isValidIban(iban)` | `boolean` | Any IBAN (ISO 13616). |
| `formatNrb(nrb)` | `string` | Grouped `61 1090 1014 …`. |
| `generateTaxMicroAccount(id)` | `{ nrb, iban, type }` | Mikrorachunek for a valid NIP/PESEL. Throws on invalid input. |

All functions are pure and synchronous. Validation functions never throw —
they return `false` for malformed input; only `generateTaxMicroAccount` throws
(on an invalid identifier), because there is no meaningful account to return.

## Need the data, not just the maths?

This package validates and generates **locally**. To actually *look up* a
company — VAT status, KRS data, official REGON name and address — use the
free hosted tools and API:

- **[skanfirmy.pl](https://skanfirmy.pl)** — verify a Polish company by NIP/KRS/REGON in the browser.
- **[skanfirmy.pl/mcp](https://skanfirmy.pl/mcp)** — an MCP server so AI agents can call the same lookups directly. Plain REST too: `skanfirmy.pl/nip/{nip}`, `/regon/{nip}`, `/vies/{country}/{number}`.
- **[otwarteapi.pl](https://otwarteapi.pl)** — a catalog of official Polish & EU public APIs for agents.

## Contributing

Issues and PRs welcome. Run the tests with:

```bash
npm test
```

## Author

**Bartosz Kuć**
· [skanfirmy.pl](https://skanfirmy.pl)
· [github.com/bartosz-kuc](https://github.com/bartosz-kuc)
· [linkedin.com/in/bartosz-kuc](https://pl.linkedin.com/in/bartosz-kuc)

## License

MIT © [Bartosz Kuć](https://skanfirmy.pl)
