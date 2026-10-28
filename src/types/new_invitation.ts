import type { BlurSettings, ShadowSettings } from "@/components/Invitation/Cover/coverEffects";
/* eslint-disable no-unused-vars */
// types/invitation.ts

/** Utilidades */
export type Id = string; // en el cliente representamos ObjectId como string

/** Enums opcionales (ajústalos a tu UI) */
export enum AlignX {
  Left = "left",
  Center = "center",
  Right = "right",
}
export enum AlignY {
  Start = "flex-start",
  Center = "center",
  End = "flex-end",
}
export enum FlexDirection {
  column = "column",
  columnReverse = "column-reverse",
  cow = "row",
  rowReverse = "row-reverse",
}
export enum PaymentMethod {
  Stripe = "stripe",
  Cash = "cash",
  Transfer = "transfer",
}
export enum InvitationType {
  Open = "open",
  Closed = "closed",
}
export enum InvitationPlan {
  P10 = "10days",
  P120 = "120days",
  P365 = "365days",
}

/** Subtipos base */
export interface Font {
  value: string | null;
  size: number;
  weight: number;
  opacity: number;
  typeFace: string;
  color: string;
}

export interface Address {
  street: string | null;
  number: string | null; // antes "numbe"
  neighborhood: string | null; // "colonia" (antes "district")
  zip: string | null; // string para preservar ceros a la izquierda
  city: string | null;
  state: string | null;
  country: string | null;
  url: string | null;
}

export interface Person {
  title: string;
  description: string | null;
}

export interface MomentItem {
  name: string;
  time: string | null; // usa Date ISO string si migras
  description: string | null;
}

export interface ItineraryItem {
  name: string;
  image: string | null;
  time: string | null;
  subtext: string | null;
  // active: boolean;
  icon: number | string | null; // number = catálogo de iconos, string = ruta de imagen (/assets/itinerary/*)
  id: number | null;
  address?: Address;
  moments?: MomentItem[];
  music?: string;
}

export type GiftCardKind = "store" | "bank";
export interface GiftCard {
  kind: GiftCardKind;
  brand: string | null; // para kind "store"
  url: string | null;
  bank: string | null; // para kind "bank"
  name: string | null;
  number: string | null;
}

export interface DestinationCard {
  image: string | null;
  name: string | null;
  description: string | null;
  url: string | null;
  type: "hotel" | "food" | "activitie"
}

/** Secciones */
export interface CoverSection {
  title: {
    text: Font;
    position: {
      column_reverse: "column" | "column-reverse"; // si no quieres restringir, deja string|null
      align_x: "left" | "center" | "right";
      align_y: "flex-start" | "center" | "flex-end";
    };
  };
  date: {
    value: string; // ISO string; si manejas Date en server, conviértelo a string en API
    active: boolean;
    color: string; // hex (#fff/#ffffff)
    type: number | null; // define enum si tienes catálogo
  };
  song?: {
    id: string;
    source?: "spotify" | "upload";
    name: string;
    artist: string;
    albumArt?: string;
    previewUrl?: string | null;
  } | null;
  image: {
    prod: string | string[] | null;
    dev: string | string[] | null;
    background: boolean | null;
    blur: boolean | null;
    // Ajustes de los efectos (ver Cover/coverEffects.ts). Opcionales: sin
    // ellos la sombra y el desenfoque se ven como siempre.
    shadow_settings?: ShadowSettings | null;
    blur_settings?: BlurSettings | null;
    position: { x: number; y: number };
    zoom: number;
  };
}

export type XYPosition = {
  x: number;
  y: number;
};


export type DynamicSeparatorType = "single" | "image";
export type DynamicSeparatorSingle = {
  value: number;   // generals.separator
  color: string;   // generals.colors.accent
};
export type DynamicSeparatorImage = {
  value: string | null; // default null
  zoom: number;         // default 1
  position: XYPosition; // default {x:0,y:0}
  height: number;
  width: number;
};

export type DynamicSeparator = {
  active: boolean;                 // same as module.separator
  type: DynamicSeparatorType;      // default "single"
  single: DynamicSeparatorSingle;
  image: DynamicSeparatorImage;
  color?: string | null;           // color propio (editor); vacío = textos del tema. single.color es un valor viejo sin uso
};

export type DynamicBackgroundShape = "square" | string;

export type DynamicBackground = {
  active: boolean;         // same as module.background
  color: string;           // valor viejo sin uso (#939faf en casi todas): no pintar con él
  // Color propio del fondo del módulo (editor). Vacío = generals.colors.secondary.
  custom_color?: string | null;
  shape?: DynamicBackgroundShape; // default "square"
  shadow?: boolean;        // default false
  texture?: number | null; // textura propia del bloque (id de `textures`), aparte de la general
  image?: string | null;   // imagen de fondo del bloque (va encima del color)
  image_opacity?: number | null; // 0–1, default 1
  texture_opacity?: number | null; // intensidad de la textura del bloque, 0.1–1 (default 1)
  padding_y?: number | null; // relleno arriba / abajo de la caja en px (sin valor = el de la hoja, 24)
  border_radius?: number;  // default 0
  width: number;          // default "100%"
};

export interface GreetingSection {
  active: boolean;
  inverted: boolean;
  background: boolean;
  separator: boolean;
  title: string;
  description: string;
  dynamic_separator: DynamicSeparator;
  dynamic_background: DynamicBackground;
}

export interface PeopleSection {
  active: boolean;
  background: boolean;
  inverted: boolean;
  separator: boolean;
  title: string;
  personas: Person[];
  dynamic_separator: DynamicSeparator;
  dynamic_background: DynamicBackground;
}

export interface QuoteSection {
  active: boolean;
  inverted: boolean;
  background: boolean;
  separator: boolean;
  image: {
    active: boolean;
    dev: string | null;
    prod: string | null;
  };
  text: {
    font: Font;
    justify: "left" | "center" | "right";
    align: "flex-start" | "center" | "flex-end";
    width: number | null;
    shadow: boolean;
  };
  dynamic_separator: DynamicSeparator;
  dynamic_background: DynamicBackground;
}

export interface ItinerarySection {
  active: boolean;
  background: boolean;
  inverted: boolean;
  separator: boolean;
  title: string | null;
  type: 'cards' | 'time-line'
  object: ItineraryItem[];
  dynamic_separator: DynamicSeparator;
  dynamic_background: DynamicBackground;
}

// export interface DressCodeLink {
//   name: string;
//   url: string;
// }

export interface DresscodeSection {
  active: boolean;
  background: boolean;
  inverted: boolean;
  separator: boolean;
  title: string | null;
  description: string | null;
  colors: string[];
  links: string[];
  prod: string[];
  dev: string[];
  images_active: boolean;
  links_active: boolean;
  dynamic_separator: DynamicSeparator;
  dynamic_background: DynamicBackground;
}

export interface GiftsSection {
  active: boolean;
  background: boolean;
  inverted: boolean;
  separator: boolean;
  title: string | null;
  description: string | null;
  cards: GiftCard[];
  dynamic_separator: DynamicSeparator;
  dynamic_background: DynamicBackground;
}

export interface DestinationsSection {
  active: boolean;
  background: boolean;
  inverted: boolean;
  separator: boolean;
  title: string | null;
  description: string | null;
  cards: DestinationCard[];
  dynamic_separator: DynamicSeparator;
  dynamic_background: DynamicBackground;
}

export interface NoticesSection {
  active: boolean;
  background: boolean;
  inverted: boolean;
  separator: boolean;
  title: string | null;
  notices: string[];
  dynamic_separator: DynamicSeparator;
  dynamic_background: DynamicBackground;
}

export interface GallerySection {
  active: boolean;
  background: boolean;
  inverted: boolean;
  separator: boolean;
  prod: string[];
  dev: string[];
  title: string | null;
  dynamic_separator: DynamicSeparator;
  dynamic_background: DynamicBackground;
}

export interface Generals {
  colors: {
    primary: string | null;
    secondary: string | null;
    accent: string | null;
    actions: string | null;
  };
  fonts: {
    titles?: Font;
    body?: Font;
  };
  event: {
    label: string | null;
    name: string | null;
  };
  separator: number;
  positions: number[];
  texture: number | null;
  languages?: string[];
  disabledLanguages?: string[];
}

// export interface InvitationMeta {
//     active: boolean;
//     type: InvitationType | string; // si aún no fijas catálogo, deja string
//     plan: InvitationPlan | string;
//     payment: {
//         type: PaymentMethod | string | null;
//         date: string | null; // ISO string
//     };
//     started: boolean;
// }

/** Modelo raíz que usas en Next */
// Elementos sueltos que el organizador pone encima de una sección desde el
// editor de escritorio (iattend-vite, herramientas Elementos y Stickers).
// Posición en % de la sección: x / y = centro, w = ancho. Ver
// components/Invitation/SectionLayer/SectionLayer.tsx.
export type LayerItemKind = "sticker" | "icon" | "text" | "line" | "separator" | "shape";
export interface LayerItem {
  id: string;
  kind: LayerItemKind;
  url?: string; // sticker
  icon?: string; // nombre del ícono de lucide
  text?: string;
  // texto: "title" | "subtitle" | "body"; línea: "solid" | "dashed" | "dotted" | "double";
  // separador: su número ("1" … "14", los mismos de generals.separator)
  variant?: string;
  color?: string | null; // null = color de textos del tema
  font?: string | null; // texto: tipografía propia; null = la del tema
  // forma: variant = "square" | "circle" | "rect" | "triangle" | "star"; color = relleno
  // ("transparent" = sin relleno); ar = alto / ancho (se estira); borde aparte.
  ar?: number | null;
  stroke?: string | null;
  strokeWidth?: number | null;
  z?: "front" | "back" | null; // plano: delante (default) o detrás del contenido del bloque
  radius?: number | null; // esquinas de cuadrado / rectángulo, px a 390 de ancho (999 = píldora)
  x: number;
  y: number;
  w: number;
  rot?: number;
  opacity?: number;
}
// Llave = sección ("cover", "greeting", "family", "quote", …).
export type Decorations = Record<string, LayerItem[] | undefined>;

export interface NewInvitation {
  // _id: Id;                 // opcional en creación; presente en lecturas
  // userID: Id;

  cover: CoverSection;
  greeting: GreetingSection;
  people: PeopleSection;
  quote: QuoteSection;
  itinerary: ItinerarySection;
  dresscode: DresscodeSection;
  gifts: GiftsSection;
  destinations: DestinationsSection;
  notices: NoticesSection;
  gallery: GallerySection;
  generals: Generals;
  decorations?: Decorations | null;
  // invitation: InvitationMeta;

  // createdAt?: string;      // si usas timestamps de Mongoose
  // updatedAt?: string;
}

export interface InvitationUIBundle {
  cover: {
    countdown: {
      days: string;
      hours: string;
      minutes: string;
      seconds: string;
    };
    datePrefix: string;
  };

  labels: {
    food: string;
    lodging: string;
    activities: string;
    cards: string;
    DiscoverGifts:string;
    seeGifts:string;
  };

  locked: {
    p1: string;
    p2: string;
    title: string;
    access: string;
    placeholder: string;
  };

  buttons: {
    confirm: string;
    details: string;
    directions: string;
    inspiration: string;
  };

  controlBar: {
    editResponse: string;
    updateStatus: string;
    digitalPass: string;
    photoWall: string;
    askLia: string;
    whatsappConfirmMessage: string;
  };

  liaGuest: {
    close: string;
    introLine: string;
    connectionError: string;
    prompts: string[];
  };

  // Rediseño de la confirmación (plan Pro). Opcional: el bundle de Supabase
  // puede no tenerlo todavía — se completa con `getDockCopy()`.
  dock?: Partial<DockCopy>;

  // Layout web (≥768): destinos, galería, flechas. Opcional igual
  // que `dock` — se completa con `getWebCopy()`.
  web?: Partial<WebCopy>;

  camera: {
    noName: string;
    tooEarly: string;
    unavailable: string;
    discard: string;
    sendToWall: string;
    shotsRemaining: string;
    switchCamera: string;
    permissionDenied: string;
    maxPhotosReached: string;
    uploadFromGallery: string;
    takePhoto: string;
    viewPhotoWall: string;
  };

  confirm: {
    cta: string;
    hello: string;
    passes1: string;
    passes2: string;
    decline: string;
    howMany: string;
    yourName: string;
    declinedMsg: string;
    drawerTitle: string;
    changeAnswer: string;
    addToCalendar: string;
    declinedTitle: string;
    confirmedTitle: string;
    changeAnswerBtn: string;
    addToCalendarBtn: string;
    confirmedMsgBold: string;
    thanks: string;
    closed_hi: string,
    closed_happy: string,
    closed_invitation: string,
    closed_companion: string,
    closed_notgoing: string,
    confirmed: string,
    not_going:string,
    dont_forget: string,
    add_companion:string,
    open_add_name:string,
    open_hi:string,
    digital_pass:string,
    digital_name:string,
    digital_table:string
  };
}

export interface WebCopy {
  previous: string;
  next: string;
  navigate: string;
  photos: string;
  dragHint: string;
}

export interface DockCopy {
  confirm: string;
  close: string;
  eyebrowConfirm: string;
  eyebrowEdit: string;
  eyebrowConfirmed: string;
  eyebrowTour: string;
  eyebrowDeclined: string;
  hi: string;
  pass: string;
  passes: string;
  individual: string;
  forYouAndOne: string;
  forYouAndMany: string;
  whoAttends: string;
  countOf: string;
  youGoing: string;
  youNotGoing: string;
  going: string;
  notGoing: string;
  needsName: string;
  companionPlaceholder: string;
  missingOne: string;
  missingMany: string;
  toastMissingOne: string;
  toastMissingMany: string;
  ctaConfirmOne: string;
  ctaConfirmMany: string;
  ctaSend: string;
  ctaSave: string;
  declineAll: string;
  openHi: string;
  openSub: string;
  openCountOne: string;
  openCountMany: string;
  yourName: string;
  companionName: string;
  addCompanion: string;
  remove: string;
  toastName: string;
  toastUpdated: string;
  toastError: string;
  thanks: string;
  thanksSub: string;
  confirmedOne: string;
  confirmedMany: string;
  saveCalendar: string;
  until: string;
  hours2: string;
  allDay: string;
  calNoteOne: string;
  calNoteMany: string;
  calNoteNone: string;
  calDone: string;
  calNext: string;
  continue: string;
  tourTitle: string;
  tourSub: string;
  tourPassesOne: string;
  tourPassesMany: string;
  tourPhotos: string;
  tourLia: string;
  tourEdit: string;
  tourNote: string;
  gotIt: string;
  declinedTitle: string;
  declinedSub: string;
  changeAnswer: string;
  tabPasses: string;
  tabPhotos: string;
  tabLia: string;
  tabEdit: string;
  passesTitle: string;
  passesSubOne: string;
  passesSubMany: string;
  passLabel: string;
  passHint: string;
  liaTitle: string;
  liaSub: string;
  liaHello: string;
  liaHelloAnon: string;
  quickQuestion: string;
}

/** Payload para crear/actualizar desde formularios del cliente */
export type NewInvitationCreate = Omit<NewInvitation, "_id" | "createdAt" | "updatedAt">;
export type NewInvitationUpdate = Partial<NewInvitationCreate> & { _id: Id };

/** Respuestas de API genéricas */
export interface ApiListResponse<T> {
  data: T[];
  total: number;
}

export interface ApiItemResponse<T> {
  data: T;
}
