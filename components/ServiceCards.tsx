import Link from "next/link";

const services = [
  {
    title: "Umzugsreinigung",
    desc: "Komplette Endreinigung Ihrer Wohnung für die erfolgreiche Abgabe. Inklusive Küche, Bad, alle Zimmer und Gemeinschaftsflächen.",
    price: "ab CHF 750",
    href: "/umzugsreinigung",
    highlight: true,
  },
  {
    title: "Fenster & Rahmen",
    desc: "Professionelle Reinigung von Fenstern, Rahmen und Fensterbänken innen und aussen.",
    price: "Inklusive",
    href: "/umzugsreinigung",
    highlight: false,
  },
  {
    title: "Hochdruckreinigung Terrasse / Aussenbereich",
    desc: "Für stark verschmutzte Aussenflächen, Terrassen oder Balkonböden.",
    price: "+ CHF 200",
    href: "/umzugsreinigung#addons",
    highlight: false,
  },
  {
    title: "Starke Kalkablagerungen / Spezial-Entkalkung",
    desc: "Bei sehr hartem Wasser oder stark verkalkten Bereichen.",
    price: "+ CHF 150",
    href: "/umzugsreinigung#addons",
    highlight: false,
  },
  {
    title: "Raucherwohnung / Nikotinrückstände",
    desc: "Spezialbehandlung bei Nikotinverfärbungen und Geruchsrückständen.",
    price: "+ CHF 390",
    href: "/umzugsreinigung#addons",
    highlight: false,
  },
  {
    title: "Haustier-Spezialreinigung",
    desc: "Entfernung von Tierhaaren und Geruch in normalem Ausmass.",
    price: "+ CHF 200",
    href: "/umzugsreinigung#addons",
    highlight: false,
  },
  {
    title: "Teppich- oder Spannteppichreinigung",
    desc: "Tiefenreinigung von Teppichböden, Preis je nach Fläche.",
    price: "+ CHF 120",
    href: "/umzugsreinigung#addons",
    highlight: false,
  },
  {
    title: "Grosser Keller / Hobbyraum / Nebenraum",
    desc: "Für überdurchschnittlich grosse oder zusätzliche Nebenräume.",
    price: "+ CHF 100",
    href: "/umzugsreinigung#addons",
    highlight: false,
  },
  {
    title: "Wintergarten / sehr viele Fensterflächen",
    desc: "Bei überdurchschnittlich vielen Fensterflächen oder Wintergarten.",
    price: "+ CHF 250",
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
