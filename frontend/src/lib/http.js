// src/lib/http.js
const DEFAULT_TIMEOUT = 12_000;
const RETRY_STATUS = new Set([502, 503, 504]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function http(path, init = {}, { timeout = DEFAULT_TIMEOUT, retries = 2 } = {}) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeout);
  const base = import.meta.env.VITE_API_URL || "";
  const url = `${base}${path}`;

  try {
    let attempt = 0;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const res = await fetch(url, {
          credentials: "include",
          headers: { "Content-Type": "application/json", ...(init.headers || {}) },
          signal: ctrl.signal,
          ...init,
        });

        const contentType = res.headers.get("content-type") || "";
        const isJSON = contentType.includes("application/json");
        const body = isJSON ? await res.json().catch(() => undefined) : await res.text().catch(() => undefined);

        if (!res.ok) {
          if (RETRY_STATUS.has(res.status) && attempt < retries) {
            attempt++;
            await sleep(300 * attempt);
            continue;
          }
          const err = new Error(`HTTP ${res.status} for ${url}`);
          err.status = res.status;
          err.url = url;
          err.body = body;
          throw err;
        }

        return body;
      } catch (e) {
        const networky = e?.name === "AbortError" || String(e?.message || "").toLowerCase().includes("network");
        if (networky && attempt < retries) {
          attempt++;
          await sleep(300 * attempt);
          continue;
        }
        throw e;
      }
    }
  } finally {
    clearTimeout(id);
  }
}
