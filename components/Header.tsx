import Link from "next/link";
import Image from "next/image";
import { COMPANY } from "@/lib/constants";
import { IconPhone, IconShieldCheck } from "./icons";

/**
 * Quotation-flow header: logo + claim on the left, reachability and a
 * reassurance note on the right. No navigation.
 *
 * Heights (h-20 / md:h-24) stay in sync with the `pt-20 md:pt-24` offset on
 * <main> in app/layout.tsx.
 */
export default function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-white border-b border-slate-200/80">
      <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-10">
        <div className="flex h-20 md:h-24 items-center justify-between gap-6">
          <Link href="/" className="flex flex-col justify-center" aria-label="Clean24 – Startseite">
            <Image
              src="/clean24-logo.png"
              alt="Clean24"
              width={1380}
              height={671}
              priority
              className="h-9 md:h-11 w-auto select-none"
              draggable={false}
            />
            <span className="mt-0.5 text-[10.5px] md:text-[11px] text-slate-500 tracking-wide">
              Sauberkeit mit System.
            </span>
          </Link>

          <div className="flex items-center gap-5 md:gap-7">
            <a
              href={`tel:${COMPANY.phone.replace(/\s/g, "")}`}
              className="group flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40 rounded-md"
            >
              <IconPhone className="w-[18px] h-[18px] text-teal-600 flex-shrink-0" />
              <span className="leading-tight">
                <span className="block text-[14px] md:text-[15px] font-semibold text-ink tabular-nums group-hover:text-teal-700 transition-colors duration-200">
                  {COMPANY.phoneDisplay}
                </span>
                <span className="hidden sm:block text-[11.5px] text-slate-500">
                  Persönlich erreichbar
                </span>
              </span>
            </a>

            <div className="hidden md:flex items-center gap-2.5 pl-6 md:pl-7 border-l border-slate-200">
              <IconShieldCheck className="w-[18px] h-[18px] text-teal-600 flex-shrink-0" />
              <span className="leading-tight">
                <span className="block text-[14px] md:text-[15px] font-semibold text-ink">
                  Sicher &amp; unverbindlich
                </span>
                <span className="block text-[11.5px] text-slate-500">
                  Ihre Anfrage ist kostenlos.
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
