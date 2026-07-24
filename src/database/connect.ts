import mongoose from 'mongoose';
import { env } from '../config/env.js';

export async function connectDatabase() {
  mongoose.set('strictQuery', true);
  const connection = await mongoose.connect(env.MONGODB_URI);
  const { host, name } = connection.connection;

  console.log(`MongoDB connected to ${host}/${name}`);
}
