import { AppState } from "@/types/context";
import { types } from "./types";

export const authReducer = (state: AppState, action: any): AppState => {
  switch (action.type) {
    case types.LOGIN:
      return { ...state, logged: true, user: action.payload };
    case types.LOGOUT:
      return { logged: false, user: null, date: new Date() };
    case types.COLOR:
      return { ...state, MainColor: action.payload };
    case types.PALETTE:
      return { ...state, colorPalette: action.payload };
    case types.THEME:
      return { ...state, theme: action.payload };
    case types.FONT:
      return { ...state, font: action.payload };
    case types.COVER:
      return { ...state, cover: action.payload };
    case types.DATE:
      return { ...state, date: action.payload };
    case types.DESIGN:
      return { ...state, onDesign: action.payload };
    case types.INVID:
      return { ...state, i_id: action.payload };
    default:
      return state;
  }
};
