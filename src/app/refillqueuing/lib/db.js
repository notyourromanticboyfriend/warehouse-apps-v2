//src/refillqueuing/lib/db.js
import { createPool } from '@vercel/postgres';

const pool = createPool({
  connectionString: process.env.POSTGRES_URL,
});

export const query = (text, params) => pool.query(text, params);