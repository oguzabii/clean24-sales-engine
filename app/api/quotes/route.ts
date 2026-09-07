import { NextResponse } from "next/server";
import { createClean24OsClient, Clean24OsClientError } from "@/lib/clean24-os-client";
import {
  buildQuoteRequest,
  fingerprintServiceInput,
  type CustomerQuoteResponseBody,
  type ThinClientFormData,
  type QuoteResponseBody,
} from "@/lib/sales-engine-contract";
import { newLogicalId, signQuoteToken } from "@/lib/quote-token";
import { moveOutRichtpreis, quoteRichtpreis } from "@/lib/richtpreis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: ThinClientFormData;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage." }, { status: 400 });
  }

  try {
    const requestId = newLogicalId("quote");
    const quoteRequest = buildQuoteRequest(body, requestId);
    const quote = await createClean24OsClient().quote(quoteRequest);
    const customerQuote = customerSafeQuote(quote, body);
    const quoteToken = signQuoteToken({
      quote_id: quote.quote_id,
      request_id: quote.request_id,
      submission_id: newLogicalId("submission"),
      service_category: quote.service_category,
      service_variant: quote.service_variant,
      service_input_fingerprint: fingerprintServiceInput(quoteRequest.service_input),
      expires_at: quote.expires_at,
    });

    return NextResponse.json({ success: true, quote: customerQuote, quote_token: quoteToken });
  } catch (error) {
    if (error instanceof Clean24OsClientError) {
      return NextResponse.json(
        {
          error: customerSafeError(error.code),
          code: error.code,
        },
        { status: error.status >= 400 && error.status < 600 ? error.status : 502 }
      );
    }
    return NextResponse.json({ error: "Preis konnte momentan nicht berechnet werden." }, { status: 500 });
  }
}

function customerSafeQuote(quote: QuoteResponseBody, input: ThinClientFormData): CustomerQuoteResponseBody {
  if (quote.pricing_mode !== "automatic" && quote.pricing_mode !== "manual_review") {
    throw new Clean24OsClientError("Invalid pricing state", "OS_INVALID_RESPONSE", 502);
  }
  const range = quote.pricing_mode === "automatic"
    ? quote.service_category === "move_out_cleaning"
      ? moveOutRichtpreis({ ...input, apartment_size: input.apartment_size ?? "" })
      : quoteRichtpreis(quote)
    : null;
  if (quote.pricing_mode === "automatic" && !range) {
    throw new Clean24OsClientError("Invalid guidance range", "OS_INVALID_RESPONSE", 502);
  }
  return {
    contract: quote.contract,
    service_category: quote.service_category,
    service_variant: quote.service_variant,
    pricing_mode: quote.pricing_mode,
    pricing: {
      currency: "CHF",
      estimated_price_min: range?.min ?? null,
      estimated_price_max: range?.max ?? null,
      amount_basis: quote.pricing.amount_basis,
    },
  };
}

function customerSafeError(code: string): string {
  if (code === "PRICING_INPUT_INVALID") return "Bitte prüfen Sie die Angaben zur gewählten Dienstleistung.";
  if (code === "PRICING_CONFIGURATION_UNAVAILABLE" || code === "OS_UNAVAILABLE" || code === "OS_TIMEOUT") {
    return "Preis konnte momentan nicht berechnet werden. Bitte versuchen Sie es erneut.";
  }
  return "Preis konnte momentan nicht berechnet werden.";
}
