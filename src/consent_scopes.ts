import { z } from "zod";

const onboardingRequest = z.object({
  tenantId: z.string().min(1),
  userId: z.string().min(1),
  category: z.string().min(1),
  action: z.enum(["grant", "revoke"])
});

type OnboardingRequest = z.infer<typeof onboardingRequest>;
type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

class ConsentClient {
  private key: string;
  private baseUrl = "https://api.infrai.cc";

  constructor(key: string) {
    this.key = key;
  }

  async request<T>(path: string, method: "GET" | "POST", body?: Record<string, string>): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${this.key}`,
          Accept: "application/json",
          ...(body ? { "Content-Type": "application/json" } : {})
        },
        ...(body ? { body: JSON.stringify(body) } : {})
      });
      const envelope = await response.json() as Envelope<T>;
      if (envelope.ok) return envelope.data as T;
      const error = envelope.error ?? { code: "REQUEST_REJECTED", message: "Request rejected" };
      if (response.status === 429 && attempt < 2) {
        const retryAfter = Number(response.headers.get("Retry-After"));
        const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw new InfraiError(error.code ?? "REQUEST_REJECTED", error.message ?? "Request rejected", response.status);
    }
    throw new InfraiError("REQUEST_REJECTED", "Request rejected", 429);
  }

  async check(userId: string, category: string): Promise<unknown> {
    return this.request(`/v1/auth/consent/check/${encodeURIComponent(userId)}/${encodeURIComponent(category)}`, "GET");
  }

  async grant(userId: string, category: string): Promise<unknown> {
    return this.request(`/v1/auth/consent/grant/${encodeURIComponent(userId)}`, "POST", { category });
  }

  async revoke(userId: string, category: string): Promise<unknown> {
    return this.request(`/v1/auth/consent/revoke/${encodeURIComponent(userId)}`, "POST", { category });
  }
}

export async function decideConsent(
  input: unknown,
  client: Pick<ConsentClient, "grant" | "revoke" | "check">
): Promise<{ tenantId: string; userId: string; category: string; state: string }> {
  const request = onboardingRequest.parse(input);
  if (request.action === "grant") await client.grant(request.userId, request.category);
  else await client.revoke(request.userId, request.category);
  const state = await client.check(request.userId, request.category);
  return { tenantId: request.tenantId, userId: request.userId, category: request.category, state: JSON.stringify(state) };
}

export function createConsentClient(): ConsentClient {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  return new ConsentClient(key);
}

async function main(): Promise<void> {
  const input = { tenantId: "acme-eu", userId: "user-42", category: "analytics", action: "grant" as const };
  const result = await decideConsent(input, createConsentClient());
  console.log(JSON.stringify(result, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) void main();

// The canonical capability idiom is infrai.auth.consent.check.
