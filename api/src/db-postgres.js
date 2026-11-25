const { Pool } = require('pg');

const ESTADOS = ['pendiente', 'confirmada', 'atendida', 'cancelada'];

let pool;

function crearConfiguracion(config) {
  if (typeof config === 'object' && config !== null) {
    return config;
  }

  const connectionString = config || process.env.DATABASE_URL;
  if (connectionString) {
    const sslMode = String(process.env.PGSSLMODE || '').toLowerCase();
    const usarSsl = sslMode === 'require'
      || sslMode === 'verify-full'
      || sslMode === 'verify-ca'
      || String(process.env.NODE_ENV || '').toLowerCase() === 'production';

    return {
      connectionString,
      ssl: usarSsl ? { rejectUnauthorized: false } : false,
    };
  }

  return {
    host: process.env.PGHOST,
    port: process.env.PGPORT ? Number(process.env.PGPORT) : undefined,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
  };
}

async function iniciar(config = process.env.DATABASE_URL) {
  if (pool) {
    await cerrar();
  }

  pool = new Pool(crearConfiguracion(config));

  await pool.query(`
    CREATE TABLE IF NOT EXISTS reservas (
      id BIGSERIAL PRIMARY KEY,
      nombre TEXT NOT NULL,
      telefono TEXT,
      servicio TEXT NOT NULL,
      fecha TEXT,
      hora TEXT,
      notas TEXT,
      comprobante TEXT,
      estado TEXT NOT NULL DEFAULT 'pendiente'
        CHECK (estado IN ('pendiente', 'confirmada', 'atendida', 'cancelada'))
    )
  `);

  await pool.query('ALTER TABLE reservas ADD COLUMN IF NOT EXISTS comprobante TEXT');
  await pool.query(`
    ALTER TABLE reservas ADD COLUMN IF NOT EXISTS estado TEXT
  `);
  await pool.query(`
    UPDATE reservas
    SET estado = 'pendiente'
    WHERE estado IS NULL
       OR estado NOT IN ('pendiente', 'confirmada', 'atendida', 'cancelada')
  `);
  await pool.query(`
    ALTER TABLE reservas ALTER COLUMN estado SET DEFAULT 'pendiente'
  `);
  await pool.query(`
    ALTER TABLE reservas ALTER COLUMN estado SET NOT NULL
  `);
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS reservas_horario_activo
    ON reservas (fecha, hora)
    WHERE estado <> 'cancelada'
  `);
}

async function cerrar() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}

async function listar() {
  const resultado = await pool.query(`
    SELECT id, nombre, telefono, servicio, fecha, hora, notas, comprobante, estado
    FROM reservas
    ORDER BY fecha ASC NULLS LAST, hora ASC NULLS LAST
  `);
  return resultado.rows;
}

async function agregar({ nombre, telefono, servicio, fecha, hora, notas, comprobante }) {
  const cliente = await pool.connect();

  try {
    await cliente.query('BEGIN');

    await cliente.query(
      "SELECT pg_advisory_xact_lock(hashtext($1 || '|' || $2))",
      [fecha, hora],
    );

    const ocupada = await cliente.query(`
      SELECT id
      FROM reservas
      WHERE fecha = $1
        AND hora = $2
        AND estado <> 'cancelada'
      LIMIT 1
    `, [fecha, hora]);

    if (ocupada.rowCount > 0) {
      const error = new Error('El horario seleccionado ya está ocupado.');
      error.code = 'HORARIO_OCUPADO';
      throw error;
    }

    const resultado = await cliente.query(`
      INSERT INTO reservas
        (nombre, telefono, servicio, fecha, hora, notas, comprobante)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [
      nombre,
      telefono || null,
      servicio,
      fecha || null,
      hora || null,
      notas || null,
      comprobante || null,
    ]);

    await cliente.query('COMMIT');
    return Number(resultado.rows[0].id);
  } catch (error) {
    await cliente.query('ROLLBACK');

    if (error.code === '23505') {
      const ocupado = new Error('El horario seleccionado ya está ocupado.');
      ocupado.code = 'HORARIO_OCUPADO';
      throw ocupado;
    }

    throw error;
  } finally {
    cliente.release();
  }
}

async function eliminar(id) {
  const resultado = await pool.query(
    'DELETE FROM reservas WHERE id = $1',
    [id],
  );
  return resultado.rowCount;
}

async function cambiarEstado(id, estado) {
  if (!ESTADOS.includes(estado)) {
    throw new Error('Estado no válido');
  }

  const resultado = await pool.query(
    'UPDATE reservas SET estado = $1 WHERE id = $2',
    [estado, id],
  );
  return resultado.rowCount;
}

async function horariosOcupados(fecha) {
  const resultado = await pool.query(`
    SELECT hora
    FROM reservas
    WHERE fecha = $1
      AND estado <> 'cancelada'
    ORDER BY hora
  `, [fecha]);

  return resultado.rows.map(({ hora }) => hora);
}

module.exports = {
  ESTADOS,
  iniciar,
  cerrar,
  listar,
  agregar,
  eliminar,
  cambiarEstado,
  horariosOcupados,
};