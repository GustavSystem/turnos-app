import React, { useState, useCallback, useEffect } from 'react';
import { obtenerFestivos, Festivo, eliminarFestivoFijo, restaurarFestivoFijo } from './utils/festivos';
import { agregarFestivo, eliminarFestivo, getFestivosPersonalizados, FestivoPersonalizado } from './utils/festivosPersonalizados'; // Import añadido y tipo FestivoPersonalizado
import { getConfiguracionTurnos, calcularTurnoParaFecha, guardarConfiguracionTurnos, ConfiguracionTurnos } from './utils/turnosConfig';
import ConfiguracionTurnos from './components/ConfiguracionTurnos';
import EstadisticasTurnos from './components/EstadisticasTurnos';

interface CeldaData {
  contenido?: string;
  esFestivo?: boolean;
  descripcionFestivo?: string;
  color?: string;
}

function App() {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [celdas, setCeldas] = useState<Record<string, CeldaData>>({});
  const [editandoCelda, setEditandoCelda] = useState<string | null>(null);
  // Estado unificado para el menú contextual
  const [mostrarConfiguracion, setMostrarConfiguracion] = useState(false);
  const [configuracionTurnos, setConfiguracionTurnos] = useState<ReturnType<typeof getConfiguracionTurnos>>(null);
  const [celdaEditandoManual, setCeldaEditandoManual] = useState<{id: string, letra: string, color: string} | null>(null);
  const [menuContextual, setMenuContextual] = useState<{
    dia: number,
    mes: number,
    celdaId: string,
    letra: string,
    color: string,
    clientX: number,
    clientY: number
  } | null>(null);
  const [mostrarEstadisticas, setMostrarEstadisticas] = useState(false);
  const [mostrarMenuAjustes, setMostrarMenuAjustes] = useState(false);

  // Clave para almacenar las celdas en localStorage
  const CELDAS_STORAGE_KEY = 'celdasTurnos';
  
  useEffect(() => {
    const config = getConfiguracionTurnos();
    setConfiguracionTurnos(config);
    
    // Cargar celdas guardadas
    const celdasGuardadas = localStorage.getItem(CELDAS_STORAGE_KEY);
    if (celdasGuardadas) {
      try {
        setCeldas(JSON.parse(celdasGuardadas));
      } catch (error) {
        console.error('Error al cargar celdas guardadas:', error);
      }
    }
  }, []);

  const getDiasEnMes = (mes: number, año: number) => {
    return new Date(año, mes + 1, 0).getDate();
  };

  const esFinDeSemana = (mes: number, dia: number) => {
    const fecha = new Date(currentYear, mes, dia);
    const diaSemana = fecha.getDay();
    return diaSemana === 0 || diaSemana === 6;
  };

  const obtenerDiaSemana = (mes: number, dia: number) => {
    const fecha = new Date(currentYear, mes, dia);
    const dias = ['d', 'l', 'm', 'x', 'j', 'v', 's'];
    return dias[fecha.getDay()];
  };

  const esFestivo = useCallback((mes: number, dia: number) => {
    const festivos = obtenerFestivos(currentYear);
    return festivos.find(f => f.mes === mes && f.dia === dia);
  }, [currentYear]);

  const handleCeldaClick = (event: React.MouseEvent, mes: string, dia: number, mesIndex: number) => {
    // Si estamos en modo edición, continuar con la edición
    if (editandoCelda) {
      const celdaId = `${mes}-${dia}`;
      setEditandoCelda(celdaId);
      return;
    }
    
    // Para cualquier otro caso, mostrar el menú contextual
    event.preventDefault();
    const celdaId = `${meses[mesIndex]}-${dia}`;
    
    // Calcular la posición óptima para el menú
    const posicion = calcularPosicionMenu(event.clientX, event.clientY);
    
    setMenuContextual({
      dia,
      mes: mesIndex,
      celdaId,
      letra: celdas[celdaId]?.contenido || obtenerTurnoParaFecha(mesIndex, dia) || '',
      color: celdas[celdaId]?.color || obtenerColorTurno(mesIndex, dia) || '#ffffff',
      clientX: posicion.x,
      clientY: posicion.y
    });
  };

  const handleCeldaKeyPress = (event: React.KeyboardEvent, mes: string, dia: number, mesIndex: number) => {
    if (event.key === 'Enter') {
      const contenido = (event.target as HTMLDivElement).textContent || '';
      const celdaId = `${mes}-${dia}`;
      const diaSemana = obtenerDiaSemana(mesIndex, dia);
      const festivo = esFestivo(mesIndex, dia);
      
      // Si es un festivo, mantener el color rojo
      let colorTurno = festivo ? '#fca5a5' : undefined;
      
      // Si no es festivo y el contenido es una letra de turno, aplicar su color
      if (!festivo && configuracionTurnos) {
        const turno = configuracionTurnos.turnos.find(t => t.letra === contenido);
        if (turno) {
          colorTurno = turno.color;
        }
      }

      setCeldas(prev => {
        const nuevasCeldas = {
          ...prev,
          [celdaId]: { 
            ...prev[celdaId],
            contenido,
            color: colorTurno,
            esFestivo: festivo ? true : undefined,
            descripcionFestivo: festivo?.descripcion
          }
        };
        // Guardar en localStorage
        localStorage.setItem(CELDAS_STORAGE_KEY, JSON.stringify(nuevasCeldas));
        return nuevasCeldas;
      });
      setEditandoCelda(null);
    }
  };

  // Función para calcular la posición óptima del menú contextual
  const calcularPosicionMenu = (x: number, y: number) => {
    // Valores más realistas basados en el contenido actual del menú
    const menuAncho = 288; // w-72 (ancho del menú)
    // Calculamos una altura estimada basada en el contenido
    // Esto es una estimación, el tamaño real dependerá del contenido y estilos
    const alturaEstimadaBase = 450; // Altura base estimada
    const alturaAdicionalPorTurno = configuracionTurnos ? Math.min(configuracionTurnos.turnos.length * 15, 100) : 0;
    const menuAlto = Math.min(alturaEstimadaBase + alturaAdicionalPorTurno, window.innerHeight * 0.8);
    
    const margen = 20; // Margen de seguridad
    
    // Obtener dimensiones de la ventana
    const ventanaAncho = window.innerWidth;
    const ventanaAlto = window.innerHeight;
    
    // Calcular posición inicial
    let posX = x;
    let posY = y;
    
    // Ajustar para dispositivos móviles
    const esMobile = ventanaAncho < 768;
    
    if (esMobile) {
      // En móviles, centrar horizontalmente y colocar en la parte superior con margen
      posX = (ventanaAncho - menuAncho) / 2;
      posY = margen * 2;
      return { x: posX, y: posY };
    }
    
    // Para pantallas normales, verificar los límites
    
    // Verificar si el menú se sale por la derecha
    if (posX + menuAncho + margen > ventanaAncho) {
      posX = ventanaAncho - menuAncho - margen;
    }
    
    // Verificar si el menú se sale por abajo
    if (posY + menuAlto + margen > ventanaAlto) {
      // Intentar colocar el menú arriba del punto de clic
      const posYArriba = y - menuAlto - margen;
      
      if (posYArriba >= margen) {
        // Si hay espacio arriba, colocarlo allí
        posY = posYArriba;
      } else {
        // Si no hay suficiente espacio arriba ni abajo, colocarlo donde haya más espacio
        const espacioArriba = y;
        const espacioAbajo = ventanaAlto - y;
        
        if (espacioArriba > espacioAbajo) {
          // Más espacio arriba, colocarlo ahí con scroll
          posY = margen;
        } else {
          // Más espacio abajo, colocarlo ahí con scroll
          posY = ventanaAlto - menuAlto - margen;
        }
      }
    }
    
    // Verificar si el menú se sale por la izquierda
    if (posX < margen) {
      posX = margen;
    }
    
    // Verificar si el menú se sale por arriba
    if (posY < margen) {
      posY = margen;
    }
    
    return { x: posX, y: posY };
  };

  // Función unificada para mostrar el menú contextual (implementada en handleCeldaClick)

  const [modalFestivo, setModalFestivo] = useState<{
    visible: boolean;
    tipo?: 'nacional' | 'autonomico' | 'local';
    descripcion: string;
    soloEsteAño: boolean;
  }>({ visible: false, descripcion: '', soloEsteAño: false });

  const handleAgregarFestivo = (tipo: 'nacional' | 'autonomico' | 'local') => {
    if (!menuContextual) return;
    
    // Mostrar modal en lugar de prompt/confirm
    setModalFestivo({
      visible: true,
      tipo,
      descripcion: '',
      soloEsteAño: false
    });
  };
  
  const confirmarAgregarFestivo = () => {
    if (!menuContextual || !modalFestivo.tipo || !modalFestivo.descripcion) return;
    
    agregarFestivo({
      dia: menuContextual.dia,
      mes: menuContextual.mes,
      descripcion: modalFestivo.descripcion,
      tipo: modalFestivo.tipo,
      año: modalFestivo.soloEsteAño ? currentYear : undefined
    });

    setMenuContextual(null);
    setModalFestivo({ visible: false, descripcion: '', soloEsteAño: false });
  };

  const [modalEliminarFestivo, setModalEliminarFestivo] = useState<{
    visible: boolean;
    soloEsteAño: boolean;
  }>({ visible: false, soloEsteAño: false });

  const handleEliminarFestivo = () => {
    if (!menuContextual) return;
    
    // Mostrar modal en lugar de confirm
    setModalEliminarFestivo({
      visible: true,
      soloEsteAño: false
    });
  };
  
  const confirmarEliminarFestivo = () => {
    if (!menuContextual) return;
    
    const año = modalEliminarFestivo.soloEsteAño ? currentYear : undefined;
    
    // Intentar eliminar primero como festivo personalizado
    eliminarFestivo(menuContextual.dia, menuContextual.mes, año);
    
    // Si es un festivo fijo, también lo eliminamos
    eliminarFestivoFijo(menuContextual.dia, menuContextual.mes, año);
    
    setMenuContextual(null);
    setModalEliminarFestivo({ visible: false, soloEsteAño: false });
  };

// Estado y funciones para EDITAR festivo
  const [modalEditarFestivo, setModalEditarFestivo] = useState<{
    visible: boolean;
    dia: number;
    mes: number;
    descripcion: string;
    tipo: 'nacional' | 'autonomico' | 'local';
    soloEsteAño: boolean;
    añoOriginal?: number; // Para saber si el original era específico de un año
  }>({ visible: false, dia: 0, mes: 0, descripcion: '', tipo: 'local', soloEsteAño: false });

  const handleEditarFestivo = () => {
    if (!menuContextual) return;

    // Buscar el festivo existente (asumimos que está en personalizados, podría necesitar lógica adicional si también hay fijos editables)
    const festivosPersonalizados = getFestivosPersonalizados();
    const festivoExistente = festivosPersonalizados.find((f: FestivoPersonalizado) => // Tipo explícito añadido
      f.dia === menuContextual.dia &&
      f.mes === menuContextual.mes &&
      (f.año === currentYear || !f.año) // Considerar festivos de este año o generales
    );

    if (!festivoExistente) {
      console.warn("No se encontró festivo personalizado para editar en esta fecha.");
      // Podríamos buscar en festivos fijos si fuera necesario
      setMenuContextual(null); // Cerrar menú si no hay nada que editar
      return;
    }

    setModalEditarFestivo({
      visible: true,
      dia: festivoExistente.dia,
      mes: festivoExistente.mes,
      descripcion: festivoExistente.descripcion,
      tipo: festivoExistente.tipo,
      soloEsteAño: festivoExistente.año === currentYear, // Marcar si era específico de este año
      añoOriginal: festivoExistente.año // Guardar el año original por si acaso
    });
    setMenuContextual(null); // Cerrar menú contextual
  };

  const confirmarEditarFestivo = () => {
    if (!modalEditarFestivo.visible) return;

    const { dia, mes, descripcion, tipo, soloEsteAño, añoOriginal } = modalEditarFestivo;

    // 1. Eliminar el festivo original
    // Necesitamos saber si el original aplicaba solo a un año para eliminarlo correctamente
    eliminarFestivo(dia, mes, añoOriginal); 
    // Si también pudiera ser un festivo fijo editable, habría que llamar a eliminarFestivoFijo aquí

    // 2. Agregar el festivo modificado
    agregarFestivo({
      dia,
      mes,
      descripcion,
      tipo,
      año: soloEsteAño ? currentYear : undefined
    });

    // 3. Cerrar modal
    setModalEditarFestivo({ visible: false, dia: 0, mes: 0, descripcion: '', tipo: 'local', soloEsteAño: false });
    // Podríamos mostrar notificación de éxito
    mostrarNotificacion('Festivo actualizado correctamente', 'success');
  };
  const cambiarAño = (incremento: number) => {
    setCurrentYear(prev => prev + incremento);
  };

  const obtenerTurnoParaFecha = (mes: number, dia: number): string | null => {
    if (!configuracionTurnos) return null;
    
    const fecha = new Date(currentYear, mes, dia);
    const turno = calcularTurnoParaFecha(fecha, configuracionTurnos);
    return turno?.letra || null;
  };

  const obtenerColorTurno = (mes: number, dia: number): string | null => {
    if (!configuracionTurnos) return null;
    
    const fecha = new Date(currentYear, mes, dia);
    const turno = calcularTurnoParaFecha(fecha, configuracionTurnos);
    return turno?.color || null;
  };

  const obtenerColorCelda = (mes: number, dia: number, celdaId: string): string => {
    // Si es festivo, siempre prevalece el color del festivo
    if (esFestivo(mes, dia)) {
      return '#fca5a5';
    }
    const celda = celdas[celdaId];
    // Si hay un color personalizado, usarlo
    if (celda?.color) {
      return celda.color;
    }
    // Si es fin de semana, prevalece sobre el turno
    if (esFinDeSemana(mes, dia)) {
      return '#e5e7eb';
    }
    // Si está en modo edición y tiene hover
    if (hoveredCell === celdaId) {
      return '#f3f4f6';
    }
    // Si hay un turno configurado, usar su color
    const colorTurno = obtenerColorTurno(mes, dia);
    if (colorTurno) {
      return colorTurno;
    }
    return 'white';
  };

  const obtenerContenidoCelda = (mes: number, dia: number, celdaId: string): string => {
    const celda = celdas[celdaId];
    
    // Si hay contenido editado manualmente, prevalece
    if (celda?.contenido) {
      return celda.contenido;
    }

    // Si es festivo, mostrar la letra del turno si existe
    if (esFestivo(mes, dia)) {
      const turno = obtenerTurnoParaFecha(mes, dia);
      return turno || '';
    }

    // Si hay un turno configurado, mostrar su letra
    const turno = obtenerTurnoParaFecha(mes, dia);
    return turno || '';
  };

  // Encontrar el mes con más días para el encabezado
  const maxDias = Math.max(...meses.map((_, index) => getDiasEnMes(index, currentYear)));

  const handleEditarCelda = () => {
    if (!menuContextual) return;
    
    const celdaId = menuContextual.celdaId;
    setEditandoCelda(celdaId);
    setMenuContextual(null);
  };

  const handleGuardarEdicionCelda = () => {
    if (!menuContextual) return;
    setCeldas(prev => {
      const nuevasCeldas = {
        ...prev,
        [menuContextual.celdaId]: {
          ...prev[menuContextual.celdaId],
          contenido: menuContextual.letra,
          color: menuContextual.color
        }
      };
      // Guardar en localStorage
      localStorage.setItem(CELDAS_STORAGE_KEY, JSON.stringify(nuevasCeldas));
      return nuevasCeldas;
    });
    setMenuContextual(null);
  };
  
  // Función para seleccionar un turno desde el menú contextual
  const seleccionarTurnoDesdeMenu = (letra: string, color: string) => {
    if (!menuContextual) return;
    setMenuContextual(prev => prev ? {
      ...prev,
      letra,
      color
    } : null);
  };

  // Función unificada para eliminar festivos desde el menú contextual

  // Estado para mensajes de notificación
  const [notificacion, setNotificacion] = useState<{
    visible: boolean;
    mensaje: string;
    tipo: 'success' | 'error';
  } | null>(null);

  // Función para mostrar notificaciones temporales
  const mostrarNotificacion = (mensaje: string, tipo: 'success' | 'error') => {
    setNotificacion({ visible: true, mensaje, tipo });
    setTimeout(() => {
      setNotificacion(null);
    }, 3000);
  };

  // Función para exportar todos los datos relevantes
  const handleExportarDatos = () => {
    try {
      const datos = {
        configuracionTurnos: localStorage.getItem('configuracionTurnos'),
        festivosPersonalizados: localStorage.getItem('festivosPersonalizados'),
        festivosEliminados: localStorage.getItem('festivosEliminados'),
        celdas: JSON.stringify(celdas),
        fechaExportacion: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `turnos-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      mostrarNotificacion('Datos exportados correctamente', 'success');
    } catch (error) {
      console.error('Error al exportar datos:', error);
      mostrarNotificacion('Error al exportar los datos', 'error');
    }
  };

  // Estado para el modal de confirmación de importación
  const [modalImportacion, setModalImportacion] = useState<{
    visible: boolean;
    datos: any;
    archivo: File | null;
  }>({ visible: false, datos: null, archivo: null });

  // Función para importar datos
  const handleImportarDatos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const datos = JSON.parse(event.target?.result as string);
        // Mostrar modal de confirmación en lugar de importar directamente
        setModalImportacion({
          visible: true,
          datos,
          archivo: file
        });
      } catch (error) {
        console.error('Error al leer el archivo:', error);
        mostrarNotificacion('Error al leer el archivo', 'error');
      }
    };
    
    reader.onerror = () => {
      mostrarNotificacion('Error al leer el archivo', 'error');
    };
    
    reader.readAsText(file);
    
    // Limpiar el input para permitir cargar el mismo archivo nuevamente
    e.target.value = '';
  };

  // Función para confirmar la importación de datos
  const confirmarImportacion = () => {
    if (!modalImportacion.datos) return;
    
    try {
      const datos = modalImportacion.datos;
      let cambiosRealizados = false;
      
      if (datos.configuracionTurnos) {
        localStorage.setItem('configuracionTurnos', datos.configuracionTurnos);
        cambiosRealizados = true;
      }
      
      if (datos.festivosPersonalizados) {
        localStorage.setItem('festivosPersonalizados', datos.festivosPersonalizados);
        cambiosRealizados = true;
      }
      
      if (datos.festivosEliminados) {
        localStorage.setItem('festivosEliminados', datos.festivosEliminados);
        cambiosRealizados = true;
      }
      
      if (datos.celdas) {
        setCeldas(JSON.parse(datos.celdas));
        cambiosRealizados = true;
      }
      
      if (cambiosRealizados) {
        // Refrescar configuración de turnos
        setConfiguracionTurnos(getConfiguracionTurnos());
        mostrarNotificacion('¡Datos importados correctamente!', 'success');
      } else {
        mostrarNotificacion('El archivo no contenía datos válidos', 'error');
      }
    } catch (error) {
      console.error('Error al importar datos:', error);
      mostrarNotificacion('Error al importar el archivo', 'error');
    }
    
    // Cerrar el modal
    setModalImportacion({ visible: false, datos: null, archivo: null });
  };

  return (
    <div className="container">
      {/* Modal para agregar festivo */}
      {modalFestivo.visible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200]">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Agregar festivo</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Descripción:</label>
              <input 
                type="text" 
                className="w-full border rounded p-2"
                value={modalFestivo.descripcion}
                onChange={(e) => setModalFestivo(prev => ({ ...prev, descripcion: e.target.value }))}
                autoFocus
              />
{/* Modal para EDITAR festivo */}
      {modalEditarFestivo.visible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200]">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Editar festivo</h3>
            <p className="text-sm text-gray-600 mb-4">
              Editando festivo para el {modalEditarFestivo.dia} de {meses[modalEditarFestivo.mes]}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Descripción:</label>
              <input 
                type="text" 
                className="w-full border rounded p-2"
                value={modalEditarFestivo.descripcion}
                onChange={(e) => setModalEditarFestivo(prev => ({ ...prev, descripcion: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Tipo:</label>
              <select 
                className="w-full border rounded p-2"
                value={modalEditarFestivo.tipo}
                onChange={(e) => setModalEditarFestivo(prev => ({ ...prev, tipo: e.target.value as 'nacional' | 'autonomico' | 'local' }))}
              >
                <option value="nacional">Nacional</option>
                <option value="autonomico">Autonómico</option>
                <option value="local">Local</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  className="mr-2"
                  checked={modalEditarFestivo.soloEsteAño}
                  onChange={(e) => setModalEditarFestivo(prev => ({ ...prev, soloEsteAño: e.target.checked }))}
                />
                Aplicar solo para este año ({currentYear})
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button 
                className="btn btn-secondary"
                onClick={() => setModalEditarFestivo({ visible: false, dia: 0, mes: 0, descripcion: '', tipo: 'local', soloEsteAño: false })}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-primary"
                onClick={confirmarEditarFestivo}
                disabled={!modalEditarFestivo.descripcion}
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
            </div>
            <div className="mb-4">
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  className="mr-2"
                  checked={modalFestivo.soloEsteAño}
                  onChange={(e) => setModalFestivo(prev => ({ ...prev, soloEsteAño: e.target.checked }))}
                />
                Aplicar solo para este año ({currentYear})
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button 
                className="btn btn-secondary"
                onClick={() => setModalFestivo({ visible: false, descripcion: '', soloEsteAño: false })}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-primary"
                onClick={confirmarAgregarFestivo}
                disabled={!modalFestivo.descripcion}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para eliminar festivo */}
      {modalEliminarFestivo.visible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200]">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Eliminar festivo</h3>
            <p className="mb-4">¿Estás seguro de que deseas eliminar este festivo?</p>
            <div className="mb-4">
              <label className="flex items-center">
                <input 
                  type="checkbox" 
                  className="mr-2"
                  checked={modalEliminarFestivo.soloEsteAño}
                  onChange={(e) => setModalEliminarFestivo(prev => ({ ...prev, soloEsteAño: e.target.checked }))}
                />
                Eliminar solo para este año ({currentYear})
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button 
                className="btn btn-secondary"
                onClick={() => setModalEliminarFestivo({ visible: false, soloEsteAño: false })}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-danger"
                onClick={confirmarEliminarFestivo}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* El modal para eliminar festivos se ha unificado */}
      
      <header className="card mb-4 py-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-2xl font-bold">Calendario de Turnos</h1>
          
          <div className="flex items-center gap-2 md:gap-4">
            <button 
              className="btn btn-secondary btn-sm md:btn-md"
              onClick={() => cambiarAño(-1)}
            >
              &lt;
            </button>
            <h2 className="text-lg font-semibold">{currentYear}</h2>
            <button 
              className="btn btn-secondary btn-sm md:btn-md"
              onClick={() => cambiarAño(1)}
            >
              &gt;
            </button>
            
            <button 
              className="btn btn-secondary btn-sm md:btn-md ml-2"
              onClick={() => setMostrarEstadisticas(!mostrarEstadisticas)}
            >
              Estadísticas
            </button>
            
            <div className="relative">
              <button 
                className="btn btn-primary btn-sm md:btn-md"
                onClick={() => setMostrarMenuAjustes(!mostrarMenuAjustes)}
              >
                Ajustes
              </button>
              {mostrarMenuAjustes && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg overflow-hidden z-50">
                  <div className="py-1">
                    <button 
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => {
                        setMostrarConfiguracion(!mostrarConfiguracion);
                        setMostrarMenuAjustes(false);
                      }}
                    >
                      Configuración
                    </button>
                    <button 
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => {
                        handleExportarDatos();
                        setMostrarMenuAjustes(false);
                      }}
                    >
                      Exportar
                    </button>
                    <label className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 block cursor-pointer">
                      Importar
                      <input 
                        type="file" 
                        accept="application/json" 
                        className="hidden" 
                        onChange={(e) => {
                          handleImportarDatos(e);
                          setMostrarMenuAjustes(false);
                        }} 
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {mostrarConfiguracion && (
        <div className="card mb-4">
          <ConfiguracionTurnos 
            onClose={() => setMostrarConfiguracion(false)}
            onSave={() => {
              setConfiguracionTurnos(getConfiguracionTurnos());
              setMostrarConfiguracion(false);
            }}
          />
        </div>
      )}

      {mostrarEstadisticas && (
        <div className="card mb-4">
          <EstadisticasTurnos 
            año={currentYear}
            onClose={() => setMostrarEstadisticas(false)}
          />
        </div>
      )}

      <div className="card">
        <div className="w-full">
          <div className="w-full">
            {/* Encabezados de días */}
            <div className="flex w-full">
              <div className="w-24 flex-shrink-0"></div>
              <div className="flex flex-1">
                {Array.from({ length: maxDias }, (_, i) => i + 1).map((dia) => (
                  <div
                    key={dia}
                    className={`flex-1 h-8 border flex items-center justify-center relative ${hoveredCell === `header-${dia}` ? 'ring-2 ring-blue-500' : ''} bg-gray-50 text-xs font-medium`}
                    onMouseEnter={() => setHoveredCell(`header-${dia}`)}
                    onMouseLeave={() => setHoveredCell(null)}
                  >
                    {dia}
                  </div>
                ))}
              </div>
            </div>

            {/* Filas de meses */}
            {meses.map((mes, mesIndex) => {
              const diasEnEsteMes = getDiasEnMes(mesIndex, currentYear);
              
              return (
                <div key={mes} className="flex w-full">
                  <div className="w-24 flex-shrink-0 flex items-center justify-center border bg-gray-50 font-medium text-sm">
                    {mes}
                  </div>
                  <div className="flex flex-1">
                    {Array.from({ length: maxDias }, (_, i) => i + 1).map((dia) => {
                      const esDiaValido = dia <= diasEnEsteMes;
                      if (!esDiaValido) {
                        return (
                          <div
                            key={`${mes}-${dia}`}
                            className="flex-1 h-12 bg-gray-50 border"
                          />
                        );
                      }

                      const celdaId = `${mes}-${dia}`;
                      const diaSemana = obtenerDiaSemana(mesIndex, dia);
                      const esFestivoActual = esFestivo(mesIndex, dia);
                      const color = obtenerColorCelda(mesIndex, dia, celdaId);
                      const contenido = obtenerContenidoCelda(mesIndex, dia, celdaId);
                      
                      return (
                        <div
                          key={`${mes}-${dia}`}
                          className={`
                            flex-1 h-12 border relative flex flex-col items-center justify-center
                            ${esFinDeSemana(mesIndex, dia) ? 'bg-gray-100' : ''}
                            ${esFestivoActual ? 'bg-red-100' : ''}
                            ${hoveredCell === celdaId ? 'ring-2 ring-blue-500' : ''}
                            hover:bg-opacity-90 transition-colors duration-150
                          `}
                          style={{ backgroundColor: color }}
                          onClick={(e) => handleCeldaClick(e, mes, dia, mesIndex)}
                          onMouseEnter={() => setHoveredCell(celdaId)}
                          onMouseLeave={() => setHoveredCell(null)}
                          title={esFestivoActual ? `Festivo: ${esFestivoActual.descripcion}` : ''}
                        >
                          <span className="text-xs text-gray-500 absolute top-0.5 left-0.5">
                            {diaSemana}
                          </span>
                          {editandoCelda === celdaId ? (
                            <div
                              contentEditable
                              onKeyDown={(e) => handleCeldaKeyPress(e, mes, dia, mesIndex)}
                              className="outline-none text-center w-full font-bold p-1 rounded hover:bg-white hover:bg-opacity-30"
                              autoFocus
                            >
                              {contenido}
                            </div>
                          ) : (
                            <span className="text-lg font-bold">{contenido}</span>
                          )}
                          {esFestivoActual && (
                            <>
                              <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></div>
                              <div className="absolute bottom-0 right-0 w-0 h-0 border-4 border-transparent border-red-500 border-b-red-500 border-r-red-500"></div>
                              <span className="text-[8px] text-red-700 absolute bottom-0.5 right-0.5 font-bold">F</span>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* El panel de gestión de festivos se ha unificado con el menú contextual */}

      {menuContextual && (
        <div 
          className="fixed bg-white shadow-lg rounded-lg p-4 z-[100] w-[90vw] sm:w-72"
          style={{ 
            top: `${menuContextual.clientY}px`, 
            left: `${menuContextual.clientX}px`,
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            position: 'fixed',
            transform: 'translate(0, 0)', // Asegura que no haya transformaciones que afecten la posición
            transition: 'none', // Evita transiciones que puedan afectar la visibilidad inicial
            maxWidth: 'calc(100vw - 40px)' // Asegura que no se salga de la pantalla
          }}
        >
          <div className="flex flex-col gap-4 max-h-[calc(80vh-2rem)] overflow-y-auto pr-1">
            <div className="border-b pb-2 mb-2 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-semibold">Editar Celda</h3>
              <p className="text-xs text-gray-500">Día {menuContextual.dia} de {meses[menuContextual.mes]}</p>
            </div>
            <div>
              <h4 className="font-medium mb-2">Configurar Turno</h4>
              <div className="flex flex-wrap gap-2 items-center mb-2">
                <div className="flex items-center gap-1">
                  <label className="text-sm whitespace-nowrap">Turno:</label>
                  <input 
                    type="text" 
                    className="border p-1 w-20 rounded"
                    value={menuContextual.letra}
                    onChange={(e) => setMenuContextual(prev => prev ? {...prev, letra: e.target.value} : null)}
                  />
                </div>
                <div className="flex items-center">
                  <label className="text-sm mr-1 whitespace-nowrap">Color:</label>
                  <input 
                    type="color" 
                    className="w-8 h-8 rounded cursor-pointer"
                    value={menuContextual.color}
                    onChange={(e) => setMenuContextual(prev => prev ? {...prev, color: e.target.value} : null)}
                  />
                </div>
              </div>
            </div>
            
            {configuracionTurnos && configuracionTurnos.turnos.length > 0 && (
              <div className="mb-2">
                <h4 className="text-sm font-medium mb-2">Turnos disponibles:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-[200px] overflow-y-auto p-1">
                  {configuracionTurnos.turnos.map(turno => (
                    <button
                      key={turno.letra}
                      className="p-2 rounded border hover:bg-gray-100 flex flex-col items-center"
                      style={{ backgroundColor: turno.color + '40' }}
                      onClick={() => seleccionarTurnoDesdeMenu(turno.letra, turno.color)}
                    >
                      <span className="font-bold">{turno.letra}</span>
                      <span className="text-xs truncate w-full text-center">{turno.nombre}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Sección de gestión de festivos */}
            {esFestivo(menuContextual.mes, menuContextual.dia) && (
              <div className="mb-2">
                <h4 className="text-sm font-medium mb-2">Gestión de festivo:</h4>
                <div className="flex gap-2"> {/* Usar flex para poner botones lado a lado */}
                  <button
                    className="btn btn-secondary flex-1 text-xs py-1.5 px-3 rounded-md bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                    onClick={handleEditarFestivo} // Nueva función a crear
                  >
                    Editar festivo
                  </button>
                  <button
                    className="btn btn-danger flex-1 text-xs py-1.5 px-3 rounded-md bg-red-100 text-red-700 hover:bg-red-200"
                    onClick={handleEliminarFestivo}
                  >
                    Eliminar festivo
                  </button>
                </div>
              </div>
            )}

            {!esFestivo(menuContextual.mes, menuContextual.dia) && (
              <div className="mb-2">
                <h4 className="text-sm font-medium mb-2">Añadir como festivo:</h4>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    className="btn btn-secondary text-xs py-1.5 px-2 rounded-md bg-red-50 text-red-700 hover:bg-red-100"
                    onClick={() => handleAgregarFestivo('nacional')}
                  >
                    Nacional
                  </button>
                  <button
                    className="btn btn-secondary text-xs py-1.5 px-2 rounded-md bg-red-50 text-red-700 hover:bg-red-100"
                    onClick={() => handleAgregarFestivo('autonomico')}
                  >
                    Autonómico
                  </button>
                  <button
                    className="btn btn-secondary text-xs py-1.5 px-2 rounded-md bg-red-50 text-red-700 hover:bg-red-100"
                    onClick={() => handleAgregarFestivo('local')}
                  >
                    Local
                  </button>
                </div>
              </div>
            )}
            
            <div className="flex justify-between mt-3 sticky bottom-0 bg-white pt-2 pb-1 z-10">
              <button 
                className="btn btn-secondary text-xs py-1.5 px-3 rounded-md"
                onClick={() => setMenuContextual(null)}
              >
                Cancelar
              </button>
              <div className="flex gap-2">
                <button 
                  className="btn btn-primary text-xs py-1.5 px-3 rounded-md"
                  onClick={handleGuardarEdicionCelda}
                >
                  Guardar
                </button>
              </div>
            </div>
            
            {/* Sección duplicada eliminada */}
          </div>
        </div>
      )}
      {/* Modal de confirmación de importación */}
      {modalImportacion.visible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200]">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Confirmar importación</h3>
            <p className="mb-4">¿Estás seguro de que deseas importar los datos del archivo "{modalImportacion.archivo?.name}"?</p>
            <p className="mb-4 text-sm text-red-600">Esta acción sobrescribirá tus datos actuales.</p>
            
            {modalImportacion.datos?.fechaExportacion && (
              <p className="mb-4 text-sm">
                Fecha de exportación: {new Date(modalImportacion.datos.fechaExportacion).toLocaleString()}
              </p>
            )}
            
            <div className="flex justify-end gap-2">
              <button 
                className="btn btn-secondary"
                onClick={() => setModalImportacion({ visible: false, datos: null, archivo: null })}
              >
                Cancelar
              </button>
              <button 
                className="btn btn-primary"
                onClick={confirmarImportacion}
              >
                Importar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Notificación */}
      {notificacion && notificacion.visible && (
        <div 
          className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg z-[150] ${notificacion.tipo === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`}
        >
          {notificacion.mensaje}
        </div>
      )}
    </div>
  );
}

export default App;