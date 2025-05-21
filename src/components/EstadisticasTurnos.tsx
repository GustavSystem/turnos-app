import React, { useState, useEffect, useMemo } from 'react';
import { getEstadisticas, guardarEstadisticas, calcularHorasPorMes, Estadisticas } from '../utils/estadisticas';
import { getConfiguracionTurnos, calcularTurnoParaFecha, ConfiguracionTurnos, Turno } from '../utils/turnosConfig';
import { Festivo } from '../utils/festivos';

// Importamos el tipo CeldaData y la clave de almacenamiento
interface CeldaData {
  contenido?: string;
  esFestivo?: boolean;
  descripcionFestivo?: string;
  color?: string;
}

// Función para obtener la clave de almacenamiento específica por año
const getCeldasStorageKey = (año: number) => `celdasTurnos_${año}`;

interface Props {
  onClose: () => void;
  año: number;
  activeFestivos: Festivo[];
}

interface TurnoCount {
  letra: string;
  count: number;
  horas: number;
}

const EstadisticasTurnos: React.FC<Props> = ({ onClose, año, activeFestivos }) => {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const [estadisticas, setEstadisticas] = useState(getEstadisticas());
  const [configuracionTurnos, setConfiguracionTurnos] = useState<ConfiguracionTurnos | null>(getConfiguracionTurnos());
  
  // Memoize the statistics calculations
  const { horasTotalesAnio, turnosPorMes, horasPorMes } = useMemo(() => {
    if (!configuracionTurnos) return { horasTotalesAnio: 0, turnosPorMes: {}, horasPorMes: {} };
    
    // Obtener las celdas con turnos asignados manualmente
    const celdasGuardadas = localStorage.getItem(getCeldasStorageKey(año));
    const celdas: Record<string, CeldaData> = celdasGuardadas ? JSON.parse(celdasGuardadas) : {};
    
    // Calcular horas y turnos por mes
    const nuevasHorasPorMes: Record<string, number> = {};
    const nuevosTurnosPorMes: Record<number, TurnoCount[]> = {};
    let totalAnio = 0;
    
    for (let mes = 0; mes < 12; mes++) {
      const diasEnMes = new Date(año, mes + 1, 0).getDate();
      const turnosCount: Record<string, TurnoCount> = {};
      let totalHorasMes = 0;

      for (let dia = 1; dia <= diasEnMes; dia++) {
        const fecha = new Date(año, mes, dia);
        const celdaId = `${meses[mes]}-${dia}`;
        let turnoLetra: string | undefined;
        let turnoHoras: number = 0;
        
        // Verificar si hay un turno asignado manualmente para esta fecha
        if (celdas[celdaId] && celdas[celdaId].contenido) {
          turnoLetra = celdas[celdaId].contenido;
          const turnoConfig = configuracionTurnos.turnos.find(t => t.letra === turnoLetra);
          if (turnoConfig) {
            turnoHoras = turnoConfig.horas;
          }
        } else {
          const turno = calcularTurnoParaFecha(fecha, configuracionTurnos);
          if (turno) {
            turnoLetra = turno.letra;
            turnoHoras = turno.horas;
          }
        }
        
        if (turnoLetra) {
          if (!turnosCount[turnoLetra]) {
            turnosCount[turnoLetra] = {
              letra: turnoLetra,
              count: 0,
              horas: turnoHoras
            };
          }
          turnosCount[turnoLetra].count++;
          totalHorasMes += turnoHoras;
        }
      }

      nuevasHorasPorMes[mes] = totalHorasMes;
      nuevosTurnosPorMes[mes] = Object.values(turnosCount);
      totalAnio += totalHorasMes;
    }
    
    return {
      horasTotalesAnio: totalAnio,
      turnosPorMes: nuevosTurnosPorMes,
      horasPorMes: nuevasHorasPorMes
    };
  }, [año, configuracionTurnos, activeFestivos, meses]);

  // Update estadisticas when horasPorMes changes
  useEffect(() => {
    setEstadisticas(prev => ({
      ...prev,
      horasPorMes
    }));
  }, [horasPorMes]);

  const handleHorasRealesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    setEstadisticas(prev => ({
      ...prev,
      horasRealesEsperadas: value
    }));
  };

  const guardarEstadisticasHandler = () => {
    guardarEstadisticas(estadisticas);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Estadísticas de Turnos {año}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            aria-label="Cerrar"
          >
            &times;
          </button>
        </div>

        <div className="overflow-y-auto p-4 flex-1">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-blue-50 p-3 rounded-lg shadow-sm text-center">
                <h3 className="text-xs font-semibold text-blue-800 mb-1 uppercase">Horas Totales Año</h3>
                <p className="text-xl font-bold text-blue-600">{horasTotalesAnio}h</p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg shadow-sm text-center">
                <h3 className="text-xs font-semibold text-green-800 mb-1 uppercase">Horas Reales Esperadas</h3>
                <input
                  type="number"
                  value={estadisticas.horasRealesEsperadas}
                  onChange={handleHorasRealesChange}
                  className="w-full p-1 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-700"
                />
              </div>
              <div className="bg-purple-50 p-3 rounded-lg shadow-sm text-center">
                <h3 className="text-xs font-semibold text-purple-800 mb-1 uppercase">Diferencia</h3>
                <p className="text-xl font-bold text-purple-600">
                  {horasTotalesAnio - estadisticas.horasRealesEsperadas}h
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Horas por Mes</h3>
              <div className="space-y-4">
                {meses.map((mes, index) => (
                  <div key={mes} className="pb-4 border-b border-gray-200 last:border-b-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 overflow-x-auto pb-1">
                      <h4 className="font-semibold text-blue-700 flex-shrink-0 text-base">{mes}: {horasPorMes[index] || 0}h</h4>
                      <div className="flex gap-3 flex-grow items-center">
                        <span className="font-medium text-sm text-gray-700 flex-shrink-0">Turnos:</span>
                        {turnosPorMes[index]?.map(turno => (
                          <div key={turno.letra} className="flex items-center flex-shrink-0 bg-gray-100 px-2 py-1 rounded">
                            <span className="font-medium text-xs text-gray-700">{turno.letra}:</span>
                            <span className="text-gray-600 text-xs ml-1 whitespace-nowrap">
                              {turno.count} días ({turno.horas * turno.count}h)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={guardarEstadisticasHandler}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 sm:py-1 sm:px-3 sm:text-sm"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default EstadisticasTurnos;
