# ¿Qué conozco?

Aplicación web para registrar los países y localidades que has visitado sobre un mapa del mundo interactivo, con métricas desglosadas por país, continente y mundo.

Dominio: [queconozco.com](https://queconozco.com)

## Características

- **Mapa del mundo interactivo** en SVG (sin API key): clic para marcar/desmarcar un país, doble clic para ver sus localidades, zoom con rueda/botones y arrastre para desplazarse.
- **Marcado por localidades**: cada país tiene sus principales localidades (pueblos y ciudades). Puedes marcar el país completo o localidad por localidad.
- **Métricas jerárquicas**: el porcentaje se calcula como `localidades visitadas / total` y se desglosa hacia arriba: país → continente → mundo.
- **Estadísticas**: resumen mundial, desglose por continente y "país más visitado".
- **Compartir en Instagram**: genera una imagen vertical (1080×1920) con el mapa, las métricas y el país más visitado; descarga el PNG o comparte directo (Web Share API en móvil).
- **Configuración de colores del mapa**: visitado, no visitado, hover y borde (afecta solo al mapa, persistido).
- **Persistencia local**: tus marcas y colores se guardan en `localStorage`.

## Stack

- **React 19 + TypeScript** (Vite)
- **d3-geo + topojson-client + world-atlas**: render del mapa y proyecciones
- **Zustand** (middleware `persist`) para el estado
- **Tailwind CSS v4** para el diseño
- **Oxlint** para el linting

## Estructura

```
que-conozco/
├── index.html
├── vite.config.ts
├── package.json
├── public/
│   └── favicon.svg
└── src/
    ├── main.tsx              # punto de entrada
    ├── App.tsx               # layout, header, modales y navegación
    ├── index.css             # estilos base (Tailwind)
    ├── types.ts              # tipos compartidos (City, CountryMeta, MapColors…)
    ├── store.ts              # estado global (zustand + persistencia)
    ├── data/                 # datasets generados
    │   ├── cities.ts         # ~34 000 localidades (>15 000 hab, GeoNames)
    │   └── countries.ts      # metadatos de países (código, nombre, continente, bandera)
    ├── lib/
    │   ├── countries.ts      # mapeos país/continente y utilidades (cityKey…)
    │   ├── geo.ts            # TopoJSON → GeoJSON del mapa mundial
    │   ├── stats.ts          # cálculo de métricas y porcentajes
    │   └── share.ts          # render de la imagen para historias (canvas)
    └── components/
        ├── WorldMap.tsx      # mapa mundial (clic, hover, zoom, pan)
        ├── CountryList.tsx   # listado de países (búsqueda + filtro por continente)
        ├── CountryDetail.tsx # modal de localidades de un país
        ├── CountryZoomMap.tsx# mapa ampliado del país con puntos clicables
        ├── StatsPanel.tsx    # estadísticas (mundo, continentes, más visitado)
        ├── ColorConfig.tsx   # configurador de colores del mapa
        ├── ShareModal.tsx    # compartir en Instagram
        └── Modal.tsx         # contenedor de modal reutilizable
```

## Sistemas y subsistemas

### Marcado (marcar lugares)
- `WorldMap.tsx`: clic simple = alternar país; doble clic = abrir detalle; hover = tooltip con nombre y porcentaje.
- `CountryList.tsx`: listado con búsqueda y filtro por continente; botón "Ciudades" para entrar al detalle.
- `CountryDetail.tsx` + `CountryZoomMap.tsx`: mapa del país (zoom automático), puntos clicables con tooltip y lista de localidades con buscador.
- La identidad de cada localidad es su `id` de GeoNames (evita colisiones por nombres repetidos).

### Estadísticas (`StatsPanel.tsx` / `lib/stats.ts`)
- Resumen mundial, desglose por continente con barras de progreso y "país más visitado" (por cantidad de localidades visitadas).

### Compartir (`ShareModal.tsx` / `lib/share.ts`)
- Renderiza una tarjeta vertical (1080×1920) en un `<canvas>` con el mapa, porcentaje mundial, países/localidades visitadas y país más visitado.

### Configuración (`ColorConfig.tsx`)
- Personaliza visitado / no visitado / hover / borde. Aplica solo al mapa y se persiste.

### Datos y persistencia (`store.ts`)
- Estado global con `zustand/persist` (clave `que-conozco-v1`).
- Exportar/importar JSON implementado pero oculto (flag `SHOW_IMPORT_EXPORT` en `App.tsx`).

## Fuentes de datos

- **world-atlas**: geometría de los países (TopoJSON 110m).
- **world-countries** (procesado en `src/data/countries.ts`): códigos ISO, nombres (incl. español) y continente.
- **GeoNames** `cities15000` + `admin1CodesASCII` (procesado en `src/data/cities.ts`): localidades con más de 15 000 habitantes y su provincia/estado.

Los archivos de `src/data/` se generan con los scripts `gen.mjs` / `gen-countries.mjs` (no versionados en el repo, se guardan en `/tmp/opencode` durante el desarrollo).

## Desarrollo

```bash
npm install       # instalar dependencias
npm run dev       # servidor de desarrollo (HMR)
npm run build     # compilar para producción
npm run lint      # linting (oxlint)
npm run preview   # previsualizar la build de producción
```
