# CLAUDE.md — iattend-events

## Ubicación del proyecto
`/Documents/I attend/Projects/iattend-events`

## Qué es este proyecto
Es la invitación digital de I attend. El invitado final (quien recibe la invitación de boda) interactúa aquí. Puede ver la información del evento, confirmar asistencia, revisar su pase digital y subir fotos al Photo Wall.

## Stack
- **Framework:** Next.js con App Router (`/app`)
- **Lenguaje:** TypeScript — todos los componentes en `.tsx`
- **Estilos:** CSS Modules — un archivo `.module.css` por componente, sin Tailwind
- **Iconos:** Lucide React — tamaño estándar 20px salvo que el contexto requiera otro
- **Base de datos / Storage / Realtime:** Supabase (cliente en el frontend)
- **Backend principal:** `iattend--backend` en `/Documents/I attend/Projects/iattend--backend`

## Estructura de carpetas relevante
```
/app
  /event/[id]/          ← rutas por evento
    page.tsx            ← página principal de la invitación
    photowall/
      page.tsx          ← Photo Wall fullscreen (proyector / celular)
/components
  Invitation.tsx        ← componente principal de la invitación
  CameraView.tsx        ← interfaz fullscreen de cámara
  PhotoWall.tsx         ← masonry grid en tiempo real (variante sin descarga)
```

## Convenciones de código
- Componentes en PascalCase, archivos `.tsx`
- CSS Modules: clase en camelCase, archivo `ComponentName.module.css`
- Props siempre tipadas con una `interface` encima del componente
- Sin `any` — tipar correctamente o usar `unknown`
- Llamadas al backend siempre a través de `iattend--backend`, no directo a Supabase salvo Realtime y Storage público

## Modelo de datos clave
El componente `Invitation.tsx` recibe una prop `invitation` con esta estructura relevante:
```ts
invitation.cover.date.value    // fecha del evento (string ISO o similar)
invitation.id                  // ID del evento
```
El invitado y su estado de RSVP se obtienen del contexto de sesión o de la prop correspondiente — siempre verificar `rsvp.status === 'confirmed'` antes de mostrar features del día del evento.

## Proyectos relacionados
- **`iattend-vite`** (`/Documents/I attend/Projects/iattend-vite`) — app del organizador (React + Vite)
- **`iattend--backend`** (`/Documents/I attend/Projects/iattend--backend`) — backend Node + Express
- **Supabase** — base de datos, Storage bucket `event-photos`, Realtime por canal `event_id`

## Reglas importantes
- No mostrar features del evento (cámara, photo wall) si el RSVP no está confirmado
- La cámara solo se habilita el día del evento y el día siguiente — validar con `invitation.cover.date.value`
- Las fotos se comprimen en el cliente (Canvas API → WebP, máx 1MB) antes de enviarse al backend
- No pueden existir fotos anónimas — siempre requerir `guest_name`
- El Photo Wall en este proyecto es **solo lectura** — sin botón de descarga ni eliminación
- Suscribirse a Realtime en `useEffect` y limpiar la suscripción en el return del cleanup