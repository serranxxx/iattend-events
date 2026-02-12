// 1) Para strings planos
export function interpolateText(
    template: string,
    values: Record<string, string | number>
  ): string {
    return template.replace(/{(\w+)}/g, (_, key) =>
      values[key] !== undefined ? String(values[key]) : `{${key}}`
    );
  }
  
  // 2) Para React nodes (permite <b>...</b>, íconos, etc.)
  import type { ReactNode } from "react";
  
  export function interpolateNodes(
    template: string,
    values: Record<string, ReactNode>
  ): ReactNode[] {
    const parts: ReactNode[] = [];
    let lastIndex = 0;
  
    const regex = /{(\w+)}/g;
    let match: RegExpExecArray | null;
  
    while ((match = regex.exec(template)) !== null) {
      const [placeholder, key] = match;
      const index = match.index;
  
      // Empuja el texto que hay antes del placeholder
      if (index > lastIndex) {
        parts.push(template.slice(lastIndex, index));
      }
  
      // Empuja el nodo (o el placeholder si no existe)
      parts.push(values[key] ?? placeholder);
  
      lastIndex = index + placeholder.length;
    }
  
    // Empuja el texto que quedara al final
    if (lastIndex < template.length) {
      parts.push(template.slice(lastIndex));
    }
  
    return parts;
  }