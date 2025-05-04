# Guía Completa para Desplegar tu Aplicación de Turnos en GitHub Pages

## Beneficios de GitHub Pages para tu Aplicación

GitHub Pages es una excelente opción para desplegar tu aplicación de turnos por las siguientes razones:

- **Acceso desde cualquier dispositivo**: Podrás acceder a tu aplicación desde móviles, tablets u ordenadores con cualquier sistema operativo.
- **Sin instalación**: Los usuarios solo necesitan abrir un navegador y visitar la URL.
- **Interfaz adaptativa**: La aplicación ya está diseñada para adaptarse a diferentes tamaños de pantalla.
- **Almacenamiento local**: Todos los datos se guardan en el navegador mediante localStorage.
- **Hosting gratuito**: GitHub Pages ofrece alojamiento gratuito para sitios estáticos.
- **Despliegue automatizado**: Puedes configurar GitHub Actions para actualizar automáticamente la aplicación.

## Preparación del Proyecto

Ya hemos realizado los siguientes cambios en tu proyecto:

1. Instalado las dependencias necesarias: `@vitejs/plugin-react` y `gh-pages`
2. Creado el archivo `vite.config.js` con la configuración para GitHub Pages
3. Actualizado el `package.json` con los scripts de despliegue
4. Creado un flujo de trabajo de GitHub Actions para automatizar el despliegue

## Pasos para Solucionar Errores de Compilación

Antes de desplegar, necesitas solucionar algunos errores de compilación:

1. En `src/App.tsx`, añade la importación del tipo `ConfiguracionTurnos`:
   ```typescript
   import { getConfiguracionTurnos, calcularTurnoParaFecha, guardarConfiguracionTurnos, ConfiguracionTurnos } from './utils/turnosConfig';
   ```

2. En `src/components/Calendario.tsx`, asegúrate de importar correctamente los tipos necesarios.

3. En `src/components/EstadisticasTurnos.tsx`, verifica las importaciones de tipos.

## Pasos para el Despliegue

1. **Corrige los errores de compilación** mencionados anteriormente.

2. **Crea un repositorio en GitHub** llamado `turnos-app`.

3. **Inicializa Git y sube el código**:
   ```bash
   git init
   git add .
   git commit -m "Versión inicial"
   git remote add origin https://github.com/TU-USUARIO/turnos-app.git
   git push -u origin main
   ```

4. **Despliega la aplicación**:
   ```bash
   npm run deploy
   ```

5. **Configura GitHub Pages** en la configuración del repositorio:
   - Ve a Settings > Pages
   - Asegúrate de que la fuente sea "Deploy from a branch"
   - Selecciona la rama "gh-pages"

## Acceso a la Aplicación

Una vez desplegada, podrás acceder a la aplicación desde cualquier dispositivo en:
```
https://TU-USUARIO.github.io/turnos-app/
```

## Consideraciones sobre el Almacenamiento de Datos

- La aplicación utiliza **localStorage** para almacenar todos los datos
- Cada dispositivo tendrá su propia copia de los datos
- Para compartir configuraciones entre dispositivos, usa la función de **exportar/importar datos**

## Actualización de la Aplicación

Cuando quieras actualizar la aplicación:

1. Realiza los cambios necesarios en el código
2. Haz commit y push a GitHub
3. Ejecuta `npm run deploy` o espera a que GitHub Actions lo haga automáticamente

## Solución de Problemas Comunes

- **Página en blanco**: Verifica que la configuración base en `vite.config.js` coincida con el nombre de tu repositorio
- **Datos no guardados**: Asegúrate de que el navegador tenga habilitado localStorage y no esté en modo incógnito
- **Errores de compilación**: Revisa las importaciones de tipos en los archivos mencionados anteriormente

---

Con esta configuración, tu aplicación de turnos estará disponible en cualquier dispositivo con acceso a internet, sin necesidad de instalación y manteniendo todas sus funcionalidades actuales.