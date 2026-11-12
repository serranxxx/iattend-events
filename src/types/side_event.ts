// Pase digital (editor de vite → Pase digital): Apple Wallet opcional
// (`enabled: false` = sin botón) y foto / título propios del pase (vacíos =
// los de la portada). Lo usan el boleto (Layout/TicketPop) y el backend.
export type PaseWalletConfig = { enabled?: boolean | null; title?: string | null; image?: string | null } | null;

export type SideEventBody = {
  wallet?: PaseWalletConfig;
  font: string;
  hour: string;
  // Pops con varias fechas (ej. 14 y 15 de octubre, cada una con su
  // hora): horas de pared ordenadas; `hour` siempre es la primera. Ausente
  // cuando hay una sola fecha.
  dates?: string[] | null;
  // Huso horario IANA del venue (ej. "America/Tijuana"), resuelto por
  // iattend-vite a partir del estado de la dirección al guardar. Ausente
  // en eventos guardados antes de este cambio.
  timezone?: string | null;
  image: string;
  // Carrusel de la portada (Pop): la primera es `image` (helpers/fotosPortada.ts).
  images?: string[];
  // Ajuste de la foto de fondo (o del video): zoom y encuadre en %
  // (helpers/fotosPortada.ts → ajusteDe).
  imageFrame?: { src?: string | null; z?: number; x?: number; y?: number } | null;
  // El de cada foto o video de la portada, por su url.
  imageFrames?: Record<string, { z?: number; x?: number; y?: number }> | null;
  // Desenfoque de la portada hacia abajo (px y % donde empieza; helpers/fotosPortada.ts).
  coverBlur?: { amount?: number; start?: number } | null;
  // Pops: video de fondo (como el Save the Date). Con video, `image`
  // es su cuadro fijo y la imagen del link.
  video?: string | null;
  // true: los PNG pueden pasar sobre los botones de confirmar sin recortarse.
  stickers_zona_libre?: boolean | null;
  // PNG sobre la portada de un Pop: x/y centro en % del ancho y del alto de
  // la pantalla, w en % del ancho, rot en grados. Van detrás del título, la
  // fecha y el lugar (z es legado, ya no se usa). Se mueven con la página.
  // Además de PNG (sin `kind` o "sticker", con `url`), elementos del panel
  // Elementos del editor: mismo modelo que los de la invitación (LayerItem).
  stickers?: PopSticker[] | null;
  // Mini itinerario de un Pop: icon es el índice del catálogo del
  // itinerario (helpers/icons); date solo si el evento tiene varias fechas.
  // desc: detalle opcional del momento (≤ 60), debajo del nombre en el itinerario.
  itinerary?: { id: string; name: string; time: string | null; icon: number | string | null; date?: string | null; place?: string | null; desc?: string | null }[] | null;
  title: {
    font: string;
    size: number;
    weight: number;
    opacity: number;
    line_height: number;
    // Sombra del título, 0–100 (sombraDeTexto). Ausente = la de siempre.
    shadow?: number | null;
    // Barra de texto del editor (como la invitación; ausentes = sin cambio):
    // color (blanco por omisión), cursiva, subrayado, tachado, mayúsculas y
    // espacio entre letras (centésimas de em). Ver fontExtras.
    color?: string | null;
    italic?: boolean | null;
    underline?: boolean | null;
    strike?: boolean | null;
    transform?: "none" | "uppercase" | "lowercase" | null;
    letterSpacing?: number | null;
  };
  // Canción de un Pop (mismo formato que la del Save the Date; la toca
  // SongPlayer). Ausente = sin canción.
  song?: { id: string; source?: "spotify" | "upload"; name: string; artist: string; albumArt?: string; previewUrl?: string | null } | null;
  // Efecto animado de un Pop (components/SideEvent/Efectos.tsx).
  effect?: { type: "sparkles" | "confetti" | "bubbles" | "snow" | "petals"; intensity?: number; color?: "theme" | "white" | "gold" | "multi" } | null;
  // Velo del color del tema sobre la portada y los PNG (detrás del texto),
  // 0–100. Ausente o 0 = sin velo.
  veil?: number | null;
  // Sombra de la fecha y el lugar, 0–100. Ausente = la del CSS.
  details_shadow?: number | null;
  address: SideAddress;
  color: string;
  extras: string | null;
  hideWeather?: boolean;
  // Cuándo se muestra el clima: "auto" (por omisión; cuando ya hay pronóstico
  // del día) o "always" (siempre; antes, el de hoy). Oculto = hideWeather.
  // Ver SideEvent/ClimaVidrio.tsx.
  weatherMode?: "auto" | "always" | null;
  // Solo Pop: cuadro "Asistentes" con quienes confirmaron (y el selector de
  // emoji / color al confirmar). Opcional, apagado por omisión.
  showAttendees?: boolean | null;
  // Avatares de Asistentes: "emoji" (por omisión, colores alegres; el
  // invitado puede cambiar el suyo) o "initials" (iniciales, colores sobrios).
  attendeesStyle?: "emoji" | "initials" | null;
  // Color base de los avatares con iniciales (slider del editor); sin él, el del tema.
  attendeesColor?: string | null;
  // Chat de asistentes (solo con Asistentes visible): prendido y mensaje
  // fijado del organizador. Ver iattend--backend router/sideEventChat.js.
  chat?: { enabled?: boolean | null; pinned?: { text: string; updated_at?: string } | null } | null;
  // Formulario (solo Pop): el que el organizador eligió de "Mis
  // formularios" (snapshot + reglas). Ver SideEvent/Registro/datosRegistro.ts.
  form?: import("@/components/SideEvent/Registro/datosRegistro").FormRegistro | null;
  // Orden y ocultos de las tarjetas de abajo (panel Capas del editor;
  // helpers/tarjetasSide.ts) y textos ocultos de la portada.
  cards?: { key: string; hidden?: boolean | null }[] | null;
  coverHidden?: { title?: boolean | null; date?: boolean | null; place?: boolean | null } | null;
  // Posición del título, fecha y lugar en la primera pantalla (3 × 3); sin él, abajo al centro.
  titlePosition?: { x?: "left" | "center" | "right" | null; y?: "top" | "center" | "bottom" | null } | null;
  // Estilo del texto de Notas (barra de texto del editor, como el título).
  // Estilo de bloques de un Pop (panel Diseño, helpers/estilosBloque.ts). Sin él, "vidrio".
  blockStyle?: "vidrio" | "hielo" | "noche" | "papel" | "tema" | "sticker" | "contorno" | null;
  notes_style?: {
    font?: string | null; size?: number | null; weight?: number | null; line_height?: number | null;
    opacity?: number | null; color?: string | null; italic?: boolean | null; underline?: boolean | null;
    strike?: boolean | null; transform?: "none" | "uppercase" | "lowercase" | null; letterSpacing?: number | null;
    align?: "left" | "center" | "right" | null;
  } | null;
  // Patrocinadores de un Pop (helpers/patrocinadores.ts; editor: panel
  // Patrocinadores de iattend-vite). Sin logos no se pinta nada.
  // v2 (categorías); `mono` y `tier` son de la v1 y se leen convertidos.
  sponsors?: {
    enabled?: boolean | null;
    layout?: "portada" | "tarjeta" | "banda" | null;
    speed?: number | null;
    label?: string | null;
    defaultCat?: string | null;
    cats?: { id: string; name?: string | null; size?: "l" | "m" | "s" | null; color?: boolean | null }[] | null;
    mono?: boolean | null;
    items?: { id: string; url: string; name?: string | null; cat?: string | null; tier?: "p" | "s" | "a" | null; w?: number | null; h?: number | null }[] | null;
  } | null;
  // Nombre del lugar (ej. "Salón Jardín"), opcional. Cuando existe, se
  // muestra en vez de la dirección debajo de la fecha en SideEvent.tsx.
  place_name?: string | null;
  // Pop en línea (helpers/acceso.ts): modo y lo público del acceso. Lo
  // privado (enlace, códigos, material) va en la columna `acceso`.
  modo?: "presencial" | "online";
  online?: { platform?: string | null; onlyConfirmed?: boolean; material?: number } | null;
  zonaOnline?: string | null;
};

export type SideEvent = {
  // Código del link público (side-event/<código>) y si el link viejo con el
  // número sigue abriendo (solo eventos de antes del código). Ver
  // app/side-event/[side_event_id]/page.tsx.
  public_code?: string | null;
  // Solo en "Ver en vivo" del editor (la página pública no la recibe).
  acceso?: unknown;
  legacy_link_enabled?: boolean;
  // Solo vista previa del editor ("Ver en vivo"): confirmados reales que ya
  // tiene el editor, para no enseñar el ejemplo si el Pop ya tiene asistentes.
  _asistentes?: { total: number; asistentes: { id: string; nombre: string; iniciales: string; emoji: string | null; perfil: number | null }[] } | null;
  // Solo en la vista previa del editor: los mensajes reales del chat (los de
  // moderación, el más reciente primero).
  _chat?: { id: string; autor: string; autorId: string; emoji: string | null; perfil: number | null; text: string; created_at: string }[] | null;
  // Solo vista previa ("Ver en vivo" → Confirmado en el dock de vite): la
  // página como la ve un invitado que ya confirmó (invitado de ejemplo).
  _vistaConfirmada?: boolean;
  id: number;
  url_image: string | null;
  created_at: string;
  invitation_id: string;
  date: string;
  name: string;
  body: SideEventBody;
  type: 'open' | 'closed';
};


export type SideAddress = {
  city: string;
  state: string;
  number: string;
  street: string;
  country: string;
  zipcode: string;
  neighborhood: string;
  url: string;
};


// Elemento de la portada de un Pop (body.stickers). Ver
// components/SideEvent/PopElemento.tsx.
export interface PopSticker {
  id: string;
  kind?: "sticker" | "icon" | "text" | "line" | "separator" | "shape" | "dibujo" | null;
  // Dibujo a mano (herramienta Dibujar del editor, components/SideEvent/Dibujo.tsx):
  // pincel, grosor, puntos en su caja (vbW × vbH) y lo borrado.
  brush?: "pluma" | "marcador" | "resaltador" | "lapiz" | "neon" | null;
  size?: number | null;
  points?: [number, number][] | null;
  vbW?: number | null;
  vbH?: number | null;
  erase?: { points: [number, number][]; size: number }[] | null;
  // Dibujo anclado a la foto de fondo: x / y / w en % de la foto como se ve.
  foto?: boolean | null;
  // Con varias fotos / videos en la portada: anclado a esa (url), solo se ve
  // cuando le toca en el carrusel. Sin él, a la primera (y se ve siempre).
  fotoSrc?: string | null;
  // Dibujo hecho encima de una tarjeta de la página (clave de body.cards:
  // itinerary, notes, map, weather, attendees): x / y / w en % de la tarjeta.
  tarjeta?: string | null;
  url?: string;
  icon?: string;
  src?: string;
  tint?: boolean | null;
  // Vector: SVG en línea con color y grosor propios (helpers/vector.ts).
  vector?: boolean | null;
  strokeRel?: number | null;
  strokePx?: number | null;
  strokeFixed?: boolean | null;
  text?: string;
  variant?: string;
  color?: string | null;
  font?: string | null;
  ar?: number | null;
  stroke?: string | null;
  strokeWidth?: number | null;
  strokeStyle?: "solid" | "dashed" | "dotted" | null;
  radius?: number | null;
  flipX?: boolean | null;
  flipY?: boolean | null;
  x: number;
  y: number;
  w: number;
  rot?: number;
  z?: "front" | "back";
  opacity?: number;
  hidden?: boolean;
}
