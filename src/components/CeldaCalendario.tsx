import React, { memo } from 'react';

interface CeldaCalendarioProps {
  mes: string;
  mesIndex: number;
  dia: number;
  esFestivo: boolean;
  esFinDeSemana: boolean;
  contenido: string;
  color: string;
  esEditando: boolean;
  onCeldaClick: (event: React.MouseEvent, mes: string, dia: number, mesIndex: number) => void;
  onCeldaContextMenu: (event: React.MouseEvent, mes: string, dia: number, mesIndex: number) => void;
  onMouseEnter: (celdaId: string) => void;
  onMouseLeave: () => void;
}

const CeldaCalendario: React.FC<CeldaCalendarioProps> = memo(({
  mes,
  mesIndex,
  dia,
  esFestivo,
  esFinDeSemana,
  contenido,
  color,
  esEditando,
  onCeldaClick,
  onCeldaContextMenu,
  onMouseEnter,
  onMouseLeave,
}) => {
  const celdaId = `${mes}-${dia}`;
  
  const handleClick = (e: React.MouseEvent) => {
    onCeldaClick(e, mes, dia, mesIndex);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onCeldaContextMenu(e, mes, dia, mesIndex);
  };

  const handleMouseEnter = () => {
    onMouseEnter(celdaId);
  };

  return (
    <div
      key={`${mes}-${dia}`}
      className={`
        border border-gray-200 h-8 flex items-center justify-center relative cursor-pointer
        ${esFinDeSemana ? 'bg-blue-100' : ''}
        ${esFestivo ? 'bg-red-100' : ''}
      `}
      style={{ backgroundColor: color }}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <span className={`text-xs ${esFestivo ? 'font-bold text-red-800' : 'text-gray-800'}`}>
        {contenido}
      </span>
      {esEditando && (
        <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none"></div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Solo volver a renderizar si estas props cambian
  return (
    prevProps.contenido === nextProps.contenido &&
    prevProps.color === nextProps.color &&
    prevProps.esEditando === nextProps.esEditando &&
    prevProps.esFestivo === nextProps.esFestivo
  );
});

CeldaCalendario.displayName = 'CeldaCalendario';

export default CeldaCalendario;
