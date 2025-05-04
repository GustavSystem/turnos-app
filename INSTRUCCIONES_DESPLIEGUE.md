# Instrucciones para Desplegar en GitHub Pages

Sigue estos pasos para desplegar la aplicación de turnos en GitHub Pages y acceder desde cualquier dispositivo:

## Preparación del Repositorio

1. Crea un repositorio en GitHub llamado `turnos-app`
2. Inicializa Git en este proyecto y súbelo a tu repositorio:

```bash
git init
git add .
git commit -m "Versión inicial"
git remote add origin https://github.com/TU-USUARIO/turnos-app.git
git push -u origin main
```

## Despliegue en GitHub Pages

1. Ejecuta el siguiente comando para desplegar la aplicación:

```bash
npm run deploy
```

2. Esto creará una rama `gh-pages` en tu repositorio con la versión compilada de la aplicación
3. Ve a la configuración de tu repositorio en GitHub (Settings > Pages)
4. Verifica que la fuente está configurada como "Deploy from a branch" y la rama seleccionada es "gh-pages"

## Acceso a la Aplicación

Una vez desplegada, podrás acceder a la aplicación desde cualquier dispositivo en la siguiente URL:

```
https://TU-USUARIO.github.io/turnos-app/
```

## Consideraciones Importantes

### Almacenamiento de Datos

La aplicación utiliza localStorage para almacenar todos los datos, lo que significa que:

- Los datos se guardan en el navegador del dispositivo que estés usando
- Cada dispositivo tendrá su propia copia de los datos
- Para compartir datos entre dispositivos, usa la función de exportar/importar

### Compatibilidad

- La aplicación funciona en cualquier navegador moderno (Chrome, Firefox, Safari, Edge)
- Es compatible con dispositivos móviles, tablets y ordenadores
- La interfaz se adapta automáticamente al tamaño de pantalla

### Actualizaciones

Si realizas cambios en el código y quieres actualizar la versión desplegada:

1. Haz los cambios necesarios
2. Haz commit de los cambios y súbelos a GitHub
3. Ejecuta `npm run deploy` nuevamente

O simplemente espera a que el flujo de trabajo de GitHub Actions despliegue automáticamente los cambios.