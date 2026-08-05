# Fix de márgenes blancos en Safari móvil ("Safari margin fix")

## Síntoma

En páginas de ancho/alto fijo (pensadas para verse como una pantalla de celular,
sin diseño responsive), Safari en iOS muestra una franja **blanca** arriba y/o
abajo del contenido que no aparece en Chrome ni en el preview de escritorio.

Pasa incluso si el contenedor principal ya tiene su propio `background-color` y
`min-height: 100vh`.

## Por qué pasa

Dos comportamientos de Safari en iOS se combinan:

1. **La barra de Safari es dinámica.** Se encoge o crece según el scroll, así
   que el viewport visible cambia de tamaño en tiempo real. `100vh` se calcula
   contra un valor que no siempre coincide con el alto visible real, dejando un
   hueco entre el fin de tu `div` y el borde de la pantalla.
2. **Overscroll / "rubber-banding".** Al hacer scroll más allá del límite del
   contenido (o con el "bounce" elástico de iOS), Safari expone brevemente lo
   que hay *detrás* de la página — que por defecto es el `background` del
   `<body>`, blanco si nadie lo definió.

Un `div` interno con su propio color de fondo no resuelve el punto 2: por más
que ese `div` intente cubrir el 100% del alto, el `<body>` sigue siendo blanco
por debajo, y el rebote de Safari lo deja ver.

## La solución (dos capas)

Este proyecto ya tenía este fix implementado en
[`PhotoWall.tsx`](../src/components/PhotoWall/PhotoWall.tsx#L150-L157) con el
comentario literal `// Force black body background (Safari margin fix)`. Es
el mismo patrón que se replicó en
[`EnvioInvitacion.tsx`](../src/app/envio-invitacion/EnvioInvitacion.tsx).

### Capa 1 — CSS: usar `dvh` en vez de `vh` + respetar el "safe area"

```css
.page_bg {
  min-height: 100dvh; /* dynamic viewport height, no 100vh */
  padding: max(40px, env(safe-area-inset-top)) 0 max(40px, env(safe-area-inset-bottom));
}
```

- `dvh` (dynamic viewport height) se recalcula cuando la barra de Safari
  cambia de tamaño, a diferencia de `vh` que usa un valor fijo poco confiable.
- `env(safe-area-inset-top/bottom)` evita que el contenido quede tapado por el
  notch o el home indicator en dispositivos con pantalla completa
  (`viewport-fit=cover` en el `<meta viewport>` del `layout.tsx` raíz).

Esta capa reduce el problema pero **no lo elimina del todo**, porque el
overscroll/rebote sigue exponiendo el `<body>`.

### Capa 2 — JS: fijar el color directamente en `document.body`

```tsx
// Force body background (Safari margin fix)
useEffect(() => {
  const prevBg = document.body.style.backgroundColor;
  document.body.style.backgroundColor = PAGE_BG;
  return () => {
    document.body.style.backgroundColor = prevBg;
  };
}, []);
```

- Se guarda el color previo del `<body>` antes de sobreescribirlo, para no
  afectar a otras páginas de la app que comparten el mismo `layout.tsx`.
- Se restaura ese color previo en el `return` del `useEffect` (cleanup), que
  corre cuando el componente se desmonta (el usuario navega a otra ruta).
- Como el color queda fijado en el elemento raíz real (`<body>`), ya no
  importa que un `div` interno no cubra perfectamente el viewport: cualquier
  hueco que Safari muestre por el bounce o por un cálculo de `vh` desfasado
  va a mostrar el color correcto, no blanco.

## Cuándo usar este patrón

Aplica a **cualquier página o vista de ancho/alto fijo tipo "app móvil"**
dentro de este repo (fullscreen, sin scroll normal de página, pensada para
verse en un solo dispositivo): Photo Wall, cámara, y ahora
`/envio-invitacion`. No hace falta en páginas normales con scroll y diseño
responsive (landing, `/about/*`, etc.), donde el `<body>` nunca queda expuesto
porque el contenido siempre llena el ancho completo del layout.

## Checklist para replicarlo en una página nueva

1. En el CSS del contenedor raíz: `min-height: 100dvh` (no `100vh`) +
   `padding` con `env(safe-area-inset-top)` / `env(safe-area-inset-bottom)`
   si la página puede tapar el notch o el home indicator.
2. En el componente (debe ser `"use client"`): un `useEffect` con el patrón
   guardar-color-previo → asignar el nuevo → restaurar en el cleanup.
3. Usar el mismo color de fondo en el `useEffect` que el que ya tiene el
   contenedor raíz vía CSS, para que ambas capas coincidan exactamente.
