import React, { useState, useCallback, useEffect } from 'react';
import { obtenerFestivos, Festivo, eliminarFestivoFijo, restaurarFestivoFijo } from './utils/festivos';
import { agregarFestivo, eliminarFestivo, getFestivosPersonalizados, FestivoPersonalizado } from './utils/festivosPersonalizados';
import { getConfiguracionTurnos, calcularTurnoParaFecha, guardarConfiguracionTurnos, ConfiguracionTurnos, Turno } from './utils/turnosConfig';
import { default as ConfiguracionTurnosComponent } from './components/ConfiguracionTurnos';
import EstadisticasTurnos from './components/EstadisticasTurnos';
import Calendario from './components/Calendario';

interface CeldaData {
  contenido?: string;
  esFestivo?: boolean;
  descripcionFestivo?: string;
  color?: string;
  horas?: number;
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
  const [configuracionTurnos, setConfiguracionTurnos] = useState<ConfiguracionTurnos | null>(null);
  const [celdaEditandoManual, setCeldaEditandoManual] = useState<{id: string, letra: string, color: string} | null>(null);
  const [menuContextual, setMenuContextual] = useState<{
    dia: number,
    mes: number,
    celdaId: string,
    letra: string,
    color: string,
    horas: number,
    clientX: number,
    clientY: number
  } | null>(null);
  const [mostrarEstadisticas, setMostrarEstadisticas] = useState(false);
  const [mostrarMenuAjustes, setMostrarMenuAjustes] = useState(false);

  // Clave para almacenar las celdas en localStorage, ahora específica por año
  const CELDAS_STORAGE_KEY = `celdasTurnos_${currentYear}`;
  
  useEffect(() => {
    const config = getConfiguracionTurnos();
    setConfiguracionTurnos(config);
    
    // Cargar celdas guardadas específicas del año actual
    const celdasGuardadas = localStorage.getItem(`celdasTurnos_${currentYear}`);
    if (celdasGuardadas) {
      try {
        setCeldas(JSON.parse(celdasGuardadas));
      } catch (error) {
        console.error('Error al cargar celdas guardadas:', error);
      }
    } else {
      // Si no hay celdas guardadas para este año, inicializar con un objeto vacío
      setCeldas({});
    }
  }, [currentYear]);

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
    const celdaActual = celdas[celdaId];
    const letraTurno = celdaActual?.contenido || obtenerTurnoParaFecha(mesIndex, dia) || '';
    
    let horasTurno = 0;
    if (celdaActual && typeof celdaActual.horas === 'number') {
      // Priorizar las horas guardadas en la celda
      horasTurno = celdaActual.horas;
    } else if (configuracionTurnos && letraTurno) {
      // Si no hay horas en la celda, buscar en la configuración de turnos
      const turnoConfig = configuracionTurnos.turnos.find(t => t.letra === letraTurno);
      if (turnoConfig) {
        horasTurno = turnoConfig.horas;
      }
    }
    
    setMenuContextual({
      dia,
      mes: mesIndex,
      celdaId,
      letra: letraTurno,
      color: celdaActual?.color || obtenerColorTurno(mesIndex, dia) || '#ffffff',
      horas: horasTurno,
      clientX: 0,
      clientY: 0
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
        // Guardar en localStorage con clave específica para el año actual
        localStorage.setItem(`celdasTurnos_${currentYear}`, JSON.stringify(nuevasCeldas));
        return nuevasCeldas;
      });
      setEditandoCelda(null);
    }
  };

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
      mes: menuContextual.mes ?? 0,
      descripcion: modalFestivo.descripcion,
      tipo: modalFestivo.tipo,
      año: modalFestivo.soloEsteAño ? currentYear : undefined
    });

    setMenuContextual(null);
    setModalFestivo({ visible: false, descripcion: '', soloEsteAño: false });
  };

  const [modalFestivo, setModalFestivo] = useState<{
    visible: boolean;
    tipo?: 'nacional' | 'autonomico' | 'local';
    descripcion: string;
    soloEsteAño: boolean;
  }>({ visible: false, descripcion: '', soloEsteAño: false });

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
    eliminarFestivo(menuContextual.dia, menuContextual.mes ?? 0, año);
    
    // Si es un festivo fijo, también lo eliminamos
    eliminarFestivoFijo(menuContextual.dia, menuContextual.mes ?? 0, año);
    
    setMenuContextual(null);
    setModalEliminarFestivo({ visible: false, soloEsteAño: false });
  };

  const [modalEliminarFestivo, setModalEliminarFestivo] = useState<{
    visible: boolean;
    soloEsteAño: boolean;
  }>({ visible: false, soloEsteAño: false });

  const handleEditarFestivo = () => {
    if (!menuContextual) return;

    // Buscar el festivo existente (asumimos que está en personalizados, podría necesitar lógica adicional si también hay fijos editables)
    const festivosPersonalizados = getFestivosPersonalizados();
    const festivoExistente = festivosPersonalizados.find((f: FestivoPersonalizado) => 
      f.dia === menuContextual.dia &&
      f.mes === (menuContextual.mes ?? 0) &&
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

  const [modalEditarFestivo, setModalEditarFestivo] = useState<{
    visible: boolean;
    dia: number;
    mes: number;
    descripcion: string;
    tipo: 'nacional' | 'autonomico' | 'local';
    soloEsteAño: boolean;
    añoOriginal?: number; // Para saber si el original era específico de un año
  }>({ visible: false, dia: 0, mes: 0, descripcion: '', tipo: 'local', soloEsteAño: false });

  const confirmarEditarFestivo = () => {
    if (!modalEditarFestivo.visible) return;

    const { dia, mes, descripcion, tipo, soloEsteAño, añoOriginal } = modalEditarFestivo;

    // 1. Eliminar el festivo original
    // Necesitamos saber si el original aplicaba solo a un año para eliminarlo correctamente
    eliminarFestivo(dia, mes ?? 0, añoOriginal); 
    // Si también pudiera ser un festivo fijo editable, habría que llamar a eliminarFestivoFijo aquí

    // 2. Agregar el festivo modificado
    agregarFestivo({
      dia,
      mes: mes ?? 0,
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

    const { celdaId, letra, color, horas } = menuContextual;

    const nuevasCeldas = { ...celdas };

    if (!letra) {
      delete nuevasCeldas[celdaId];
    } else {
      nuevasCeldas[celdaId] = {
        contenido: letra,
        color: color,
        horas: horas || 0,
      };
    }
    // Guardar en localStorage para persistencia
    localStorage.setItem(`celdasTurnos_${currentYear}`, JSON.stringify(nuevasCeldas));
    setCeldas(nuevasCeldas);
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

  const handleAsignarTurno = (letra: string, color: string) => {
    if (!menuContextual) return;

    const { celdaId } = menuContextual;
    const nuevasCeldas = { ...celdas };

    const turnoConfig = configuracionTurnos?.turnos.find(t => t.letra === letra);

    if (letra) {
      nuevasCeldas[celdaId] = {
        contenido: letra,
        color: color,
        horas: turnoConfig?.horas || 0,
      };
    } else {
      // Si la letra está vacía, es para borrar el turno
      delete nuevasCeldas[celdaId];
    }
    // Guardar en localStorage para persistencia
    localStorage.setItem(`celdasTurnos_${currentYear}`, JSON.stringify(nuevasCeldas));
    setCeldas(nuevasCeldas);
    setMenuContextual(null); // Cerrar el modal después de asignar
  };

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
      // Recopilar todas las celdas de todos los años
      const todasLasCeldas: Record<string, Record<string, CeldaData>> = {};
      
      // Buscar todas las claves en localStorage que empiecen con 'celdasTurnos_'
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('celdasTurnos_')) {
          const año = key.split('_')[1];
          const celdasAño = localStorage.getItem(key);
          if (celdasAño) {
            todasLasCeldas[año] = JSON.parse(celdasAño);
          }
        }
      }
      
      const datos = {
        configuracionTurnos: localStorage.getItem('configuracionTurnos'),
        festivosPersonalizados: localStorage.getItem('festivosPersonalizados'),
        festivosEliminados: localStorage.getItem('festivosEliminados'),
        celdas: JSON.stringify(todasLasCeldas),
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
        try {
          const celdasData = JSON.parse(datos.celdas);
          
          // Verificar si es el formato nuevo (separado por años) o el antiguo
          if (typeof celdasData === 'object' && Object.keys(celdasData).some(key => /^\d{4}$/.test(key))) {
            // Formato nuevo: guardar cada año en su propia clave
            Object.entries(celdasData).forEach(([año, celdasAño]) => {
              localStorage.setItem(`celdasTurnos_${año}`, JSON.stringify(celdasAño));
            });
            
            // Actualizar las celdas del año actual
            if (celdasData[currentYear.toString()]) {
              setCeldas(celdasData[currentYear.toString()]);
            } else {
              setCeldas({});
            }
          } else {
            // Formato antiguo: guardar todas las celdas en el año actual
            localStorage.setItem(`celdasTurnos_${currentYear}`, datos.celdas);
            setCeldas(celdasData);
          }
          
          cambiosRealizados = true;
        } catch (error) {
          console.error('Error al procesar las celdas importadas:', error);
          mostrarNotificacion('Error al procesar las celdas', 'error');
        }
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

  // Función para actualizar las celdas desde localStorage (para Calendario)
  const handleActualizarCeldas = () => {
    const celdasGuardadas = localStorage.getItem(`celdasTurnos_${currentYear}`);
    if (celdasGuardadas) {
      setCeldas(JSON.parse(celdasGuardadas));
    } else {
      setCeldas({});
    }
  };

  return (
    <div className="container mx-auto p-2 sm:p-4 font-sans">
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



      <main className="card p-0 sm:p-2 md:p-4 overflow-x-auto">
        <div className="w-full min-w-[800px]">
          {/* Encabezados de días */}
          <div className="flex w-full">
            <div className="w-24 flex-shrink-0"></div> {/* Espacio para los nombres de los meses */}
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
      </main>

      {menuContextual && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm p-3 flex flex-col max-h-[90vh] animate-fade-in-fast">
            <div className="flex flex-col gap-3 max-h-full overflow-y-auto">
              <div className="border-b pb-2 mb-1 sticky top-0 bg-white z-10">
                <h3 className="text-lg font-semibold">Editar Celda</h3>
                <p className="text-xs text-gray-500">Día {menuContextual.dia} de {meses[menuContextual.mes]}</p>
              </div>

              {/* Sección para Turno Manual */}
              <div>
                <h4 className="font-semibold text-md mb-2">Turno Manual</h4>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Turno"
                    className="border p-1 rounded w-16 text-center"
                    value={menuContextual.letra}
                    onChange={(e) => setMenuContextual(prev => prev ? { ...prev, letra: e.target.value.toUpperCase() } : null)}
                    maxLength={3}
                  />
                  <input
                    type="color"
                    className="w-8 h-8 p-0 border-none rounded cursor-pointer"
                    value={menuContextual.color}
                    onChange={(e) => setMenuContextual(prev => prev ? { ...prev, color: e.target.value } : null)}
                  />
                  <input
                    type="number"
                    placeholder="Horas"
                    className="border p-1 rounded w-20"
                    value={menuContextual.horas || ''}
                    onChange={(e) => setMenuContextual(prev => prev ? { ...prev, horas: parseFloat(e.target.value) || 0 } : null)}
                  />
                  <button onClick={handleGuardarEdicionCelda} className="btn btn-primary flex-grow p-2">
                    Aplicar
                  </button>
                </div>
              </div>

              <div className="border-t my-2"></div>

              {/* Sección para asignar turno */}
              <div>
                <h4 className="font-semibold text-md mb-2">Asignar Turno Predefinido</h4>
                <div className="flex flex-wrap gap-2">
                  {configuracionTurnos?.turnos.map(turno => (
                    <button
                      key={turno.letra}
                      onClick={() => handleAsignarTurno(turno.letra, turno.color)}
                      className={`p-2 rounded-md border flex items-center transition-all duration-150 ${
                        menuContextual.letra === turno.letra ? 'bg-blue-100 border-blue-400' : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                      title={`Turno ${turno.letra} (${turno.horas}h)`}
                    >
                      <span
                        className="w-4 h-4 rounded-full mr-2 border border-gray-300"
                        style={{ backgroundColor: turno.color }}
                      ></span>
                      <span className="font-semibold">{turno.letra}</span>
                    </button>
                  ))}
                  <button
                    onClick={() => handleAsignarTurno('', '#ffffff')}
                    className="p-2 rounded-md border bg-red-50 hover:bg-red-100 text-red-700 flex items-center justify-center"
                    title="Borrar turno"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Sección para gestionar festivos */}
              <div>
                <h4 className="font-semibold text-md mb-2">Festivos</h4>
                <div className="flex flex-col space-y-1">
                  {esFestivo(menuContextual.mes, menuContextual.dia) ? (
                    <>
                      <button
                        onClick={handleEditarFestivo}
                        className="w-full text-left p-1.5 rounded-md hover:bg-gray-100"
                      >
                        Editar Festivo
                      </button>
                      <button
                        onClick={handleEliminarFestivo}
                        className="w-full text-left p-1.5 rounded-md hover:bg-gray-100 text-red-600"
                      >
                        Eliminar Festivo
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleAgregarFestivo('local')}
                        className="w-full text-left p-1.5 rounded-md hover:bg-gray-100"
                      >
                        Añadir Festivo Local
                      </button>
                      <button
                        onClick={() => handleAgregarFestivo('autonomico')}
                        className="w-full text-left p-1.5 rounded-md hover:bg-gray-100"
                      >
                        Añadir Festivo Autonómico
                      </button>
                      <button
                        onClick={() => handleAgregarFestivo('nacional')}
                        className="w-full text-left p-1.5 rounded-md hover:bg-gray-100"
                      >
                        Añadir Festivo Nacional
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Botón para cerrar el menú */}
              <button
                onClick={() => setMenuContextual(null)}
                className="w-full mt-3 p-2 rounded-md bg-gray-200 hover:bg-gray-300 font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modales para confirmación de acciones */}
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

      {mostrarConfiguracion && (
        <ConfiguracionTurnosComponent 
          onClose={() => setMostrarConfiguracion(false)}
          onSave={() => {
            setConfiguracionTurnos(getConfiguracionTurnos());
            setMostrarConfiguracion(false);
          }}
        />
      )}

      {mostrarEstadisticas && (
        <EstadisticasTurnos 
          año={currentYear}
          onClose={() => setMostrarEstadisticas(false)}
        />
      )}
    </div>
  );
}

export default App;