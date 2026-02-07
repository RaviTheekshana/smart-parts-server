import {
  CognitoIdentityProviderClient,
  AdminListGroupsForUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";

export const cognito = new CognitoIdentityProviderClient({});

export async function getPrimaryRole(userPoolId, username) {
  // returns "admin" if in admin group, else "customer" if in customer, else ""
  const out = await cognito.send(
    new AdminListGroupsForUserCommand({
      UserPoolId: userPoolId,
      Username: username,
    })
  );

  const names = (out.Groups || []).map((g) => g.GroupName).filter(Boolean);

  if (names.includes(process.env.ADMIN_GROUP || "admin")) return "admin";
  if (names.includes(process.env.CUSTOMER_GROUP || "customer")) return "customer";
  return names[0] || "";
}
