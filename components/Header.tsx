"use client";

import Link from "next/link";
import Image from "next/image";

export default function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/70 bg-white/90 shadow-[0_1px_20px_rgba(11,31,51,0.04)] backdrop-blur-md">
      <div className="container-page">
        <div className="flex h-16 md:h-18 items-center justify-between gap-4">
          <Link href="/" className="flex items-center" aria-label="Clean24 – Startseite">
            <Image
              src="/clean24-logo.png"
              alt="Clean24"
              width={1380}
              height={671}
              priority
              className="h-10 md:h-12 w-auto select-none"
              draggable={false}
            />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href="tel:+41445161923"
              className="hidden sm:inline-flex text-sm font-semibold text-slate-700 hover:text-[#0b1f33] transition-colors"
            >
              +41 44 516 19 23
            </a>
            <a
              href="tel:+41445161923"
              aria-label="Clean24 telefonisch kontaktieren"
              className="inline-flex sm:hidden h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-[#0b1f33]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.95.68l1.5 4.5a1 1 0 01-.5 1.2l-2.26 1.14a11.04 11.04 0 005.52 5.51l1.13-2.25a1 1 0 011.21-.5l4.49 1.5a1 1 0 01.68.94V19a2 2 0 01-2 2h-1C9.72 21 3 14.28 3 6V5z" />
              </svg>
            </a>
            <Link href="#offer" className="c24-button-primary min-h-10 px-4 py-2 text-sm">
              Offerte anfragen
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
