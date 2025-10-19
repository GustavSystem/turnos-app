export interface FestivoPersonalizado { // Añadido export
  dia: number;
  mes: number;
  descripcion: string;
  tipo: 'nacional' | 'autonomico' | 'local';
  año?: number; // Ahora es obligatorio para separar por año
}

// Almacenar en localStorage
const STORAGE_KEY = 'festivosPersonalizados';

export const getFestivosPersonalizados = (año?: number): FestivoPersonalizado[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  const festivos = stored ? JSON.parse(stored) : [];
  
  // Si se especifica un año, filtrar solo los festivos de ese año
  if (año) {
    return festivos.filter((festivo: FestivoPersonalizado) => festivo.año === año);
  }
  
  return festivos;
};

export const agregarFestivo = (festivo: FestivoPersonalizado) => {
  // Asegurarse de que el festivo tiene un año asignado
  if (!festivo.año) {
    festivo.año = new Date().getFullYear();
  }
  
  const festivos = getFestivosPersonalizados();
  festivos.push(festivo);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(festivos));
};

export const eliminarFestivo = (dia: number, mes: number, año?: number) => {
  const festivos = getFestivosPersonalizados();
  const festivosFiltrados = festivos.filter(f => 
    !(f.dia === dia && f.mes === mes && f.año === año)
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(festivosFiltrados));
};