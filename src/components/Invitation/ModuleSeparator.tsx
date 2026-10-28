"use client";

import React from "react";
import Image from "next/image";
import { Generals } from "@/types/new_invitation";
import { Separador } from "./Separator/Separator";
import { Plus } from "lucide-react";

// Separador al pie de un módulo (dynamic_separator: uno de los regulares o una
// imagen). En modo edición va envuelto en un bloque que se toca para abrir su
// panel en el editor; si el módulo no tiene, el bloque muestra un recuadro
// "+ Separador" en su lugar.

type DynamicSeparatorLike = {
  active?: boolean;
  type?: string;
  color?: string | null; // color propio del separador; vacío = textos del tema
  single?: { value?: number | null };
  image?: { value?: string | null; width?: number | null; height?: number | null };
} | null | undefined;

type Props = {
  separator: DynamicSeparatorLike;
  generals: Generals | null | undefined;
  inverted?: boolean;
  editMode?: boolean;
  section: string; // sección del editor (greeting, family…)
  onFieldTool?: (_field: string, _rect: { x: number; y: number; w: number; h: number }, _section?: string) => void;
};

export function ModuleSeparator({ separator, generals, inverted, editMode = false, section, onFieldTool }: Props) {
  const hasSeparator = Boolean(separator?.active);
  // Color propio: el Separador pinta con colors.accent.
  const sepGenerals = generals && separator?.color
    ? ({ ...generals, colors: { ...generals.colors, accent: separator.color } } as Generals)
    : generals;

  const node = hasSeparator && generals ? (
    separator?.type === "single" ? (
      <Separador inverted={inverted} generals={sepGenerals ?? undefined} value={separator?.single?.value ?? 1} />
    ) : (
      <div className="dyn_separator_cont"
        style={{
          width: `${separator?.image?.width}%`,
          minHeight: `${separator?.image?.height}px`,
          zIndex: 99,
        }}
      >
        {separator?.image?.value && (
          <Image fill src={separator.image.value} alt="" style={{ objectFit: "cover" }} />
        )}
      </div>
    )
  ) : null;

  if (!editMode) return node;

  return (
    <div
      className={hasSeparator ? "edit_separator" : "edit_separator edit_separator--empty"}
      data-edit-hit
      onClick={(e) => {
        e.stopPropagation();
        const r = e.currentTarget.getBoundingClientRect();
        onFieldTool?.("separator", { x: r.left, y: r.top, w: r.width, h: r.height }, section);
      }}
    >
      {hasSeparator ? node : <span className="edit_separator_label"><Plus size={14} strokeWidth={2.4} /> Separador</span>}
    </div>
  );
}
