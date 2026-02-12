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
  icon: number | null;
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
  image: {
    prod: string | null;
    dev: string | null;
    background: boolean | null;
    blur: boolean | null;
    position: { x: number; y: number };
    zoom: number;
  };
}

export interface GreetingSection {
  active: boolean;
  inverted: boolean;
  background: boolean;
  separator: boolean;
  title: string;
  description: string;
}

export interface PeopleSection {
  active: boolean;
  background: boolean;
  inverted: boolean;
  separator: boolean;
  title: string;
  personas: Person[];
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
}

export interface ItinerarySection {
  active: boolean;
  background: boolean;
  inverted: boolean;
  separator: boolean;
  title: string | null;
  type: 'cards' | 'time-line'
  object: ItineraryItem[];
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
}

export interface GiftsSection {
  active: boolean;
  background: boolean;
  inverted: boolean;
  separator: boolean;
  title: string | null;
  description: string | null;
  cards: GiftCard[];
}

export interface DestinationsSection {
  active: boolean;
  background: boolean;
  inverted: boolean;
  separator: boolean;
  title: string | null;
  description: string | null;
  cards: DestinationCard[];
}

export interface NoticesSection {
  active: boolean;
  background: boolean;
  inverted: boolean;
  separator: boolean;
  title: string | null;
  notices: string[];
}

export interface GallerySection {
  active: boolean;
  background: boolean;
  inverted: boolean;
  separator: boolean;
  prod: string[];
  dev: string[];
  title: string | null;
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
