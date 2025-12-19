const { Pool } = require('pg');

// Database connection configuration (defaults match postgres_qhapnan)
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5436,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'qhapnan',
  database: process.env.DB_NAME || 'qhapaqnan_db',
});

// Ensure the table exists before accepting writes
async function ensureRegistrationTable() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS registrations (
      id SERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      institution TEXT,
      city TEXT,
      national_id TEXT,
      message TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await pool.query(createTableSQL);
  console.log('Table "registrations" is ready');
}

async function testConnection() {
  const client = await pool.connect();
  try {
    await client.query('SELECT NOW()');
    console.log('Connected to postgres_qhapnan successfully');
  } finally {
    client.release();
  }
}

async function insertRegistration(input) {
  const insertSQL = `
    INSERT INTO registrations
      (full_name, email, institution, city, national_id, message)
    VALUES
      ($1, $2, $3, $4, $5, $6)
    RETURNING id, full_name, email, institution, city, national_id, message, created_at
  `;

  const values = [
    input.fullName,
    input.email,
    input.institution || null,
    input.city || null,
    input.nationalId || null,
    input.message || null,
  ];

  const { rows } = await pool.query(insertSQL, values);
  return rows[0];
}

async function getDbTime() {
  const { rows } = await pool.query('SELECT NOW() AS now');
  return rows[0].now;
}

async function listRegistrations(filter = {}, pagination = {}) {
  const where = [];
  const values = [];

  if (filter.fullName) {
    values.push(`%${filter.fullName.toLowerCase()}%`);
    where.push(`LOWER(full_name) LIKE $${values.length}`);
  }

  if (filter.dateFrom) {
    values.push(filter.dateFrom);
    where.push(`created_at >= $${values.length}::timestamptz`);
  }

  if (filter.dateTo) {
    values.push(filter.dateTo);
    where.push(`created_at <= $${values.length}::timestamptz`);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const page = Math.max(1, Number(pagination.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(pagination.pageSize) || 20));
  const offset = (page - 1) * pageSize;

  const countSQL = `SELECT COUNT(*) FROM registrations ${whereClause}`;
  const totalResult = await pool.query(countSQL, values);
  const total = Number(totalResult.rows[0].count) || 0;

  const dataSQL = `
    SELECT id, full_name, email, institution, city, national_id, message, created_at
    FROM registrations
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${values.length + 1}
    OFFSET $${values.length + 2}
  `;

  const dataValues = [...values, pageSize, offset];
  const { rows } = await pool.query(dataSQL, dataValues);

  return {
    items: rows,
    total,
    page,
    pageSize,
  };
}

module.exports = {
  pool,
  ensureRegistrationTable,
  testConnection,
  insertRegistration,
  getDbTime,
  listRegistrations,
};
