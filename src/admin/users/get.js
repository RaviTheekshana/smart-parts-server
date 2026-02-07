import { AdminGetUserCommand } from "@aws-sdk/client-cognito-identity-provider";
import { json, getUserContext } from "../../_shared/aws.js";
import { cognito, getPrimaryRole } from "./_cognito.js";

export async function handler(event) {
  
  const userPoolId = process.env.USER_POOL_ID;
  const username = event.pathParameters?.id;
  if (!userPoolId) return json(500, { message: "USER_POOL_ID not set" });
  if (!username) return json(400, { message: "Missing user id" });

  const out = await cognito.send(
    new AdminGetUserCommand({ UserPoolId: userPoolId, Username: username })
  );

  const attrs = Object.fromEntries((out.UserAttributes || []).map((a) => [a.Name, a.Value]));
  const role = await getPrimaryRole(userPoolId, username);

  const user = {
    _id: username,
    email: attrs.email || username,
    role: role || "customer",
    profile: { name: attrs.name || "" },
    createdAt: out.UserCreateDate ? new Date(out.UserCreateDate).toISOString() : null,
  };

  return json(200, { user });
}
