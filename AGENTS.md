# AGENTS.md — iattend-events

> Instrucciones: pega este archivo en la raíz del repo y pídele a Codex
> "explora este repo y llena cada sección de AGENTS.md" — así el contenido
> refleja el código real, no una suposición.

## Qué es este repo
App Next.js (`i-attend-next`) que sirve tres cosas distintas bajo el mismo dominio: el sitio de marketing (`/about/*`), el visor público de invitaciones/pop-events/side-events que ve el invitado final (RSVP, pase digital, cámara y Photo Wall), y un endpoint de embed (`/host`) que el editor del organizador (`iattend-vite`) monta en un iframe para previsualizar cambios en vivo.

## Stack técnico
- **Framework:** Next.js 15 (App Router, `next dev --turbopack`)
- **Lenguaje:** TypeScript
- **Estilos:** CSS Modules, un archivo `.module.css` por componente — sin Tailwind. Las clases en la práctica están en **snake_case** (`cover_container`, `confirm_label`), no camelCase
- **Librería de UI base:** Ant Design (`antd` v5 + `@ant-design/nextjs-registry`), iconos mezclados entre `lucide-react` y `react-icons` (Fa/Fi/Io)
- **Otras dependencias clave:** `@supabase/ssr` + `@supabase/supabase-js`, `firebase` (uso legado, ver gotchas), `axios`, `deepl-node` (traducción de invitaciones), `motion`, `canvas-confetti`, `add-to-calendar-button-react`, `dayjs`

## Cómo se conecta con el resto de I attend
- **iattend--backend**: se consume vía `NEXT_PUBLIC_IATTEND_API_URL` solo para el flujo de fotos del Photo Wall (`POST /photos/upload`, `GET /photos/:eventId`, `GET /photos/likes/event/:id`, `POST /photos/:id/like`) desde `CameraView.tsx` y `PhotoWall.tsx`. También existen servicios más antiguos (`src/services/apiInvitation.ts`, `apiGuests.ts`, `apiLogin.ts`) que hablan con el backend vía Axios + JWT en header `token`, pero parecen resabios de una arquitectura anterior — las páginas activas hoy leen Supabase directo.
- **Supabase**: lectura/escritura directa desde el frontend (no todo pasa por el backend). Tablas/vistas usadas: `invitations`, `guests`, `event_photos`, `invitation_translations`, `pop_events`, `side_events`. Realtime por canal `event_photos_{eventId}` para el Photo Wall. Hay tres variantes de cliente en `src/lib/supabase/`: `client.ts` (browser), `server.ts` (server component, atado a cookies para sesión autenticada) y `public-server.ts` (server, sin sesión — usado en páginas públicas de invitación).
- **iattend-vite**: la app del organizador embebe la ruta `/host` de este repo en un iframe y se comunica por `postMessage` (`REMOTE_READY`, `HOST_PROPS`, `REMOTE_HEIGHT`) para previsualizar la invitación mientras se edita, sin ida y vuelta a la base de datos.

## Estructura de carpetas clave
```
src/
  app/
    [invitation_label]/[invitation_name]/page.tsx   ← página pública de una invitación (lee Supabase por label+name)
    event/[id]/photowall/page.tsx                    ← Photo Wall fullscreen (proyector / celular)
    pop/[pop_id]/  y  pop-event/[quick_event_id]/    ← eventos "pop" (formato ligero, un solo día)
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
    Pop/, SideEvent/, LandPage/                        ← componentes específicos de cada tipo de página
  context/            ← AppContext/AppProvider (useReducer) — sesión, tema, colores del organizador logueado
  lib/supabase/        ← los tres clientes de Supabase
  lib/translation/      ← pipeline de traducción con DeepL + cache en Supabase
  services/            ← llamadas Axios legadas al backend (apiInvitation, apiGuests, apiLogin)
  types/               ← new_invitation.ts (modelo vigente) convive con invitation.ts (más viejo, ver deuda técnica)
```

## Convenciones y patrones que hay que respetar
- Componentes en carpeta propia `ComponentName/ComponentName.tsx` + `componentname.module.css` (la convención de nombre de archivo CSS varía: a veces PascalCase, a veces kebab/snake — revisar el vecino antes de crear uno nuevo)
- Props tipadas con `interface`/`type` encima del componente; casi todo el árbol de la invitación usa el tipo `NewInvitation` de `src/types/new_invitation.ts`, **no** `src/types/invitation.ts`
- Las páginas dinámicas (`[invitation_label]/[invitation_name]`, `pop/[pop_id]`, `side-event/[side_event_id]`) usan `generateMetadata` + `export const dynamic = "force-dynamic"` para armar OG tags por evento a partir de Supabase
- Páginas públicas usan `getPublicServerClient()` (sin sesión); todo lo que requiera sesión de organizador usa `createClient()` de `server.ts`
- Estado de sesión/tema del organizador vive en `AppContext` + `AppProvider` (patrón reducer en `src/context/appReducer.ts`), persistido en `localStorage`
- El identificador del invitado en el navegador (para fotos, likes) se guarda en `localStorage` como `guest_${invitationID}` — no hay JWT de invitado, es confianza en el cliente
- ESLint fuerza `unused-imports/no-unused-imports` como error; variables/args con prefijo `_` están exentos

## Rutas / páginas principales
| Ruta | Qué hace | Componente principal |
|---|---|---|
| `/` | Redirige a `/about` | — |
| `/about/*` | Landing de marketing (features, FAQs, planes, legal) | `components/LandPage/*` |
| `/[invitation_label]/[invitation_name]` | Invitación pública de un evento (RSVP, itinerario, regalos, galería) | `components/Invitation/Invitation/Invitation.tsx` |
| `/event/[id]/photowall` | Photo Wall fullscreen para proyectar o ver desde el celular | `components/PhotoWall/PhotoWall.tsx` |
| `/pop/[pop_id]` | Vista de un "pop event" (evento ligero de un día) | `components/Pop/PopEvent.tsx` |
| `/pop-event/[quick_event_id]` | Variante/alias de pop event | `components/Pop/PopEvent.tsx` |
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
- La cámara y el Photo Wall solo se habilitan el día del evento y el día siguiente, calculado en el cliente a partir de `invitation.cover.date.value` (`CameraView.tsx`) — si se toca esa ventana, revisar también el mensaje de "muy temprano / ya cerró"
- El Photo Wall de este repo **sí permite interacción** (like, ver quién dio like) vía Realtime — no es de solo lectura como en otros repos hermanos de I attend; no asumir lo contrario
- El pipeline de traducción (`lib/translation/deepl.ts`) tiene un allow/blocklist de rutas del JSON de la invitación escrito a mano (`BLOCKED_SUBTREES`, `DONT_TRANSLATE_PATHS`, `DONT_TRANSLATE_KEYS`). Si se agrega un campo nuevo al modelo de invitación (`types/new_invitation.ts`), hay que decidir explícitamente si se traduce o no, o se cuela/bloquea por accidente
- Las traducciones se cachean en `invitation_translations` con hash SHA1 del JSON fuente (`lib/translation/cache.ts`) — no hay invalidación activa más allá de que el hash cambie
- `/host` valida el origen del `postMessage` contra una lista fija `ALLOWED_ORIGINS` en `src/app/host/page.tsx` — agregar un nuevo entorno de preview (staging, etc.) requiere tocar esa lista
- `next.config.ts` usa la API vieja `images.domains` (no `remotePatterns`) y además tiene `eslint.ignoreDuringBuilds: true` — un error de lint **no** rompe el build de producción
- Los servicios legados (`apiInvitation.ts`, `apiGuests.ts`) todavía importan `firebase/storage` y `firebase/vertexai` pese a que el resto del repo migró a Supabase — no asumir que están en uso activo sin verificar quién los llama
- No existe autenticación real de invitado: el nombre del invitado en `localStorage` (`guest_${invitationID}`) es lo único que identifica quién sube una foto o da like

## Pendientes / deuda técnica conocida
- Conviven dos sistemas de tipos para el modelo de invitación: `types/new_invitation.ts` (vigente, usado por las páginas activas) y `types/invitation.ts` (más viejo) — falta decidir cuándo se elimina el segundo
- Los servicios Axios legados hacia `iattend--backend` (`apiInvitation.ts`, `apiGuests.ts`, `apiLogin.ts`) coexisten con llamadas directas a Supabase; no está claro cuál es la fuente de verdad para el flujo de organizador
- Uso de `any` en varios puntos (`Guests.tables: any[]`, `translateInvitationObject`) pese a que otros repos de I attend imponen "sin any"
- Nombrado de CSS Modules inconsistente entre carpetas (mezcla de kebab-case y snake_case en los nombres de archivo `.module.css`)
