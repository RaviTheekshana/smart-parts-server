import {
  AdminUpdateUserAttributesCommand,
  AdminSetUserPasswordCommand,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { json, getUserContext } from "../../_shared/aws.js";
import { cognito, getPrimaryRole } from "./_cognito.js";

export async function handler(event) {

  const userPoolId = process.env.USER_POOL_ID;
  const username = event.pathParameters?.id;
  if (!userPoolId) return json(500, { message: "USER_POOL_ID not set" });
  if (!username) return json(400, { message: "Missing user id" });

  const body = event.body ? JSON.parse(event.body) : {};
  const email = body.email ? String(body.email).trim().toLowerCase() : null;
  const name = body.name ? String(body.name).trim() : null;
  const role = body.role === "admin" ? "admin" : body.role === "customer" ? "customer" : null;
  const password = body.password ? String(body.password) : null;

  // Update attributes
  const attrs = [];
  if (email) attrs.push({ Name: "email", Value: email }, { Name: "email_verified", Value: "true" });
  if (name !== null) attrs.push({ Name: "name", Value: name });

  if (attrs.length) {
    await cognito.send(
      new AdminUpdateUserAttributesCommand({
        UserPoolId: userPoolId,
        Username: username,
        UserAttributes: attrs,
      })
    );
  }

  // Password update
  if (password) {
    await cognito.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: userPoolId,
        Username: username,
        Password: password,
        Permanent: true,
      })
    );
  }

  // Group update (2 groups only)
  if (role) {
    const current = await getPrimaryRole(userPoolId, username);
    if (current && current !== role) {
      await cognito.send(
        new AdminRemoveUserFromGroupCommand({
          UserPoolId: userPoolId,
          Username: username,
          GroupName: current,
        })
      );
    }
    if (current !== role) {
      await cognito.send(
        new AdminAddUserToGroupCommand({
          UserPoolId: userPoolId,
          Username: username,
          GroupName: role,
        })
      );
    }
  }

  return json(200, { ok: true });
}
