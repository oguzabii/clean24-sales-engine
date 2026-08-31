import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../app/danke/page.tsx", import.meta.url), "utf8");

test("success copy confirms intake without claiming a receipt email was sent", () => {
  assert.match(source, /Ihre Anfrage wurde erfolgreich \u00fcbermittelt\. Wir bearbeiten Ihre Angaben jetzt und melden uns mit der <strong>Offerte<\/strong>\./);
  assert.doesNotMatch(source, /Eingangsbest\u00e4tigung|Best\u00e4tigungsmail|E-Mail ist unterwegs|bereits eine E-Mail|per E-Mail gesendet|Spam-Ordner/);
});

test("manual-review success and both step lists make no unverified mail promise", () => {
  assert.match(source, /Ihre Anfrage wurde erfolgreich \u00fcbermittelt\. Wir pr\u00fcfen die Angaben und melden uns mit einer <strong>individuellen Offerte<\/strong>\./);
  assert.equal(source.match(/step: "1", text: "Ihre Anfrage wurde erfolgreich \u00fcbermittelt\."/g)?.length, 2);
});
