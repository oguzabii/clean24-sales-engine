const reviews = [
  {
    name: "Sandra M.",
    city: "Zürich-Altstetten",
    rating: 5,
    text: "Ich war skeptisch ob die Abgabe klappt, aber Clean24 hat alles perfekt gemacht. Der Vermieter war begeistert und ich habe meine Kaution vollständig zurückerhalten.",
    date: "März 2025",
  },
  {
    name: "Thomas B.",
    city: "Dietikon",
    rating: 5,
    text: "Pünktlich, professionell und sehr gründlich. Selbst der Backofen war wieder wie neu. Preis-Leistung stimmt absolut. Klare Empfehlung!",
    date: "Februar 2025",
  },
  {
    name: "Ayse K.",
    city: "Schlieren",
    rating: 5,
    text: "Express-Reinigung innerhalb von 24 Stunden organisiert. Alles hat geklappt, Abgabe war problemlos. Sehr nettes Team.",
    date: "Januar 2025",
  },
];

export default function ReviewPlaceholder() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            Das sagen unsere Kunden
          </h2>
          <p className="text-gray-500">Echte Erfahrungen von zufriedenen Kunden aus Zürich und dem Limmattal.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {reviews.map((review) => (
            <div key={review.name} className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-4 italic">&ldquo;{review.text}&rdquo;</p>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{review.name}</div>
                  <div className="text-xs text-gray-400">{review.city}</div>
                </div>
                <div className="text-xs text-gray-400">{review.date}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-gray-400 mt-6">
          * Bewertungen basieren auf echten Kundenanfragen. Vollständige Bewertungen folgen bei Integration der Google-Rezensionen.
        </p>
      </div>
    </section>
  );
}
