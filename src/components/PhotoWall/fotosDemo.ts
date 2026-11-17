/*
  Photo Wall de ejemplo para "Ver en vivo" del editor (no hay invitación real
  detrás): fotos de las ideas de I attend (bucket público `assets`) con
  nombres y horas inventados. Nunca se llama a la API ni se guarda nada.
*/

const BASE = "https://jblcqcxckefmydvtrxbi.supabase.co/storage/v1/object/public/assets";
const FOTOS = [
  "Covers/cover_1.jpg", "Quote/quote_2.jpg", "Covers/cover_3.jpg", "Covers/cover_5.jpg",
  "Quote/quote_1.jpg", "Covers/cover_7.jpg", "Covers/cover_2.jpg", "Quote/quote_10.jpg",
  "Covers/cover_8.jpg", "Covers/cover_4.jpg",
];
const NOMBRES = ["Ana", "Luis", "Sofía", "Diego", "Valeria", "Carlos", "Mariana", "Jorge", "Paola", "Andrés"];

export const fotosDemo = () => {
  const ahora = Date.now();
  return FOTOS.map((ruta, i) => {
    const hora = new Date(ahora - i * 7 * 60_000).toISOString();
    return {
      id: `demo-${i}`,
      event_id: "demo",
      guest_name: NOMBRES[i % NOMBRES.length],
      taken_at: hora,
      public_url: `${BASE}/${ruta}`,
      uploaded_at: hora,
    };
  });
};

export const likesDemo = (): Record<string, string[]> => ({
  "demo-0": ["Luis", "Sofía", "Diego"],
  "demo-2": ["Ana"],
  "demo-5": ["Mariana", "Jorge"],
});
