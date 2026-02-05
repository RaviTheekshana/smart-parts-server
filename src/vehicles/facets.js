import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const ddb = DynamoDBDocumentClient.from(
  new DynamoDBClient({ region: process.env.AWS_REGION })
);

export const handler = async () => {
  const res = await ddb.send(
    new ScanCommand({
      TableName: process.env.VEHICLES_TABLE,
    })
  );

  const items = res.Items || [];
  const uniq = (k) => [...new Set(items.map((i) => i[k]).filter(Boolean))];

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      makes: uniq("make"),
      models: uniq("model"),
      years: uniq("year"),
      engines: uniq("engine"),
      transmissions: uniq("transmission"),
      trims: uniq("trim"),
    }),
  };
};
