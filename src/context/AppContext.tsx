import { AppStateContextType } from "@/types/context";
import { createContext } from "react";

// Exporta el contexto vacío, pero tipado
export const appContext = createContext<AppStateContextType | null>(null);
