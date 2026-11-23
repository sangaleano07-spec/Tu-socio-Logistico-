# Sandino Emprendimiento — App Web Lista para GitHub y Android

Proyecto estructurado en **Catálogo (Compra y Reventa)**, **Pedido / Carrito** e **Historial**, sin dependencias externas ni errores de eventos en botones.

## Estructura del proyecto
- `index.html`: Interfaz principal con pestañas y formularios validados.
- `styles.css`: Estilos responsivos adaptados a pantallas móviles (Android / WebView).
- `app.js`: Lógica limpia con delegación de eventos y persistencia local segura.
- `assets/`: Recursos gráficos (incluye `logo.jpg`).

## Pasos para subir a GitHub y convertir en App Android
1. Crea un repositorio en **GitHub.com** y sube los archivos de esta carpeta (puedes activar **GitHub Pages** en *Settings > Pages* si deseas una URL pública).
2. Toma la URL pública (o los archivos web empaquetados) y llévalos a tu creador de apps Android basado en WebView (por ejemplo, WebIntoApp, Median/GoNative, AppsGeyser o similar).
3. Configura los permisos básicos de red/almacenamiento y genera el instalador `.apk` o `.aab`.
