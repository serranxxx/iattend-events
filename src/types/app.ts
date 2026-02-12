import { IconType } from "react-icons";

export interface navItems {
  name: string;
  icon: IconType;
  selected: IconType;
  path: string;
  position: string;
}

export interface homeCards {
  icon: IconType;
  title: string;
  text: string;
}
