export interface Invitation {
  _id: string;
  userID: string;
  active: boolean;
  due_date: string | Date;
  type: string;
  plan: string;
  creation_date: string | Date;
  last_update_date: string | Date;
  label: string;
  payment: string | null;

  greeting: GreetingType;
  family: FamilyType;
  quote: QuoteType;
  itinerary: ItineraryType;
  dresscode: DresscodeType;
  gifts: GiftsType;
  notices: NoticesType;
  cover: CoverType;
  gallery: GalleryType;
  generals: GeneralsType;
}

interface SectionBase {
  active: boolean;
  background: boolean;
  separator: boolean;
  id: number;
}

interface GreetingType extends SectionBase {
  title: string | null;
  description: string | null;
}

interface FamilyType extends SectionBase {
  title: string | null;
  personas: {
    title: string | null;
    name: string | null;
  }[];
}

interface QuoteType extends SectionBase {
  description: string | null;
  image: boolean;
  image_dev: string | null;
  image_prod: string | null;
  text: {
    justify: string | null;
    align: string | null;
    font: string | null;
    size: number;
    opacity: number;
    weight: number;
    color: string;
    width: number;
    shadow: boolean;
  };
}

interface ItineraryType extends SectionBase {
  title: string | null;
  object: ItineraryEvent[];
}

interface ItineraryEvent {
  name: string | null;
  time: string | null;
  subname: string | null;
  address: Address;
  subitems: SubEvent[] | null;
  playlist: string | null;
  active: boolean;
  image: number;
  id: string;
}

interface Address {
  calle: string | null;
  numero: string | null;
  colonia: string | null;
  CP: string | null;
  ciudad: string | null;
  estado: string | null;
  url: string | null;
}

interface SubEvent {
  name: string | null;
  time: string | null;
  description: string | null;
}

interface DresscodeType extends SectionBase {
  title: string | null;
  description: string | null;
  colors: string[] | null;
  images_prod: string[] | null;
  images_dev: string[] | null;
  available: number;
  onImages: boolean;
  onLinks: boolean;
}

interface GiftsType extends SectionBase {
  title: string | null;
  description: string | null;
  cards: GiftCard[];
}

interface GiftCard {
  link: boolean;
  type: string | null;
  url: string | null;
  bank: string | null;
  name: string | null;
  number: string | null;
}

interface NoticesType extends SectionBase {
  title: string | null;
  notices: string[] | null;
}

interface CoverType {
  date: string | Date;
  flexDirection: "row" | "row-reverse" | "column" | "column-reverse";
  fontSize: number;
  fontWeight: number;
  opacity: number;
  align: "flex-start" | "center" | "flex-end" | "space-between";
  justify: "center" | "left" | "right";
  featured_prod: string | null;
  featured_dev: string | null;
  background: string | null;
  image: string | null;
  color: string;
  auto: boolean;
  timerColor: string | null;
  timerType: number;
  title: string | null;
  mapPosition: {
    x: number;
    y: number;
  };
  zoomLevel: number;
  blur: boolean;
  isDate: boolean;
}

interface GalleryType extends SectionBase {
  title: string | null;
  gallery_prod: string[] | null;
  gallery_dev: string[] | null;
  available: number;
}

interface GeneralsType {
  color: string | null;
  palette: {
    base: string;
    primary: string;
    secondary: string;
    accent: string;
    buttons: string;
  };
  eventName: string | null;
  font: string | null;
  separator: number;
  texture: number | null;
  theme: boolean;
  positions: number[];
}
