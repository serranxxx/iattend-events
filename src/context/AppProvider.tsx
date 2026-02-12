"use client";

import { useEffect, useReducer, useState } from "react";
import { appContext } from "./AppContext";
import { authReducer } from "./appReducer";
import { types } from "./types";
import { AppState, AppUser, ColorPalette } from "@/types/context";

const initialState: AppState = {
  logged: false,
  user: null,
  date: new Date(),
};

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [authState, dispatch] = useReducer(authReducer, initialState);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isLogged = localStorage.getItem("logged") === "true";
      const user = JSON.parse(
        localStorage.getItem("user") || "null"
      ) as AppUser | null;

      if (isLogged && user) {
        dispatch({ type: types.LOGIN, payload: user });
      }

      setIsClient(true);
    }
  }, []);

  const login = (newUser: AppUser) => {
    dispatch({ type: types.LOGIN, payload: newUser });
    localStorage.setItem("logged", "true");
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  const logout = () => {
    dispatch({ type: types.LOGOUT });
    localStorage.removeItem("logged");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  };

  const setMainColor = (color: string = "#000000") =>
    dispatch({ type: types.COLOR, payload: color });

  const setColorPalette = (colors: ColorPalette) =>
    dispatch({ type: types.PALETTE, payload: colors });

  const setTheme = (theme: boolean = true) =>
    dispatch({ type: types.THEME, payload: theme });

  const setFont = (font: string = "Georgia") =>
    dispatch({ type: types.FONT, payload: font });

  const setCover = (cover: boolean = false) =>
    dispatch({ type: types.COVER, payload: cover });

  const setOnDate = (date: Date = new Date()) =>
    dispatch({ type: types.DATE, payload: date });

  const setOnDesigning = (designing: boolean = false) =>
    dispatch({ type: types.DESIGN, payload: designing });

  const setCurrentInvitation = (id: string | null = null) =>
    dispatch({ type: types.INVID, payload: id });

  if (!isClient) return null;

  return (
    <appContext.Provider
      value={{
        ...authState,
        login,
        logout,
        setMainColor,
        setColorPalette,
        setTheme,
        setFont,
        setCover,
        setOnDate,
        setOnDesigning,
        setCurrentInvitation,
      }}
    >
      {children}
    </appContext.Provider>
  );
};
