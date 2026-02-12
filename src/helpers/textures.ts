import { CSSProperties } from "react";

type Texture = {
  /** ruta pública dentro de /public */
  image: string; // ej: "/textures/paper.jpg"
  opacity: number;
  blend: CSSProperties["mixBlendMode"];
  filter: CSSProperties["filter"];
  path: string; // si quieres mantenerlo, puede ser igual que image
};

export const textures: Texture[] = [
  {
    image: "/assets/textures/paper.jpg",
    opacity: 1,
    blend: "multiply",
    filter: "grayscale(1) contrast(1) brightness(1)",
    path: "/assets/textures/paper.jpg",
  },
  {
    image: "/assets/textures/pared.jpg",
    opacity: 0.5,
    blend: "multiply",
    filter: "grayscale(1) contrast(1) brightness(1)",
    path: "/assets/textures/pared.jpg",
  },
  {
    image: "/assets/textures/paper-2.jpg",
    opacity: 0.5,
    blend: "multiply",
    filter: "grayscale(1) contrast(1) brightness(1)",
    path: "/assets/textures/paper-2.jpg",
  },
  {
    image: "/assets/textures/textile.jpg",
    opacity: 0.5,
    blend: "multiply",
    filter: "grayscale(1) contrast(1) brightness(1)",
    path: "/assets/textures/textile.jpg",
  },
  {
    image: "/assets/textures/grunge.jpg",
    opacity: 0.5,
    blend: "multiply",
    filter: "grayscale(1) contrast(1) brightness(1)",
    path: "/assets/textures/grunge.jpg",
  },
  {
    image: "/assets/textures/crumpled.jpg",
    opacity: 0.5,
    blend: "multiply",
    filter: "grayscale(1) contrast(1) brightness(1)",
    path: "/assets/textures/crumpled.jpg",
  },
  {
    image: "/assets/textures/cotton.jpg",
    opacity: 0.5,
    blend: "multiply",
    filter: "grayscale(1) contrast(1.1) brightness(1)",
    path: "/assets/textures/cotton.jpg",
  },
  {
    image: "/assets/textures/leather.jpg",
    opacity: 0.5,
    blend: "multiply",
    filter: "grayscale(1) contrast(1.1) brightness(1)",
    path: "/assets/textures/cotton.jpg",
  },
  {
    image: "/assets/textures/magazine.jpg",
    opacity: 0.5,
    blend: "multiply",
    filter: "grayscale(1) contrast(1.1) brightness(1)",
    path: "/assets/textures/cotton.jpg",
  },
  // {
  //   image: "/assets/textures/magzne.jpg",
  //   opacity: 0.5,
  //   blend: "multiply",
  //   filter: "grayscale(1) contrast(1.1) brightness(1)",
  //   path: "/assets/textures/cotton.jpg",
  // },
  {
    image: "/assets/textures/flowers.jpeg",
    opacity: 0.5,
    blend: "multiply",
    filter: "grayscale(1) contrast(1.1) brightness(1)",
    path: "/assets/textures/cotton.jpg",
  },
  // {
  //   image: "/assets/textures/thread.jpg",
  //   opacity: 0.3,
  //   blend: "multiply",
  //   filter: "grayscale(1) contrast(1) brightness(0.9)",
  //   path: "/assets/textures/thread.jpg",
  // },
  // {
  //   image: "/assets/textures/kraft.jpg",
  //   opacity: 0.4,
  //   blend: "multiply",
  //   filter: "grayscale(1) contrast(1.2) brightness(1)",
  //   path: "/assets/textures/thread.jpg",
  // },
  {
    image: "/assets/textures/trees.jpg",
    opacity: 0.4,
    blend: "multiply",
    filter: "grayscale(1) contrast(1.2) brightness(1)",
    path: "/assets/textures/thread.jpg",
  },
  // {
  //   image: "/assets/textures/water.jpg",
  //   opacity: 0.8,
  //   blend: "soft-light",
  //   filter: "grayscale(1) contrast(1.4) brightness(1.2)",
  //   path: "/assets/textures/thread.jpg",
  // },
  

];
