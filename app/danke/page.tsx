import type { Metadata } from "next";
import Link from "next/link";
import WhatsAppButton from "@/components/WhatsAppButton";
import { COMPANY } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Vielen Dank für Ihre Anfrage",
  description: "Wir haben Ihre Anfrage erhalten und melden uns bald.",
  robots: { index: false, follow: false },
};

export default function DankePage() {
  const whatsappMsg =
    "Guten Tag, ich habe soeben eine Anfrage über die Website gesendet und möchte mich kurz vorstellen. Können Sie mir bitte Fotos zeigen oder soll ich Fotos der Wohnung schicken?";

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
        <p className="text-gray-600 mb-3 leading-relaxed">
          Wir haben Ihre Angaben erhalten und werden diese prüfen. Sie erhalten von uns eine Rückmeldung innerhalb von <strong>2 Stunden</strong> (Werktage).
        </p>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Für eine schnellere Bearbeitung können Sie uns gerne <strong>Fotos der Wohnung</strong> via WhatsApp schicken – das hilft uns, einen genauen Preis zu kalkulieren.
        </p>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
          <h2 className="font-semibold text-gray-900 mb-4">So geht es weiter</h2>
          <div className="space-y-3 text-left">
            {[
              { step: "1", text: "Wir prüfen Ihre Angaben und bereiten einen verbindlichen Preis vor." },
              { step: "2", text: "Sie erhalten eine Bestätigung per E-Mail oder Telefon." },
              { step: "3", text: "Wir vereinbaren gemeinsam Datum und Uhrzeit der Reinigung." },
              { step: "4", text: "Unser Team erscheint pünktlich und reinigt Ihre Wohnung professionell." },
            ].map((item) => (
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
          <WhatsAppButton message={whatsappMsg} label="Fotos via WhatsApp senden" />
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
