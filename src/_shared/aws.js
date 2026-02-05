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

export function getClaims(event) {
  return event?.requestContext?.authorizer?.jwt?.claims || null;
}

function parseGroups(groupsRaw) {
  if (!groupsRaw) return [];

  // Case 1: already an array ["admin"]
  if (Array.isArray(groupsRaw)) {
    return groupsRaw.map((g) => String(g).trim()).filter(Boolean);
  }

  // Convert to string safely
  const s = String(groupsRaw).trim();
  if (!s) return [];

  // Case 2: stringified JSON array like "[\"admin\"]"
  if (s.startsWith("[") && s.endsWith("]")) {
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) {
        return parsed.map((g) => String(g).trim()).filter(Boolean);
      }
    } catch {
      // fallback below
    }
  }

  // Case 3: comma-separated "admin,customer" OR single "admin"
  return s.split(",").map((g) => g.trim()).filter(Boolean);
}

export function getUserContext(event) {
  const claims = getClaims(event);
  if (!claims) return null;

  // Some setups may vary claim key casing or formatting
  const groupsRaw =
    claims["cognito:groups"] ??
    claims["Cognito:groups"] ??
    claims["groups"] ??
    "";

  const groups = parseGroups(groupsRaw);
  const isAdmin = groups.includes("admin");

  return {
    userId: claims.sub,
    email: claims.email,
    groups,
    isAdmin,
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
