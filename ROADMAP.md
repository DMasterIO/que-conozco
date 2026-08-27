# Roadmap / Backlog

Lista de ideas y trabajo futuro de **¿Qué conozco?** (queconozco.com). Sirve como única fuente de verdad para decidir qué sigue.

- Estado: `pendiente` · `en curso` · `hecho`
- Esfuerzo: `bajo` · `medio` · `alto`
- Backend: `sí` / `no` (indica si requiere servidor o servicios externos)

## Orden de trabajo de esta fase

- [x] 1. Documento de backlog (este archivo)
- [x] 2. PWA + mobile
- [x] 3. Dark mode
- [x] 4. Wishlist "quiero ir"
- [x] 5. Lazy-load de datos (split por país)
- [x] 6. Tests

## Backlog

### Media / fotos
- [ ] Adjuntar fotos o álbumes de Instagram, Google Photos o Facebook (OAuth + backend) — esfuerzo `alto`, backend `sí`
- [ ] Subir fotos propias por lugar/viaje (drag & drop, almacenamiento en la nube) — esfuerzo `alto`, backend `sí`
- [ ] Pegar enlaces a fotos (URLs) y mostrarlas en una galería por lugar — esfuerzo `medio`, backend `no`

### Datos de viaje
- [ ] Fecha del viaje por lugar o país — esfuerzo `medio`, backend `no`
- [ ] Trips con rango de fechas — esfuerzo `medio`, backend `no`
- [ ] Timeline de viajes — esfuerzo `medio`, backend `no`
- [ ] Recap anual / "tu año en viajes" (estilo Wrapped) — esfuerzo `medio`, backend `no`
- [ ] Primer país visitado — esfuerzo `bajo`, backend `no`

### Estadísticas
- [ ] Ranking completo de países visitados (barras) — esfuerzo `medio`, backend `no`
- [ ] % de cobertura por población — esfuerzo `bajo`, backend `no`
- [ ] % de cobertura por área — esfuerzo `medio`, backend `no`
- [ ] País más raro (menos marcado / menos localidades) — esfuerzo `bajo`, backend `no`
- [ ] Metas por continente ("te falta 1 país en Sudamérica") — esfuerzo `medio`, backend `no`

### Social / cuenta
- [ ] Login multi-plataforma (Google, Apple, Discord, Facebook, Instagram) — esfuerzo `alto`, backend `sí`
- [ ] Sincronización multi-dispositivo — esfuerzo `alto`, backend `sí`
- [ ] Perfil público compartible (`/u/<usuario>`) — esfuerzo `alto`, backend `sí`
- [ ] Comparar con amigos / leaderboard — esfuerzo `alto`, backend `sí`

### UX / producto
- [ ] Diario / notas por lugar (rating, recuerdos) — esfuerzo `medio`, backend `no`
- [ ] Detalle de país enriquecido (capital, idioma, moneda, Wikipedia) — esfuerzo `medio`, backend `no`
- [ ] Globo 3D (globe.gl / three.js) como modo alternativo — esfuerzo `alto`, backend `no`
- [ ] Búsqueda global de ciudad → saltar al país — esfuerzo `medio`, backend `no`
- [ ] Importar desde otras apps (Nomad List, Countries Been) — esfuerzo `medio`, backend `no`
- [ ] Sacar a la vista exportar/importar (hoy oculto tras flag) — esfuerzo `bajo`, backend `no`

### Ingeniería / rendimiento
- [ ] Virtualización de listas de países — esfuerzo `medio`, backend `no`
- [ ] Stats en Web Worker — esfuerzo `alto`, backend `no`

### Mobile / PWA
- [x] PWA instalable + offline (manifest, service worker) — esfuerzo `medio`, backend `no`
- [x] Iconos y add-to-home-screen — esfuerzo `bajo`, backend `no`
- [x] Gestos táctiles y safe-area — esfuerzo `bajo`, backend `no`

### IA (Chrome built-in AI)
> Experimental (flags / Early Preview / origin trial). Toda feature debe usar feature-detection + fallback elegante. Translator y Language Detector solo funcionan en desktop.

#### Fundacional
- [ ] Wrapper `src/lib/ai.ts` con detección de APIs + fallback — esfuerzo `bajo`, backend `no`

#### Prompt API (Gemini Nano on-device)
- [ ] Recap anual narrativo (estilo Wrapped) con tus stats — esfuerzo `medio`, backend `no`
- [ ] Copiloto de viajes: chat sobre tu mapa ("¿qué me falta en Europa?") — esfuerzo `alto`, backend `no`
- [ ] Notas auto: "escribe un recuerdo" al marcar un país — esfuerzo `medio`, backend `no`
- [ ] Sugerir próximo destino según tu patrón — esfuerzo `medio`, backend `no`
- [ ] Trivia (capitales/banderas de tus países visitados) — esfuerzo `bajo`, backend `no`
- [ ] Etiquetar/clasificar notas o fotos — esfuerzo `medio`, backend `no`

#### Summarizer
- [ ] Resumir artículo de Wikipedia del país a 1 párrafo — esfuerzo `bajo`, backend `no`
- [ ] Resumir diario de viaje para la tarjeta de compartir — esfuerzo `bajo`, backend `no`

#### Writer / Rewriter / Proofreader
- [ ] Generar caption de Instagram con tus stats — esfuerzo `bajo`, backend `no`
- [ ] Reescribir notas (tono/largo) — esfuerzo `bajo`, backend `no`
- [ ] Corregir gramática de notas/diario — esfuerzo `bajo`, backend `no`

#### Translator / Language Detector (solo desktop)
- [ ] Traducir notas entre idiomas — esfuerzo `medio`, backend `no`
- [ ] Traducir nombres de localidades / Wikipedia al idioma del usuario — esfuerzo `medio`, backend `no`
- [ ] Detectar idioma de notas para etiquetar/traducir — esfuerzo `bajo`, backend `no`
