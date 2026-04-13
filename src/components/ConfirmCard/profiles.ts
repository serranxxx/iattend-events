type Profile = {
  id: number
  light: string
  dark: string
  gradient: string
  background: string
}

export const profiles: Profile[] = [
  {
    id: 0,
    light: '#BFB3D3',
    dark: '#A79ABC',
    gradient: 'linear-gradient(to bottom, #BFB3D3, #A79ABC)',
    background: 'linear-gradient(270deg, #D9D0E6 0%, #BFB3D3 45%, #A79ABC 100%)'
  },
  {
    id: 1,
    light: '#EB5A40',
    dark: '#C6422A',
    gradient: 'linear-gradient(to bottom, #EB5A40, #C6422A)',
    background: 'linear-gradient(270deg, #F48A78 0%, #EB5A40 45%, #C6422A 100%)'
  },
  {
    id: 2,
    light: '#F0A23B',
    dark: '#C88124',
    gradient: 'linear-gradient(to bottom, #F0A23B, #C88124)',
    background: 'linear-gradient(270deg, #F6C57A 0%, #F0A23B 45%, #C88124 100%)'
  },
  {
    id: 3,
    light: '#FFD931',
    dark: '#DFBA18',
    gradient: 'linear-gradient(to bottom, #FFD931, #DFBA18)',
    background: 'linear-gradient(270deg, #FFE97A 0%, #FFD931 45%, #DFBA18 100%)'
  },
  {
    id: 4,
    light: '#A1B569',
    dark: '#7F9347',
    gradient: 'linear-gradient(to bottom, #A1B569, #7F9347)',
    background: 'linear-gradient(270deg, #C0CF97 0%, #A1B569 45%, #7F9347 100%)'
  },
  {
    id: 5,
    light: '#69A266',
    dark: '#477644',
    gradient: 'linear-gradient(to bottom, #69A266, #477644)',
    background: 'linear-gradient(270deg, #98C395 0%, #69A266 45%, #477644 100%)'
  },
  {
    id: 6,
    light: '#61A39A',
    dark: '#427A72',
    gradient: 'linear-gradient(to bottom, #61A39A, #427A72)',
    background: 'linear-gradient(270deg, #95C7C1 0%, #61A39A 45%, #427A72 100%)'
  },
  {
    id: 7,
    light: '#89D8EC',
    dark: '#67B1C3',
    gradient: 'linear-gradient(to bottom, #89D8EC, #67B1C3)',
    background: 'linear-gradient(270deg, #BCECF7 0%, #89D8EC 45%, #67B1C3 100%)'
  },
  {
    id: 8,
    light: '#4B9DE0',
    dark: '#3073A9',
    gradient: 'linear-gradient(to bottom, #4B9DE0, #3073A9)',
    background: 'linear-gradient(270deg, #86C0EE 0%, #4B9DE0 45%, #3073A9 100%)'
  },
  {
    id: 9,
    light: '#2F438C',
    dark: '#1A285C',
    gradient: 'linear-gradient(to bottom, #2F438C, #1A285C)',
    background: 'linear-gradient(270deg, #6E7FB8 0%, #2F438C 45%, #1A285C 100%)'
  },
  {
    id: 10,
    light: '#7C8EDE',
    dark: '#5869B6',
    gradient: 'linear-gradient(to bottom, #7C8EDE, #5869B6)',
    background: 'linear-gradient(270deg, #AAB5EC 0%, #7C8EDE 45%, #5869B6 100%)'
  },
  {
    id: 11,
    light: '#C760A2',
    dark: '#A94486',
    gradient: 'linear-gradient(to bottom, #C760A2, #A94486)',
    background: 'linear-gradient(270deg, #DF97C6 0%, #C760A2 45%, #A94486 100%)'
  },
  {
    id: 12,
    light: '#92A0A3',
    dark: '#6C7A7D',
    gradient: 'linear-gradient(to bottom, #92A0A3, #6C7A7D)',
    background: 'linear-gradient(270deg, #BCC5C7 0%, #92A0A3 45%, #6C7A7D 100%)'
  },
  {
    id: 13,
    light: '#D1B48A',
    dark: '#927A57',
    gradient: 'linear-gradient(to bottom, #D1B48A, #927A57)',
    background: 'linear-gradient(270deg, #E5D1B3 0%, #D1B48A 45%, #927A57 100%)'
  },
  {
    id: 14,
    light: '#755027',
    dark: '#5F3F1C',
    gradient: 'linear-gradient(to bottom, #755027, #5F3F1C)',
    background: 'linear-gradient(270deg, #A27B4F 0%, #755027 45%, #5F3F1C 100%)'
  },
  {
    id: 15,
    light: '#2D2D2C',
    dark: '#232322',
    gradient: 'linear-gradient(to bottom, #2D2D2C, #232322)',
    background: 'linear-gradient(270deg, #5C5C5B 0%, #2D2D2C 45%, #232322 100%)'
  }
]

export const profilesMap: Record<number, Profile> = profiles.reduce(
  (acc, profile) => {
    acc[profile.id] = profile
    return acc
  },
  {} as Record<number, Profile>
)