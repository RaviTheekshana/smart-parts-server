import { AdminDeleteUserCommand } from "@aws-sdk/client-cognito-identity-provider";
import { json, getUserContext } from "../../_shared/aws.js";
import { cognito } from "./_cognito.js";

export async function handler(event) {

  const userPoolId = process.env.USER_POOL_ID;
  const username = event.pathParameters?.id;
  if (!userPoolId) return json(500, { message: "USER_POOL_ID not set" });
  if (!username) return json(400, { message: "Missing user id" });

  await cognito.send(
    new AdminDeleteUserCommand({ UserPoolId: userPoolId, Username: username })
  );

  return json(200, { ok: true });
}
