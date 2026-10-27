import { MongoClient, type Db } from "mongodb";

let client: MongoClient | undefined;

// Lazy on purpose: the app must import cleanly during `next build` with no .env.
export function db(): Db {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  client ??= new MongoClient(uri);
  return client.db(process.env.MONGODB_DB || "twofold");
}
