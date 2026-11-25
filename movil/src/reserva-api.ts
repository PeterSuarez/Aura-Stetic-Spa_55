// movil/src/reserva-api.ts
const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  'https://aura-stetic-spa-55.onrender.com/api/reservas';

export type EstadoReserva =
  | 'pendiente'
  | 'confirmada'
  | 'atendida'
  | 'cancelada';

export interface Reserva {
  id: number;
  nombre: string;
  telefono: string | null;
  servicio: string;
  fecha: string | null;
  hora: string | null;
  notas: string | null;
  estado: EstadoReserva;
}

export interface NuevaReserva {
  nombre: string;
  telefono: string;
  servicio: string;
  fecha: string;
  hora: string;
  notas: string;
}

export async function listarReservas(): Promise<Reserva[]> {
  const res = await fetch(API_URL);
  if (!res.ok) throw new Error('No se pudieron cargar las reservas');
  return res.json();
}

export async function agregarReserva(datos: NuevaReserva): Promise<Reserva> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...datos, comprobante: 'pendiente' }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.errores?.join(', ') ?? 'No se pudo guardar la reserva');
  }
  return res.json();
}

export async function eliminarReserva(id: number): Promise<void> {
  const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
  if (!res.ok && res.status !== 204) throw new Error('No se pudo eliminar');
}

export async function cambiarEstadoReserva(
  id: number,
  estado: EstadoReserva,
): Promise<void> {
  const res = await fetch(`${API_URL}/${id}/estado`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado }),
  });
  if (!res.ok) throw new Error('No se pudo cambiar el estado');
}