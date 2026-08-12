// Lightweight request-body validators for edge functions. Zero deps.
//
// Every guard throws a `ValidationError` (HTTP 400) on bad input so handlers
// can funnel validation failures through a single error path instead of
// scattering `if (!x) throw` checks (which previously produced 400s with
// inconsistent shapes). Handlers should call `validateBody(req, fields)` or
// the individual guards inside their try/catch.

export class ValidationError extends Error {
  status = 400;
  constructor(field: string, message?: string) {
    super(message ?? `Invalid or missing field: ${field}`);
    this.name = "ValidationError";
  }
}

export function isString(v: unknown): v is string {
  return typeof v === "string";
}

/** Returns the string or throws a 400 for a missing / blank field. */
export function isRequiredString(v: unknown, field: string): string {
  if (typeof v !== "string" || v.trim().length === 0) {
    throw new ValidationError(field, `Missing required field: ${field}`);
  }
  return v;
}

/**
 * Accepts a raw base64 payload, optionally prefixed with a `data:image/...`
 * URI. Rejects empty / obviously non-base64 values (spaces allowed — base64
 * may be line-wrapped).
 */
export function isBase64Image(v: unknown): boolean {
  if (typeof v !== "string" || v.length === 0) return false;
  const body = v.includes(",") ? v.split(",")[1] : v;
  const trimmed = body.trim();
  return trimmed.length > 0 && /^[A-Za-z0-9+/=\r\n]+$/.test(trimmed);
}

export function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

/** Build a validator that enforces membership in a fixed enum. */
export function asEnum<T extends string>(values: readonly T[]) {
  const allowed = new Set<string>(values);
  return (v: unknown, field: string): T => {
    if (typeof v !== "string" || !allowed.has(v)) {
      throw new ValidationError(
        field,
        `Invalid value for ${field}. Expected one of: ${values.join(", ")}`,
      );
    }
    return v as T;
  };
}

/**
 * Safely parse a JSON request body. Non-JSON payloads become a 400
 * ValidationError instead of throwing a raw SyntaxError.
 */
export async function readJsonBody(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new ValidationError("body", "Request body must be valid JSON");
  }
}

/** Serialize a ValidationError (or any Error) into a 400 JSON response. */
export function validationErrorResponse(
  err: unknown,
  corsHeaders: Record<string, string>,
): Response {
  const message = err instanceof Error ? err.message : "Bad request";
  const status = err instanceof ValidationError ? err.status : 400;
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
