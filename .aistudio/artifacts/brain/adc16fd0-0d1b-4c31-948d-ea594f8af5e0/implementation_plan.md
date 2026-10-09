# Plan de Implementación: Generador de Descarga por Lotes de Listas Completas (Batch Playlist Downloader)

El usuario necesita descargar **listas completas de YouTube y mezclas musicales** sin tener que bajar video por video de forma manual, y seleccionó la solución de **scripts automatizados en 1 clic para PC**.

Este plan describe la arquitectura y los pasos para implementar el **Generador de Descargas de Listas Completas para USB Automotriz** dentro de la aplicación.

---

## 1. Diagnóstico y Enfoque de Solución

* **Problema:** Descargar listas de 20 a 100 videos uno a uno en webs como Cobalt o conversores online es tedioso, consume horas y genera archivos con nombres incompatibles que traban las pantallas de los autos.
* **Solución Técnica:** Generador inteligente de scripts por lotes (`.bat` para Windows y `.sh` para Mac/Linux) que:
  1. Recibe el enlace de la playlist o mezcla de YouTube.
  2. Configura los parámetros automotrices exactos: resolución máxima a 720p, códec H.264 Baseline, audio AAC y exclusión de caracteres especiales incompatibles con sistemas de archivos FAT32.
  3. Entrega un archivo script de 1 clic que el usuario ejecuta en su PC; el script descarga automáticamente toda la lista a máxima velocidad, numerada (`01 - `, `02 - `) y clasificada en la carpeta correspondiente para su memoria USB.
  4. Permite estimar el tamaño en GB y validar la capacidad de la memoria USB (8GB, 16GB, 32GB, 64GB).

---

## 2. Componentes y Modificaciones Previstas

### A. Nuevo Módulo: `BatchPlaylistDownloader.tsx`
* **Entrada de Listas:** Campo para pegar una o varias URLs de listas de reproducción de YouTube (o URLs individuales en lista).
* **Configuración del Lote Automotriz:**
  * Resolución objetivo (720p recomendada para autos vs 1080p).
  * Letra de unidad USB o carpeta destino (ej. `E:\Musica_Auto` o `D:\Videos_Carro`).
  * Estructura de carpetas: Subcarpeta por nombre de lista (ej. `\Mix Vallenato\01 - Artista - Cancion.mp4`).
  * Numeración indexada estricta para navegación en volante/consola.
* **Generador de Scripts de 1 Clic:**
  * **Descarga de Script `.bat` (Windows):** Script auto-contenido que verifica si existe `yt-dlp` (o lo descarga de forma segura en 2 segundos si no existe) y ejecuta la descarga por lotes con barra de progreso.
  * **Descarga de Script `.sh` (Mac / Linux):** Script bash para usuarios de macOS o Linux.
  * **Copia rápida de comando en terminal:** Para usuarios que prefieren ejecutar el comando directamente.
* **Calculadora de Capacidad de Playlist:**
  * Estimación del peso en GB según la cantidad estimada de videos (ej. 30 canciones ~ 1.4 GB) para saber si cabe en una memoria de 8GB, 16GB o 32GB.

### B. Integración en `WebDownloaderView.tsx` y Navegación
* Añadir la sección destacada **«Listas Completas & Descarga por Lotes (Batch)»** en la barra de navegación del centro de descargas.
* Conectar con la **Zona de Importación a USB**: Una vez descargada la lista en la PC, un solo arrastre de la carpeta a la app permite verificar códecs, probar en el reproductor de cabina y generar el archivo final para el vehículo.

---

## 3. Plan de Verificación y Pruebas

1. **Validación de URLs de Playlists:** Probar con formatos de listas estándar de YouTube (`playlist?list=...`, `watch?v=...&list=...`, y enlaces de mix).
2. **Generación de Archivos `.bat` y `.sh`:** Verificar que el contenido generado contenga la sintaxis correcta de escape de caracteres, codificación UTF-8, flags de formateo H.264/720p y directivas de nombres limpios para FAT32.
3. **Compilación y Linteo:** Ejecutar `compile_applet` para garantizar cero errores de TypeScript y cumplimiento estricto de las directivas de diseño.
