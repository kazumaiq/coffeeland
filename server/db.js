const { Pool } = require('pg')

const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is required for Supabase/Postgres')
}

const ssl = connectionString.includes('sslmode=disable')
  ? false
  : { rejectUnauthorized: false }

const pool = new Pool({ connectionString, ssl })

const query = (text, params = [], client) => {
  const runner = client || pool
  return runner.query(text, params)
}

const transaction = async (fn) => {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}

module.exports = { query, transaction }
