export type SideEventBody = {
  font: string;
  hour: string;
  image: string;
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
    secondary: string
  },
  background: { type: string, media: string }[]
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
    address: SideAddress
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