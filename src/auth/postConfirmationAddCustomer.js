import { CognitoIdentityProviderClient, AdminAddUserToGroupCommand } from "@aws-sdk/client-cognito-identity-provider";

const cognito = new CognitoIdentityProviderClient({});

export async function handler(event) {
  const userPoolId = event.userPoolId;
  const username = event.userName;

  const group = process.env.CUSTOMER_GROUP || "customer";

  await cognito.send(
    new AdminAddUserToGroupCommand({
      UserPoolId: userPoolId,
      Username: username,
      GroupName: group,
    })
  );

  return event;
}
