"use client";

import Link from "next/link";
import type { ComponentProps, MouseEvent } from "react";

type OfferScrollLinkProps = ComponentProps<typeof Link>;

export function OfferScrollLink({
  href,
  onClick,
  target,
  ...props
}: OfferScrollLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);

    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      (target && target !== "_self")
    ) {
      return;
    }

    const hrefContainsOffer =
      typeof href === "string"
        ? href.includes("#offer")
        : href.hash?.includes("#offer");
    const offerSection = hrefContainsOffer
      ? document.getElementById("offer")
      : null;

    if (!offerSection) {
      return;
    }

    event.preventDefault();
    offerSection.scrollIntoView({ behavior: "smooth" });
    window.history.replaceState(window.history.state, "", "#offer");
  }

  return (
    <Link href={href} target={target} onClick={handleClick} {...props} />
  );
}
