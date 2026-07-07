import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Vielen Dank für Ihre Anfrage",
  description: "Wir haben Ihre Anfrage erhalten und melden uns bald.",
  robots: { index: false, follow: false },
};

const MOVE_OUT_STEPS = [
  { step: "1", text: "Eingangsbestätigung und Richtpreis per E-Mail." },
  { step: "2", text: "Prüfung Ihrer Angaben durch Clean24." },
  { step: "3", text: "Rückmeldung mit Fixpreis und Terminvorschlag." },
  { step: "4", text: "Reinigung mit Abgabegarantie nach Terminbestätigung." },
];

const MANUAL_REVIEW_STEPS = [
  { step: "1", text: "Eingangsbestätigung per E-Mail." },
  { step: "2", text: "Individuelle Prüfung Ihrer Angaben durch Clean24." },
  { step: "3", text: "Rückmeldung mit einer passenden Offerte." },
  { step: "4", text: "Ausführung nach Terminbestätigung." },
];

export default async function DankePage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  // ?m=review → non-move-out category: neutral copy without Richtpreis /
  // Abgabegarantie promises. Default keeps the Umzugsreinigung wording.
  const { m } = await searchParams;
  const manualReview = m === "review";
  const steps = manualReview ? MANUAL_REVIEW_STEPS : MOVE_OUT_STEPS;

  return (
    <section className="min-h-screen bg-gray-50 flex items-center justify-center py-20 px-4">
      <div className="max-w-xl w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Vielen Dank für Ihre Anfrage!
        </h1>
        {manualReview ? (
          <>
            <p className="text-gray-600 mb-3 leading-relaxed">
              Ihre Anfrage wurde übermittelt. Wir prüfen die Angaben und melden uns mit einer <strong>individuellen Offerte</strong>.
            </p>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Sie erhalten eine Eingangsbestätigung per E-Mail – bitte prüfen Sie ggf. auch den Spam-Ordner. Bei Fragen erreichen Sie uns telefonisch unter <strong>044 516 19 23</strong> oder per E-Mail an <strong>info@clean-24.ch</strong>.
            </p>
          </>
        ) : (
          <>
            <p className="text-gray-600 mb-3 leading-relaxed">
              Ihre Anfrage wurde erhalten. Wir haben Ihnen eine <strong>Eingangsbestätigung mit Ihrem Richtpreis</strong> per E-Mail gesendet – bitte prüfen Sie ggf. auch den Spam-Ordner.
            </p>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Clean24 prüft Ihre Angaben und meldet sich anschliessend mit <strong>Fixpreis und Terminvorschlag</strong>. Bei Fragen erreichen Sie uns telefonisch unter <strong>044 516 19 23</strong> oder per E-Mail an <strong>info@clean-24.ch</strong>.
            </p>
          </>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
          <h2 className="font-semibold text-gray-900 mb-4">So geht es weiter</h2>
          <div className="space-y-3 text-left">
            {steps.map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <span className="w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                  {item.step}
                </span>
                <p className="text-sm text-gray-600 pt-1">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={`mailto:${COMPANY.email}`}
            className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {COMPANY.email}
          </a>
          <a
            href={`tel:${COMPANY.phone}`}
            className="inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-700 hover:text-blue-600 font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {COMPANY.phoneDisplay}
          </a>
        </div>

        <Link href="/" className="block mt-8 text-sm text-gray-400 hover:text-gray-600 transition-colors">
          Zurück zur Startseite
        </Link>
      </div>
    </section>
  );
}
