import { readFileSync } from "node:fs";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  UpdateCommand
} from "@aws-sdk/lib-dynamodb";

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.TABLE_NAME;
const KEY = { pk: "GLOBAL" };

const capsules = JSON.parse(
  readFileSync(new URL("./capsules.json", import.meta.url), "utf8")
);

const HEADERS = {
  "content-type": "application/json",
  "cache-control": "no-store"
};

function reply(statusCode, body) {
  return {
    statusCode,
    headers: HEADERS,
    body: JSON.stringify(body)
  };
}

function routeOf(event) {
  const http = event.requestContext && event.requestContext.http;
  return {
    method: (http && http.method) || event.httpMethod || "GET",
    path: (http && http.path) || event.path || "/"
  };
}

function dayOfYear(date) {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  return Math.floor((date.getTime() - start) / 86400000);
}

async function increment() {
  if (!TABLE_NAME) {
    throw new Error("TABLE_NAME is not configured");
  }
  const result = await client.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: KEY,
      UpdateExpression: "ADD #count :one",
      ExpressionAttributeNames: { "#count": "count" },
      ExpressionAttributeValues: { ":one": 1 },
      ReturnValues: "ALL_NEW"
    })
  );
  return Number(result.Attributes && result.Attributes.count) || 1;
}

async function readCount() {
  if (!TABLE_NAME) {
    throw new Error("TABLE_NAME is not configured");
  }
  const result = await client.send(
    new GetCommand({ TableName: TABLE_NAME, Key: KEY })
  );
  return Number(result.Item && result.Item.count) || 0;
}

export const handler = async (event) => {
  const { method, path } = routeOf(event);

  if (method === "OPTIONS") {
    return { statusCode: 204, headers: HEADERS, body: "" };
  }

  try {
    if (path.endsWith("/pull") && method === "POST") {
      const count = await increment();
      return reply(200, { count });
    }

    if (path.endsWith("/stats") && method === "GET") {
      const count = await readCount();
      return reply(200, { count });
    }

    if (path.endsWith("/daily") && method === "GET") {
      const now = new Date();
      const index = dayOfYear(now) % capsules.length;
      const capsule = capsules[index];
      return reply(200, {
        date: now.toISOString().slice(0, 10),
        id: capsule.id,
        superpower: capsule.superpower
      });
    }

    return reply(404, { error: "not_found", path, method });
  } catch (error) {
    console.error("bugdrop_api_error", error);
    return reply(500, { error: "internal_error" });
  }
};
