const express = require('express');
const cors = require('cors');
const db = require('./db');
const { validarReserva } = require('./validaciones');

const app = express();


app.use(cors({
  origin: ['http://localhost:4200', 'http://localhost:8081', 'http://localhost:8082'],
}));

app.use(express.json());

app.get('/api/reservas', (_req, res) => {
  try {
    res.json(db.listar());
  } catch (error) {
    console.error('Error al listar reservas:', error);
    res.status(500).json({ errores: ['No se pudieron cargar las reservas.'] });
  }
});

app.post('/api/reservas', (req, res) => {
  const { valido, errores, datos } = validarReserva(req.body);

  if (!valido) {
    return res.status(400).json({ errores });
  }

  try {
    const id = db.agregar(datos);
    return res.status(201).json({
      id: Number(id),
      ...datos,
      estado: 'pendiente',
    });
  } catch (error) {
    console.error('Error al guardar reserva:', error);
    return res.status(500).json({ errores: ['No se pudo guardar la reserva.'] });
  }
});

app.delete('/api/reservas/:id', (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ errores: ['El ID no es válido.'] });
  }

  try {
    const eliminadas = db.eliminar(id);

    if (eliminadas === 0) {
      return res.status(404).json({ errores: ['Reserva no encontrada.'] });
    }

    return res.status(204).end();
  } catch (error) {
    console.error('Error al eliminar reserva:', error);
    return res.status(500).json({ errores: ['No se pudo eliminar la reserva.'] });
  }
});

app.put('/api/reservas/:id/estado', (req, res) => {
  const id = Number(req.params.id);
  const { estado } = req.body;

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ errores: ['El ID no es válido.'] });
  }

  if (!db.ESTADOS.includes(estado)) {
    return res.status(400).json({ errores: ['Estado no válido.'] });
  }

  try {
    const actualizadas = db.cambiarEstado(id, estado);

    if (actualizadas === 0) {
      return res.status(404).json({ errores: ['Reserva no encontrada.'] });
    }

    return res.json({ mensaje: 'Estado actualizado correctamente.' });
  } catch (error) {
    console.error('Error al cambiar estado:', error);
    return res.status(500).json({ errores: ['No se pudo cambiar el estado.'] });
  }
});

module.exports = app;