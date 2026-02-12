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
  login: (user: AppUser) => void;
  logout: () => void;
  setMainColor: (color: string) => void;
  setColorPalette: (colors: ColorPalette) => void;
  setTheme: (theme: boolean) => void;
  setFont: (font: string) => void;
  setCover: (cover: boolean) => void;
  setOnDate: (date: Date) => void;
  setOnDesigning: (designing: boolean) => void;
  setCurrentInvitation: (id: string | null) => void;
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
