import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";

export const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
export const eb = new EventBridgeClient({});

export function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? "" : JSON.stringify(body),
  };
}

// --------- JWT helpers (fallback) ----------
function base64UrlDecodeToString(input) {
  // base64url -> base64
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  // pad
  const pad = b64.length % 4;
  const padded = pad ? b64 + "=".repeat(4 - pad) : b64;

  return Buffer.from(padded, "base64").toString("utf8");
}

function decodeJwtWithoutVerify(token) {
  try {
    const parts = String(token).split(".");
    if (parts.length < 2) return null;
    const payloadJson = base64UrlDecodeToString(parts[1]);
    return JSON.parse(payloadJson);
  } catch {
    return null;
  }
}

function getBearerToken(event) {
  const h = event?.headers || {};
  const auth = h.Authorization || h.authorization || "";
  const s = String(auth).trim();
  if (!s) return null;
  const m = s.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : s; // if they sent raw token without "Bearer"
}

// --------- Claims extraction ----------
export function getClaims(event) {
  // 1) HTTP API JWT authorizer (v2)
  const jwtClaims = event?.requestContext?.authorizer?.jwt?.claims;
  if (jwtClaims && typeof jwtClaims === "object") return jwtClaims;

  // 2) REST API Cognito authorizer (v1)
  const restClaims = event?.requestContext?.authorizer?.claims;
  if (restClaims && typeof restClaims === "object") return restClaims;

  // 3) Some setups put claims directly under authorizer
  const maybeClaims = event?.requestContext?.authorizer;
  if (maybeClaims && typeof maybeClaims === "object" && (maybeClaims.sub || maybeClaims.email)) {
    return maybeClaims;
  }

  // 4) Fallback: decode JWT from Authorization header
  const token = getBearerToken(event);
  if (!token) return null;
  return decodeJwtWithoutVerify(token);
}

function parseGroups(groupsRaw) {
  if (!groupsRaw) return [];

  // already array ["admin"]
  if (Array.isArray(groupsRaw)) {
    return groupsRaw.map((g) => String(g).trim()).filter(Boolean);
  }

  const s = String(groupsRaw).trim();
  if (!s) return [];

  // stringified JSON array
  if (s.startsWith("[") && s.endsWith("]")) {
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) {
        return parsed.map((g) => String(g).trim()).filter(Boolean);
      }
    } catch {
      // ignore
    }
  }

  // comma-separated or single
  return s.split(",").map((g) => g.trim()).filter(Boolean);
}

export function getUserContext(event) {
  const claims = getClaims(event);
  if (!claims) return null;

  const groupsRaw =
    claims["cognito:groups"] ??
    claims["Cognito:groups"] ??
    claims["groups"] ??
    claims["custom:groups"] ??
    "";

  const groups = parseGroups(groupsRaw);

  // make it case-insensitive (safer)
  const groupsLower = groups.map((g) => g.toLowerCase());
  const isAdmin = groupsLower.includes("admin");

  return {
    userId: claims.sub || claims.username || claims["cognito:username"] || null,
    email: claims.email || null,
    groups,
    isAdmin,
    // handy for debugging:
    tokenUse: claims.token_use || null,
    iss: claims.iss || null,
  };
}

export async function putEvent({ source, detailType, detail }) {
  const cmd = new PutEventsCommand({
    Entries: [
      {
        Source: source,
        DetailType: detailType,
        Detail: JSON.stringify(detail),
        EventBusName: process.env.EVENT_BUS_NAME || "default",
      },
    ],
  });

  await eb.send(cmd);
}
