import React, { useState, useEffect } from 'react';
import { getEstadisticas, guardarEstadisticas, calcularHorasPorMes } from '../utils/estadisticas';
import { getConfiguracionTurnos, calcularTurnoParaFecha, ConfiguracionTurnos } from '../utils/turnosConfig';

// Importamos el tipo CeldaData y la clave de almacenamiento
interface CeldaData {
  contenido?: string;
  esFestivo?: boolean;
  descripcionFestivo?: string;
  color?: string;
}

const CELDAS_STORAGE_KEY = 'celdasTurnos';

interface Props {
  onClose: () => void;
  año: number;
}

interface TurnoCount {
  letra: string;
  count: number;
  horas: number;
}

const EstadisticasTurnos: React.FC<Props> = ({ onClose, año }) => {
  const [estadisticas, setEstadisticas] = useState(getEstadisticas());
  const [configuracionTurnos, setConfiguracionTurnos] = useState<ConfiguracionTurnos | null>(getConfiguracionTurnos());
  const [horasTotalesAnio, setHorasTotalesAnio] = useState(0);
  const [turnosPorMes, setTurnosPorMes] = useState<Record<number, TurnoCount[]>>({});

  useEffect(() => {
    const config = getConfiguracionTurnos();
    setConfiguracionTurnos(config);
    
    if (!config) return;
    
    // Obtener las celdas con turnos asignados manualmente
    const celdasGuardadas = localStorage.getItem(CELDAS_STORAGE_KEY);
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
          // Usar el turno asignado manualmente
          turnoLetra = celdas[celdaId].contenido;
          // Buscar las horas correspondientes a este turno
          const turnoConfig = config.turnos.find(t => t.letra === turnoLetra);
          if (turnoConfig) {
            turnoHoras = turnoConfig.horas;
          }
        } else {
          // Si no hay asignación manual, usar el cálculo automático
          const turno = calcularTurnoParaFecha(fecha, config);
          if (turno) {
            turnoLetra = turno.letra;
            turnoHoras = turno.horas;
          }
        }
        
        // Si tenemos un turno (manual o automático), contabilizarlo
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
    setEstadisticas(prev => ({
      ...prev,
      horasPorMes: nuevasHorasPorMes
    }));
  }, [año]);

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

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[95%] max-w-6xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl sm:text-2xl font-bold">Estadísticas de Turnos {año}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto p-4 flex-1">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Horas Totales del Año</h3>
                <p className="text-2xl font-bold text-blue-600">{horasTotalesAnio} horas</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800 mb-2">Horas Reales Esperadas</h3>
                <input
                  type="number"
                  value={estadisticas.horasRealesEsperadas}
                  onChange={handleHorasRealesChange}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-purple-800 mb-2">Diferencia</h3>
                <p className="text-2xl font-bold text-purple-600">
                  {horasTotalesAnio - estadisticas.horasRealesEsperadas} horas
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Horas por Mes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {meses.map((mes, index) => (
                  <div key={mes} className="border rounded-lg p-4">
                    <h4 className="font-semibold mb-2">{mes}</h4>
                    <p className="text-2xl font-bold text-blue-600 mb-2">
                      {estadisticas.horasPorMes[index] || 0} horas
                    </p>
                    <div className="space-y-2">
                      {turnosPorMes[index]?.map(turno => (
                        <div key={turno.letra} className="flex justify-between items-center">
                          <span className="font-medium">Turno {turno.letra}</span>
                          <span className="text-gray-600">
                            {turno.count} días ({turno.horas * turno.count}h)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end">
          <button
            onClick={guardarEstadisticasHandler}
            className="btn btn-primary"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default EstadisticasTurnos;