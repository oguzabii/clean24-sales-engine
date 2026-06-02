import Link from "next/link";

const services = [
  {
    title: "Umzugsreinigung",
    desc: "Komplette Endreinigung Ihrer Wohnung für die erfolgreiche Abgabe. Inklusive Küche, Bad, alle Zimmer und Gemeinschaftsflächen.",
    price: "ab CHF 590",
    href: "/umzugsreinigung",
    highlight: true,
  },
  {
    title: "Backofen-Tiefenreinigung",
    desc: "Gründliche Entfernung von Fett und Verkrustungen aus Backofen und Herd. Als Zusatzleistung buchbar.",
    price: "+CHF 60",
    href: "/umzugsreinigung#addons",
    highlight: false,
  },
  {
    title: "Fenster & Rahmen",
    desc: "Professionelle Reinigung von Fenstern, Rahmen und Fensterbänken innen und aussen.",
    price: "Inklusive",
    href: "/umzugsreinigung",
    highlight: false,
  },
  {
    title: "Balkon & Loggia",
    desc: "Balkon kehren, Geländer abwischen, Bodenbelag reinigen – sauber für die Abgabe.",
    price: "+CHF 80",
    href: "/umzugsreinigung#addons",
    highlight: false,
  },
  {
    title: "Keller & Estrich",
    desc: "Reinigung von Kellerabteilen und Estrichflächen gemäss Abgabeprotokoll.",
    price: "+CHF 80",
    href: "/umzugsreinigung#addons",
    highlight: false,
  },
  {
    title: "Lamellen & Jalousien",
    desc: "Einzelne Reinigung jeder Lamelle – für makellose Ergebnisse bei der Wohnungsabgabe.",
    price: "+CHF 120",
    href: "/umzugsreinigung#addons",
    highlight: false,
  },
];

export default function ServiceCards() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            Unsere Leistungen
          </h2>
          <p className="text-gray-500 max-w-xl mx-auto">
            Alles was Sie für eine erfolgreiche Wohnungsabgabe brauchen – aus einer Hand.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <Link
              key={service.title}
              href={service.href}
              className={`group block rounded-2xl p-6 border transition-all hover:shadow-lg ${
                service.highlight
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-white border-gray-100 hover:border-blue-200"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className={`font-semibold text-lg ${service.highlight ? "text-white" : "text-gray-900"}`}>
                  {service.title}
                </h3>
                <span className={`text-sm font-semibold rounded-full px-3 py-1 ${
                  service.highlight
                    ? "bg-white/20 text-white"
                    : "bg-blue-50 text-blue-700"
                }`}>
                  {service.price}
                </span>
              </div>
              <p className={`text-sm leading-relaxed ${service.highlight ? "text-blue-100" : "text-gray-500"}`}>
                {service.desc}
              </p>
              <div className={`mt-4 text-sm font-medium flex items-center gap-1 ${
                service.highlight ? "text-white" : "text-blue-600"
              }`}>
                Mehr erfahren
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
