/**
 * Thin wrapper over the Apollo.io REST API. Used by the server-side sync
 * route to keep apollo_sequences and apollo_email_accounts in step with
 * the upstream account.
 *
 * Auth: Apollo accepts `Cache-Control: no-cache` plus an `X-Api-Key` header
 * (or the legacy `?api_key=…` query param, which we avoid). The key lives
 * in the APOLLO_API_KEY env var, server-side only.
 */

const APOLLO_BASE = "https://api.apollo.io/api/v1";

export interface ApolloSequence {
  id: string;
  name: string;
  active: boolean;
  archived: boolean;
  num_steps: number;
  unique_scheduled: number;
  unique_delivered: number;
  unique_bounced: number;
  unique_hard_bounced: number;
  unique_opened: number;
  unique_replied: number;
  unique_clicked: number;
  unique_spam_blocked: number;
  unique_unsubscribed: number;
  open_rate: number;
  bounce_rate: number;
  reply_rate: number;
  click_rate: number;
  spam_block_rate: number;
  is_performing_poorly: boolean;
  creation_type: string | null;
  created_at: string;
  last_used_at: string | null;
}

export interface ApolloEmailAccount {
  id: string;
  email: string;
  type: string;
  active: boolean;
  default: boolean;
  created_at: string;
  last_synced_at: string | null;
}

export class ApolloError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApolloError";
    this.status = status;
  }
}

function apiKey(): string {
  const key = process.env.APOLLO_API_KEY;
  if (!key) {
    throw new ApolloError(
      "APOLLO_API_KEY is not set. Add it in Vercel project env vars to enable Apollo sync.",
      500,
    );
  }
  return key;
}

async function call<T>(
  path: string,
  init?: RequestInit & { searchParams?: Record<string, string | number> },
): Promise<T> {
  const url = new URL(`${APOLLO_BASE}${path}`);
  if (init?.searchParams) {
    for (const [k, v] of Object.entries(init.searchParams)) {
      url.searchParams.set(k, String(v));
    }
  }

  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Api-Key": apiKey(),
      "Cache-Control": "no-cache",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    let message = `Apollo ${res.status} on ${path}`;
    try {
      const body = await res.text();
      if (body) message += `: ${body.slice(0, 300)}`;
    } catch {
      // ignore
    }
    throw new ApolloError(message, res.status);
  }
  return (await res.json()) as T;
}

export async function fetchEmailerCampaigns(): Promise<ApolloSequence[]> {
  type Resp = {
    pagination: { total_pages: number };
    emailer_campaigns: ApolloSequence[];
  };
  const all: ApolloSequence[] = [];
  let page = 1;
  while (true) {
    const data = await call<Resp>(`/emailer_campaigns/search`, {
      method: "POST",
      body: JSON.stringify({ per_page: 100, page }),
    });
    all.push(...data.emailer_campaigns);
    if (page >= data.pagination.total_pages) break;
    page += 1;
    if (page > 20) break; // sanity stop
  }
  return all;
}

export async function fetchEmailAccounts(): Promise<ApolloEmailAccount[]> {
  type Resp = { email_accounts: ApolloEmailAccount[] };
  const data = await call<Resp>(`/email_accounts`, { method: "GET" });
  return data.email_accounts;
}
