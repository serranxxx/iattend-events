// src/helpers/slug.ts
export function slugify(s: string) {
    return s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // quita acentos
      .replace(/[^a-z0-9]+/g, '-')     // espacios y símbolos -> guiones
      .replace(/(^-|-$)/g, '');        // recorta guiones al inicio/fin
  }