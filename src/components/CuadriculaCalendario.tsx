import React, { memo, useCallback } from 'react';
import CeldaCalendario from './CeldaCalendario';

interface CuadriculaCalendarioProps {
  meses: string[];
  currentYear: number;
  celdas: Record<string, any>;
  editandoCelda: string | null;
  obtenerColorCelda: (mes: number, dia: number, celdaId: string) => string;
  obtenerContenidoCelda: (mes: number, dia: number, celdaId: string) => string;
  esFestivo: (mes: number, dia: number) => any;
  esFinDeSemana: (mes: number, dia: number) => boolean;
  onCeldaClick: (event: React.MouseEvent, mes: string, dia: number, mesIndex: number) => void;
  onCeldaContextMenu: (event: React.MouseEvent, mes: string, dia: number, mesIndex: number) => void;
  onCeldaMouseEnter: (celdaId: string) => void;
  onCeldaMouseLeave: () => void;
}

const CuadriculaCalendario: React.FC<CuadriculaCalendarioProps> = memo(({
  meses,
  currentYear,
  celdas,
  editandoCelda,
  obtenerColorCelda,
  obtenerContenidoCelda,
  esFestivo,
  esFinDeSemana,
  onCeldaClick,
  onCeldaContextMenu,
  onCeldaMouseEnter,
  onCeldaMouseLeave,
}) => {
  const renderDiasSemana = () => {
    return (
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map((dia, index) => (
          <div key={index} className="bg-gray-100 p-1 text-center text-xs font-semibold">
            {dia}
          </div>
        ))}
      </div>
    );
  };

  const renderMes = (mes: string, mesIndex: number) => {
    const diasEnMes = new Date(currentYear, mesIndex + 1, 0).getDate();
    const primerDia = new Date(currentYear, mesIndex, 1).getDay();
    const diasVacios = Array(primerDia).fill(null);
    const dias = Array.from({ length: diasEnMes }, (_, i) => i + 1);

    return (
      <div key={mes} className="mb-8">
        <h2 className="text-lg font-bold mb-2">{mes} {currentYear}</h2>
        {renderDiasSemana()}
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {diasVacios.map((_, index) => (
            <div key={`empty-${index}`} className="h-8 bg-white" />
          ))}
          {dias.map((dia) => {
            const celdaId = `${mes}-${dia}`;
            const esDiaFestivo = !!esFestivo(mesIndex, dia);
            const esDiaFinDeSemana = esFinDeSemana(mesIndex, dia);
            const color = obtenerColorCelda(mesIndex, dia, celdaId);
            const contenido = obtenerContenidoCelda(mesIndex, dia, celdaId);
            const esEditando = editandoCelda === celdaId;

            return (
              <CeldaCalendario
                key={celdaId}
                mes={mes}
                mesIndex={mesIndex}
                dia={dia}
                esFestivo={esDiaFestivo}
                esFinDeSemana={esDiaFinDeSemana}
                contenido={contenido}
                color={color}
                esEditando={esEditando}
                onCeldaClick={onCeldaClick}
                onCeldaContextMenu={onCeldaContextMenu}
                onMouseEnter={onCeldaMouseEnter}
                onMouseLeave={onCeldaMouseLeave}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
      {meses.map((mes, index) => renderMes(mes, index))}
    </div>
  );
}, (prevProps, nextProps) => {
  // Solo volver a renderizar si estas props cambian
  return (
    prevProps.currentYear === nextProps.currentYear &&
    prevProps.editandoCelda === nextProps.editandoCelda &&
    JSON.stringify(prevProps.celdas) === JSON.stringify(nextProps.celdas)
  );
});

CuadriculaCalendario.displayName = 'CuadriculaCalendario';

export default CuadriculaCalendario;
