/**
 * polish-company-utils — zero-dependency validators & helpers for Polish
 * business identifiers. Same algorithms that run on https://skanfirmy.pl
 */

/** Validate a Polish NIP (10-digit tax ID) by its checksum. Separators are stripped. */
export function isValidNip(nip: string | number): boolean;

/** Format a NIP as `123-456-32-18`; returns the input unchanged if not 10 digits. */
export function formatNip(nip: string | number): string;

/** Validate a Polish REGON (9 or 14 digits) by its checksum. */
export function isValidRegon(regon: string | number): boolean;

/** Validate a Polish PESEL (11-digit personal number) by its checksum. */
export function isValidPesel(pesel: string | number): boolean;

export interface PeselInfo {
  /** ISO date, `YYYY-MM-DD`. */
  date: string;
  year: number;
  month: number;
  day: number;
  sex: "male" | "female";
}

/** Extract date of birth and sex from a PESEL, or `null` if invalid/impossible. */
export function peselInfo(pesel: string | number): PeselInfo | null;

/** Validate a Polish bank account number (NRB, 26 digits) via ISO 7064 mod-97-10. Accepts an optional leading `PL`. */
export function isValidNrb(nrb: string): boolean;

/** Validate any IBAN (ISO 13616) via mod-97-10. */
export function isValidIban(iban: string): boolean;

/** Format a 26-digit NRB in `61 1090 1014 …` groups. */
export function formatNrb(nrb: string): string;

export interface TaxMicroAccount {
  /** 26-digit NRB. */
  nrb: string;
  /** IBAN form (`PL` + nrb). */
  iban: string;
  type: "NIP" | "PESEL";
}

/**
 * Generate the individual tax micro-account (mikrorachunek podatkowy, PIT/CIT/VAT)
 * for a valid NIP or PESEL. Throws if the identifier is invalid.
 */
export function generateTaxMicroAccount(identifier: string | number): TaxMicroAccount;
