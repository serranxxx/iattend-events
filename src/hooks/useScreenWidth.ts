import { useState, useEffect } from "react";

export function useScreenWidth() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);

    // Agrega el listener
    window.addEventListener("resize", handleResize);

    // Limpieza al desmontar el componente
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return width;
}