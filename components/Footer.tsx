import Image from "next/image";
import { COMPANY } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="bg-navy-950 text-navy-300">
      <div className="container-page py-12">
        <div className="mb-8 grid grid-cols-1 items-start gap-8 md:grid-cols-2">
          <div>
            <Image
              src="/clean24-logo-light.png"
              alt="Clean24 – Ihr Reinigungsprofi"
              width={1380}
              height={671}
              className="h-11 md:h-12 w-auto select-none"
              draggable={false}
            />
            <p className="mt-5 max-w-md text-sm leading-relaxed text-navy-300">
              Ihre Reinigungsfirma für Umzug, Privat, Büro, Bau, Fenster und Spezialreinigungen –
              Umzugsreinigungen mit Abgabegarantie. Einsätze in der ganzen Schweiz nach
              Verfügbarkeit.
            </p>
          </div>

          {/* Contact / company info */}
          <div className="md:text-right">
            <div className="mb-3 text-sm font-semibold uppercase tracking-wider text-white">Kontakt</div>
            <ul className="space-y-2 text-sm">
              <li>{COMPANY.name}</li>
              <li>
                {COMPANY.address}, {COMPANY.city}
              </li>
              <li>
                <a href={`tel:${COMPANY.phone}`} className="transition-colors hover:text-teal-300">
                  {COMPANY.phoneDisplay}
                </a>
              </li>
              <li>
                <a href={`mailto:${COMPANY.email}`} className="transition-colors hover:text-teal-300">
                  {COMPANY.email}
                </a>
              </li>
              <li className="mt-2 text-xs text-navy-400">MwSt Nr.: {COMPANY.mwst}</li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-navy-400 sm:flex-row">
          <p>© {new Date().getFullYear()} {COMPANY.name}. Alle Rechte vorbehalten.</p>
          <p>Ihr Reinigungsservice – Umzugsreinigung mit Abgabegarantie.</p>
        </div>
      </div>
    </footer>
  );
}
