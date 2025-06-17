import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { obtenerFestivos, Festivo, eliminarFestivoFijo, restaurarFestivoFijo, getFestivosEliminados } from './utils/festivos';
import { agregarFestivo, eliminarFestivo, getFestivosPersonalizados, FestivoPersonalizado } from './utils/festivosPersonalizados';
import { getConfiguracionTurnos, calcularTurnoParaFecha, guardarConfiguracionTurnos, ConfiguracionTurnos, Turno } from './utils/turnosConfig';
import { default as ConfiguracionTurnosComponent } from './components/ConfiguracionTurnos';
import EstadisticasTurnos from './components/EstadisticasTurnos';

interface CeldaData {
  contenido?: string;
  esFestivo?: boolean;
  descripcionFestivo?: string;
  color?: string;
}

// Definir el tipo para el estado del menú contextual sin clientX/clientY
interface MenuContextualState {
  dia: number;
  mes: number;
  celdaId: string;
  letra: string;
  color: string;
  horas: number;
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
  // Usar el nuevo tipo para menuContextual
  const [menuContextual, setMenuContextual] = useState<MenuContextualState | null>(null);
  const [mostrarEstadisticas, setMostrarEstadisticas] = useState(false);
  const [mostrarMenuAjustes, setMostrarMenuAjustes] = useState(false);

  // Clave para almacenar las celdas en localStorage, ahora específica por año
  const CELDAS_STORAGE_KEY = `celdasTurnos_${currentYear}`;

  // Estado para almacenar los festivos del año actual después de calcularlos
  // Combinaremos festivos fijos (no eliminados para este año) y personalizados (del año actual o sin año)
  const [activeFestivos, setActiveFestivos] = useState<Festivo[]>([]);

  // Mover las funciones de utilidad antes de su uso
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

  // Cargar datos iniciales y recalcular festivos activos al cambiar el año
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

    // Recalcular y almacenar los festivos activos para el año actual
    // obtenerFestivos ya combina festivos fijos (filtrando eliminados) y personalizados (filtrando por año)
    setActiveFestivos(obtenerFestivos(currentYear));

  }, [currentYear]);

  // Memoize the festivo check function
  const esFestivo = useCallback((mes: number, dia: number): Festivo | undefined => {
    return activeFestivos.find(f => f.mes === mes && f.dia === dia);
  }, [activeFestivos]);

  // Memoize turno calculations for each date
  const turnosCache = useMemo(() => {
    const cache: Record<string, { letra: string | null, color: string | null }> = {};
    
    for (let mes = 0; mes < 12; mes++) {
      const diasEnMes = new Date(currentYear, mes + 1, 0).getDate();
      for (let dia = 1; dia <= diasEnMes; dia++) {
        const fecha = new Date(currentYear, mes, dia);
        const celdaId = `${meses[mes]}-${dia}`;
        
        // Check if there's a manual assignment
        if (celdas[celdaId]?.contenido) {
          cache[celdaId] = {
            letra: celdas[celdaId].contenido,
            color: celdas[celdaId].color || null
          };
        } else if (configuracionTurnos) {
          // Calculate automatic turn
          const turno = calcularTurnoParaFecha(fecha, configuracionTurnos);
          cache[celdaId] = {
            letra: turno?.letra || null,
            color: turno?.color || null
          };
        }
      }
    }
    return cache;
  }, [currentYear, celdas, configuracionTurnos]);

  // Memoize cell colors
  const coloresCache = useMemo(() => {
    const cache: Record<string, string> = {};
    
    for (let mes = 0; mes < 12; mes++) {
      const diasEnMes = new Date(currentYear, mes + 1, 0).getDate();
      for (let dia = 1; dia <= diasEnMes; dia++) {
        const celdaId = `${meses[mes]}-${dia}`;
        
        // If it's a holiday, always use red
        if (esFestivo(mes, dia)) {
          cache[celdaId] = '#fca5a5';
          continue;
        }
        
        // If there's a manual color, use it
        if (celdas[celdaId]?.color) {
          cache[celdaId] = celdas[celdaId].color;
          continue;
        }
        
        // If it's weekend, use gray
        if (esFinDeSemana(mes, dia)) {
          cache[celdaId] = '#e5e7eb';
          continue;
        }
        
        // If there's a turn color, use it
        const turnoColor = turnosCache[celdaId]?.color;
        if (turnoColor) {
          cache[celdaId] = turnoColor;
          continue;
        }
        
        // Default to white
        cache[celdaId] = 'white';
      }
    }
    return cache;
  }, [currentYear, celdas, esFestivo, turnosCache]);

  // Update the obtenerColorCelda function to use the cache
  const obtenerColorCelda = useCallback((mes: number, dia: number, celdaId: string): string => {
    if (hoveredCell === celdaId) {
      return '#f3f4f6';
    }
    return coloresCache[celdaId] || 'white';
  }, [hoveredCell, coloresCache]);

  // Update the obtenerContenidoCelda function to use the cache
  const obtenerContenidoCelda = useCallback((mes: number, dia: number, celdaId: string): string => {
    return turnosCache[celdaId]?.letra || '';
  }, [turnosCache]);

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

    // Buscar el turno actual para obtener las horas si existe
    let horasTurno = 0;
    const letraTurno = celdas[celdaId]?.contenido || obtenerTurnoParaFecha(mesIndex, dia) || '';

    if (configuracionTurnos && letraTurno) {
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
      color: celdas[celdaId]?.color || obtenerColorTurno(mesIndex, dia) || '#ffffff',
      horas: horasTurno,
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

  const [modalFestivo, setModalFestivo] = useState<{
    visible: boolean;
    tipo?: 'nacional' | 'autonomico' | 'local';
    descripcion: string;
    soloEsteAño: boolean;
    dia: number | undefined;
    mes: number | undefined;
    celdaId?: string;
  }>({ visible: false, descripcion: '', soloEsteAño: false, dia: undefined, mes: undefined });

  const handleAgregarFestivo = (tipo: 'nacional' | 'autonomico' | 'local') => {
    // Asegurarse de que el menú contextual está abierto
    if (!menuContextual) return;

    // Guardar datos del menú contextual en el estado del modal antes de cerrarlo
    const { dia, mes, celdaId } = menuContextual;

    setMenuContextual(null); // Cerrar menú contextual

    // Mostrar modal para agregar festivo, pasando los datos de la celda
    setModalFestivo({
      visible: true,
      tipo,
      descripcion: '',
      soloEsteAño: false,
      dia: dia,
      mes: mes,
      celdaId: celdaId,
    });
  };

  const confirmarAgregarFestivo = () => {
    // Asegurar que el modal está visible y tiene los datos necesarios (dia y mes definidos)
    if (!modalFestivo.visible || !modalFestivo.tipo || !modalFestivo.descripcion || modalFestivo.dia === undefined || modalFestivo.mes === undefined) return;

    // Obtener los datos del festivo desde el estado del modal
    const { dia, mes, descripcion, tipo, soloEsteAño } = modalFestivo;

    // Agregar festivo personalizado. Si soloEsteAño es true, se guarda con el año actual. Si no, sin año.
    // La función agregarFestivo en festivosPersonalizados.ts requiere 'año: number'.
    // Si soloEsteAño es false, la intención original de guardar sin año no encaja con la actual utilidad.
    // Asumiendo que si no es soloEsteAño, se desea agregar un festivo personalizado para el año actual.
     agregarFestivo({
        dia: dia,
        mes: mes,
        descripcion: descripcion,
        tipo: tipo,
        año: soloEsteAño ? currentYear : currentYear // Siempre pasar un número para el año
     } as FestivoPersonalizado);

    // Recalcular festivos activos del año actual después de agregar
    setActiveFestivos(obtenerFestivos(currentYear));

    setModalFestivo({ visible: false, descripcion: '', soloEsteAño: false, dia: undefined, mes: undefined }); // Resetear dia y mes al cerrar
    mostrarNotificacion('Festivo agregado correctamente', 'success');
  };

  const [modalEliminarFestivo, setModalEliminarFestivo] = useState<{
    visible: boolean;
    soloEsteAño: boolean;
    dia: number | undefined;
    mes: number | undefined;
    celdaId?: string;
  }>({ visible: false, soloEsteAño: false, dia: undefined, mes: undefined });

  const handleEliminarFestivo = () => {
    // Asegurarse de que el menú contextual está abierto
    if (!menuContextual) return;

     // Guardar datos del menú contextual en el estado del modal antes de cerrarlo
    const { dia, mes, celdaId } = menuContextual;

    setMenuContextual(null); // Cerrar menú contextual

    // Mostrar modal para eliminar festivo, pasando los datos de la celda
    setModalEliminarFestivo({
      visible: true,
      soloEsteAño: false,
      dia: dia,
      mes: mes,
      celdaId: celdaId,
    });
  };

  const confirmarEliminarFestivo = () => {
    // Asegurar que el modal está visible y tiene los datos necesarios (dia y mes definidos)
    if (!modalEliminarFestivo.visible || modalEliminarFestivo.dia === undefined || modalEliminarFestivo.mes === undefined) return; // celdaId no es estrictamente necesario para eliminar festivo

     // Obtener los datos del festivo desde el estado del modal
    const { dia, mes, soloEsteAño } = modalEliminarFestivo;

    // Intentar eliminar primero como festivo personalizado.
    // eliminarFestivo requiere el año (number).
    // Si soloEsteAño es true, eliminamos el personalizado del currentYear.
    // Si soloEsteAño es false, y queremos eliminar un personalizado general, nuestra utilidad actual no lo soporta.
    // Asumiendo que si soloEsteAño es false, la intención es eliminar el personalizado para el AÑO ACTUAL.
    eliminarFestivo(dia, mes, currentYear); // Pasa currentYear (number)

    // Si es un festivo fijo, también lo eliminamos (marcando como eliminado para el año actual o todos).
     eliminarFestivoFijo(dia, mes, soloEsteAño ? currentYear : undefined);

    // Recalcular festivos activos del año actual después de eliminar
    setActiveFestivos(obtenerFestivos(currentYear));

    setModalEliminarFestivo({ visible: false, soloEsteAño: false, dia: undefined, mes: undefined }); // Resetear dia y mes al cerrar
    mostrarNotificacion('Festivo eliminado correctamente', 'success');
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
    celdaId?: string; // Añadir celdaId al estado del modal de editar festivo si es necesario
  }>({ visible: false, dia: 0, mes: 0, descripcion: '', tipo: 'local', soloEsteAño: false });

  const handleEditarFestivo = () => {
     // Asegurarse de que el menú contextual está abierto
    if (!menuContextual) return;

     // Guardar datos del menú contextual en el estado del modal (dia, mes, celdaId)
    const { dia, mes, celdaId } = menuContextual;

    setMenuContextual(null); // Cerrar menú contextual

    // Buscar el festivo existente en la lista de festivos activos
    const festivoExistente = activeFestivos.find((f: Festivo) => // Usar el tipo Festivo
      f.dia === dia &&
      f.mes === mes &&
      (f.año === undefined || f.año === currentYear) // Considerar festivos sin año (fijos) o del año actual (personalizados)
    );

    if (!festivoExistente) {
      console.warn("No se encontró festivo para editar en esta fecha.");
      setModalEditarFestivo({ visible: false, dia: 0, mes: 0, descripcion: '', tipo: 'local', soloEsteAño: false }); // Asegurarse de que el modal esté cerrado si no hay festivo
      mostrarNotificacion('No hay festivo para editar en esta fecha', 'error');
      return;
    }

    // Mostrar modal para editar festivo, precargando los datos del festivo existente y los datos de la celda
    setModalEditarFestivo({
      visible: true,
      dia: festivoExistente.dia,
      mes: festivoExistente.mes,
      descripcion: festivoExistente.descripcion,
      tipo: festivoExistente.tipo,
      soloEsteAño: festivoExistente.año === currentYear, // Marcar si era específico de este año
      añoOriginal: festivoExistente.año, // Guardar el año original por si acaso (undefined for fixed)
      celdaId: celdaId, // Guardar el celdaId también
    });

    // El menú contextual ya se cerró arriba
  };

  const confirmarEditarFestivo = () => {
    // Asegurar que el modal está visible y tiene los datos necesarios (dia, mes, descripcion, tipo definidos)
    if (!modalEditarFestivo.visible || modalEditarFestivo.dia === undefined || modalEditarFestivo.mes === undefined || !modalEditarFestivo.descripcion || modalEditarFestivo.tipo === undefined) return;

    const { dia, mes, descripcion, tipo, soloEsteAño, añoOriginal } = modalEditarFestivo;

    // Lógica para eliminar el festivo original:
    // eliminarFestivo en festivosPersonalizados.ts requiere un año number.
    // Si el original tenía añoOriginal (era personalizado con año), lo eliminamos con ese año.
    // Si añoOriginal es undefined (era fijo), no llamamos a eliminarFestivo.
    if (añoOriginal !== undefined) { // Era personalizado con año
        eliminarFestivo(dia, mes, añoOriginal);
    } else { // Era fijo
         // Si el original era fijo y ahora se edita para ser solo de este año, marcamos el fijo como eliminado para este año.
         // Si se edita para ser fijo nuevamente (soloEsteAño false), nos aseguramos de que no esté marcado como eliminado para este año.
         if (soloEsteAño) {
             eliminarFestivoFijo(dia, mes, currentYear);
         } else {
             restaurarFestivoFijo(dia, mes, currentYear);
         }

    }

    // Lógica para agregar el festivo modificado:
    // agregarFestivo requiere un festivo de tipo FestivoPersonalizado, que tiene 'año: number'.
    // Siempre debemos pasar un número para el año al llamar a agregarFestivo.
     agregarFestivo({
        dia: dia,
        mes: mes,
        descripcion: descripcion,
        tipo: tipo,
        año: soloEsteAño ? currentYear : currentYear // Siempre pasar un número para el año
     } as FestivoPersonalizado); // Asegurar el tipo

    // Recalcular festivos activos del año actual después de editar
    setActiveFestivos(obtenerFestivos(currentYear));

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
      // Guardar en localStorage con clave específica para el año actual
      localStorage.setItem(`celdasTurnos_${currentYear}`, JSON.stringify(nuevasCeldas));
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
        // Recalcular festivos activos después de importar
        setActiveFestivos(obtenerFestivos(currentYear));
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
    <div className="main-calendar-container w-full" style={{overflowX: 'hidden'}}>
      {/* Modal para agregar festivo */}
      {modalFestivo.visible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200]">
          <div className="bg-white rounded-lg shadow-xl p-3 w-80 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-base font-semibold">Agregar festivo</h3>
              <button 
                className="text-gray-500 hover:text-gray-700" 
                onClick={() => setModalFestivo({ visible: false, descripcion: '', soloEsteAño: false, dia: undefined, mes: undefined })}
              >
                &times;
              </button>
            </div>
            <p className="text-xs text-gray-600 mb-2">
              {modalFestivo.dia} de {meses[modalFestivo.mes || 0]}
            </p>
            <div className="mb-2">
              <label className="block text-xs font-medium mb-1">Descripción:</label>
              <input
                type="text"
                className="w-full border rounded p-1 text-sm"
                value={modalFestivo.descripcion}
                onChange={(e) => setModalFestivo(prev => ({ ...prev, descripcion: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="mb-3">
              <label className="flex items-center text-xs">
                <input
                  type="checkbox"
                  className="mr-1"
                  checked={modalFestivo.soloEsteAño}
                  onChange={(e) => setModalFestivo(prev => ({ ...prev, soloEsteAño: e.target.checked }))}
                />
                Solo para {currentYear}
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                onClick={() => setModalFestivo({ visible: false, descripcion: '', soloEsteAño: false, dia: undefined, mes: undefined })}
              >
                Cancelar
              </button>
              <button
                className="px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded"
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
          <div className="bg-white rounded-lg shadow-xl p-3 w-80 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-base font-semibold">Eliminar festivo</h3>
              <button 
                className="text-gray-500 hover:text-gray-700" 
                onClick={() => setModalEliminarFestivo({ visible: false, soloEsteAño: false, dia: undefined, mes: undefined })}
              >
                &times;
              </button>
            </div>
            <p className="text-xs text-gray-600 mb-2">
              {modalEliminarFestivo.dia} de {meses[modalEliminarFestivo.mes || 0]}
            </p>
            <p className="mb-3 text-xs">¿Estás seguro de que deseas eliminar este festivo?</p>
            <div className="mb-3">
              <label className="flex items-center text-xs">
                <input
                  type="checkbox"
                  className="mr-1"
                  checked={modalEliminarFestivo.soloEsteAño}
                  onChange={(e) => setModalEliminarFestivo(prev => ({ ...prev, soloEsteAño: e.target.checked }))}
                />
                Solo para {currentYear}
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                onClick={() => setModalEliminarFestivo({ visible: false, soloEsteAño: false, dia: undefined, mes: undefined })}
              >
                Cancelar
              </button>
              <button
                className="px-2 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded"
                onClick={confirmarEliminarFestivo}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* El modal para eliminar festivos se ha unificado */}
      {/* Modal para EDITAR festivo */}
      {modalEditarFestivo.visible && (
        // Aumentar el z-index para asegurar que esté por encima de otros modales y elementos
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[300]">
          <div className="bg-white rounded-lg shadow-xl p-3 w-80 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-base font-semibold">Editar festivo</h3>
              <button 
                className="text-gray-500 hover:text-gray-700" 
                onClick={() => setModalEditarFestivo({ visible: false, dia: 0, mes: 0, descripcion: '', tipo: 'local', soloEsteAño: false })}
              >
                &times;
              </button>
            </div>
            <p className="text-xs text-gray-600 mb-2">
              {modalEditarFestivo.dia} de {meses[modalEditarFestivo.mes]}
            </p>
            <div className="mb-2">
              <label className="block text-xs font-medium mb-1">Descripción:</label>
              <input
                type="text"
                className="w-full border rounded p-1 text-sm"
                value={modalEditarFestivo.descripcion}
                onChange={(e) => setModalEditarFestivo(prev => ({ ...prev, descripcion: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="mb-2">
              <label className="block text-xs font-medium mb-1">Tipo:</label>
              <select
                className="w-full border rounded p-1 text-sm"
                value={modalEditarFestivo.tipo}
                onChange={(e) => setModalEditarFestivo(prev => ({ ...prev, tipo: e.target.value as 'nacional' | 'autonomico' | 'local' }))}
              >
                <option value="nacional">Nacional</option>
                <option value="autonomico">Autonómico</option>
                <option value="local">Local</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="flex items-center text-xs">
                <input
                  type="checkbox"
                  className="mr-1"
                  checked={modalEditarFestivo.soloEsteAño}
                  onChange={(e) => setModalEditarFestivo(prev => ({ ...prev, soloEsteAño: e.target.checked }))}
                />
                Solo para {currentYear}
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button
                className="px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded"
                onClick={() => setModalEditarFestivo({ visible: false, dia: 0, mes: 0, descripcion: '', tipo: 'local', soloEsteAño: false })}
              >
                Cancelar
              </button>
              <button
                className="px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded"
                onClick={confirmarEditarFestivo}
                disabled={!modalEditarFestivo.descripcion}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="mb-4 py-3 sm:mb-1 sm:py-1 bg-white rounded-t-lg shadow max-w-full md:max-w-4xl lg:max-w-6xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-0 px-4 sm:px-1">
          <h1 className="text-2xl font-bold sm:text-base">Calendario de Turnos</h1>

          <div className="flex items-center gap-2 md:gap-4 sm:gap-0">
            <button
              className="btn btn-secondary btn-sm md:btn-md"
              onClick={() => cambiarAño(-1)}
            >
              &lt;
            </button>
            <h2 className="text-lg font-semibold sm:text-sm mx-1">{currentYear}</h2>
            <button
              className="btn btn-secondary btn-sm md:btn-md"
              onClick={() => cambiarAño(1)}
            >
              &gt;
            </button>

            <button
              className="btn btn-secondary btn-sm md:btn-md ml-2 sm:ml-1 sm:btn-xs"
              onClick={() => setMostrarEstadisticas(!mostrarEstadisticas)}
            >
              Estadísticas
            </button>

            <div className="relative">
              <button
                className="btn btn-primary btn-sm md:btn-md sm:btn-xs"
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

      {/* Componente de Configuración como Modal */}
      {mostrarConfiguracion && (
        <div className="modal-overlay">
          <div className="modal-content sm:p-3">
             {/* Puedes añadir un modal-header si el componente ConfiguracionTurnosComponent no tiene uno interno */}
             {/* <div className="modal-header"><h3>Configuración</h3><button className="modal-close" onClick={() => setMostrarConfiguracion(false)}>&times;</button></div> */}
            <ConfiguracionTurnosComponent
              onClose={() => setMostrarConfiguracion(false)}
              onSave={() => {
                setConfiguracionTurnos(getConfiguracionTurnos());
                setMostrarConfiguracion(false);
                 // Recalcular festivos activos si la configuración de turnos afecta festivos (aunque no parece ser el caso actual)
                setActiveFestivos(obtenerFestivos(currentYear));
              }}
            />
             {/* Puedes añadir un modal-footer si es necesario */}
          </div>
        </div>
      )}

      {/* Componente de Estadísticas como Modal */}
      {mostrarEstadisticas && (
         <div className="modal-overlay">
          <div className="modal-content sm:p-3">
            {/* Puedes añadir un modal-header si el componente EstadisticasTurnos no tiene uno interno */}
             {/* <div className="modal-header"><h3>Estadísticas</h3><button className="modal-close" onClick={() => setMostrarEstadisticas(false)}>&times;</button></div> */}
            <EstadisticasTurnos
              año={currentYear}
              onClose={() => setMostrarEstadisticas(false)}
              // Pasar los festivos activos para que EstadisticasTurnos no los recalcule si los necesita
              activeFestivos={activeFestivos}
            />
             {/* Puedes añadir un modal-footer si es necesario */}
          </div>
        </div>
      )}

      <div className="w-full calendario-grid-interna">
        {/* Encabezados de días */}
        <div className="flex w-full">
          {/* Columna de meses - mantener ancho fijo y sticky */}
          <div className="w-24 flex-shrink-0 sticky left-0 bg-gray-50 z-10 border-r sm:w-12 text-xs sm:text-[10px] calendario-celda-mes">
             {/* Espacio vacío para alinear con las filas de meses */}
             <div className="h-8 border-b"></div>
          </div>
          {/* Contenedor de días - permitir que crezca lo necesario y aplicar ancho mínimo a las celdas */}
          <div className="flex flex-grow">
            {Array.from({ length: maxDias }, (_, i) => i + 1).map((dia) => (
              <div
                key={dia}
                className={`flex-1 h-8 border flex items-center justify-center relative bg-gray-50 text-xs font-medium min-w-[35px] sm:text-[9px] sm:min-w-[28px] calendario-celda-header`}
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
            <div key={mes} className="flex w-full calendario-fila-mes">
              {/* Columna del nombre del mes - mantener ancho fijo y sticky */}
              <div className="w-24 flex-shrink-0 flex items-center justify-center border sticky left-0 bg-gray-50 font-medium text-sm z-10 border-r sm:w-12 text-xs sm:text-[10px] calendario-celda-mes">
                {mes}
              </div>
              {/* Contenedor de días del mes - permitir que crezca lo necesario y aplicar ancho mínimo a las celdas */}
              <div className="flex flex-grow">
                {Array.from({ length: maxDias }, (_, i) => i + 1).map((dia) => {
                  const esDiaValido = dia <= diasEnEsteMes;
                  if (!esDiaValido) {
                    return (
                      <div
                        key={`${mes}-${dia}`}
                        className="flex-1 h-12 bg-gray-50 border min-w-[35px] sm:min-w-[28px] calendario-celda-dia"
                      />
                    );
                  }

                  const celdaId = `${mes}-${dia}`;
                  const diaSemana = obtenerDiaSemana(mesIndex, dia);
                  const festivoActual = esFestivo(mesIndex, dia); // Usar la función optimizada
                  const color = obtenerColorCelda(mesIndex, dia, celdaId);
                  const contenido = obtenerContenidoCelda(mesIndex, dia, celdaId);

                  return (
                    <div
                      key={`${mes}-${dia}`}
                      className={`flex-1 h-12 border relative flex flex-col items-center justify-center min-w-[35px] sm:min-w-[28px] calendario-celda-dia`}
                      style={{ backgroundColor: color }}
                      onClick={(e) => handleCeldaClick(e, mes, dia, mesIndex)}
                      onMouseEnter={() => setHoveredCell(celdaId)}
                      onMouseLeave={() => setHoveredCell(null)}
                      title={festivoActual ? `Festivo: ${festivoActual.descripcion}` : ''}
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
                      {festivoActual && (
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

      {/* El panel de gestión de festivos se ha unificado con el menú contextual */}

      {menuContextual && (
        <div className="modal-overlay">
          <div className="modal-content sm:p-3">
            <div className="modal-header sm:py-2">
              <h3 className="modal-title sm:text-base">Editar Celda</h3>
              <button className="modal-close sm:text-lg" onClick={() => setMenuContextual(null)}>&times;</button>
            </div>
            <div className="modal-body flex flex-col gap-6 sm:gap-3">
              <div>
                <h4 className="font-medium mb-3 sm:text-sm sm:mb-1">Configurar Turno</h4>
                <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-start md:items-center mb-4 sm:gap-2 sm:mb-2">
                  <div className="flex items-center gap-2 sm:gap-1">
                    <label className="text-sm whitespace-nowrap sm:text-xs">Turno:</label>
                    <input
                      type="text"
                      className="border p-2 w-20 rounded sm:p-1 sm:w-16 sm:text-sm"
                      value={menuContextual.letra}
                      onChange={(e) => setMenuContextual(prev => prev ? {...prev, letra: e.target.value} : null)}
                    />
                  </div>
                  <div className="flex items-center gap-2 sm:gap-1">
                    <label className="text-sm mr-1 whitespace-nowrap sm:text-xs">Color:</label>
                    <input
                      type="color"
                      className="p-1 h-9 w-9 rounded border-0 sm:h-7 sm:w-7"
                      value={menuContextual.color}
                      onChange={(e) => setMenuContextual(prev => prev ? {...prev, color: e.target.value} : null)}
                    />
                  </div>
                </div>
                {configuracionTurnos && configuracionTurnos.turnos.length > 0 && (
                  <div className="mt-4 sm:mt-2">
                    <h5 className="text-sm font-semibold mb-2 sm:text-xs sm:mb-1">Seleccionar turno predefinido:</h5>
                    <div className="flex flex-wrap gap-2 sm:gap-1">
                      {configuracionTurnos.turnos.map(turno => (
                        <button
                          key={turno.letra}
                          className="btn btn-sm"
                          style={{ backgroundColor: turno.color, color: 'white' }}
                          onClick={() => seleccionarTurnoDesdeMenu(turno.letra, turno.color)}
                        >
                          {turno.letra} ({turno.horas}h)
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sección de gestión de festivos (simplificada para usar modales dedicados) */}
              {/* Los botones de festivos ahora abrirán los modales correspondientes */}
              <div className="border-t pt-4 mt-4 sm:pt-2 sm:mt-2">
                <h4 className="font-medium mb-2 sm:text-sm sm:mb-1">Añadir como festivo:</h4>
                <div className="flex gap-2 flex-wrap sm:gap-1">
                  <button className="btn btn-secondary btn-sm" onClick={() => handleAgregarFestivo('nacional')}>NACIÓN</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleAgregarFestivo('autonomico')}>AUTONÓMICO</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleAgregarFestivo('local')}>LOCAL</button>
                </div>
                {/* Usar activeFestivos para verificar si hay un festivo existente en esta fecha */}
                {activeFestivos.find(f => f.dia === menuContextual.dia && f.mes === menuContextual.mes && (f.año === undefined || f.año === currentYear)) && (
                   <div className="mt-4 sm:mt-2">
                    <h4 className="font-medium mb-2 sm:text-sm sm:mb-1">Gestión de festivo existente:</h4>
                    <div className="flex gap-2 flex-wrap sm:gap-1">
                       {/* Botón para editar festivo existente */}
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={handleEditarFestivo}
                      >
                        Editar Festivo
                      </button>
                      {/* Botón para eliminar festivo existente */}
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={handleEliminarFestivo}
                      >
                        Eliminar Festivo
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer sm:py-2">
              <button
                className="btn btn-secondary sm:btn-sm"
                onClick={() => setMenuContextual(null)}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary sm:btn-sm"
                onClick={handleGuardarEdicionCelda}
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de importación */}
      {modalImportacion.visible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200]">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-h-[90vh] overflow-y-auto sm:w-11/12 sm:p-3">
            <h3 className="text-lg font-semibold mb-4 sm:text-base sm:mb-2">Confirmar importación</h3>
            <p className="mb-4 sm:mb-2 sm:text-sm">¿Estás seguro de que deseas importar los datos del archivo "{modalImportacion.archivo?.name}"?</p>
            <p className="mb-4 text-sm text-red-600 sm:mb-2 sm:text-xs">Esta acción sobrescribirá tus datos actuales.</p>

            {modalImportacion.datos?.fechaExportacion && (
              <p className="mb-4 text-sm sm:mb-2 sm:text-xs">
                Fecha de exportación: {new Date(modalImportacion.datos.fechaExportacion).toLocaleString()}
              </p>
            )}

            <div className="flex justify-end gap-2 sm:gap-1">
              <button
                className="btn btn-secondary sm:btn-sm"
                onClick={() => setModalImportacion({ visible: false, datos: null, archivo: null })}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary sm:btn-sm"
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
