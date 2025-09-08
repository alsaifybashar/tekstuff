const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS ?? 8000);
const WITH_CREDENTIALS = (import.meta.env.VITE_API_WITH_CREDENTIALS ?? "true") === "true"; // default true to match your current behavior

const etags = new Map();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function buildUrl(path, query) {
  const url = new URL(path.replace(/^\//, ""), BASE_URL);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}

async function withTimeout(run, ms) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await run(ctrl.signal);
  } finally {
    clearTimeout(t);
  }
}

async function parseJsonSafe(resp) {
  const text = await resp.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    throw new Error("Invalid JSON received from server.");
  }
}

export async function httpGet(path, options = {}) {
  if (!BASE_URL) throw new Error("Missing VITE_API_BASE_URL");

  const url = buildUrl(path, options.query);
  const retries = options.retries ?? 1;
  let attempt = 0;

  while (true) {
    const headers = { Accept: "application/json" };
    const tag = etags.get(url);
    if (tag) headers["If-None-Match"] = tag;

    try {
      const res = await withTimeout(
        (signal) =>
          fetch(url, {
            method: "GET",
            headers,
            mode: "cors",
            credentials: WITH_CREDENTIALS ? "include" : "omit",
            signal,
          }),
        TIMEOUT_MS
      );

      if (res.status === 304) return { data: null, status: 304, fromCache: true };

      if (!res.ok) {
        if ((res.status >= 500 || res.status === 429) && attempt < retries) {
          attempt++;
          await sleep(300 * 2 ** (attempt - 1));
          continue;
        }
        const body = await parseJsonSafe(res).catch(() => ({}));
        throw new Error((body && body.message) || `HTTP ${res.status}`);
      }

      const data = await parseJsonSafe(res);
      const newTag = res.headers.get("ETag");
      if (newTag) etags.set(url, newTag);

      return { data, status: res.status, fromCache: false };
    } catch (err) {
      const isAbort = err?.name === "AbortError";
      const transient = isAbort || /NetworkError|fetch failed/i.test(err?.message || "");
      if (transient && attempt < retries) {
        attempt++;
        await sleep(300 * 2 ** (attempt - 1));
        continue;
      }
      throw err;
    }
  }
}
