"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const {
  isValidNip, formatNip, isValidRegon, isValidPesel, peselInfo,
  isValidNrb, isValidIban, formatNrb, generateTaxMicroAccount,
} = require("../index.js");

test("isValidNip — known-good", () => {
  assert.equal(isValidNip("7393933151"), true);   // real JDG
  assert.equal(isValidNip("5261040828"), true);   // GUS
  assert.equal(isValidNip("525-234-40-78"), true); // separators stripped
  assert.equal(isValidNip(5252344078), true);      // number input
});
test("isValidNip — bad", () => {
  assert.equal(isValidNip("1234567890"), false);
  assert.equal(isValidNip("123456789"), false);    // too short
  assert.equal(isValidNip("52522484811"), false);  // too long
  assert.equal(isValidNip(""), false);
});
test("formatNip", () => {
  assert.equal(formatNip("5252344078"), "525-234-40-78");
  assert.equal(formatNip("bad"), "bad");
});

test("isValidRegon — 9-digit", () => {
  assert.equal(isValidRegon("000331501"), true);   // GUS
  assert.equal(isValidRegon("000331502"), false);
  assert.equal(isValidRegon("12345678"), false);   // wrong length
});
test("isValidRegon — 14-digit round-trip", () => {
  // build a valid 14 from a valid 9 by finding the correct check digit
  const base = "00033150100000"; // 9-valid prefix + local-unit body (13) + placeholder
  // brute the 14th check digit against our own validator to get a positive case
  let found = null;
  for (let c = 0; c <= 9; c++) {
    const cand = base.slice(0, 13) + c;
    if (isValidRegon(cand)) { found = cand; break; }
  }
  assert.ok(found, "a valid 14-digit REGON should exist for this prefix");
  assert.equal(isValidRegon(found), true);
  assert.equal(isValidRegon(found.slice(0, 13) + ((Number(found[13]) + 1) % 10)), false);
});

test("isValidPesel + peselInfo", () => {
  assert.equal(isValidPesel("44051401359"), true); // textbook valid
  assert.equal(isValidPesel("44051401358"), false);
  const info = peselInfo("44051401359");
  assert.deepEqual(info, { date: "1944-05-14", year: 1944, month: 5, day: 14, sex: "male" });
  assert.equal(peselInfo("44051401358"), null);
});

test("isValidIban / isValidNrb — known-good", () => {
  assert.equal(isValidIban("PL61109010140000071219812874"), true);
  assert.equal(isValidNrb("61109010140000071219812874"), true);
  assert.equal(isValidNrb("PL61109010140000071219812874"), true);
  assert.equal(isValidNrb("61109010140000071219812875"), false);
  assert.equal(isValidIban("PL00000000000000000000000000"), false);
});
test("formatNrb", () => {
  assert.equal(formatNrb("61109010140000071219812874"), "61 1090 1014 0000 0712 1981 2874");
});

test("generateTaxMicroAccount — NIP, round-trips as a valid account", () => {
  const r = generateTaxMicroAccount("7393933151");
  assert.equal(r.type, "NIP");
  assert.match(r.nrb, /^\d{26}$/);
  assert.equal(r.iban, "PL" + r.nrb);
  assert.ok(r.nrb.includes("1010007122227393933151"), "embeds bank + type marker + NIP");
  assert.equal(isValidNrb(r.nrb), true);   // self-consistent mod-97
  assert.equal(isValidIban(r.iban), true);
});
test("generateTaxMicroAccount — PESEL + errors", () => {
  const r = generateTaxMicroAccount("44051401359");
  assert.equal(r.type, "PESEL");
  assert.equal(isValidIban(r.iban), true);
  assert.throws(() => generateTaxMicroAccount("1234567890")); // bad NIP
  assert.throws(() => generateTaxMicroAccount("123"));        // wrong length
});
