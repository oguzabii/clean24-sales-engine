"use client";

import Link from "next/link";
import Image from "next/image";

export default function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-paper border-none shadow-none">
      <div className="container-page">
        <div className="flex h-16 md:h-20 items-center">
          <Link href="/" className="flex items-center" aria-label="Clean24 – Startseite">
            <Image
              src="/clean24-logo.png"
              alt="Clean24"
              width={1380}
              height={671}
              priority
              className="h-11 md:h-14 w-auto select-none"
              draggable={false}
            />
          </Link>
        </div>
      </div>
    </header>
  );
}