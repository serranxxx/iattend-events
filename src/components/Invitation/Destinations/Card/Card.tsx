import { useState } from "react";
import { DestinationCard, InvitationUIBundle, NewInvitation } from "@/types/new_invitation";
import { Drawer } from "antd";
import { ArrowLeft, ImagePlus, Plus } from "lucide-react";
import { EditableText } from "../../EditableText";
import { AddPlaceButton, DEST_STYLE_IDS, DestStyleId, StyledDestinations } from "../DestinationStyles";

type CardProps = {
  invitation: NewInvitation;
  ui?: InvitationUIBundle | null;
  invitationID: string | undefined;
  // Modo edición: tocar la revista / ficha / postal del frente abre un drawer
  // con todo editable, y "+ Lugar" agrega mientras haya lugar.
  editMode?: boolean;
  onFieldChange?: (_path: string, _value: unknown) => void;
  onFieldTool?: (_field: string, _rect: { x: number; y: number; w: number; h: number }, _section?: string) => void;
};

// Solo se ven las primeras 6 (el panel avisa lo mismo).
const MAX_CARDS = 6;
const TYPES: { value: DestinationCard["type"]; label: string }[] = [
  { value: "hotel", label: "Hospedaje" },
  { value: "activitie", label: "Actividad" },
  { value: "food", label: "Comida" },
];

export default function Card({ ui, invitation, invitationID: _invitationID, editMode = false, onFieldChange, onFieldTool }: CardProps) {
  const content = invitation.destinations;
  const realCards = content.cards.slice(0, MAX_CARDS);
  const showAdd = editMode && content.cards.length < MAX_CARDS;

  const primary = invitation.generals.colors.primary ?? "#FFF";
  const accent = invitation.generals.colors.accent ?? "#FFF";

  // Drawer de edición: índice en destinations.cards.
  const [editing, setEditing] = useState<number | null>(null);
  const editCard = editing !== null ? content.cards[editing] ?? null : null;
  const base = `destinations.cards.${editing}`;
  const addCard = () => {
    onFieldChange?.("destinations.cards", [
      { image: null, name: "Nueva actividad", description: "", url: "", type: "activitie" },
      ...content.cards,
    ]);
    setEditing(0);
  };
  const removeEditing = () => {
    if (editing === null) return;
    const index = editing;
    setEditing(null);
    onFieldChange?.("destinations.cards", content.cards.filter((_, i) => i !== index));
  };
  const openImageTool = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect();
    onFieldTool?.(`dest_image:${editing}`, { x: r.left, y: r.top, w: r.width, h: r.height }, "destinations");
  };

  // Estilo del catálogo (destinations.style): "1a" (o vacío) Revistero, "1e"
  // Llaveros, "1f" Postales. Todos los pinta DestinationStyles; aquí queda el
  // drawer de edición.
  const styleId = (DEST_STYLE_IDS as readonly string[]).includes(content.style ?? "") ? (content.style as DestStyleId) : "1a";

  return (
    <>
      <StyledDestinations
        styleId={styleId}
        invitation={invitation}
        ui={ui}
        cards={realCards}
        editMode={editMode}
        onEdit={setEditing}
        addButton={showAdd ? <AddPlaceButton onAdd={addCard} /> : null}
      />

      {/* Drawer de edición de una actividad (modo edición), a pantalla
          completa como el de los momentos. */}
      {editMode && (
        <Drawer
          placement="bottom"
          open={editCard !== null}
          onClose={() => setEditing(null)}
          height="100%"
          closeIcon={<span className="edit_drawer_close" aria-label="Regresar"><ArrowLeft size={16} /></span>}
          classNames={{ body: "scroll-invitation", header: "edit_drawer" }}
          styles={{
            header: { backgroundColor: primary },
            body: { backgroundColor: primary, paddingTop: 12 },
          }}
          title={editCard && (
            <EditableText
              key={editing}
              path={`${base}.name`}
              value={editCard.name ?? ""}
              editMode
              onFieldChange={onFieldChange}
              placeholder="Nombre"
              className="edit_drawer_title"
              style={{ fontFamily: invitation.generals.fonts.body?.typeFace, fontSize: 20, color: accent }}
            />
          )}
        >
          {editCard && (
            <div key={editing} className="edit_drawer" style={{ display: "flex", flexDirection: "column", gap: 20, color: accent, fontFamily: invitation.generals.fonts.body?.typeFace }}>
              {editCard.image ? (
                <div style={{ position: "relative", width: "100%", height: 220, borderRadius: 16, overflow: "hidden" }}>
                  <img src={editCard.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button type="button" className="edit_center_btn edit_center_btn--always" onClick={openImageTool}>
                    <ImagePlus size={14} /> Cambiar imagen
                  </button>
                </div>
              ) : (
                <button type="button" className="edit_drawer_image_empty" onClick={openImageTool} style={{ color: accent }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Plus size={15} /> Imagen</span>
                </button>
              )}

              <div className="edit_drawer_section">
                <span className="edit_drawer_label">Tipo</span>
                <div className="edit_type_pills">
                  {TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      className="edit_type_pill"
                      data-on={editCard.type === t.value || undefined}
                      onClick={() => onFieldChange?.(`${base}.type`, t.value)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="edit_drawer_section">
                <span className="edit_drawer_label">Información</span>
                <EditableText path={`${base}.description`} value={editCard.description ?? ""} editMode onFieldChange={onFieldChange} multiline placeholder="Descripción" />
              </div>

              <div className="edit_drawer_section">
                <span className="edit_drawer_label">Link</span>
                <EditableText path={`${base}.url`} value={editCard.url ?? ""} editMode onFieldChange={onFieldChange} placeholder="Google Maps, sitio web…" style={{ wordBreak: "break-all" }} />
              </div>

              <div style={{ display: "flex", justifyContent: "center", marginTop: 32 }}>
                <button type="button" className="edit_drawer_delete" onClick={removeEditing}>Eliminar actividad</button>
              </div>
            </div>
          )}
        </Drawer>
      )}
    </>
  );
}
