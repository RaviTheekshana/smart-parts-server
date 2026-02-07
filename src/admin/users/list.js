import { ListUsersCommand } from "@aws-sdk/client-cognito-identity-provider";
import { json, getUserContext } from "../../_shared/aws.js";
import { cognito, getPrimaryRole } from "./_cognito.js";

export async function handler(event) {

  const userPoolId = process.env.USER_POOL_ID;
  if (!userPoolId) return json(500, { message: "USER_POOL_ID not set" });

  const query = (event.queryStringParameters?.query || "").trim();
  const filter = query ? `email ^= "${query}"` : undefined;

  const out = await cognito.send(
    new ListUsersCommand({
      UserPoolId: userPoolId,
      Filter: filter,
      Limit: 50,
    })
  );

  const usersRaw = out.Users || [];

  // For each user, fetch groups to set "role" (fine for small class project)
  const users = await Promise.all(
    usersRaw.map(async (u) => {
      const attrs = Object.fromEntries((u.Attributes || []).map((a) => [a.Name, a.Value]));
      const email = attrs.email || u.Username;
      const name = attrs.name || attrs.given_name || "";
      const role = await getPrimaryRole(userPoolId, u.Username);

      return {
        _id: u.Username,                 // frontend expects _id
        email,
        role: role || "customer",
        profile: { name },
        createdAt: u.UserCreateDate ? new Date(u.UserCreateDate).toISOString() : null,
      };
    })
  );

  return json(200, { users, total: users.length });
}
