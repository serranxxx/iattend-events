# CLAUDE.md — iattend-events

> Instrucciones: pega este archivo en la raíz del repo y pídele a Claude Code
> "explora este repo y llena cada sección de CLAUDE.md" — así el contenido
> refleja el código real, no una suposición.

## Qué es este repo
App Next.js (`i-attend-next`) que sirve tres cosas distintas bajo el mismo dominio: el sitio de marketing (`/about/*`), el visor público de invitaciones/side-events/Pops que ve el invitado final (RSVP, pase digital, cámara y Photo Wall), y un endpoint de embed (`/host`) que el editor del organizador (`iattend-vite`) monta en un iframe para previsualizar cambios en vivo.

## Stack técnico
- **Framework:** Next.js 15 (App Router, `next dev --turbopack`)
- **Lenguaje:** TypeScript
- **Estilos:** CSS Modules, un archivo `.module.css` por componente — sin Tailwind. Las clases en la práctica están en **snake_case** (`cover_container`, `confirm_label`), no camelCase
- **Librería de UI base:** Ant Design (`antd` v5 + `@ant-design/nextjs-registry`), iconos mezclados entre `lucide-react` y `react-icons` (Fa/Fi/Io)
- **Otras dependencias clave:** `@supabase/ssr` + `@supabase/supabase-js`, `firebase` (uso legado, ver gotchas), `axios`, `deepl-node` (traducción de invitaciones), `motion`, `canvas-confetti`, `add-to-calendar-button-react`, `dayjs`

## Cómo se conecta con el resto de I attend
- **iattend--backend**: se consume vía `NEXT_PUBLIC_IATTEND_API_URL` solo para el flujo de fotos del Photo Wall (`POST /photos/upload`, `GET /photos/:eventId`, `GET /photos/likes/event/:id`, `POST /photos/:id/like`) desde `CameraView.tsx` y `PhotoWall.tsx`. También existen servicios más antiguos (`src/services/apiInvitation.ts`, `apiGuests.ts`, `apiLogin.ts`) que hablan con el backend vía Axios + JWT en header `token`, pero parecen resabios de una arquitectura anterior — las páginas activas hoy leen Supabase directo.
- **Supabase**: lectura/escritura directa desde el frontend (no todo pasa por el backend). Tablas/vistas usadas: `invitations`, `guests`, `event_photos`, `invitation_translations`, `copy_bundles`, `copy_translations`, `side_events`. Realtime por canal `event_photos_{eventId}` para el Photo Wall. Hay tres variantes de cliente en `src/lib/supabase/`: `client.ts` (browser), `server.ts` (server component, atado a cookies para sesión autenticada) y `public-server.ts` (server, sin sesión — usado en páginas públicas de invitación). Nota: el pipeline de traducción (`cache.ts`/`copy-cache.ts`) usa `server.ts` (con cookies) aunque se invoca desde la página pública de invitación sin sesión de organizador — revisar si esto afecta políticas RLS para invitados anónimos.
- **iattend-vite**: la app del organizador embebe la ruta `/host` de este repo en un iframe y se comunica por `postMessage` (`REMOTE_READY`, `HOST_PROPS`, `REMOTE_HEIGHT`) para previsualizar la invitación mientras se edita, sin ida y vuelta a la base de datos.

## Estructura de carpetas clave
```
src/
  app/
    [invitation_label]/[invitation_name]/page.tsx   ← página pública de una invitación (lee Supabase por label+name)
    event/[id]/photowall/page.tsx                    ← Photo Wall fullscreen (proyector / celular)
    side-event/[side_event_id]/                      ← eventos satélite de una invitación principal
    host/page.tsx                                    ← embed iframe para el editor (iattend-vite)
    login/page.tsx                                   ← login con Supabase Auth (email/password)
    about/*                                          ← landing / marketing (SEO, FAQs, planes)
    api/song-preview/route.ts                        ← único route handler de API interno
  components/
    Invitation/Invitation/Invitation.tsx              ← orquestador principal de la invitación
    Invitation/Confirm/Confirm.tsx                    ← flujo de RSVP (crear/confirmar/rechazar invitado)
    Invitation/CameraView/CameraView.tsx              ← cámara fullscreen + compresión + subida de fotos
    Invitation/Ticket/Ticket.tsx                      ← pase digital del invitado
    PhotoWall/PhotoWall.tsx                           ← masonry en tiempo real, con likes (a diferencia de otros
                                                          proyectos I attend, aquí SÍ tiene interacción, no es solo lectura)
    SideEvent/, LandPage/                             ← componentes específicos de cada tipo de página
  context/            ← AppContext/AppProvider (useReducer) — sesión, tema, colores del organizador logueado
  lib/supabase/        ← los tres clientes de Supabase
  lib/translation/
    deepl.ts             ← llamada al SDK deepl-node (server-only), con allow/blocklist recursivo de qué strings del JSON de la invitación se traducen
    cache.ts             ← cache de la traducción del CONTENIDO de una invitación puntual, tabla invitation_translations (invitation_id+lang)
    copy-cache.ts        ← cache de la traducción del COPY FIJO de la UI (botones, labels), tabla copy_translations sobre un bundle base en copy_bundles (bundle_id+lang); slug usado hoy: "invitation_ui_v1"
  services/            ← llamadas Axios legadas al backend (apiInvitation, apiGuests, apiLogin)
  types/               ← new_invitation.ts (modelo vigente) convive con invitation.ts (más viejo, ver deuda técnica)
```

## Convenciones y patrones que hay que respetar
- Componentes en carpeta propia `ComponentName/ComponentName.tsx` + `componentname.module.css` (la convención de nombre de archivo CSS varía: a veces PascalCase, a veces kebab/snake — revisar el vecino antes de crear uno nuevo)
- Props tipadas con `interface`/`type` encima del componente; casi todo el árbol de la invitación usa el tipo `NewInvitation` de `src/types/new_invitation.ts`, **no** `src/types/invitation.ts`
- Las páginas dinámicas (`[invitation_label]/[invitation_name]`, `side-event/[side_event_id]`) usan `generateMetadata` + `export const dynamic = "force-dynamic"` para armar OG tags por evento a partir de Supabase
- Páginas públicas usan `getPublicServerClient()` (sin sesión); todo lo que requiera sesión de organizador usa `createClient()` de `server.ts`
- Estado de sesión/tema del organizador vive en `AppContext` + `AppProvider` (patrón reducer en `src/context/appReducer.ts`), persistido en `localStorage`
- El identificador del invitado en el navegador (para fotos, likes) se guarda en `localStorage` como `guest_${invitationID}` — no hay JWT de invitado, es confianza en el cliente
- Horas de side events y Pops (`getTimezoneForState`, `formatEventDateTime` en `src/helpers/functions.ts`) leen el formato "wall-clock" (`YYYY-MM-DD HH:mm:00`, sin conversión) que escribe `iattend-vite` (`src/helpers/assets/eventDateTime.js`) — son contraparte una de la otra, no tocar una sin revisar la otra. Datos legados (instante UTC real) se reconvierten con `STATE_TIMEZONES` (BC, BCS, Sonora, Sinaloa, Quintana Roo tienen huso distinto al de CDMX)
- ESLint fuerza `unused-imports/no-unused-imports` como error; variables/args con prefijo `_` están exentos

## Rutas / páginas principales
| Ruta | Qué hace | Componente principal |
|---|---|---|
| `/` | Redirige a `/about` | — |
| `/about/*` | Landing de marketing (features, FAQs, planes, legal) | `components/LandPage/*` |
| `/[invitation_label]/[invitation_name]` | Invitación pública de un evento (RSVP, itinerario, regalos, galería) | `components/Invitation/Invitation/Invitation.tsx` |
| `/event/[id]/photowall` | Photo Wall fullscreen para proyectar o ver desde el celular | `components/PhotoWall/PhotoWall.tsx` |
| `/side-event/[side_event_id]` | Evento satélite asociado a una invitación principal | `components/SideEvent/SideEvent.tsx` |
| `/host` | Embed iframe para preview en vivo desde el editor del organizador | `components/Invitation/Invitation/Invitation.tsx` (modo `dev`) |
| `/login` | Login/signup con Supabase Auth | — |

## Comandos frecuentes
```bash
# instalar
npm install

# correr en dev (usa Turbopack)
npm run dev

# build
npm run build

# lint
npm run lint

# tests
# no existe suite de tests en este repo
```

## Variables de entorno que necesita
- `NEXT_PUBLIC_IATTEND_API_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `NEXT_PUBLIC_WEATHER_API_KEY`
- `DEEPL_API_KEY`
- `NEXT_PUBLIC_ANONYMOUS_ID`

## Cosas que hay que saber antes de tocar este repo (gotchas)
- **Textura de la invitación y bloques** (`TextureOverlay`, z 0 al final de la invitación): Galería, Regalos, Destinos y los estilos de catálogo de Saludo / Personas / Avisos suben el bloque entero (z 1). Cita, Itinerario y Dresscode suben solo sus elementos (`ELEMENTOS_SOBRE_TEXTURA` en `ModuleBackdrop.tsx`: la foto de la Cita; los momentos del itinerario; paleta, fotos y botones del dresscode) y dejan el fondo del bloque, título y descripción bajo la textura. Para eso su caja no lleva `isolation` (su `ModuleBackdrop` va con `z={0}` y el contenedor de info `position: relative`) y los `FadeLeft` de los textos van con `zIndex={0}`: un ancestro que cree contexto de apilamiento atrapa a los elementos debajo de la textura.
- **Pop = el antiguo "Evento Flash"** (renombrado el 2026-11-01 en vite, events y backend). Lo guardado sigue diciendo flash y no se renombra: `planner_benefits.free_flash_events`, RPC `consumir_/devolver_evento_flash_gratis`, `planner_events.kind = 'flash'`, `ventas.plan = 'Flash'`, lookup key de Stripe `flash_event`, carpetas de Storage `flash-<id>` y los nombres de las migraciones. El "Pop" viejo de este repo (`/pop/:id`, `/pop-event/:id`, `components/Pop/`, tabla `pop_events`) se borró; la página de un Pop es `/side-event/:id`.
- La cámara y el Photo Wall solo se habilitan el día del evento y el día siguiente, calculado en el cliente a partir de `invitation.cover.date.value` (`CameraView.tsx`) — si se toca esa ventana, revisar también el mensaje de "muy temprano / ya cerró"
- El Photo Wall de este repo **sí permite interacción** (like, ver quién dio like) vía Realtime — no es de solo lectura como en otros repos hermanos de I attend; no asumir lo contrario
- El pipeline de traducción (`lib/translation/deepl.ts`) tiene un allow/blocklist de rutas del JSON de la invitación escrito a mano (`BLOCKED_SUBTREES`, `DONT_TRANSLATE_PATHS`, `DONT_TRANSLATE_KEYS`). Si se agrega un campo nuevo al modelo de invitación (`types/new_invitation.ts`), hay que decidir explícitamente si se traduce o no, o se cuela/bloquea por accidente
- Las traducciones se cachean en dos tablas con comportamiento **distinto** de invalidación, aunque ambas calculan un `source_hash` SHA1 sobre `JSON.stringify` del contenido fuente:
  - `copy_translations` (`copy-cache.ts`, copy fijo de UI): SÍ compara `existing.source_hash === sourceHash` antes de servir cache — si el bundle base cambió, retraduce.
  - `invitation_translations` (`cache.ts`, contenido de la invitación del usuario): **NO compara `source_hash` antes de devolver la fila cacheada** — solo verifica que exista una traducción para ese `invitation_id`+`lang`. El campo se calcula y se guarda, pero nunca se usa para invalidar. Si el organizador edita su invitación después de que ya se generó una traducción, el invitado sigue viendo la traducción vieja aunque el español haya cambiado. Bug conocido, no arreglado — ver Pendientes.
- `/host` valida el origen del `postMessage` contra una lista fija `ALLOWED_ORIGINS` en `src/app/host/page.tsx` — agregar un nuevo entorno de preview (staging, etc.) requiere tocar esa lista
- `next.config.ts` usa la API vieja `images.domains` (no `remotePatterns`) y además tiene `eslint.ignoreDuringBuilds: true` — un error de lint **no** rompe el build de producción
- Los servicios legados (`apiInvitation.ts`, `apiGuests.ts`) todavía importan `firebase/storage` y `firebase/vertexai` pese a que el resto del repo migró a Supabase — no asumir que están en uso activo sin verificar quién los llama
- No existe autenticación real de invitado: el nombre del invitado en `localStorage` (`guest_${invitationID}`) es lo único que identifica quién sube una foto o da like
- **Portada de un side event / Pop** (la arma vite): lista de 1 a 6 fotos y videos (`body.images` con 2 o más, mezclados; `body.video` si es un video solo; `body.image` = la primera foto). Con varios, carrusel: cada foto 4.5 s y cada video completo cuando le toca (`mediaDePortada`, `esVideo` en `helpers/fotosPortada.ts`, gemela de vite). Cada foto o video lleva su ajuste (`body.imageFrames[url] = { z, x, y }`, zoom sobre el cover y encuadre como object-position; `estiloAjuste`); `marcoFoto` (dibujos anclados a la foto) sale de `cubrir` con el de la primera. El desenfoque hacia abajo de la portada es ajustable (`body.coverBlur = { amount, start }`, `variablesDesenfoque`; sin valor, 6 px desde el 40 %; 0 = sin capa). La foto sola y el video van dentro de `.hero_bg` (el `[data-zoom]` al que el scroll le escribe el transform en línea).
- **Dibujos anclados a una foto / video del carrusel** (`stickers[].fotoSrc` = su url, con `foto: true`): van en el recuadro de esa (`marcosFoto`, medido con el tamaño de cada una y su ajuste) y solo se ven cuando le toca (mismo fundido de 0.9 s). Sin `fotoSrc`, anclados a la primera y siempre visibles.
- **Dibujos encima de una tarjeta** (`body.stickers[].tarjeta` = clave de la tarjeta, x / y / w en % de ella): `conDibujos` en `SideEvent.tsx` envuelve esa tarjeta en `.tarjeta_con_dibujos` (mismo ancho que la tarjeta en celular, tableta y mosaico) y los pinta encima; no van en la portada.
- **Formulario obligatorio de un Pop** (`body.form.required`, interruptor "Obligatorio" en vite): mientras el invitado confirmado lo tenga pendiente (`formObligatorio` en `SideEvent.tsx`), la hoja del formulario se abre sola —después del confeti al confirmar, o casi al momento si vuelve a entrar— y `HojaPop` va con `obligatoria` (sin cerrar por velo, asa, ✕ ni Esc). Al cerrarla ya respondida se abre el pase. Es una regla de la página; el backend no la exige.
- **Vista previa ("Ver en vivo") de un Pop**: los asistentes salen de `_asistentes` (lo real del editor) completados con ejemplos hasta 9 (`rellenarConEjemplo`, marca "Ejemplo"), y el chat de `_chat` (los mensajes reales de moderación, `useChatPop({ delEditor })`), sin reacciones ni "nuevos". La conversación de ejemplo ya no existe.
- **Tarjeta del invitado ya respondido** (side event / Pop): nombre, píldora con su respuesta ("Asistencia confirmada" con palomita verde / "No asistirás"), "Ver mi pase" como botón principal, "Agregar al calendario" como botón de texto y un pie con "Cambiar mi respuesta · ¿No eres …?". Sin pase activo (`body.wallet.enabled === false`, `paseActivo`) no hay "Ver mi pase" (ni se abre solo al confirmar) y "Agregar al calendario" pasa a ser el botón principal.
- **Cambiar de opinión** (side event / Pop): un invitado que ya confirmó o declinó ve en su tarjeta su respuesta y "Cambiar mi respuesta" (`cambiandoRespuesta` en `SideEvent.tsx`): vuelven Asistiré / No asistiré con Cancelar. "No asistiré" declina al titular y a sus acompañantes (`declinarPase`); "Asistiré" sigue el flujo normal (con acompañantes, el paso de quiénes vienen; si no, confeti y pase). Ya no hay el botón "Asistencia declinada" que regresaba a "sin responder".
- **Agregar al calendario** (side event / Pop, ya confirmado; botón bajo "Ver mi pase" en la tarjeta del invitado): `Layout/CalendarioPop.tsx` → `entradasDeCalendario(info)`: con itinerario, cada momento con hora (termina a la hora del siguiente del mismo día; el último, una hora); sin itinerario, cada fecha del evento (tres horas). Con una sola entrada abre el menú de `AddToCalendar` (Apple / Google / Outlook); con varias, una `HojaPop` para elegir cuáles (todas marcadas, por día) y baja un `.ics` con las elegidas (`downloadICS`, hora de pared con `TZID` = `body.timezone`).
- **`/side-event/[side_event_id]` acepta el código público o el número** (`buscarSideEvent` en `app/side-event/[side_event_id]/page.tsx`): un código (`side_events.public_code`, al azar) siempre abre; un número solo si el evento tiene `legacy_link_enabled` (los que existían antes del código, hasta que el organizador lo apaga). Sin la migración (`iattend--backend/migrations/2026-11-01b_side_events_public_code.sql`) el número abre como antes. El link de registro de acompañantes (`RegistroCard`) reusa la ruta con la que llegó el invitado.
- **Posición del título de un side event / Pop** (como la portada de la invitación): al elegir el título, la pieza enseña una cuadrícula 3 × 3 punteada (`.cuadriculaTitulo` en SideCanvas; la celda actual en lila); el título se arrastra a una celda (más de 6 px; un clic sigue siendo para escribir) o se toca la celda. `body.titlePosition = { x: left|center|right, y: top|center|bottom }`; sin él, abajo al centro. Solo se mueve el título (`.bloqueTitulo` / `.bloque_titulo` en events: ocupa el alto libre arriba de la fecha); la fecha, el lugar y los botones se quedan abajo. Reglas en `tarjetasSide.js` (`posicionTitulo`, `variablesPosicionTitulo`) y su gemela `iattend-events/src/helpers/tarjetasSide.ts`. En iPad / Mac (≥ 600), arriba o al centro el bloque del título va del 12 % al 54 % de la pantalla.
- **Patrocinadores de un Pop** (handoff "Patrocinadores en un Pop" v2 · categorías; solo Pop): `body.sponsors` con `cats` (`{ id, name, size: l|m|s, color }`, en orden) e `items[].cat` (tipo en `types/side_event.ts`); `normalizarPatrocinadores` en `helpers/patrocinadores.ts` (gemela de iattend-vite `modules/SideEvents/patrocinadores.js`) pone los valores por omisión (acomodo inicial `tarjeta`) y lee lo de la v1 (`tier` / `mono`). `components/SideEvent/Patrocinadores/`: `PortadaPatrocinadores` (cinta con todas las marcas del mismo tamaño, cada una con el color de su categoría), `TarjetaPatrocinadores` (vidrio `.tarjeta`, un bloque por categoría con su nombre en MAYÚSCULAS —sin nombre, sin etiqueta; una sola "Patrocinadores" no se repite—; adaptados con la tinta del estilo si es claro) y `BandaPatrocinadores` (sin vidrio ni etiqueta de grupo; con varias categorías la primera fija arriba (con su nombre) y las demás en la cinta arrastrable, con sus nombres encima, que avanza con el scroll de `paginaRef`; con una, solo la cinta). La cinta (`Cinta.tsx`) se mueve en rAF y con reducir movimiento se queda quieta. Tarjeta y Banda son la tarjeta `sponsors` del grupo `marcas` de `tarjetasSide.ts`.
## Pendientes / deuda técnica conocida
- **Bug de cache de traducciones**: `lib/translation/cache.ts` (`getTranslatedInvitationFromCache`) no invalida por `source_hash` — sirve la traducción cacheada de `invitation_translations` aunque el contenido en español ya haya cambiado. `copy-cache.ts` sí lo hace bien para el copy de UI; falta replicar esa comparación en `cache.ts`.
- Conviven dos sistemas de tipos para el modelo de invitación: `types/new_invitation.ts` (vigente, usado por las páginas activas) y `types/invitation.ts` (más viejo) — falta decidir cuándo se elimina el segundo
- Los servicios Axios legados hacia `iattend--backend` (`apiInvitation.ts`, `apiGuests.ts`, `apiLogin.ts`) coexisten con llamadas directas a Supabase; no está claro cuál es la fuente de verdad para el flujo de organizador
- Uso de `any` en varios puntos (`Guests.tables: any[]`, `translateInvitationObject`) pese a que otros repos de I attend imponen "sin any"
- Nombrado de CSS Modules inconsistente entre carpetas (mezcla de kebab-case y snake_case en los nombres de archivo `.module.css`)
- **Editor del celular de la invitación**: `HOST_PROPS.editMovil` (vite `ReactHost editMovil`, desde `EditorMovilShell`) → `HostClient.tsx` pone `html[data-edit-movil]` y los botones de edición de la pieza (`.edit_center_btn`, "Cambiar fondo") miden 44 px (`styles/modules.css`).
- **Zoom al escribir (editor del celular)**: en modo edición, `HostClient.tsx` manda `REMOTE_TEXT_FOCUS` ({ x, y, w, h, fontSize } en px del iframe, o null) al enfocar / soltar un texto editable; vite acerca la pieza hasta que el texto se vea de 16 px (`Editor/useZoomTexto.js`).
- **"Ver en vivo" → Confirmado de la invitación**: `HOST_PROPS.vistaConfirmada` y `HOST_PROPS.plan` (solo el "Ver en vivo" del editor) → `HostClient` → `Invitation vistaConfirmada plan`. Con `dev`, `Invitation` usa `INVITADO_EJEMPLO` (confirmado, sin id ni código) como `guestInfo`; `Confirm` lleva `key` por estado para rearmarse.
