// Centralized AI call helper for the SEM project.
// Provides aiCall (non-streaming) and aiCallStream (SSE proxy) with:
//  - AbortController-based timeout (default 30s)
//  - Exponential backoff retries on 429 / 5xx (default 2 retries)
//  - Fail-fast on 4xx (except 429)
//  - Structured console.info logging per call (route, userId, model, duration, usage, ok, retries)
//  - PII-safe logs: message content trimmed to first 100 chars
//  - model name validated (falls back to env / default)
//
// Designed to be used by every Chat Completions call site so we can:
//  1. Auditing/cost-by-route
//  2. Centralize retry/timeout policy
//  3. Swap models per-route freely (e.g. qwen-turbo for insights)

export interface AICallMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AICallOptions {
  messages: AICallMessage[];
  model?: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
  timeoutMs?: number;
  retries?: number;
  userId?: string | null;
  route?: string;
}

export interface AIUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface AICallResult {
  content: string;
  model: string;
  usage?: AIUsage;
  durationMs: number;
  retries: number;
}

interface AICallMeta {
  model: string;
  durationMs: number;
  retries: number;
  usage?: AIUsage;
}

// ─── Model / Config helpers ──────────────────────────────────────────────

function resolveBaseUrl(): string {
  return (
    process.env.AI_BASE_URL || "https://coding-intl.dashscope.aliyuncs.com/v1"
  );
}

function resolveApiKey(): string {
  return process.env.AI_API_KEY || "";
}

function resolveModel(model?: string): string {
  // Empty string, undefined, or whitespace → fall back to env / default.
  if (model && model.trim().length > 0) return model.trim();
  const envModel = process.env.AI_MODEL;
  if (envModel && envModel.trim().length > 0) return envModel.trim();
  return "qwen3.5-plus";
}

// ─── Logging ─────────────────────────────────────────────────────────────

interface LogPayload {
  route?: string;
  userId?: string | null;
  model: string;
  durationMs: number;
  usage?: AIUsage;
  ok: boolean;
  retries: number;
  error?: string;
  preview?: string;
}

function logCall(payload: LogPayload, messages: AICallMessage[]): void {
  // Trim each message content to first 100 chars to avoid leaking PII / tokens.
  const preview = messages
    .map((m) => `${m.role}:${m.content.slice(0, 100)}`)
    .join(" | ");

  console.info(
    "[ai]",
    JSON.stringify({
      ...payload,
      preview: preview.length > 300 ? preview.slice(0, 300) + "…" : preview,
    })
  );
}

// ─── Backoff ─────────────────────────────────────────────────────────────

function backoffMs(attempt: number): number {
  // 500ms * 2^attempt + jitter. attempt=0 → 500ms, attempt=1 → 1000ms, attempt=2 → 2000ms.
  const base = 500 * Math.pow(2, attempt);
  const jitter = Math.floor(Math.random() * 200);
  return base + jitter;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isAbortError(err: unknown): boolean {
  return (
    err instanceof Error &&
    (err.name === "AbortError" || err.name === "TimeoutError")
  );
}

// ─── Non-streaming aiCall ────────────────────────────────────────────────

export async function aiCall(opts: AICallOptions): Promise<AICallResult> {
  const {
    messages,
    maxTokens = 800,
    temperature = 0.7,
    timeoutMs = 30000,
    retries = 2,
    userId = null,
    route,
  } = opts;

  const baseUrl = resolveBaseUrl();
  const apiKey = resolveApiKey();
  const model = resolveModel(opts.model);

  if (!apiKey) {
    throw new Error("AI_API_KEY not configured");
  }
  if (!baseUrl) {
    throw new Error("AI_BASE_URL not configured");
  }

  let lastError: Error | null = null;
  let attempt = 0;
  let meta: AICallMeta = { model, durationMs: 0, retries: 0 };

  // Up to `retries + 1` total attempts (1 initial + retries).
  while (attempt <= retries) {
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);
    const start = Date.now();

    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: maxTokens,
          temperature,
          stream: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutHandle);
      const durationMs = Date.now() - start;

      if (res.ok) {
        const data = (await res.json()) as {
          model?: string;
          choices?: Array<{ message?: { content?: string } }>;
          usage?: AIUsage;
        };
        const content = data.choices?.[0]?.message?.content ?? "";
        const usage = data.usage;
        const resolvedModel = data.model ?? model;
        meta = {
          model: resolvedModel,
          durationMs,
          retries: attempt,
          usage,
        };
        logCall({ ...meta, route, userId, ok: true }, messages);
        return {
          content,
          model: resolvedModel,
          usage,
          durationMs,
          retries: attempt,
        };
      }

      // ── Error handling ────────────────────────────────────────────────
      // 4xx (except 429): fail fast
      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        const errText = await res.text();
        const err = new Error(
          `AI API error: ${res.status} ${res.statusText} — ${errText}`
        );
        meta = { model, durationMs, retries: attempt };
        logCall(
          { ...meta, route, userId, ok: false, error: err.message },
          messages
        );
        throw err;
      }

      // 429 / 5xx: retryable
      const errText = await res.text();
      lastError = new Error(
        `AI API error: ${res.status} ${res.statusText} — ${errText}`
      );
      meta = { model, durationMs, retries: attempt };
      logCall(
        { ...meta, route, userId, ok: false, error: lastError.message },
        messages
      );
    } catch (err) {
      clearTimeout(timeoutHandle);
      const durationMs = Date.now() - start;
      if (isAbortError(err)) {
        lastError = new Error(`AI API timeout after ${timeoutMs}ms`);
      } else if (err instanceof Error) {
        lastError = err;
      } else {
        lastError = new Error(String(err));
      }
      meta = { model, durationMs, retries: attempt };
      logCall(
        { ...meta, route, userId, ok: false, error: lastError.message },
        messages
      );
    }

    // Retry? Only if we have attempts left.
    if (attempt < retries) {
      await sleep(backoffMs(attempt));
      attempt++;
      continue;
    }
    break;
  }

  throw lastError ?? new Error("AI call failed after retries");
}

// ─── Streaming aiCallStream ──────────────────────────────────────────────

/**
 * Returns an SSE ReadableStream that proxies upstream tokens.
 * Side-channel: callers can pass route + userId for logging. The response
 * pipeline also tracks usage via `x-usage` header if present, else
 * estimates from the concatenated token text length.
 */
export function aiCallStream(opts: AICallOptions): ReadableStream<Uint8Array> {
  const {
    messages,
    maxTokens = 1000,
    temperature = 0.8,
    timeoutMs = 30000,
    retries = 2,
    userId = null,
    route,
  } = opts;

  const baseUrl = resolveBaseUrl();
  const apiKey = resolveApiKey();
  const model = resolveModel(opts.model);

  // Encode SSE chunks as UTF-8 bytes.
  const encoder = new TextEncoder();

  // Side-channel: estimate usage from accumulated content.
  // Estimate: ~4 chars per token. We expose this via a closure variable that
  // is updated as tokens stream through. We log it after the stream ends.
  let accumulated = "";

  async function attemptStream(
    attempt: number,
    signal: AbortSignal
  ): Promise<Response> {
    return fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
        stream: true,
      }),
      signal,
    });
  }

  let lastError: Error | null = null;

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let attempt = 0;
      let upstream: Response | null = null;
      let startedAt = Date.now();
      let headerUsage: AIUsage | undefined;

      // Some hosts extend ReadableStreamDefaultController with a `signal` so
      // producers can short-circuit when the consumer aborts. TS doesn't
      // know about it, so we widen to a structural type that may carry it.
      const streamController = controller as ReadableStreamDefaultController<Uint8Array> & {
        signal?: AbortSignal;
      };

      // Initial loop with retries (no body buffering — we want to start streaming immediately).
      while (attempt <= retries) {
        const controller2 = new AbortController();
        const timeoutHandle = setTimeout(
          () => controller2.abort(),
          timeoutMs
        );
        if (streamController.signal?.aborted) {
          clearTimeout(timeoutHandle);
          controller.error(new Error("Client aborted"));
          return;
        }
        try {
          startedAt = Date.now();
          const res = await attemptStream(attempt, controller2.signal);
          clearTimeout(timeoutHandle);

          if (res.ok) {
            // Best-effort usage from header if upstream sends it.
            const xUsage = res.headers.get("x-usage");
            if (xUsage) {
              try {
                headerUsage = JSON.parse(xUsage) as AIUsage;
              } catch {
                headerUsage = undefined;
              }
            }
            upstream = res;
            break;
          }

          // 4xx (except 429): fail fast
          if (res.status >= 400 && res.status < 500 && res.status !== 429) {
            const errText = await res.text();
            const err = new Error(
              `AI API error: ${res.status} ${res.statusText} — ${errText}`
            );
            logCall(
              {
                route,
                userId,
                model,
                durationMs: Date.now() - startedAt,
                ok: false,
                retries: attempt,
                error: err.message,
              },
              messages
            );
            controller.error(err);
            return;
          }

          // 429 / 5xx: retryable
          const errText = await res.text();
          lastError = new Error(
            `AI API error: ${res.status} ${res.statusText} — ${errText}`
          );
          logCall(
            {
              route,
              userId,
              model,
              durationMs: Date.now() - startedAt,
              ok: false,
              retries: attempt,
              error: lastError.message,
            },
            messages
          );
        } catch (err) {
          clearTimeout(timeoutHandle);
          if (isAbortError(err)) {
            lastError = new Error(`AI API timeout after ${timeoutMs}ms`);
          } else if (err instanceof Error) {
            lastError = err;
          } else {
            lastError = new Error(String(err));
          }
          logCall(
            {
              route,
              userId,
              model,
              durationMs: Date.now() - startedAt,
              ok: false,
              retries: attempt,
              error: lastError.message,
            },
            messages
          );
        }

        if (attempt < retries) {
          await sleep(backoffMs(attempt));
          attempt++;
          continue;
        }
        break;
      }

      if (!upstream || !upstream.body) {
        controller.error(lastError ?? new Error("AI stream failed after retries"));
        return;
      }

      // Log success on stream start.
      logCall(
        {
          route,
          userId,
          model,
          durationMs: Date.now() - startedAt,
          ok: true,
          retries: attempt,
          usage: headerUsage,
        },
        messages
      );

      const reader = upstream.body.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          // Track accumulated content for usage estimation.
          const text = new TextDecoder().decode(value);
          accumulated += text;
          controller.enqueue(encoder.encode(text));
        }
        controller.close();

        // After stream ends, log estimated usage if no header was provided.
        if (!headerUsage) {
          const completionTokens = Math.ceil(accumulated.length / 4);
          logCall(
            {
              route,
              userId,
              model,
              durationMs: Date.now() - startedAt,
              ok: true,
              retries: attempt,
              usage: {
                prompt_tokens: 0,
                completion_tokens: completionTokens,
                total_tokens: completionTokens,
              },
            },
            messages
          );
        }
      } catch (err) {
        controller.error(err);
      }
    },
    cancel() {
      // Client closed connection — nothing else to do.
    },
  });
}

// ─── Tiny semaphore for parallel concurrency cap ─────────────────────────

/**
 * Promise-queue semaphore. Caps how many of `worker(input)` promises run
 * concurrently. Used by insight-generator to avoid hammering upstream.
 */
export async function parallelWithLimit<TIn, TOut>(
  items: TIn[],
  limit: number,
  worker: (item: TIn, index: number) => Promise<TOut>
): Promise<TOut[]> {
  const results: TOut[] = new Array(items.length);
  let cursor = 0;

  async function runOne(): Promise<void> {
    while (true) {
      const idx = cursor++;
      if (idx >= items.length) return;
      try {
        results[idx] = await worker(items[idx], idx);
      } catch {
        // Worker is expected to handle its own errors; if it throws we
        // leave a hole in the array. The caller decides what to do.
      }
    }
  }

  const workers: Promise<void>[] = [];
  const concurrency = Math.max(1, Math.min(limit, items.length));
  for (let i = 0; i < concurrency; i++) {
    workers.push(runOne());
  }
  await Promise.all(workers);
  return results;
}
