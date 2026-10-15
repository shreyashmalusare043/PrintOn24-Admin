# System One API — Full Specification & Code

Gateway marker host uses Traefik rewrite: `api-<id>@app-evp0b1kqhrlt-api-79jKnBxVg4oL.gateway.appmedo.com` → `{app_id}-api-<id>{gateway_suffix}`.

## Endpoint Information

| Item | Value |
|------|-------|
| Endpoint | `POST https://app-evp0b1kqhrlt-api-79jKnBxVg4oL.gateway.appmedo.com/v1/systemone` |
| Models | `GET https://app-evp0b1kqhrlt-api-eLMlzKkOd7V9.gateway.appmedo.com/v1/models` |
| Auth | `platform_managed` — header `X-Gateway-Authorization: Bearer ${INTEGRATIONS_API_KEY}` |
| Content type | `application/json` |
| Billing | Billed per call |

## Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `model` | `string` | Yes | Model id, e.g. `jev-1.13.0`. Use `GET /v1/models` to list what the account can call. |
| `state` | `string` \| `object` \| `array` \| `null` | Yes | The data to judge. Prefer a structured object over a prose blob — nested keys are understood as structure, not as text. |
| `questions` | `object` | Yes | Non-empty map of question name → question. Names are the keys of the answers you get back. |
| `questions.<name>.type` | `"choice"` \| `"score"` \| `"noul"` | Yes | Question type. |
| `questions.<name>.instructions` | `string` \| `object` \| `array` \| `null` | No | The question itself. It may be structured, so you can attach per-answer context here. |
| `questions.<name>.criteria` | `object` \| `array` | For `choice`/`score` | `choice`: map of label → description. `score`: ordered array of level descriptions, index = score from 0. |

## Response Fields

| Field Path | Type | Description |
|------------|------|-------------|
| `model` | `string` | Model that answered the request. |
| `answers` | `object` | Answers keyed by question name. |
| `answers.<name>.type` | `string` | Echoes the question type. |
| `answers.<name>.choice` | `string` | `choice` only — the selected label. |
| `answers.<name>.score` | `number` | `score` only — expected score; may fall between rubric levels. |
| `answers.<name>.noul` | `number` | `noul` only — probability of "yes", 0–1. |
| `answers.<name>.confidence` | `number` | `choice`/`score` only — confidence in the selected answer, 0–1. |
| `answers.<name>.probabilities` | `object` | `choice`/`score` only — full distribution over labels/scores. |
| `answers.<name>.legend` | `object` | `score` only — the rubric keyed by score. |
| `usage.input_tokens` | `number` | Input tokens billed. |
| `usage.output_tokens` | `number` | Output tokens billed (cheap — outputs are structured). |

### Response codes

| Status | Meaning | Action |
|--------|---------|--------|
| `200` | Answered | Read `answers`; check each `confidence` before branching |
| `400` | Malformed questions (empty, or score with < 2 levels, > 10 levels) | Fix the request; do not retry |
| `401` / `403` | Gateway key missing, wrong or unauthorized | Check `INTEGRATIONS_API_KEY` binding; do not retry |
| `408` / `429` / `5xx` | Transient | Retry with backoff; Jev is safe to retry (read-only, no side effects) |
| `402` | Insufficient balance | Surface to the user |

## Generation-Time Usage (Direct Agent Call)

`scripts/call_jev.py` owns the HTTP call. Write the request to a file and invoke the script:

```bash
python3 <skill-path>/scripts/call_jev.py --request /tmp/jev-request.json
```

Inline form, for small requests:

```bash
python3 <skill-path>/scripts/call_jev.py \
  --state '{"text":"I was charged twice"}' \
  --questions '{"billing":{"type":"noul","instructions":"Is this about billing?"}}'
```

List callable models:

```bash
python3 <skill-path>/scripts/call_jev.py --models
```

**The Bash tool timeout must be set to 600000ms (600 seconds)**, or the default 120s may cut a
slow call off.

## Post-Generation Usage (In-App via Edge Function)

The Edge Function holds the **question set** (authored at generation time) and accepts only the
`state` from the client. Do not let the browser send arbitrary `questions` — that would give the
frontend control over what the model is asked, which is this API's equivalent of raw SQL.

```typescript
// edge-functions/<api-name>.ts
import { serve } from "https://deno.land/std/http/server.ts";

// Authored once at generation time and locked here — never taken from the request body.
const QUESTIONS = {
  intent: {
    type: "choice",
    instructions: "What is the sender's main communicative intent?",
    criteria: {
      ask: "asking for information",
      share: "sharing their own news",
      care: "checking in on the other person",
    },
  },
} as const;

serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  // --- Parse client request ---
  let state: unknown;
  try {
    const body = await req.json();
    state = body.state;
    if (state === undefined || state === null) throw new Error("Missing state");
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // --- Inject platform key (never expose to client) ---
  const apiKey = Deno.env.get("INTEGRATIONS_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // --- Call upstream ---
  const upstream = await fetch("https://app-evp0b1kqhrlt-api-79jKnBxVg4oL.gateway.appmedo.com/v1/systemone", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Gateway-Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: "jev-1.13.0", state, questions: QUESTIONS }),
  });

  // Forward quota/balance errors verbatim
  if (upstream.status === 429 || upstream.status === 402) {
    const errText = await upstream.text();
    return new Response(errText, {
      status: upstream.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!upstream.ok) {
    return new Response(
      JSON.stringify({ error: `Upstream error: ${upstream.status}` }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  const data = await upstream.json();
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
```

### Frontend → Edge Function

```typescript
type JevAnswer =
  | { type: "choice"; choice: string; confidence: number; probabilities: Record<string, number> }
  | { type: "score"; score: number; confidence: number; probabilities: Record<string, number> }
  | { type: "noul"; noul: number };

async function judge(state: unknown): Promise<Record<string, JevAnswer>> {
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/<api-name>`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state }),
  });

  if (res.status === 429) {
    const err = await res.json();
    throw new Error(`Quota exceeded: ${err.message ?? res.statusText}`);
  }
  if (res.status === 402) {
    const err = await res.json();
    throw new Error(`Insufficient balance: ${err.message ?? res.statusText}`);
  }
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);

  const json = (await res.json()) as { answers: Record<string, JevAnswer> };
  return json.answers;
}
```

## Notes

- **Key security**: `INTEGRATIONS_API_KEY` must only be read server-side in the Edge Function or by
  the generation-time script; never expose it to the frontend, never log it.
- **Error handling**: always handle `429` (quota exceeded) and `402` (insufficient balance).
- **Billing**: Jev is billed per call but is cheap. Combine independent questions into one request;
  a single `systemone` call with ten questions costs far less than ten calls.
- **Retries are safe**: `systemone` has no side effects, so retrying a transient failure cannot
  duplicate an action. This is not true of APIs with write semantics.
