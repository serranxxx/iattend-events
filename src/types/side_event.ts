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
  // Mini itinerario de un Flash: icon es el índice del catálogo del
  // itinerario (helpers/icons); date solo si el evento tiene varias fechas.
  itinerary?: { id: string; name: string; time: string | null; icon: number | string | null; date?: string | null; place?: string | null }[] | null;
  title: {
    font: string;
    size: number;
    weight: number;
    opacity: number;
    line_height: number;
  };
  address: SideAddress;
  color: string;
  extras: string | null;
  hideWeather?: boolean;
  // Nombre del lugar (ej. "Salón Jardín"), opcional. Cuando existe, se
  // muestra en vez de la dirección debajo de la fecha en SideEvent.tsx.
  place_name?: string | null;
};

export type SideEvent = {
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