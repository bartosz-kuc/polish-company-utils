/*!
 * polish-company-utils — zero-dependency validators & helpers for Polish
 * business identifiers: NIP, REGON, PESEL, bank account (NRB/IBAN) and the
 * tax micro-account (mikrorachunek podatkowy).
 *
 * Algorithms are the same ones running in production on https://skanfirmy.pl
 * (free tools to verify Polish companies by NIP/KRS/REGON). MIT licensed.
 */

"use strict";

/* ------------------------------------------------------------------ *
 * NIP — Numer Identyfikacji Podatkowej (10-digit tax ID)
 * ------------------------------------------------------------------ */

const NIP_WEIGHTS = [6, 5, 7, 2, 3, 4, 5, 6, 7];

/**
 * Validate a Polish NIP (tax ID) by its checksum.
 * @param {string|number} nip - 10 digits; separators/spaces are stripped.
 * @returns {boolean}
 */
function isValidNip(nip) {
  const d = onlyDigits(nip);
  if (d.length !== 10) return false;
  const nums = toDigits(d);
  const control = nums.slice(0, 9).reduce((a, x, i) => a + x * NIP_WEIGHTS[i], 0) % 11;
  return control < 10 && control === nums[9];
}

/** Format a NIP as `123-456-32-18`. Returns the input unchanged if not 10 digits. */
function formatNip(nip) {
  const d = onlyDigits(nip);
  if (d.length !== 10) return String(nip);
  return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6, 8)}-${d.slice(8, 10)}`;
}

/* ------------------------------------------------------------------ *
 * REGON — statistical number (9 or 14 digits)
 * ------------------------------------------------------------------ */

const REGON9_WEIGHTS = [8, 9, 2, 3, 4, 5, 6, 7];
const REGON14_WEIGHTS = [2, 4, 8, 5, 0, 9, 7, 3, 6, 1, 2, 4, 8];

function regonControl(nums, weights) {
  const sum = nums.reduce((a, x, i) => a + x * weights[i], 0);
  const c = sum % 11;
  return c === 10 ? 0 : c;
}

/**
 * Validate a Polish REGON (9 or 14 digits) by its checksum. For a 14-digit
 * REGON the embedded 9-digit prefix must also be valid.
 * @param {string|number} regon
 * @returns {boolean}
 */
function isValidRegon(regon) {
  const d = onlyDigits(regon);
  if (d.length !== 9 && d.length !== 14) return false;
  const nums = toDigits(d);
  if (d.length === 9) {
    return regonControl(nums.slice(0, 8), REGON9_WEIGHTS) === nums[8];
  }
  // 14-digit: prefix must be a valid 9-digit REGON, plus the 14-digit checksum
  if (regonControl(nums.slice(0, 8), REGON9_WEIGHTS) !== nums[8]) return false;
  return regonControl(nums.slice(0, 13), REGON14_WEIGHTS) === nums[13];
}

/* ------------------------------------------------------------------ *
 * PESEL — personal identity number (11 digits)
 * ------------------------------------------------------------------ */

const PESEL_WEIGHTS = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3];

/**
 * Validate a Polish PESEL by its checksum.
 * @param {string|number} pesel - 11 digits.
 * @returns {boolean}
 */
function isValidPesel(pesel) {
  const d = onlyDigits(pesel);
  if (d.length !== 11) return false;
  const nums = toDigits(d);
  const sum = nums.slice(0, 10).reduce((a, x, i) => a + x * PESEL_WEIGHTS[i], 0);
  const control = (10 - (sum % 10)) % 10;
  return control === nums[10];
}

/**
 * Extract date of birth and sex from a PESEL. Returns null if the PESEL is
 * invalid or encodes an impossible date.
 * @param {string|number} pesel
 * @returns {{ date: string, year: number, month: number, day: number, sex: 'male'|'female' }|null}
 */
function peselInfo(pesel) {
  const d = onlyDigits(pesel);
  if (!isValidPesel(d)) return null;
  const n = toDigits(d);
  let year = n[0] * 10 + n[1];
  const monthCode = n[2] * 10 + n[3];
  const day = n[4] * 10 + n[5];
  // Century is encoded in the month field (PESEL standard).
  const centuries = { 0: 1900, 1: 2000, 2: 2100, 3: 2200, 4: 1800 };
  const century = centuries[Math.floor(monthCode / 20)];
  if (century === undefined) return null;
  const month = monthCode % 20;
  year += century;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (dt.getUTCFullYear() !== year || dt.getUTCMonth() !== month - 1 || dt.getUTCDate() !== day) return null;
  const sex = n[9] % 2 === 0 ? "female" : "male";
  return { date: `${pad(year, 4)}-${pad(month, 2)}-${pad(day, 2)}`, year, month, day, sex };
}

/* ------------------------------------------------------------------ *
 * Bank account — NRB (26-digit Polish) / IBAN (ISO 13616)
 * ------------------------------------------------------------------ */

/**
 * Validate a Polish bank account number (NRB, 26 digits) via ISO 7064 mod-97-10.
 * Accepts an optional leading `PL`.
 * @param {string} nrb
 * @returns {boolean}
 */
function isValidNrb(nrb) {
  let s = String(nrb).replace(/\s/g, "").toUpperCase();
  if (s.startsWith("PL")) s = s.slice(2);
  if (!/^\d{26}$/.test(s)) return false;
  // IBAN check: move the 2 check digits + "PL" (=2521) to the end, then mod 97 === 1
  return mod97(s.slice(2) + "2521" + s.slice(0, 2)) === 1;
}

/**
 * Validate any IBAN (ISO 13616) via mod-97-10.
 * @param {string} iban
 * @returns {boolean}
 */
function isValidIban(iban) {
  const s = String(iban).replace(/\s/g, "").toUpperCase();
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/.test(s)) return false;
  const rearranged = s.slice(4) + s.slice(0, 4);
  let numeric = "";
  for (const ch of rearranged) {
    const code = ch.charCodeAt(0);
    numeric += code >= 65 && code <= 90 ? String(code - 55) : ch; // A=10 … Z=35
  }
  return mod97(numeric) === 1;
}

/** Format a 26-digit NRB as `61 1090 1014 0000 0712 1981 2874`. */
function formatNrb(nrb) {
  let s = String(nrb).replace(/\s/g, "").toUpperCase();
  if (s.startsWith("PL")) s = s.slice(2);
  if (!/^\d{26}$/.test(s)) return String(nrb);
  return s.slice(0, 2) + " " + s.slice(2).match(/.{1,4}/g).join(" ");
}

/* ------------------------------------------------------------------ *
 * Mikrorachunek podatkowy — individual tax micro-account (PIT/CIT/VAT)
 * ------------------------------------------------------------------ */

/**
 * Generate the individual tax micro-account (mikrorachunek podatkowy) for a
 * NIP (10 digits) or PESEL (11 digits). In effect in Poland since 2020-01-01.
 * @param {string|number} identifier - a valid NIP or PESEL.
 * @returns {{ nrb: string, iban: string, type: 'NIP'|'PESEL' }}
 * @throws {Error} if the identifier is not a valid NIP or PESEL.
 */
function generateTaxMicroAccount(identifier) {
  const d = onlyDigits(identifier);
  let type, bban;
  if (d.length === 10) {
    if (!isValidNip(d)) throw new Error("Invalid NIP checksum.");
    type = "NIP";
    bban = "10100071" + "222" + "2" + d + "00"; // 24 digits
  } else if (d.length === 11) {
    if (!isValidPesel(d)) throw new Error("Invalid PESEL checksum.");
    type = "PESEL";
    bban = "10100071" + "222" + "1" + d + "0"; // 24 digits
  } else {
    throw new Error("Identifier must be a 10-digit NIP or an 11-digit PESEL.");
  }
  const check = String(98 - mod97(bban + "2521" + "00")).padStart(2, "0");
  const nrb = check + bban;
  return { nrb, iban: "PL" + nrb, type };
}

/* ------------------------------------------------------------------ *
 * internal helpers
 * ------------------------------------------------------------------ */

/** ISO 7064 mod-97, digit-by-digit (no BigInt needed). */
function mod97(numStr) {
  let rem = 0;
  for (let i = 0; i < numStr.length; i++) {
    rem = (rem * 10 + (numStr.charCodeAt(i) - 48)) % 97;
  }
  return rem;
}

function onlyDigits(v) {
  return String(v == null ? "" : v).replace(/\D/g, "");
}
function toDigits(s) {
  return s.split("").map((c) => c.charCodeAt(0) - 48);
}
function pad(n, len) {
  return String(n).padStart(len, "0");
}

module.exports = {
  isValidNip,
  formatNip,
  isValidRegon,
  isValidPesel,
  peselInfo,
  isValidNrb,
  isValidIban,
  formatNrb,
  generateTaxMicroAccount,
};
