// Tipo del estado
export interface AppState {
  logged: boolean;
  user: AppUser | null;
  date: Date;
  MainColor?: string;
  colorPalette?: ColorPalette;
  theme?: boolean;
  font?: string;
  cover?: boolean;
  onDesign?: boolean;
  i_id?: string | null;
}

// Tipo del contexto
export interface AppStateContextType extends AppState {
  login: (_user: AppUser) => void;
  logout: () => void;
  setMainColor: (_color: string) => void;
  setColorPalette: (_colors: ColorPalette) => void;
  setTheme: (_theme: boolean) => void;
  setFont: (_font: string) => void;
  setCover: (_cover: boolean) => void;
  setOnDate: (_date: Date) => void;
  setOnDesigning: (_designing: boolean) => void;
  setCurrentInvitation: (_id: string | null) => void;
}

export interface AppUser {
  uid: string;
  name: string;
  role: "Owner" | "Admin";
  enterprise: AppUserEnterprise | null;
}

export interface AppUserEnterprise {
  active: boolean;
  name: string | null;
  logo: string | null;
  discount: number | null;
  color: string | null;
  instagram: string | null;
  email: string | null;
  whatsapp: string | null;
  webpage: string | null;
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  buttons: string;
}
