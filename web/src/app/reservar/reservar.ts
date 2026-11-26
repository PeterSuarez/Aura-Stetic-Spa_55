import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { finalize } from 'rxjs';
import { ReservaApi } from '../reserva-api';

const fechaNoPasada: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const valor = String(control.value ?? '');
  if (!valor) return null;

  const partes = valor.split('-').map(Number);
  if (partes.length !== 3) return { fechaInvalida: true };

  const [anio, mes, dia] = partes;
  const seleccionada = new Date(anio, mes - 1, dia);

  if (
    seleccionada.getFullYear() !== anio ||
    seleccionada.getMonth() !== mes - 1 ||
    seleccionada.getDate() !== dia
  ) {
    return { fechaInvalida: true };
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  return seleccionada < hoy ? { fechaPasada: true } : null;
};

// Los mismos horarios que acepta la API (api/src/validaciones.js) y la app móvil.
const HORARIOS = ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

// El comprobante se reduce antes de enviarlo: la API acepta cuerpos de hasta 1 MB.
const LADO_MAXIMO = 1280;
const CALIDAD_JPEG = 0.7;
const TAMANO_MAXIMO = 900_000; // caracteres del data URL

function leerComoDataUrl(archivo: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(String(lector.result));
    lector.onerror = () => reject(lector.error);
    lector.readAsDataURL(archivo);
  });
}

// Redimensiona la imagen y la convierte a JPEG para que pese poco.
async function comprimirImagen(archivo: File): Promise<string> {
  const original = await leerComoDataUrl(archivo);
  const imagen = new Image();
  await new Promise<void>((resolve, reject) => {
    imagen.onload = () => resolve();
    imagen.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    imagen.src = original;
  });

  const escala = Math.min(1, LADO_MAXIMO / Math.max(imagen.width, imagen.height));
  const lienzo = document.createElement('canvas');
  lienzo.width = Math.round(imagen.width * escala);
  lienzo.height = Math.round(imagen.height * escala);
  lienzo.getContext('2d')?.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
  return lienzo.toDataURL('image/jpeg', CALIDAD_JPEG);
}

function fechaLocalHoy(): string {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${hoy.getFullYear()}-${mes}-${dia}`;
}

@Component({
  selector: 'app-reservar',
  imports: [ReactiveFormsModule],
  templateUrl: './reservar.html',
  styleUrl: './reservar.css',
})
export class ReservarComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ReservaApi);
  private readonly ruta = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly minFecha = fechaLocalHoy();
  protected readonly horarios = HORARIOS;
  protected readonly ocupados = signal<string[]>([]);
  protected readonly cargandoHorarios = signal(false);
  protected readonly errorComprobante = signal('');
  protected readonly guardando = signal(false);
  protected readonly mensaje = signal('');
  protected readonly esError = signal(false);

  protected readonly formulario = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    telefono: ['', [Validators.required, Validators.pattern(/^0\d{9}$/)]],
    servicio: ['', Validators.required],
    fecha: ['', [Validators.required, fechaNoPasada]],
    hora: ['', Validators.required],
    notas: ['', Validators.maxLength(200)],
    comprobante: ['', Validators.required],
  });

  ngOnInit(): void {
    const servicio = this.ruta.snapshot.queryParamMap.get('servicio');

    if (servicio) {
      this.formulario.controls.servicio.setValue(servicio);
    }

    // Al cambiar el día se consultan los horarios ocupados en la API.
    this.formulario.controls.fecha.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.cargarOcupados());
  }

  protected estaOcupado(hora: string): boolean {
    return this.ocupados().includes(hora);
  }

  private cargarOcupados(): void {
    const control = this.formulario.controls.fecha;
    this.ocupados.set([]);
    if (!control.value || control.invalid) return;

    this.cargandoHorarios.set(true);
    this.api.disponibilidad(control.value)
      .pipe(finalize(() => this.cargandoHorarios.set(false)))
      .subscribe({
        next: ({ ocupados }) => {
          this.ocupados.set(ocupados);
          // Si la hora elegida quedó ocupada en el nuevo día, se limpia.
          const hora = this.formulario.controls.hora;
          if (ocupados.includes(hora.value)) hora.setValue('');
        },
        error: () => this.mostrar('No se pudieron consultar los horarios disponibles.', true),
      });
  }

  protected async elegirComprobante(evento: Event): Promise<void> {
    const entrada = evento.target as HTMLInputElement;
    const archivo = entrada.files?.[0];
    const control = this.formulario.controls.comprobante;
    control.markAsTouched();
    this.errorComprobante.set('');
    if (!archivo) return;

    if (!archivo.type.startsWith('image/')) {
      control.setValue('');
      this.errorComprobante.set('El comprobante debe ser una imagen (foto o captura).');
      return;
    }

    try {
      const dataUrl = await comprimirImagen(archivo);
      if (dataUrl.length > TAMANO_MAXIMO) {
        control.setValue('');
        this.errorComprobante.set('La imagen es demasiado grande. Prueba con una captura más pequeña.');
        return;
      }
      control.setValue(dataUrl);
    } catch {
      control.setValue('');
      this.errorComprobante.set('No se pudo leer la imagen. Prueba con otra.');
    }
  }

  protected quitarComprobante(entrada: HTMLInputElement): void {
    entrada.value = '';
    this.formulario.controls.comprobante.setValue('');
  }

  protected resumen(): string {
    const datos = this.formulario.getRawValue();
    const lineas = ['Hola Aura Stetic Spa, quisiera reservar una cita.', ''];

    if (datos.nombre.trim()) lineas.push(`Nombre: ${datos.nombre.trim()}`);
    if (datos.servicio) lineas.push(`Tratamiento: ${datos.servicio}`);

    const cuando: string[] = [];
    if (datos.fecha) cuando.push(this.fechaBonita(datos.fecha));
    if (datos.hora) cuando.push(`a las ${this.horaBonita(datos.hora)}`);
    if (cuando.length) lineas.push(`Preferiría: ${cuando.join(' ')}`);

    if (datos.telefono.trim()) lineas.push(`Teléfono: ${datos.telefono.trim()}`);
    if (datos.notas.trim()) lineas.push(`Nota: ${datos.notas.trim()}`);

    return datos.nombre.trim() || datos.servicio ? lineas.join('\n') : '';
  }

  protected guardar(): void {
    this.formulario.markAllAsTouched();

    if (this.formulario.invalid) {
      this.mostrar('Revisa los campos marcados antes de continuar.', true);
      return;
    }

    const datos = this.formulario.getRawValue();
    if (this.estaOcupado(datos.hora)) {
      this.mostrar('Ese horario ya está ocupado. Elige otro.', true);
      return;
    }
    this.guardando.set(true);
    this.mostrar('Guardando tu solicitud…', false);

    this.api.agregar(datos)
      .pipe(finalize(() => this.guardando.set(false)))
      .subscribe({
        next: () => {
          const telefonoSpa = '593999406511';
          const url = `https://wa.me/${telefonoSpa}?text=${encodeURIComponent(this.resumen())}`;
          window.location.assign(url);
        },
error: (error: HttpErrorResponse) => {
  console.error('Error al guardar la reserva:', error.status, error.error);
  // Otra persona pudo reservar el mismo horario mientras se llenaba el formulario.
  if (error.status === 409) this.cargarOcupados();

  const errores = error.error?.errores;
  const detalle = Array.isArray(errores)
    ? errores.join(' ')
    : error.error?.message ?? error.message;

  this.mostrar(
    error.status === 0
      ? 'No se pudo conectar con la API.'
      : `La API respondió con error ${error.status}: ${detalle}`,
    true,
  );
},
      });
  }

  private fechaBonita(valor: string): string {
    const [anio, mes, dia] = valor.split('-').map(Number);
    const fecha = new Date(anio, mes - 1, dia);

    return new Intl.DateTimeFormat('es-EC', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(fecha);
  }

  private horaBonita(valor: string): string {
    const [hora, minutos] = valor.split(':').map(Number);
    const sufijo = hora < 12 ? 'am' : 'pm';
    const hora12 = hora % 12 || 12;

    return `${hora12}:${String(minutos).padStart(2, '0')} ${sufijo}`;
  }

  private mostrar(texto: string, error: boolean): void {
    this.mensaje.set(texto);
    this.esError.set(error);
  }
}