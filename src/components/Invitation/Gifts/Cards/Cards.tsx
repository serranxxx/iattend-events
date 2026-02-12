import { GiftCard, NewInvitation } from "@/types/new_invitation";
import styles from "./cards.module.css";
import { FaCopy } from "react-icons/fa6";
import { message } from "antd";
import { it } from "node:test";

type CardProps = {
  invitation: NewInvitation;
  dev: boolean;
  GiftCard: GiftCard[];
  onSelect?: (index: number) => void; // 👉 nuevo callback
};

export default function Card({ invitation, dev, GiftCard, onSelect }: CardProps) {
  const content = invitation.gifts;
  const generals = invitation.generals;
  const font = generals.fonts.body?.typeFace;

  const primary = generals?.colors.primary ?? "#FFFFFF";
  const secondary = generals?.colors.secondary ?? "#FFFFFF";
  const accent = generals?.colors.accent ?? "#FFFFFF";
  const actions = generals?.colors.actions ?? "#FFFFFF";

  const [messageApi, contextHolder] = message.useMessage();

  const copyToClipboard = async (textToCopy: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      messageApi.info("Número de cuenta copiado");
    } catch (err) {
      console.error("Error al copiar el texto: ", err);
    }
  };

  const handleClass = (card: GiftCard) => {
    if (card.kind === "store" && card.brand) {
      switch (card.brand.trim().toLowerCase()) {
        case "liverpool":
          return "liverpool";

        case "palacio de hierro":
          return "palacio";

        case "amazon":
          return "amazon";

        case "sears":
          return "sears";

        default:
          return "default";
      }
    } else {
      switch (card?.bank?.trim().toLowerCase()) {
        case "bbva":
          return "bbva";

        case "citibanamex":
          return "banamex";

        case "banamex":
          return "banamex";

        case "santander":
          return "santander";

        case "hsbc":
          return "hsbc";

        case "scotiabank":
          return "scotiabank";

        case "banorte":
          return "banorte";

        case "nu":
          return "nu";

        case "nu bank":
          return "nu";

        default:
          return "default";
      }
    }
  };
  return (
    <>
      {contextHolder}

      {GiftCard?.slice().reverse().map((item, index) => {
        const key = (item as any)?.id ?? index; // usa id si existe
        const color = content.background ? accent : content.inverted ? primary : accent;
        const baseClass = item.kind === "bank" ? styles.gift_card_bank : styles.gift_card_page;
        const composedClass = `${baseClass} ${styles[handleClass(item)]}`;

        if (item.kind === "bank") {
          return (
            <div
              key={key}
              role="button"
              onClick={() => onSelect?.(index)}
              // onClick={() => item.number && copyToClipboard(item.number)}
              className={`${styles.gift_card} ${composedClass}`}
              style={{
                color,
                cursor: item.number ? "pointer" : "default",
                top: `calc(50px * ${index})`,
                // zIndex: GiftCard.length - index,
              }}
            >
              <span className={`g_mdoule_regular_text ${styles.bank_name}`} style={{ fontFamily: font, fontSize: "16px" }}>
                <b>{item.bank}</b>
              </span>

              <div className={styles.gifts_single_col}>
                <span
                  className="g_mdoule_regular_text"
                  style={{
                    fontFamily: font,
                    fontWeight: 400,
                    letterSpacing: "1px",
                    fontSize: "12px",
                    textTransform: "uppercase",
                  }}
                >
                  {item.name}
                </span>

                <span
                  className="g_mdoule_regular_text"
                  style={{
                    fontFamily: font,
                    fontSize: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-start",
                    gap: "8px",
                  }}
                >
                  <b>{item.number}</b> <FaCopy />
                </span>
              </div>
            </div>
          );
        }

        // kind !== "bank" → enlace a página/brand
        return (
          <a
            key={key}
            href={item.url ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className={`${styles.gift_card} ${composedClass}`}
            style={{
              color,
              cursor: item.url ? "pointer" : "default",
              top: `calc(50px * ${index})`,
              // zIndex: GiftCard.length - index,
            }}
            onClick={(e) => {
              e.preventDefault();
              onSelect?.(index); // 👉 notifica
            }}
            // onClick={(e) => {
            //   if (!item.url) e.preventDefault();
            // }}
          >
            <span style={{ fontFamily: font }}>{item.brand}</span>
          </a>
        );
      })}
    </>
  );
}
