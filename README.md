# CarVideo USB Studio

**CarVideo USB Studio** es una aplicación diseñada para la preparación, optimización y exportación de videos musicales en formato MP4 (H.264 + AAC) para su reproducción óptima en memorias USB y pantallas de infoentretenimiento de automóviles.

El propósito principal de esta herramienta es garantizar que los archivos multimedia sean totalmente compatibles con los sistemas de audio y video de los vehículos, evitando problemas comunes como formatos no soportados o fallos en la reproducción de audio.

## 🌟 Funcionalidades Principales

La aplicación sigue un flujo directo de 3 pasos, acompañado de herramientas de diagnóstico y reparación:

1. **1. Añadir videos:**
   - **YouTube (Script PC):** Un único generador de scripts `yt-dlp + FFmpeg` (`.bat` para Windows, `.sh` para Mac/Linux o comando de terminal) que detecta automáticamente enlaces de video individual, playlists o búsquedas y garantiza video **H.264 + audio AAC**.
   - **Buscar gratis (Internet Archive):** Búsqueda directa de videos y conciertos MP4 de dominio público listos para añadir a tu USB o probar.
   - **Importar MP4:** Carga por clic o arrastrar y soltar archivos locales con análisis de encabezados MP4 y detección automática de pistas sin audio o códecs Opus/Vorbis incompatibles.
2. **2. Mi USB:**
   - Lista unificada con cálculo de espacio ocupado (referencia USB 16 GB), organización por carpetas de género o modo plano (raíz FAT32), vista previa del árbol de carpetas, alertas de compatibilidad, descarga individual MP4 y exportación en paquete **ZIP** (incluyendo listas `.m3u`).
3. **3. Probar en el auto:**
   - Simulador de consola automotriz (modo Día/Noche, pantalla completa y cola de reproducción) para verificar reproducción, imagen, pista de audio e inspección detallada antes de copiar a la memoria USB.
- **Reparar audio (1-Clic):** Modal accesible desde la cabecera o desde cualquier aviso de audio incompatible para generar el script `FFmpeg` que convierte videos mudos o con Opus/Vorbis a MP4 H.264 + AAC Estéreo.
- **Marco Legal y Copia Privada:** Accesible desde el pie de página junto con el inspector de licencia por pista.
- **Soporte de Temas:** Interfaz adaptable con modo oscuro y modo claro.

## 📖 Guía de Uso

1. **Añadir videos:** Genera tu script para PC, busca videos abiertos en Archive.org o importa los MP4 de tu computadora.
2. **Organizar Mi USB:** Elige carpetas por género o modo plano, revisa la estructura y descarga tu `.ZIP` (o cada `.mp4` por separado).
3. **Probar en el auto:** Verifica que tus videos reproduzcan con audio AAC válido en la consola simulada antes de llevar la memoria al vehículo.

## 💻 Tecnologías Utilizadas

- **React 19 + TypeScript**
- **Vite + Tailwind CSS**
- **Express** (servidor API para búsqueda en Archive.org y descarga directa de muestras)
- **JSZip** y **Lucide React**

## ⚖️ Licencias y Marco Legal

Consulta en cualquier momento **Marco Legal y Copia Privada** desde el enlace del pie de página o haciendo clic en la etiqueta de licencia dentro de la consola del auto para revisar las condiciones de uso personal y licencias abiertas.

