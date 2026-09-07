import Link from "next/link";
import Image from "next/image";
import { COMPANY } from "@/lib/constants";

/**
 * Minimal header for the quotation experience — logo and reachability only.
 * No navigation, no badges. Heights (h-16 / md:h-20) stay in sync with the
 * `pt-16 md:pt-20` offset on <main> in app/layout.tsx so the first plane sits
 * flush beneath it.
 */
export default function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-slate-200/80">
      <div className="px-5 sm:px-8 lg:px-10">
        <div className="flex h-16 md:h-20 items-center justify-between gap-6">
          <Link href="/" className="flex items-center" aria-label="Clean24 – Startseite">
            <Image
              src="/clean24-logo.png"
              alt="Clean24"
              width={1380}
              height={671}
              priority
              className="h-9 md:h-11 w-auto select-none"
              draggable={false}
            />
          </Link>

          <a
            href={`tel:${COMPANY.phone.replace(/\s/g, "")}`}
            className="group text-right leading-tight focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/40"
          >
            <span className="block text-[15px] md:text-[16px] font-medium text-ink tabular-nums group-hover:text-teal-700 transition-colors duration-200">
              {COMPANY.phoneDisplay}
            </span>
            <span className="block text-[11.5px] text-slate-500">Persönlich erreichbar</span>
          </a>
        </div>
      </div>
    </header>
  );
}
