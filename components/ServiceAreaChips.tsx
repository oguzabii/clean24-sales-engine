import { SERVICE_AREAS } from "@/lib/constants";

interface ServiceAreaChipsProps {
  title?: string;
}

export default function ServiceAreaChips({
  title = "Umzugsreinigung in der ganzen Schweiz",
}: ServiceAreaChipsProps) {
  return (
    <section className="py-16 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div data-reveal>
          <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3 py-1 text-xs font-semibold text-gray-700 uppercase tracking-wider mb-4">
            Einsatzgebiet
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 tracking-tight">
            {title}
          </h2>
          <p className="text-gray-500 text-sm mb-8 max-w-xl mx-auto leading-relaxed">
            Verfügbarkeit je nach Region, Termin und Objekt. Weitere Regionen auf Anfrage –
            wir prüfen jede Anfrage individuell.
          </p>
          <div className="flex flex-wrap gap-2 justify-center max-w-3xl mx-auto">
            {SERVICE_AREAS.map((area) => (
              <span
                key={area.label}
                className={
                  area.primary
                    ? "inline-flex items-center bg-gradient-to-br from-blue-600 to-blue-700 text-white text-sm font-medium px-4 py-2 rounded-full shadow-sm"
                    : "inline-flex items-center bg-white border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-full hover:border-blue-200 hover:text-blue-700 transition-colors"
                }
              >
                {area.label}
              </span>
            ))}
            <span className="inline-flex items-center bg-white border border-dashed border-gray-300 text-gray-500 text-sm font-medium px-4 py-2 rounded-full">
              + weitere Regionen auf Anfrage
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
