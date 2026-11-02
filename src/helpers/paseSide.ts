/*
  Contenido del QR del pase de un side event / Pop (PasePop y su pase de
  Apple Wallet). Lleva el prefijo "side:" porque los ids de
  `side_events_guests` y de `guests` son números que se repiten entre tablas:
  sin él, el lector de una boda podría registrar a un invitado equivocado.
  El lector de iattend-vite (pages/Scanner/scannerUtils.js, `leerQr`) lo
  reconoce y en una invitación lo rechaza.
*/

export const qrPaseSide = (guestId: number | string) => `side:${guestId}`;
