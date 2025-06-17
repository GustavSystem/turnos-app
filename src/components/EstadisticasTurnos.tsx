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

  const [estadisticas, setEstadisticas] = useState<Estadisticas>(getEstadisticas());
  const [configuracionTurnos, setConfiguracionTurnos] = useState<ConfiguracionTurnos | null>(getConfiguracionTurnos());
  const [error, setError] = useState<string | null>(null);
  const [horasTotalesAnio, setHorasTotalesAnio] = useState(0);
  const [turnosPorMes, setTurnosPorMes] = useState<Record<number, TurnoCount[]>>({});
  const [horasPorMes, setHorasPorMes] = useState<Record<string, number>>({});

  useEffect(() => {
    try {
      if (!configuracionTurnos) {
        setError('No se encontró la configuración de turnos');
        return;
      }
      
      const celdasGuardadas = localStorage.getItem(getCeldasStorageKey(año));
      const celdas: Record<string, CeldaData> = celdasGuardadas ? JSON.parse(celdasGuardadas) : {};
      
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
      
      setHorasTotalesAnio(totalAnio);
      setTurnosPorMes(nuevosTurnosPorMes);
      setHorasPorMes(nuevasHorasPorMes);
      setError(null);
    } catch (err) {
      setError('Error al calcular las estadísticas');
      console.error('Error en cálculo de estadísticas:', err);
    }
  }, [año, configuracionTurnos, activeFestivos]);

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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-1 overflow-y-auto">
      <div className="bg-white p-1 rounded-lg w-full max-w-xl my-1 shadow-xl max-h-[98vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex flex-col gap-1 border-b pb-1">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-gray-800 m-0 p-0">Estadísticas {año}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl leading-none p-1"
              aria-label="Cerrar"
            >
              &times;
            </button>
          </div>
          {/* Stats Cards compactas y más estrechas */}
          <div className="flex flex-row gap-1 mt-0 mb-0">
            <div className="bg-blue-50 p-1 rounded shadow-sm text-center flex-1 min-w-[70px] max-w-[90px]">
              <div className="text-[10px] font-semibold text-blue-800 uppercase">Totales</div>
              <div className="text-sm font-bold text-blue-600">{horasTotalesAnio}h</div>
            </div>
            <div className="bg-green-50 p-1 rounded shadow-sm text-center flex-1 min-w-[70px] max-w-[90px]">
              <div className="text-[10px] font-semibold text-green-800 uppercase">Reales</div>
              <input
                type="number"
                value={estadisticas.horasRealesEsperadas}
                onChange={handleHorasRealesChange}
                className="w-full p-1 border border-gray-300 rounded text-center text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-700"
                style={{minWidth: 0}}
              />
            </div>
            <div className="bg-purple-50 p-1 rounded shadow-sm text-center flex-1 min-w-[70px] max-w-[90px]">
              <div className="text-[10px] font-semibold text-purple-800 uppercase">Diferencia</div>
              <div className="text-sm font-bold text-purple-600">
                {horasTotalesAnio - estadisticas.horasRealesEsperadas}h
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-1">
          {error ? (
            <div className="bg-red-50 p-2 rounded-lg text-red-700 text-center text-sm">
              {error}
            </div>
          ) : (
            <div className="space-y-1">
              {/* Monthly Stats compacta */}
              <div>
                <div className="text-xs font-semibold mb-0.5 text-gray-800">Horas por Mes</div>
                <div className="calendario-scroll">
                  <table className="tabla-calendario w-full text-xs">
                    <tbody>
                      {meses.map((mes, index) => (
                        <tr key={mes} className="border-b last:border-b-0">
                          <td className="py-0.5 pr-1 font-semibold text-blue-700 whitespace-nowrap min-w-[60px] align-middle">{mes}</td>
                          <td className="py-0.5 pr-1 text-right text-gray-700 whitespace-nowrap min-w-[28px] align-middle">{horasPorMes[index] || 0}h</td>
                          <td className="py-0.5 align-middle">
                            <div className="flex flex-row flex-wrap gap-x-1 gap-y-0 items-center whitespace-nowrap">
                              {turnosPorMes[index]?.map(turno => (
                                <span key={turno.letra} className="inline-flex items-center bg-gray-100 px-1 rounded text-[10px] mr-0.5">
                                  <span className="font-medium text-gray-700">{turno.letra}:</span>
                                  <span className="text-gray-600 ml-0.5">{turno.count}d({turno.horas * turno.count}h)</span>
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EstadisticasTurnos;
