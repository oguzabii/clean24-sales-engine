import { SERVICE_AREAS } from "@/lib/constants";

interface ServiceAreaChipsProps {
  title?: string;
}

export default function ServiceAreaChips({
  title = "Umzugsreinigung in der ganzen Schweiz",
}: ServiceAreaChipsProps) {
  return (
    <section className="py-16 bg-white">
      <div className="container-page max-w-5xl text-center">
        <div data-reveal>
          <div className="c24-eyebrow mb-4">
            Einsatzgebiet
          </div>
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-[#0b1f33] md:text-3xl">
            {title}
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-sm leading-relaxed text-slate-500">
            Verfügbarkeit je nach Region, Termin und Objekt. Weitere Regionen auf Anfrage –
            wir prüfen jede Anfrage individuell.
          </p>
          <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-2">
            {SERVICE_AREAS.map((area) => (
              <span
                key={area.label}
                className={
                  area.primary
                    ? "inline-flex items-center rounded-md bg-[#0b1f33] px-4 py-2 text-sm font-medium text-white"
                    : "inline-flex items-center rounded-md border border-[#dbe6ea] bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-[#9ac7c7] hover:text-[#0f766e]"
                }
              >
                {area.label}
              </span>
            ))}
            <span className="inline-flex items-center rounded-md border border-dashed border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-500">
              + weitere Regionen auf Anfrage
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
