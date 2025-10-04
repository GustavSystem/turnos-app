import React, { useState, useEffect } from 'react';
import type { Turno, ConfiguracionTurnos } from '../utils/turnosConfig';
import { guardarConfiguracionTurnos, getConfiguracionTurnos } from '../utils/turnosConfig';

interface Props {
  onClose: () => void;
  onSave: () => void;
}

const ConfiguracionTurnos: React.FC<Props> = ({ onClose, onSave }) => {
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [nuevoTurno, setNuevoTurno] = useState<Turno>({
    letra: '',
    nombre: '',
    color: '#ffffff',
    horas: 0
  });
  const [secuencia, setSecuencia] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');

  useEffect(() => {
    const config = getConfiguracionTurnos();
    if (config) {
      setTurnos(config.turnos);
      setSecuencia(config.secuencia);
      setFechaInicio(config.fechaInicio);
    }
  }, []);

  const agregarTurno = () => {
    if (!nuevoTurno.letra || !nuevoTurno.nombre) return;
    
    setTurnos([...turnos, nuevoTurno]);
    setNuevoTurno({
      letra: '',
      nombre: '',
      color: '#ffffff',
      horas: 0
    });
  };

  const eliminarTurno = (letra: string) => {
    setTurnos(turnos.filter(t => t.letra !== letra));
  };

  const guardarConfiguracion = () => {
    const config: ConfiguracionTurnos = {
      turnos,
      secuencia,
      fechaInicio
    };
    guardarConfiguracionTurnos(config);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-4 sm:p-6 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex justify-between items-center mb-4 border-b pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Configuración de Turnos</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
            aria-label="Cerrar"
          >
            &times;
          </button>
        </div>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Agregar Nuevo Turno</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <input
                type="text"
                placeholder="Letra"
                value={nuevoTurno.letra}
                onChange={e => setNuevoTurno({...nuevoTurno, letra: e.target.value})}
                className="border border-gray-300 p-2 rounded w-full text-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="Nombre"
                value={nuevoTurno.nombre}
                onChange={e => setNuevoTurno({...nuevoTurno, nombre: e.target.value})}
                className="border border-gray-300 p-2 rounded w-full text-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="color"
                value={nuevoTurno.color}
                onChange={e => setNuevoTurno({...nuevoTurno, color: e.target.value})}
                className="border border-gray-300 p-1 rounded w-full h-[42px] focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="number"
                placeholder="Horas"
                value={nuevoTurno.horas}
                onChange={e => setNuevoTurno({...nuevoTurno, horas: parseInt(e.target.value) || 0})}
                className="border border-gray-300 p-2 rounded w-full text-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={agregarTurno}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 text-sm"
            >
              Agregar Turno
            </button>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Turnos Configurados</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {turnos.map((turno) => (
                <div key={turno.letra} className="border border-gray-200 rounded-lg p-3 flex items-center justify-between bg-gray-50">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded-full"
                      style={{ backgroundColor: turno.color }}
                    />
                    <span className="font-medium text-sm text-gray-700">{turno.letra} - {turno.nombre}</span>
                    <span className="text-gray-500 text-sm">({turno.horas}h)</span>
                  </div>
                  <button
                    onClick={() => eliminarTurno(turno.letra)}
                    className="text-red-500 hover:text-red-700 text-lg leading-none"
                    aria-label={`Eliminar turno ${turno.letra}`}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Secuencia de Turnos</h3>
            <input
              type="text"
              value={secuencia}
              onChange={e => setSecuencia(e.target.value)}
              placeholder="Ej: A,B,C,D"
              className="border border-gray-300 p-2 rounded w-full text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Fecha de Inicio</h3>
            <input
              type="date"
              value={fechaInicio}
              onChange={e => setFechaInicio(e.target.value)}
              className="border border-gray-300 p-2 rounded w-full text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 border-t pt-4">
            <button
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={guardarConfiguracion}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 text-sm"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionTurnos;