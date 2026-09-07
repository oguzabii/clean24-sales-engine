import { getVercelOidcToken } from "@vercel/oidc";

import type {
  Clean24ApiErrorBody,
  IntakeRequestBody,
  IntakeResponseBody,
  QuoteRequestBody,
  QuoteResponseBody,
} from "./sales-engine-contract";

export class Clean24OsClientError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
    public readonly details?: Clean24ApiErrorBody["details"]
  ) {
    super(message);
  }
}

export interface AttachmentResponseBody {
  contract: "clean24_sales_attachment_response_v1";
  upload_id: string;
  attachment_id: string;
  status: "created" | "duplicate";
  filename: string;
  mime_type: string;
  size_bytes: number;
  sha256: string;
}

/**
 * Die Fristen je Aufruf. Sie liegen deutlich unter der Laufzeitgrenze der
 * Funktion, damit ein Überschreiten hier eine saubere Meldung ergibt und
 * nicht den Abbruch der ganzen Funktion.
 */
const QUOTE_TIMEOUT_MS = 8_000;
const INTAKE_TIMEOUT_MS = 60_000;
const ATTACHMENT_TIMEOUT_MS = 30_000;

export interface Clean24OsClientOptions {
  baseUrl?: string;
  secret?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  oidcTokenProvider?: () => Promise<string | undefined> | string | undefined;
}

export class Clean24OsClient {
  private readonly baseUrl: string;
  private readonly secret: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly oidcTokenProvider: () => Promise<string | undefined> | string | undefined;

  constructor(options: Clean24OsClientOptions = {}) {
    this.baseUrl = normalizeBaseUrl(options.baseUrl ?? process.env.CLEAN24_OS_BASE_URL);
    this.secret = options.secret ?? process.env.SALES_ENGINE_INTEGRATION_SECRET ?? "";
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.timeoutMs = options.timeoutMs ?? QUOTE_TIMEOUT_MS;
    this.oidcTokenProvider = options.oidcTokenProvider ?? (() => getVercelOidcToken());

    if (!this.baseUrl) {
      throw new Clean24OsClientError("Clean24 OS base URL is not configured.", "OS_CONFIG_MISSING", 500);
    }
  }

  /**
   * Das Preisangebot muss schnell sein — der Kunde wartet davor.
   */
  quote(body: QuoteRequestBody): Promise<QuoteResponseBody> {
    return this.post<QuoteResponseBody>("/api/integrations/sales-engine/quote", body);
  }

  /**
   * DIE EINREICHUNG BEKOMMT MEHR ZEIT ALS DAS PREISANGEBOT.
   *
   * -------------------------------------------------------------------------
   * WAS ACHT SEKUNDEN IN DER PRODUKTION ANGERICHTET HABEN
   * -------------------------------------------------------------------------
   *
   * Beide Aufrufe teilten sich eine Frist von acht Sekunden. Für das
   * Preisangebot ist das richtig: es rechnet, und der Kunde sieht dabei zu.
   *
   * Die Einreichung tut etwas ganz anderes. Sie legt den Lead an, erzeugt die
   * Offerte und verschickt sie — Arbeit, die naturgemäss länger dauert als
   * eine Preisrechnung. In der Produktion überschritt sie die Frist, und der
   * Kunde bekam nach acht Sekunden „Anfrage konnte momentan nicht übermittelt
   * werden" zu lesen.
   *
   * Das Schlimme daran ist nicht die Meldung, sondern dass sie LÜGT. Der
   * Abbruch geschieht hier, im Browserdienst; Clean24 OS hat die Einreichung
   * längst erhalten und arbeitet sie zu Ende. Der Lead entsteht, die Offerte
   * entsteht — und der Kunde, dem gerade ein Fehlschlag gemeldet wurde,
   * drückt ein zweites Mal auf Absenden. Jede dieser Wiederholungen trägt
   * eine neue Einreichungskennung und wird deshalb NICHT als Wiederholung
   * erkannt: aus einem Kunden werden zwei Leads und zwei Offerten.
   *
   * Eine Frist, die abläuft, während die Gegenseite erfolgreich arbeitet, ist
   * schlimmer als gar keine.
   */
  intake(body: IntakeRequestBody): Promise<IntakeResponseBody> {
    return this.post<IntakeResponseBody>("/api/integrations/sales-engine/intake", body, INTAKE_TIMEOUT_MS);
  }

  /**
   * Ein Anhang reist über die Leitung des Kunden — auf dem Mobilfunknetz
   * dauern zehn Megabyte länger als acht Sekunden.
   */
  attachment(formData: FormData): Promise<AttachmentResponseBody> {
    return this.postForm<AttachmentResponseBody>("/api/integrations/sales-engine/attachments", formData, ATTACHMENT_TIMEOUT_MS);
  }

  /**
   * DER AUSWEIS FÜR EINEN AUFRUF — bei jedem Aufruf neu ermittelt.
   *
   * -------------------------------------------------------------------------
   * WARUM NICHT EINMAL IM KONSTRUKTOR
   * -------------------------------------------------------------------------
   *
   * Ein Vercel-OIDC-Merkmal ist kurzlebig. Es beim Erzeugen des Clients zu
   * holen und aufzubewahren hiesse, mit einem abgelaufenen Ausweis zu
   * arbeiten, sobald der Prozess lange genug lebt — und genau das tut eine
   * serverlose Funktion, die warm bleibt.
   *
   * -------------------------------------------------------------------------
   * DIE REIHENFOLGE
   * -------------------------------------------------------------------------
   *
   * Ist ein gemeinsames Geheimnis gesetzt, gilt es. Das hält lokale Läufe und
   * jede Umgebung ohne Vercel deterministisch — dort gibt es kein Merkmal,
   * und ein Fehlschlag beim Holen wäre reines Rauschen.
   *
   * Sonst das Merkmal. In der Produktion auf Vercel ist genau das der Weg:
   * niemand tippt ein Geheimnis ab, und es dreht sich von selbst.
   *
   * Es geht ausschliesslich in den `Authorization`-Kopf — nie in den Rumpf,
   * nie in eine Antwort, nie in den Browser.
   */
  private async authorization(): Promise<string> {
    if (this.secret) return `Bearer ${this.secret}`;

    const token = await this.oidcTokenProvider();
    if (!token) {
      throw new Clean24OsClientError(
        "Clean24 OS integration credentials are not configured.",
        "OS_CONFIG_MISSING",
        500,
      );
    }
    return `Bearer ${token}`;
  }

  private async post<T>(path: string, body: unknown, timeoutMs: number = this.timeoutMs): Promise<T> {
    const authorization = await this.authorization();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authorization,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      const data = (await response.json().catch(() => null)) as T | Clean24ApiErrorBody | null;
      if (!response.ok) {
        const error = isApiError(data)
          ? data
          : { code: `HTTP_${response.status}`, message: "Clean24 OS request failed.", details: undefined };
        throw new Clean24OsClientError(error.message, error.code, response.status, error.details);
      }
      if (!data || typeof data !== "object") {
        throw new Clean24OsClientError("Clean24 OS returned an invalid response.", "OS_INVALID_RESPONSE", 502);
      }
      return data as T;
    } catch (error) {
      if (error instanceof Clean24OsClientError) throw error;
      if (error instanceof Error && error.name === "AbortError") {
        throw new Clean24OsClientError("Clean24 OS request timed out.", "OS_TIMEOUT", 504);
      }
      throw new Clean24OsClientError("Clean24 OS is currently unavailable.", "OS_UNAVAILABLE", 503);
    } finally {
      clearTimeout(timeout);
    }
  }

  private async postForm<T>(path: string, body: FormData, timeoutMs: number = this.timeoutMs): Promise<T> {
    const authorization = await this.authorization();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method: "POST",
        headers: {
          Authorization: authorization,
        },
        body,
        signal: controller.signal,
      });

      const data = (await response.json().catch(() => null)) as T | Clean24ApiErrorBody | null;
      if (!response.ok) {
        const error = isApiError(data)
          ? data
          : { code: `HTTP_${response.status}`, message: "Clean24 OS request failed.", details: undefined };
        throw new Clean24OsClientError(error.message, error.code, response.status, error.details);
      }
      if (!data || typeof data !== "object") {
        throw new Clean24OsClientError("Clean24 OS returned an invalid response.", "OS_INVALID_RESPONSE", 502);
      }
      return data as T;
    } catch (error) {
      if (error instanceof Clean24OsClientError) throw error;
      if (error instanceof Error && error.name === "AbortError") {
        throw new Clean24OsClientError("Clean24 OS request timed out.", "OS_TIMEOUT", 504);
      }
      throw new Clean24OsClientError("Clean24 OS is currently unavailable.", "OS_UNAVAILABLE", 503);
    } finally {
      clearTimeout(timeout);
    }
  }
}

function normalizeBaseUrl(value: string | undefined): string {
  return value ? value.replace(/\/+$/, "") : "";
}

function isApiError(value: unknown): value is Clean24ApiErrorBody {
  return Boolean(value && typeof value === "object" && (value as { contract?: unknown }).contract === "clean24_api_error_v1");
}

export function createClean24OsClient(options?: Clean24OsClientOptions): Clean24OsClient {
  return new Clean24OsClient(options);
}
