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

async function ensurePonenciaTable() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS ponencias (
      id SERIAL PRIMARY KEY,
      topic TEXT NOT NULL,
      full_name TEXT NOT NULL,
      affiliation TEXT,
      city_country TEXT,
      summary TEXT,
      status SMALLINT NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await pool.query(createTableSQL);
  await pool.query(`
    ALTER TABLE ponencias
    ADD COLUMN IF NOT EXISTS status SMALLINT NOT NULL DEFAULT 1
  `);
  console.log('Table "ponencias" is ready');
}

async function ensureSintesisTable() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS sintesis (
      id SERIAL PRIMARY KEY,
      mesa TEXT NOT NULL,
      coordinacion TEXT,
      fecha TIMESTAMPTZ,
      fecha_fin TIMESTAMPTZ,
      sintesis_general TEXT,
      lineas_trabajo JSONB,
      cierre TEXT,
      status SMALLINT NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await pool.query(createTableSQL);
  await pool.query(`
    ALTER TABLE sintesis
    ADD COLUMN IF NOT EXISTS mesa TEXT NOT NULL DEFAULT ''
  `);
  await pool.query(`
    ALTER TABLE sintesis
    ADD COLUMN IF NOT EXISTS coordinacion TEXT
  `);
  await pool.query(`
    ALTER TABLE sintesis
    ADD COLUMN IF NOT EXISTS fecha TIMESTAMPTZ
  `);
  await pool.query(`
    ALTER TABLE sintesis
    ADD COLUMN IF NOT EXISTS fecha_fin TIMESTAMPTZ
  `);
  await pool.query(`
    ALTER TABLE sintesis
    ADD COLUMN IF NOT EXISTS sintesis_general TEXT
  `);
  await pool.query(`
    ALTER TABLE sintesis
    ADD COLUMN IF NOT EXISTS lineas_trabajo JSONB
  `);
  await pool.query(`
    ALTER TABLE sintesis
    ADD COLUMN IF NOT EXISTS cierre TEXT
  `);
  await pool.query(`
    ALTER TABLE sintesis
    ADD COLUMN IF NOT EXISTS status SMALLINT NOT NULL DEFAULT 1
  `);

  console.log('Table "sintesis" is ready');
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

async function insertPonencia(input) {
  const insertSQL = `
    INSERT INTO ponencias
      (topic, full_name, affiliation, city_country, summary, status)
    VALUES
      ($1, $2, $3, $4, $5, $6)
    RETURNING id, topic, full_name, affiliation, city_country, summary, status, created_at
  `;

  const values = [
    input.topic,
    input.fullName,
    input.affiliation || null,
    input.cityCountry || null,
    input.summary || null,
    1,
  ];

  const { rows } = await pool.query(insertSQL, values);
  return rows[0];
}

const parseLineasTrabajo = (value) => {
  if (!value) return null;
  if (Array.isArray(value)) return value;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  return JSON.parse(trimmed);
};

async function insertSintesis(input) {
  const insertSQL = `
    INSERT INTO sintesis
      (mesa, coordinacion, fecha, fecha_fin, sintesis_general, lineas_trabajo, cierre, status)
    VALUES
      ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)
    RETURNING id, mesa, coordinacion, fecha, fecha_fin, sintesis_general, lineas_trabajo, cierre, status, created_at
  `;

  const lineasTrabajo = parseLineasTrabajo(input.lineasTrabajo);
  const values = [
    input.mesa,
    input.coordinacion || null,
    input.fecha || null,
    input.fechaFin || null,
    input.sintesisGeneral || null,
    lineasTrabajo ? JSON.stringify(lineasTrabajo) : null,
    input.cierre || null,
    1,
  ];

  const { rows } = await pool.query(insertSQL, values);
  return rows[0];
}

async function updatePonencia(id, input) {
  const updateSQL = `
    UPDATE ponencias
    SET topic = $1,
        full_name = $2,
        affiliation = $3,
        city_country = $4,
        summary = $5
    WHERE id = $6
    RETURNING id, topic, full_name, affiliation, city_country, summary, status, created_at
  `;

  const values = [
    input.topic,
    input.fullName,
    input.affiliation || null,
    input.cityCountry || null,
    input.summary || null,
    id,
  ];

  const { rows } = await pool.query(updateSQL, values);
  return rows[0] || null;
}

async function updateSintesis(id, input) {
  const updateSQL = `
    UPDATE sintesis
    SET mesa = $1,
        coordinacion = $2,
        fecha = $3,
        fecha_fin = $4,
        sintesis_general = $5,
        lineas_trabajo = $6::jsonb,
        cierre = $7
    WHERE id = $8
    RETURNING id, mesa, coordinacion, fecha, fecha_fin, sintesis_general, lineas_trabajo, cierre, status, created_at
  `;

  const lineasTrabajo = parseLineasTrabajo(input.lineasTrabajo);
  const values = [
    input.mesa,
    input.coordinacion || null,
    input.fecha || null,
    input.fechaFin || null,
    input.sintesisGeneral || null,
    lineasTrabajo ? JSON.stringify(lineasTrabajo) : null,
    input.cierre || null,
    id,
  ];

  const { rows } = await pool.query(updateSQL, values);
  return rows[0] || null;
}

async function softDeletePonencia(id) {
  const deleteSQL = `
    UPDATE ponencias
    SET status = 0
    WHERE id = $1
    RETURNING id, topic, full_name, affiliation, city_country, summary, status, created_at
  `;

  const { rows } = await pool.query(deleteSQL, [id]);
  return rows[0] || null;
}

async function softDeleteSintesis(id) {
  const deleteSQL = `
    UPDATE sintesis
    SET status = 0
    WHERE id = $1
    RETURNING id, mesa, coordinacion, fecha, fecha_fin, sintesis_general, lineas_trabajo, cierre, status, created_at
  `;

  const { rows } = await pool.query(deleteSQL, [id]);
  return rows[0] || null;
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

async function listPonencias(filter = {}, pagination = {}) {
  const where = [];
  const values = [];

  where.push('status = 1');

  if (filter.topic) {
    values.push(`%${filter.topic.toLowerCase()}%`);
    where.push(`LOWER(topic) LIKE $${values.length}`);
  }

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

  const countSQL = `SELECT COUNT(*) FROM ponencias ${whereClause}`;
  const totalResult = await pool.query(countSQL, values);
  const total = Number(totalResult.rows[0].count) || 0;

  const dataSQL = `
    SELECT id, topic, full_name, affiliation, city_country, summary, status, created_at
    FROM ponencias
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

async function listSintesis(filter = {}, pagination = {}) {
  const where = [];
  const values = [];

  where.push('status = 1');

  if (filter.mesa) {
    values.push(filter.mesa);
    where.push(`mesa = $${values.length}`);
  }

  if (filter.date) {
    values.push(filter.date);
    where.push(`(
      (fecha IS NULL OR DATE(fecha) <= DATE($${values.length}))
      AND (fecha_fin IS NULL OR DATE(fecha_fin) >= DATE($${values.length}))
    )`);
  }

  const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const page = Math.max(1, Number(pagination.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(pagination.pageSize) || 20));
  const offset = (page - 1) * pageSize;

  const countSQL = `SELECT COUNT(*) FROM sintesis ${whereClause}`;
  const totalResult = await pool.query(countSQL, values);
  const total = Number(totalResult.rows[0].count) || 0;

  const dataSQL = `
    SELECT id, mesa, coordinacion, fecha, fecha_fin, sintesis_general, lineas_trabajo, cierre, status, created_at
    FROM sintesis
    ${whereClause}
    ORDER BY fecha DESC NULLS LAST, created_at DESC
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
  ensurePonenciaTable,
  ensureSintesisTable,
  testConnection,
  insertRegistration,
  insertPonencia,
  insertSintesis,
  updatePonencia,
  updateSintesis,
  softDeletePonencia,
  softDeleteSintesis,
  getDbTime,
  listRegistrations,
  listPonencias,
  listSintesis,
};
