import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDb() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  return mongoose.connect(env.MONGO_URI);
}
