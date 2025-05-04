# Aplicación de Gestión de Turnos

Esta aplicación web permite gestionar y visualizar turnos de trabajo, festivos y estadísticas relacionadas. Está desarrollada con React, TypeScript y Tailwind CSS.

## Características

- Visualización de turnos por mes y año
- Gestión de festivos (nacionales, autonómicos y locales)
- Configuración personalizada de turnos
- Estadísticas de horas trabajadas
- Almacenamiento local de datos (localStorage)
- Interfaz adaptable a dispositivos móviles

## Despliegue en GitHub Pages

La aplicación está configurada para ser desplegada en GitHub Pages. Sigue estos pasos para desplegarla:

1. Crea un repositorio en GitHub
2. Conecta este proyecto con tu repositorio:

```bash
git init
git add .
git commit -m "Primer commit"
git remote add origin https://github.com/tu-usuario/turnos-app.git
git push -u origin main
```

3. Despliega la aplicación en GitHub Pages:

```bash
npm run deploy
```

Esto creará una rama `gh-pages` en tu repositorio y desplegará la aplicación en `https://tu-usuario.github.io/turnos-app/`

## Desarrollo local

Para ejecutar la aplicación en modo desarrollo:

```bash
npm install
npm run dev
```

## Almacenamiento de datos

La aplicación utiliza localStorage para almacenar:

- Configuración de turnos
- Festivos personalizados
- Festivos eliminados
- Celdas con turnos asignados manualmente

Esto permite que los datos persistan entre sesiones y estén disponibles sin necesidad de un servidor backend.

## Compatibilidad con dispositivos móviles

La interfaz está diseñada para adaptarse a diferentes tamaños de pantalla, incluyendo dispositivos móviles. La aplicación funciona correctamente en navegadores modernos en cualquier sistema operativo.

## Exportación e importación de datos

La aplicación permite exportar todos los datos a un archivo JSON e importarlos posteriormente, facilitando la transferencia de configuraciones entre dispositivos.

## Notas importantes

- Al acceder por primera vez desde GitHub Pages, es posible que necesites configurar tus turnos y festivos.
- Los datos se almacenan localmente en el navegador, por lo que no se comparten entre dispositivos a menos que utilices la función de exportación/importación.