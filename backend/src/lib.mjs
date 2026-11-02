export const HEADERS = {
  "content-type": "application/json",
  "cache-control": "no-store"
};

export function reply(statusCode, body) {
  return {
    statusCode,
    headers: HEADERS,
    body: JSON.stringify(body)
  };
}

export function routeOf(event) {
  const http = event && event.requestContext && event.requestContext.http;
  return {
    method: (http && http.method) || (event && event.httpMethod) || "GET",
    path: (http && http.path) || (event && event.path) || "/"
  };
}

export function dayOfYear(date) {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  return Math.floor((date.getTime() - start) / 86400000);
}

export function dailyCapsule(capsules, date) {
  if (!Array.isArray(capsules) || capsules.length === 0) {
    throw new Error("dailyCapsule requires a non-empty capsules array");
  }
  const index = dayOfYear(date) % capsules.length;
  const capsule = capsules[index];
  if (!capsule || !capsule.id || !capsule.superpower) {
    throw new Error("capsule at index " + index + " is malformed");
  }
  return {
    date: date.toISOString().slice(0, 10),
    id: capsule.id,
    superpower: capsule.superpower
  };
}
