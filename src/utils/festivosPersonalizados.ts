export interface FestivoPersonalizado { // Añadido export
  dia: number;
  mes: number;
  descripcion: string;
  tipo: 'nacional' | 'autonomico' | 'local';
  año?: number; // opcional, si no se especifica aplica a todos los años
}

// Almacenar en localStorage
const STORAGE_KEY = 'festivosPersonalizados';

export const getFestivosPersonalizados = (): FestivoPersonalizado[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const agregarFestivo = (festivo: FestivoPersonalizado) => {
  const festivos = getFestivosPersonalizados();
  festivos.push(festivo);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(festivos));
};

export const eliminarFestivo = (dia: number, mes: number, año?: number) => {
  const festivos = getFestivosPersonalizados();
  const festivosFiltrados = festivos.filter(f => 
    !(f.dia === dia && f.mes === mes && (!año || f.año === año))
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(festivosFiltrados));
}; 