# Pasos para Desplegar en GitHub Pages

## Solución de Errores de Compilación

Antes de desplegar la aplicación, es necesario solucionar los errores de compilación detectados:

1. Instala las dependencias necesarias (ya realizado):
```bash
npm install --save-dev @vitejs/plugin-react gh-pages
```

2. Corrige los errores de importación en los archivos:
   - En `src/App.tsx`: Verifica las importaciones de los tipos y funciones
   - En `src/components/Calendario.tsx`: Asegúrate de importar correctamente los tipos
   - En `src/components/EstadisticasTurnos.tsx`: Revisa las importaciones

3. Específicamente, asegúrate de que los tipos `ConfiguracionTurnos` y `Festivo` estén correctamente importados en todos los archivos que los utilizan.

## Pasos para el Despliegue

1. Una vez corregidos los errores, ejecuta el comando de construcción:
```bash
npm run build
```

2. Crea un repositorio en GitHub llamado `turnos-app`

3. Inicializa Git y sube el código al repositorio:
```bash
git init
git add .
git commit -m "Versión inicial"
git remote add origin https://github.com/TU-USUARIO/turnos-app.git
git push -u origin main
```

4. Despliega la aplicación en GitHub Pages:
```bash
npm run deploy
```

5. Configura GitHub Pages en la configuración del repositorio:
   - Ve a Settings > Pages
   - Asegúrate de que la fuente sea "Deploy from a branch"
   - Selecciona la rama "gh-pages"

## Acceso a la Aplicación

Una vez desplegada, podrás acceder a la aplicación desde cualquier dispositivo en:
```
https://TU-USUARIO.github.io/turnos-app/
```

## Consideraciones sobre el Almacenamiento de Datos

- La aplicación utiliza localStorage para almacenar todos los datos
- Cada dispositivo tendrá su propia copia de los datos
- Para compartir configuraciones entre dispositivos, usa la función de exportar/importar datos

## Ventajas de GitHub Pages

- Hosting gratuito para tu aplicación
- Accesible desde cualquier dispositivo con navegador web
- Funciona en móviles, tablets y ordenadores
- No requiere instalación, solo acceder a la URL
- La interfaz se adapta automáticamente al tamaño de pantalla