import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

export function getDdb() {
  const region = process.env.AWS_REGION || process.env.REGION || "us-east-1";
  return DynamoDBDocumentClient.from(new DynamoDBClient({ region }));
}

export function chunk(arr, size = 25) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
