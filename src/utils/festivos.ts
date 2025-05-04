import { getFestivosPersonalizados } from './festivosPersonalizados';

export interface Festivo {
  dia: number;
  mes: number;
  descripcion: string;
  tipo: 'nacional' | 'autonomico' | 'local';
  año?: number;
}

// Festivos fijos anuales
export const festivosFijos: Festivo[] = [
  { dia: 1, mes: 0, descripcion: 'Año Nuevo', tipo: 'nacional' },
  { dia: 6, mes: 0, descripcion: 'Epifanía del Señor', tipo: 'nacional' },
  { dia: 1, mes: 4, descripcion: 'Día del Trabajo', tipo: 'nacional' },
  { dia: 30, mes: 4, descripcion: 'Día de Canarias', tipo: 'autonomico' },
  { dia: 15, mes: 7, descripcion: 'Asunción de la Virgen', tipo: 'nacional' },
  { dia: 12, mes: 9, descripcion: 'Fiesta Nacional de España', tipo: 'nacional' },
  { dia: 1, mes: 10, descripcion: 'Todos los Santos', tipo: 'nacional' },
  { dia: 6, mes: 11, descripcion: 'Día de la Constitución', tipo: 'nacional' },
  { dia: 8, mes: 11, descripcion: 'Inmaculada Concepción', tipo: 'nacional' },
  { dia: 25, mes: 11, descripcion: 'Navidad', tipo: 'nacional' },
];

// Almacenar festivos eliminados en localStorage
const STORAGE_KEY_ELIMINADOS = 'festivosEliminados';

export const getFestivosEliminados = (): {dia: number, mes: number, año?: number}[] => {
  const stored = localStorage.getItem(STORAGE_KEY_ELIMINADOS);
  return stored ? JSON.parse(stored) : [];
};

export const eliminarFestivoFijo = (dia: number, mes: number, año?: number) => {
  const eliminados = getFestivosEliminados();
  eliminados.push({ dia, mes, año });
  localStorage.setItem(STORAGE_KEY_ELIMINADOS, JSON.stringify(eliminados));
};

export const restaurarFestivoFijo = (dia: number, mes: number, año?: number) => {
  const eliminados = getFestivosEliminados();
  const eliminadosFiltrados = eliminados.filter(f => 
    !(f.dia === dia && f.mes === mes && (!año || f.año === año))
  );
  localStorage.setItem(STORAGE_KEY_ELIMINADOS, JSON.stringify(eliminadosFiltrados));
};

// Función para calcular la Semana Santa
export const calcularSemanaSanta = (año: number): Festivo[] => {
  // Algoritmo de Meeus/Jones/Butcher para calcular la Pascua
  const a = año % 19;
  const b = Math.floor(año / 100);
  const c = año % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const dia = ((h + l - 7 * m + 114) % 31) + 1;

  return [
    {
      dia: dia - 2,
      mes,
      descripcion: 'Jueves Santo',
      tipo: 'autonomico',
      año
    },
    {
      dia: dia - 1,
      mes,
      descripcion: 'Viernes Santo',
      tipo: 'nacional',
      año
    }
  ];
};

// Función para obtener todos los festivos de un año
export const obtenerFestivos = (año: number): Festivo[] => {
  const festivosEliminados = getFestivosEliminados();
  const festivos = [...festivosFijos
    .map(f => ({ ...f, año }))
    .filter(f => !festivosEliminados.some(e => 
      e.dia === f.dia && e.mes === f.mes && (!e.año || e.año === año)
    ))];
  
  const semanaSanta = calcularSemanaSanta(año)
    .filter(f => !festivosEliminados.some(e => 
      e.dia === f.dia && e.mes === f.mes && (!e.año || e.año === año)
    ));
  
  const festivosPersonalizados = getFestivosPersonalizados()
    .filter(f => !f.año || f.año === año);
  
  return [...festivos, ...semanaSanta, ...festivosPersonalizados];
}; 