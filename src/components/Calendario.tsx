import React, { useState } from 'react';

// Asumimos que tenemos tipos definidos para Festivo y Turno
// import { Festivo } from '../types'; 
// import { Turno } from '../types';

// Podríamos necesitar funciones de los utils
import { agregarFestivo, eliminarFestivo, getFestivosPersonalizados } from '../utils/festivosPersonalizados';
// import { obtenerFestivos } from '../utils/festivos';

// Definir tipo FestivoPersonalizado si no está globalmente disponible
interface FestivoPersonalizado {
  dia: number;
  mes: number;
  descripcion: string;
  tipo: 'nacional' | 'autonomico' | 'local';
  año?: number;
}

interface CeldaSeleccionada {
  mes: string;
  dia: number;
}

const Calendario: React.FC = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [celdaSeleccionada, setCeldaSeleccionada] = useState<CeldaSeleccionada | null>(null);

  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Mapa para convertir nombre de mes a número
  const mesNumero: { [key: string]: number } = {
    'Enero': 1, 'Febrero': 2, 'Marzo': 3, 'Abril': 4, 'Mayo': 5, 'Junio': 6,
    'Julio': 7, 'Agosto': 8, 'Septiembre': 9, 'Octubre': 10, 'Noviembre': 11, 'Diciembre': 12
  };

  // Simplificado: Debería calcular los días reales de cada mes
  const diasDelMes = Array.from({ length: 31 }, (_, i) => i + 1); 

  const handleCeldaClick = (mes: string, dia: number) => {
    setCeldaSeleccionada({ mes, dia });
    setModalVisible(true);
    console.log(`Celda clickeada: ${dia} de ${mes}`); // Para depuración
  };

  const handleCerrarModal = () => {
    setModalVisible(false);
    setCeldaSeleccionada(null);
  };

  // --- Inicio: Componente Modal (simplificado) ---
  const EditarCeldaModal: React.FC<{ celda: CeldaSeleccionada | null; onClose: () => void }> = ({ celda, onClose }) => {
    // Estado local para futuros inputs
    const [descripcionFestivo, setDescripcionFestivo] = useState('');
    const [tipoFestivo, setTipoFestivo] = useState<'nacional' | 'autonomico' | 'local'>('local');

    if (!celda) return null;

    const mesNum = mesNumero[celda.mes]; // Obtener número del mes

    const handleAnadirFestivo = () => {
      if (!mesNum) {
        console.error("Mes inválido:", celda.mes);
        return;
      }
      // TODO: Obtener descripción y tipo de inputs cuando se añadan
      const nuevoFestivo: FestivoPersonalizado = {
        dia: celda.dia,
        mes: mesNum,
        descripcion: `Festivo ${celda.dia}/${mesNum}`, // Descripción de ejemplo
        tipo: 'local' // Tipo de ejemplo
      };
      console.log(`Intentando añadir festivo:`, nuevoFestivo);
      agregarFestivo(nuevoFestivo);
      // Podríamos añadir feedback al usuario aquí
      onClose(); // Cerrar modal después de la acción
    };

    // Renombrado de handleEditarFestivo a handleEliminarFestivo
    const handleEliminarFestivo = () => {
       if (!mesNum) {
        console.error("Mes inválido:", celda.mes);
        return;
      }
      // TODO: Podríamos querer confirmar antes de eliminar
      console.log(`Intentando eliminar festivo para ${celda.dia}/${mesNum}`);
      eliminarFestivo(celda.dia, mesNum);
      // Podríamos añadir feedback al usuario aquí
      onClose(); // Cerrar modal después de la acción
    };
    
    // Otros ajustes podrían ir aquí (ej. asignar turno)
    const handleAsignarTurno = (turno: string) => {
         console.log(`Asignar turno ${turno} a ${celda.dia} de ${celda.mes}`);
         // Lógica para asignar turno
         onClose();
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded shadow-lg w-96">
          <h2 className="text-xl font-semibold mb-4">Editar Celda: {celda.dia} de {celda.mes}</h2>
          
          {/* Ajustes Visibles */}
          <div className="space-y-4">
            {/* Sección Festivos */}
            <fieldset className="border p-3 rounded">
                <legend className="text-lg font-medium px-1">Festivos</legend>
                 <button 
                    onClick={handleAnadirFestivo}
                    className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-2"
                 >
                    Añadir Festivo
                 </button>
                 {/* TODO: Añadir inputs para descripción y tipo aquí */}
                 <button
                    onClick={handleEliminarFestivo} // Cambiado a handleEliminarFestivo
                    className="w-full bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded" // Cambiado color a rojo para eliminar
                 >
                    Eliminar Festivo
                 </button>
                 {/* Aquí podríamos mostrar info del festivo si existe */}
            </fieldset>

            {/* Sección Turnos (Ejemplo) */}
             <fieldset className="border p-3 rounded">
                <legend className="text-lg font-medium px-1">Turnos</legend>
                {/* Ejemplo: botones para asignar turnos */}
                <button onClick={() => handleAsignarTurno('Mañana')} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded mb-2">Asignar Mañana</button>
                <button onClick={() => handleAsignarTurno('Tarde')} className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded mb-2">Asignar Tarde</button>
                <button onClick={() => handleAsignarTurno('Noche')} className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded">Asignar Noche</button>
                 {/* Aquí podríamos mostrar el turno asignado si existe */}
            </fieldset>

             {/* Otros ajustes podrían añadirse aquí */}

          </div>

          <button 
            onClick={onClose}
            className="mt-6 w-full bg-gray-300 hover:bg-gray-400 text-black font-bold py-2 px-4 rounded"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  };
  // --- Fin: Componente Modal ---


  return (
    <div className="overflow-x-auto relative"> {/* Añadido relative para el modal */}
      <div className="min-w-full">
        {/* Encabezados de días */}
        <div className="flex sticky top-0 bg-white z-10"> {/* Sticky header */}
          <div className="w-32 flex-shrink-0"></div>
          {diasDelMes.map((dia) => (
            <div
              key={`header-${dia}`}
              className="w-12 h-12 flex items-center justify-center border border-gray-200 bg-gray-100 font-semibold" // Estilo mejorado
            >
              {dia}
            </div>
          ))}
        </div>

        {/* Filas de meses */}
        {meses.map((mes) => (
          <div key={mes} className="flex">
            <div className="w-32 flex-shrink-0 flex items-center justify-center border border-gray-200 bg-gray-100 font-semibold sticky left-0 z-10"> {/* Sticky month */}
              {mes}
            </div>
            {diasDelMes.map((dia) => (
              <div
                key={`${mes}-${dia}`}
                className="w-12 h-12 border border-gray-200 hover:bg-blue-100 cursor-pointer flex items-center justify-center text-xs" // Estilo y añadido flex
                onClick={() => handleCeldaClick(mes, dia)} // Añadido onClick
              >
                {/* Aquí se podría mostrar info del turno o festivo */}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Renderizar el Modal */}
      {modalVisible && <EditarCeldaModal celda={celdaSeleccionada} onClose={handleCerrarModal} />}
    </div>
  );
};

export default Calendario;