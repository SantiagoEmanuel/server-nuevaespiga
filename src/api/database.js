import { createClient } from "@libsql/client";

// Import dotenv
import dotenv from "dotenv";
dotenv.config();

// Database configuration
export const db = await createClient({
  url: process.env.DB_URL,
  authToken: process.env.DB_TOKEN,
});
