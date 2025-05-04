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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white p-6 rounded-lg w-[90%] max-w-4xl my-8 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Configuración de Turnos</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Turnos</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <input
                type="text"
                placeholder="Letra"
                value={nuevoTurno.letra}
                onChange={e => setNuevoTurno({...nuevoTurno, letra: e.target.value})}
                className="border p-2 rounded w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Nombre"
                value={nuevoTurno.nombre}
                onChange={e => setNuevoTurno({...nuevoTurno, nombre: e.target.value})}
                className="border p-2 rounded w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="color"
                value={nuevoTurno.color}
                onChange={e => setNuevoTurno({...nuevoTurno, color: e.target.value})}
                className="border p-2 rounded w-full h-[42px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="number"
                placeholder="Horas"
                value={nuevoTurno.horas}
                onChange={e => setNuevoTurno({...nuevoTurno, horas: parseInt(e.target.value) || 0})}
                className="border p-2 rounded w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={agregarTurno}
              className="btn btn-primary mb-4"
            >
              Agregar Turno
            </button>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Turnos Configurados</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {turnos.map((turno) => (
                <div key={turno.letra} className="border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded-full" 
                      style={{ backgroundColor: turno.color }}
                    />
                    <span className="font-medium">{turno.letra} - {turno.nombre}</span>
                    <span className="text-gray-500">({turno.horas}h)</span>
                  </div>
                  <button
                    onClick={() => eliminarTurno(turno.letra)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Secuencia de Turnos</h3>
            <input
              type="text"
              value={secuencia}
              onChange={e => setSecuencia(e.target.value)}
              placeholder="Ej: A,B,C,D"
              className="border p-2 rounded w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Fecha de Inicio</h3>
            <input
              type="date"
              value={fechaInicio}
              onChange={e => setFechaInicio(e.target.value)}
              className="border p-2 rounded w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end gap-4">
            <button
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancelar
            </button>
            <button
              onClick={guardarConfiguracion}
              className="btn btn-primary"
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