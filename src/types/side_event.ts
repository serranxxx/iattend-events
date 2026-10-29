export type SideEventBody = {
  font: string;
  hour: string;
  // Eventos Flash con varias fechas (ej. 14 y 15 de octubre, cada una con su
  // hora): horas de pared ordenadas; `hour` siempre es la primera. Ausente
  // cuando hay una sola fecha.
  dates?: string[] | null;
  // Huso horario IANA del venue (ej. "America/Tijuana"), resuelto por
  // iattend-vite a partir del estado de la dirección al guardar. Ausente
  // en eventos guardados antes de este cambio.
  timezone?: string | null;
  image: string;
  // Eventos Flash: video de fondo (como el Save the Date). Con video, `image`
  // es su cuadro fijo y la imagen del link.
  video?: string | null;
  // true: los PNG pueden pasar sobre los botones de confirmar sin recortarse.
  stickers_zona_libre?: boolean | null;
  // PNG sobre la portada de un Flash: x/y centro en % del ancho y del alto de
  // la pantalla, w en % del ancho, rot en grados. Van detrás del título, la
  // fecha y el lugar (z es legado, ya no se usa). Se mueven con la página.
  // Además de PNG (sin `kind` o "sticker", con `url`), elementos del panel
  // Elementos del editor: mismo modelo que los de la invitación (LayerItem).
  stickers?: FlashSticker[] | null;
  // Mini itinerario de un Flash: icon es el índice del catálogo del
  // itinerario (helpers/icons); date solo si el evento tiene varias fechas.
  itinerary?: { id: string; name: string; time: string | null; icon: number | string | null; date?: string | null; place?: string | null }[] | null;
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
  // Canción de un Flash (mismo formato que la del Save the Date; la toca
  // SongPlayer). Ausente = sin canción.
  song?: { id: string; source?: "spotify" | "upload"; name: string; artist: string; albumArt?: string; previewUrl?: string | null } | null;
  // Efecto animado de un Flash (components/SideEvent/Efectos.tsx).
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
  // Solo Flash: cuadro "Asistentes" con quienes confirmaron (y el selector de
  // emoji / color al confirmar). Opcional, apagado por omisión.
  showAttendees?: boolean | null;
  // Avatares de Asistentes: "emoji" (por omisión, colores alegres; el
  // invitado puede cambiar el suyo) o "initials" (iniciales, colores sobrios).
  attendeesStyle?: "emoji" | "initials" | null;
  // Chat de asistentes (solo con Asistentes visible): prendido y mensaje
  // fijado del organizador. Ver iattend--backend router/sideEventChat.js.
  chat?: { enabled?: boolean | null; pinned?: { text: string; updated_at?: string } | null } | null;
  // Registro de asistentes (solo Flash): el formulario que arma el
  // organizador con plantillas. Ver SideEvent/Registro/datosRegistro.ts.
  form?: import("@/components/SideEvent/Registro/datosRegistro").FormRegistro | null;
  // Orden y ocultos de las tarjetas de abajo (panel Capas del editor;
  // helpers/tarjetasSide.ts) y textos ocultos de la portada.
  cards?: { key: string; hidden?: boolean | null }[] | null;
  coverHidden?: { title?: boolean | null; date?: boolean | null; place?: boolean | null } | null;
  // Estilo del texto de Notas (barra de texto del editor, como el título).
  notes_style?: {
    font?: string | null; size?: number | null; weight?: number | null; line_height?: number | null;
    opacity?: number | null; color?: string | null; italic?: boolean | null; underline?: boolean | null;
    strike?: boolean | null; transform?: "none" | "uppercase" | "lowercase" | null; letterSpacing?: number | null;
    align?: "left" | "center" | "right" | null;
  } | null;
  // Nombre del lugar (ej. "Salón Jardín"), opcional. Cuando existe, se
  // muestra en vez de la dirección debajo de la fecha en SideEvent.tsx.
  place_name?: string | null;
};

export type SideEvent = {
  // Solo vista previa del editor ("Ver en vivo"): confirmados reales que ya
  // tiene el editor, para no enseñar el ejemplo si el Flash ya tiene asistentes.
  _asistentes?: { total: number; asistentes: { id: string; nombre: string; iniciales: string; emoji: string | null; perfil: number | null }[] } | null;
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


export type popTheme = {
  button: number,
  animation: number,
  palette: {
    actions: string,
    primary: string,
    secondary: string,
    glass: number
  },
  background: { type: string, media: string }[],
  theme: string,
};

export type popContent = {
  text: {
    color: string,
    family: string,
  },
  extra: {
    info: string,
    custom_question: {
      type: string,
      options: string[],
      question: string
    },
  }
  title: {
    size: number,
    color: string,
    family: string,
    weight: number,
    opacity: number,
    line_height: number,
    value: string | null
  },
  information: {
    date: string,
    type: string,
    address: SideAddress,
    timezone?: string | null
  }
};


export type popEventBody = {
  theme: popTheme,
  content: popContent
};

export type PopEvent = {
  id: number;
  created_at: string;
  user_id: string;
  body: popEventBody;
};

// Elemento de la portada de un Flash (body.stickers). Ver
// components/SideEvent/FlashElemento.tsx.
export interface FlashSticker {
  id: string;
  kind?: "sticker" | "icon" | "text" | "line" | "separator" | "shape" | null;
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
