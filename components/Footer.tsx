import Image from "next/image";
import { COMPANY } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 items-start">
          {/* Brand: real full-colour Clean24 logo (transparent PNG) directly on
              the dark footer — no card/background. */}
          <div>
            <Image
              src="/clean24-logo.png"
              alt="Clean24 – Ihr Reinigungsprofi"
              width={1380}
              height={671}
              className="h-11 md:h-12 w-auto select-none"
              draggable={false}
            />
            <p className="text-sm leading-relaxed max-w-md mt-5">
              Professionelle Umzugsreinigung mit Abgabegarantie. Einsätze in der ganzen Schweiz
              nach Verfügbarkeit.
            </p>
          </div>

          {/* Contact / company info */}
          <div className="md:text-right">
            <div className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Kontakt</div>
            <ul className="space-y-2 text-sm">
              <li>{COMPANY.name}</li>
              <li>
                {COMPANY.address}, {COMPANY.city}
              </li>
              <li>
                <a href={`tel:${COMPANY.phone}`} className="hover:text-white transition-colors">
                  {COMPANY.phoneDisplay}
                </a>
              </li>
              <li>
                <a href={`mailto:${COMPANY.email}`} className="hover:text-white transition-colors">
                  {COMPANY.email}
                </a>
              </li>
              <li className="text-xs text-gray-500 mt-2">MwSt Nr.: {COMPANY.mwst}</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© {new Date().getFullYear()} {COMPANY.name}. Alle Rechte vorbehalten.</p>
          <p>Professionelle Reinigung mit Abgabegarantie.</p>
        </div>
      </div>
    </footer>
  );
}
