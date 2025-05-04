export interface Turno {
  letra: string;
  nombre: string;
  color: string;
  horas: number;
}

export interface ConfiguracionTurnos {
  turnos: Turno[];
  secuencia: string;
  fechaInicio: string; // formato: YYYY-MM-DD
}

const STORAGE_KEY = 'configuracionTurnos';

export const getConfiguracionTurnos = (): ConfiguracionTurnos | null => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const guardarConfiguracionTurnos = (config: ConfiguracionTurnos) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
};

function normalizarFecha(fecha: Date): Date {
  // Normaliza la fecha a medianoche en UTC para evitar desfases por zona horaria
  return new Date(Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()));
}

export const calcularTurnoParaFecha = (fecha: Date, config: ConfiguracionTurnos): Turno | null => {
  if (!config.secuencia || !config.fechaInicio) return null;

  // Normalizar las fechas a medianoche UTC
  const fechaNormalizada = normalizarFecha(fecha);
  const [anio, mes, dia] = config.fechaInicio.split('-').map(Number);
  const fechaInicioNormalizada = new Date(Date.UTC(anio, mes - 1, dia));

  // Calcular la diferencia en días
  const diffMs = fechaNormalizada.getTime() - fechaInicioNormalizada.getTime();
  const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDias < 0) return null;

  const indiceSecuencia = diffDias % config.secuencia.length;
  const letraTurno = config.secuencia[indiceSecuencia];

  // LOGS DE DEPURACIÓN
  if (typeof window !== 'undefined') {
    console.log('[Turnos] Fecha consultada:', fecha.toISOString().slice(0, 10));
    console.log('[Turnos] Fecha inicio:', config.fechaInicio);
    console.log('[Turnos] diffDias:', diffDias);
    console.log('[Turnos] indiceSecuencia:', indiceSecuencia);
    console.log('[Turnos] letraTurno:', letraTurno);
  }

  return config.turnos.find(t => t.letra === letraTurno) || null;
}; 