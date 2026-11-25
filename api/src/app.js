const express = require('express');
const cors = require('cors');
const db = require('./db');
const { validarReserva } = require('./validaciones');

const app = express();
const origenesPermitidos = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((origen) => origen.trim()).filter(Boolean)
  : ['http://localhost:4200', 'http://localhost:8081', 'http://localhost:8082'];

app.use(cors({
  origin: origenesPermitidos,
}));

app.use(express.json({ limit: '1mb' }));

app.get('/api/reservas/disponibilidad', async (req, res) => {
  const fecha = String(req.query.fecha ?? '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return res.status(400).json({ errores: ['La fecha no es válida.'] });
  }

  try {
    return res.json({ ocupados: await db.horariosOcupados(fecha) });
  } catch (error) {
    console.error('Error al consultar disponibilidad:', error);
    return res.status(500).json({ errores: ['No se pudo consultar la disponibilidad.'] });
  }
});

app.get('/api/reservas', async (_req, res) => {
  try {
    res.json(await db.listar());
  } catch (error) {
    console.error('Error al listar reservas:', error);
    res.status(500).json({ errores: ['No se pudieron cargar las reservas.'] });
  }
});

app.post('/api/reservas', async (req, res) => {
  const { valido, errores, datos } = validarReserva(req.body);

  if (!valido) {
    return res.status(400).json({ errores });
  }

  try {
    const id = await db.agregar(datos);
    return res.status(201).json({
      id: Number(id),
      ...datos,
      estado: 'pendiente',
    });
  } catch (error) {
    if (error.code === 'HORARIO_OCUPADO') {
      return res.status(409).json({ errores: [error.message] });
    }
    console.error('Error al guardar reserva:', error);
    return res.status(500).json({ errores: ['No se pudo guardar la reserva.'] });
  }
});

app.delete('/api/reservas/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ errores: ['El ID no es válido.'] });
  }

  try {
    const eliminadas = await db.eliminar(id);

    if (eliminadas === 0) {
      return res.status(404).json({ errores: ['Reserva no encontrada.'] });
    }

    return res.status(204).end();
  } catch (error) {
    console.error('Error al eliminar reserva:', error);
    return res.status(500).json({ errores: ['No se pudo eliminar la reserva.'] });
  }
});

app.put('/api/reservas/:id/estado', async (req, res) => {
  const id = Number(req.params.id);
  const { estado } = req.body;

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ errores: ['El ID no es válido.'] });
  }

  if (!db.ESTADOS.includes(estado)) {
    return res.status(400).json({ errores: ['Estado no válido.'] });
  }

  try {
    const actualizadas = await db.cambiarEstado(id, estado);

    if (actualizadas === 0) {
      return res.status(404).json({ errores: ['Reserva no encontrada.'] });
    }

    return res.json({ mensaje: 'Estado actualizado correctamente.' });
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    return res.status(500).json({ errores: ['No se pudo cambiar el estado.'] });
  }
});
// GET /api/salud → Render comprueba que la API está activa (Health Check Path)
app.get('/api/salud', (_req, res) => {
  res.status(200).json({ estado: 'ok', version: '1.1' });
});

module.exports = app;