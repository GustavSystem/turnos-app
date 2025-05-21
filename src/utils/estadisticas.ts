import { calcularTurnoParaFecha } from './turnosConfig';

export interface Estadisticas {
  horasRealesEsperadas: number;
  horasPorMes: Record<string, number>;
}

const STORAGE_KEY = 'estadisticasTurnos';

export const getEstadisticas = (): Estadisticas => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : {
    horasRealesEsperadas: 0,
    horasPorMes: {}
  };
};

export const guardarEstadisticas = (estadisticas: Estadisticas) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(estadisticas));
};

// Definimos la interfaz para las celdas con turnos manuales
interface CeldaData {
  contenido?: string;
  esFestivo?: boolean;
  descripcionFestivo?: string;
  color?: string;
}

// Función para obtener la clave de almacenamiento específica por año
const getCeldasStorageKey = (año: number) => `celdasTurnos_${año}`;

export const calcularHorasPorMes = (mes: number, año: number, configuracionTurnos: any): number => {
  if (!configuracionTurnos) return 0;
  
  // Obtener las celdas con turnos asignados manualmente
  const celdasGuardadas = localStorage.getItem(getCeldasStorageKey(año));
  const celdas: Record<string, CeldaData> = celdasGuardadas ? JSON.parse(celdasGuardadas) : {};
  
  // Nombres de los meses para construir las claves de las celdas
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  const diasEnMes = new Date(año, mes + 1, 0).getDate();
  let totalHoras = 0;

  for (let dia = 1; dia <= diasEnMes; dia++) {
    const fecha = new Date(año, mes, dia);
    const celdaId = `${meses[mes]}-${dia}`;
    
    // Verificar si hay un turno asignado manualmente para esta fecha
    if (celdas[celdaId] && celdas[celdaId].contenido) {
      // Usar el turno asignado manualmente
      const turnoLetra = celdas[celdaId].contenido;
      // Buscar las horas correspondientes a este turno
      const turnoConfig = configuracionTurnos.turnos.find((t: any) => t.letra === turnoLetra);
      if (turnoConfig) {
        totalHoras += turnoConfig.horas;
      }
    } else {
      // Si no hay asignación manual, usar el cálculo automático
      const turno = calcularTurnoParaFecha(fecha, configuracionTurnos);
      if (turno) {
        totalHoras += turno.horas;
      }
    }
  }

  return totalHoras;
};