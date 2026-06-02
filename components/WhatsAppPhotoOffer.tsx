import { buildWhatsAppUrl } from "@/lib/whatsapp";

const MESSAGE =
  "Guten Tag, ich möchte gerne Fotos meiner Wohnung für eine Ersteinschätzung senden. Können Sie mir kurz bestätigen, dass ich die Bilder hier senden kann? Danke!";

export default function WhatsAppPhotoOffer() {
  const href = buildWhatsAppUrl(MESSAGE);

  return (
    <section className="py-16 bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          data-reveal
          className="relative overflow-hidden rounded-3xl bg-white border border-gray-100 shadow-sm"
        >
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-200/40 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-24 w-72 h-72 bg-blue-200/40 rounded-full blur-3xl pointer-events-none" />

          <div className="relative grid lg:grid-cols-[1.2fr_1fr] gap-10 p-8 md:p-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 rounded-full px-3 py-1 text-xs font-semibold mb-4">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Schnellster Weg zur Offerte
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-3">
                Schneller zur Offerte per WhatsApp
              </h2>
              <p className="text-gray-600 leading-relaxed mb-5">
                Senden Sie uns 3–5 Fotos Ihrer Wohnung oder Ihrer Abgabeliste per WhatsApp.
                Wir prüfen die Angaben und geben Ihnen eine schnelle Ersteinschätzung.
              </p>
              <p className="text-sm text-gray-500 mb-7">
                Ideal, wenn die Wohnungsabgabe bald bevorsteht oder Sie unsicher sind, welche
                Reinigung benötigt wird.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold px-7 py-3.5 rounded-xl transition-all shadow-sm hover:shadow-md"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  Fotos per WhatsApp senden
                </a>
                <a
                  href="#offer"
                  className="inline-flex items-center justify-center gap-2 border-2 border-gray-200 hover:border-blue-300 text-gray-700 font-semibold px-7 py-3.5 rounded-xl transition-colors"
                >
                  Richtpreis berechnen
                </a>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <div className="text-xs text-gray-400 mb-3 uppercase tracking-wider">So einfach geht es</div>
                <ol className="space-y-3">
                  {[
                    "Fotos in WhatsApp aufnehmen oder auswählen",
                    "An unsere Nummer senden",
                    "Ersteinschätzung & Richtpreis erhalten",
                  ].map((step, i) => (
                    <li key={step} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="text-sm text-gray-700 leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
                <p className="text-[11px] text-gray-400 mt-4 leading-relaxed">
                  Der genaue Preis wird nach Prüfung Ihrer Angaben bestätigt.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
