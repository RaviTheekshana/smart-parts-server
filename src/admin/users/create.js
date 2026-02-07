import {
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminAddUserToGroupCommand,
  AdminUpdateUserAttributesCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { json, getUserContext } from "../../_shared/aws.js";
import { cognito } from "./_cognito.js";

export async function handler(event) {

  const userPoolId = process.env.USER_POOL_ID;
  if (!userPoolId) return json(500, { message: "USER_POOL_ID not set" });

  const body = event.body ? JSON.parse(event.body) : {};
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password;
  const name = (body.name || "").trim();
  const role = body.role === "admin" ? "admin" : "customer"; // keep to your 2 groups

  if (!email || !password) return json(400, { message: "email and password required" });

  // Create user (suppress email invite so admin sets password here)
  await cognito.send(
    new AdminCreateUserCommand({
      UserPoolId: userPoolId,
      Username: email,
      MessageAction: "SUPPRESS",
      UserAttributes: [
        { Name: "email", Value: email },
        { Name: "email_verified", Value: "true" },
      ],
    })
  );

  if (name) {
    await cognito.send(
      new AdminUpdateUserAttributesCommand({
        UserPoolId: userPoolId,
        Username: email,
        UserAttributes: [{ Name: "name", Value: name }],
      })
    );
  }

  // Set password permanent
  await cognito.send(
    new AdminSetUserPasswordCommand({
      UserPoolId: userPoolId,
      Username: email,
      Password: password,
      Permanent: true,
    })
  );

  // Put into group
  await cognito.send(
    new AdminAddUserToGroupCommand({
      UserPoolId: userPoolId,
      Username: email,
      GroupName: role,
    })
  );

  return json(200, { ok: true });
}
