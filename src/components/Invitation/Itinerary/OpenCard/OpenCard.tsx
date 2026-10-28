import { ItineraryItem, NewInvitation } from "@/types/new_invitation";
import styles from "./open.module.css";
import Image from "next/image";
import { useEffect } from "react";
import WeatherWidget from "../WeatherApi/WeatherWidget";
import { getEventDateOnly } from "@/helpers/functions";
import { ImagePlus, Plus } from "lucide-react";
import { TimePicker } from "antd";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { EditableText } from "../../EditableText";
import { useEditableList } from "../../useEditableList";
import type { MomentItem } from "@/types/new_invitation";

type CardProps = {
  invitation: NewInvitation;
  dev: boolean;
  item: ItineraryItem;
  setActiveSteps?: React.Dispatch<React.SetStateAction<ItineraryItem[]>>;
  activeSteps?: ItineraryItem[];
  // Modo edición: todo el contenido del momento se escribe encima. `index`
  // es su lugar en itinerary.object (ruta de los cambios).
  editMode?: boolean;
  index?: number;
  onFieldChange?: (_path: string, _value: unknown) => void;
  onFieldTool?: (_field: string, _rect: { x: number; y: number; w: number; h: number }, _section?: string) => void;
};

dayjs.extend(customParseFormat);

// La hora se guarda como "4:00 pm" (igual que el panel de Itinerario).
const parseTime = (value: string | null | undefined) => {
  if (!value) return null;
  const d = dayjs(value.trim(), ["h:mm a", "h:mm A", "HH:mm"], true);
  return d.isValid() ? d : null;
};


export default function OpenCard({ invitation, dev, item, editMode = false, index = 0, onFieldChange, onFieldTool }: CardProps) {
  const content = invitation.itinerary;
  const generals = invitation.generals;

  const primary = generals?.colors.primary ?? "#FFFFFF";
  const secondary = generals?.colors.secondary ?? "#FFFFFF";
  const accent = generals?.colors.accent ?? "#FFFFFF";

  const extractSpotifyPath = (url: string | undefined) => {
    if (!url) return "";

    try {
      const parsedUrl = new URL(url);
      // ejemplo: /album/2Ek1q2haOnxVqhvVKqMvJe
      const path = parsedUrl.pathname.substring(1); // quita el "/"
      return path; // "album/2Ek1q2haOnxVqhvVKqMvJe"
    } catch {
      return "";
    }
  };

  useEffect(() => {
    extractSpotifyPath(item.music);
  }, []);

  // Actividades del momento (item.moments): misma lista que personas/avisos.
  const base = `itinerary.object.${index}`;
  const moments: MomentItem[] = item.moments ?? [];
  const list = useEditableList<MomentItem>({
    items: moments,
    path: `${base}.moments`,
    editMode,
    onFieldChange,
    makeNew: () => ({ name: "Actividad", time: "12:00 pm", description: "" }),
  });
  const text = (field: string, value: string | null | undefined, className?: string, placeholder?: string, style?: React.CSSProperties) => (
    <EditableText
      path={`${base}.${field}`}
      value={value ?? ""}
      editMode
      onFieldChange={onFieldChange}
      className={className}
      placeholder={placeholder}
      style={style}
    />
  );
  // Hora (del momento y de cada actividad): selector, no texto libre.
  const timePicker = (path: string, value: string | null | undefined, className?: string) => (
    <TimePicker
      className={`${className ?? ""} edit_drawer_time`}
      variant="borderless"
      use12Hours
      format="h:mm a"
      minuteStep={5}
      allowClear={false}
      suffixIcon={null}
      needConfirm={false}
      placeholder="Hora"
      value={parseTime(value)}
      onChange={(d) => d && onFieldChange?.(path, d.format("h:mm a"))}
      style={{ color: "inherit", fontFamily: "inherit", padding: 0 }}
    />
  );
  const openImageTool = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    const r = e.currentTarget.getBoundingClientRect();
    onFieldTool?.(`moment_image:${index}`, { x: r.left, y: r.top, w: r.width, h: r.height }, "itinerary");
  };

  if (editMode) {
    const muted = content.inverted ? `${primary}80` : `${accent}80`;
    return (
      <div
        className={`${styles.open_card_container} edit_drawer`}
        style={{ fontFamily: generals.fonts.body?.typeFace, color: content.inverted ? primary : accent }}
      >
        {item.image ? (
          <div className={styles.image_header_container} style={{ position: "relative" }}>
            <Image alt="" fill src={item.image} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
            {/* Al centro de la imagen, el mismo chip que en la portada y la cita. */}
            <button type="button" className="edit_center_btn edit_center_btn--always" onClick={openImageTool}>
              <ImagePlus size={14} /> Cambiar imagen
            </button>
          </div>
        ) : (
          <button type="button" className="edit_drawer_image_empty" onClick={openImageTool} style={{ color: primary }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Plus size={15} /> Imagen</span>
          </button>
        )}

        <div className={styles.open_card_info} style={{ gap: 18, padding: "4px 0" }}>
          {/* Hora: selector, no texto libre. */}
          {timePicker(`${base}.time`, item.time, styles.open_sub)}
          {text("subtext", item.subtext?.trim() ? item.subtext : "", styles.open_text, "Lugar")}
        </div>

        {/* Dirección: sin ella, un solo "Agregar dirección" (buscador de Google en
            el editor). Con ella, la dirección y su mapa, y abajo "Eliminar
            dirección" para quitarla. */}
        {item.address ? (
          <div className="edit_drawer_address_card">
            <span className={styles.open_card_address} style={{ color: muted }}>
              {[item.address.street, item.address.number, item.address.neighborhood, item.address.zip, item.address.city, item.address.state, item.address.country].filter(Boolean).join(" ")}
            </span>
            {item.address.city && (
              <div className={styles.mapa_container} style={{ backgroundColor: secondary, width: "100%" }}>
                <iframe
                  title="Mapa"
                  width="100%"
                  height="100%"
                  style={{ borderColor: content.inverted ? primary : secondary }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  src={simpleaddress(item.address.street, item.address.number, item.address.neighborhood, item.address.zip, item.address.city, item.address.state, item.address.country)}
                />
              </div>
            )}
            <button
              type="button"
              className="edit_drawer_delete edit_drawer_delete--soft"
              onClick={(e) => { e.stopPropagation(); onFieldChange?.(`${base}.address`, null); }}
            >
              Eliminar dirección
            </button>
          </div>
        ) : (
          <div className="edit_drawer_empty_box">
            <button
              type="button"
              className="edit_drawer_delete edit_drawer_delete--soft"
              onClick={(e) => {
                e.stopPropagation();
                const r = e.currentTarget.getBoundingClientRect();
                onFieldTool?.(`moment_address:${index}`, { x: r.left, y: r.top, w: r.width, h: r.height }, "itinerary");
              }}
            >
              <Plus size={14} style={{ marginRight: 6 }} /> Agregar dirección
            </button>
          </div>
        )}

        <div className="edit_drawer_section">
          <span className="edit_drawer_label">Actividades</span>
          {/* Sin actividades: el botón va adentro de un recuadro. */}
          {moments.length === 0 ? (
            <div className="edit_drawer_empty_box">
              <button type="button" className="edit_drawer_delete edit_drawer_delete--soft" onClick={(e) => { e.stopPropagation(); list.add(); }}>
                <Plus size={14} style={{ marginRight: 6 }} /> Agregar actividad
              </button>
            </div>
          ) : (
          <>
          <div ref={list.listRef} className={styles.custom_card_subitems} style={{ borderColor: accent, gap: 28, padding: "18px 14px 18px 0", borderRadius: 16 }}>
            {moments.map((subitem, i) => (
              <div key={i} {...list.rowProps(i, { width: "100%", boxSizing: "border-box" })} data-corner-delete>
                <div className={styles.custom_card_subitem} style={{ lineHeight: "1.3", gap: 16 }}>
                  <div className={styles.custom_card_subitem_bullet} style={{ backgroundColor: accent }} />
                  <EditableText path={`${base}.moments.${i}.name`} value={subitem.name ?? ""} editMode onFieldChange={onFieldChange} className={styles.custom_card_subitem_title} placeholder="Actividad" />
                  {timePicker(`${base}.moments.${i}.time`, subitem.time, styles.custom_card_subitem_time)}
                  <EditableText path={`${base}.moments.${i}.description`} value={subitem.description ?? ""} editMode onFieldChange={onFieldChange} multiline className={styles.custom_card_subitem_description} style={{ color: muted }} placeholder="Descripción" />
                </div>
                {list.showDelete(i) && (
                  <button type="button" className="edit_row_delete edit_drawer_delete--soft edit_row_delete--corner" data-edit-row-delete onClick={(e) => { e.stopPropagation(); list.remove(i); }}>
                    Eliminar
                  </button>
                )}
              </div>
            ))}
            {list.dropAtEnd && <div className="edit_row_drop_end" />}
          </div>
          <button type="button" className="edit_glass_btn" onClick={(e) => { e.stopPropagation(); list.add(); }}>
            <Plus size={15} /> Agregar actividad
          </button>
          </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={ `${styles.open_card_container}`}
      style={{
        fontFamily: generals.fonts.body?.typeFace,
        color: content.inverted ? primary : accent,
      }}
    >

      {item.image && (
        <div className={styles.image_header_container}>
          <Image alt="" fill src={item.image!} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
        </div>
      )}

      <div className={styles.open_card_info}>
        <span className={styles.open_sub}> {item.time} </span>
        <span className={styles.open_text}> {item.subtext} </span>
        {item.address && (
          <span className={styles.open_card_address} style={{ color: content.inverted ? `${primary}80` : `${accent}80` }}>
            {`${item.address.street ?? ""} ${item.address.number ?? ""} ${item.address.neighborhood ?? ""} ${item.address.zip ?? ""} ${item.address.city ?? ""} ${item.address.state ?? ""} ${item.address.country ?? ""}`}
          </span>
        )}
      </div>

      {item.moments && item.moments.length > 0 && (
        <div className={styles.custom_card_subitems} style={{ borderColor: accent }}>
          {item.moments.map((subitem) => (
            <div key={subitem.name} className={styles.custom_card_subitem} style={{ lineHeight: "1.3" }}>
              <div className={styles.custom_card_subitem_bullet} style={{ backgroundColor: accent }} />
              <span className={styles.custom_card_subitem_title}>{subitem.name}</span>
              <span className={styles.custom_card_subitem_time}>{subitem.time}</span>
              <span className={styles.custom_card_subitem_description} style={{ color: content.inverted ? `${primary}80` : `${accent}80` }}>
                {subitem.description}
              </span>
            </div>
          ))}
        </div>
      )}

      {item.address && (
        <>
          <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "flex-start", gap: "12px" }}>
            {
              item.address.city &&(
                <>
                  {<WeatherWidget invitation={invitation} dev={dev} item={item} eventDate={getEventDateOnly(invitation.cover.date.value)} />}

                  <div className={styles.mapa_container} style={{ backgroundColor: secondary }}>
                    <iframe
                      title="Mapa"
                      width="100%"
                      height="100%"
                      style={{ borderColor: content.inverted ? primary : secondary }}
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      src={simpleaddress(
                        item.address.street,
                        item.address.number,
                        item.address.neighborhood,
                        item.address.zip,
                        item.address.city,
                        item.address.state,
                        item.address.country
                      )}
                    />
                  </div>
                </>
              )}
          </div>
        </>
      )}

    </div>
  );
}

export function simpleaddress(direccion: string | null, numero: string | null, colonia: string | null, codigoPostal: string | null, ciudad: string | null, estado: string | null, pais: string | null) {
  const direccionCompleta = `${direccion} ${numero}, ${colonia}, ${codigoPostal}, ${ciudad}, ${estado}, ${pais}`;
  const direccionCodificada = encodeURIComponent(direccionCompleta);
  const key = "AIzaSyBZ8NLpvAl4DiTeE2gYekBqhmSZFx43R0M";
  const urlMapaGenerado = `https://www.google.com/maps/embed/v1/place?key=${key}&q=${direccionCodificada}`;
  return urlMapaGenerado;
}
