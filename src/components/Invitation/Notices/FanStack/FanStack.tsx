"use client";
import styles from "./fanstack.module.css";

type FanStackProps = {
  items: string[];
  radius?: number;
  angleStart?: number;
  angleStep?: number;
  xStep?: number;
  yStep?: number;
  color?: string;
  fontFamily?: string;
  bg?: string;
  showEllipsis?: boolean;
};

export default function FanStack({
  items,
  radius = 24,
  angleStart = -10,
  angleStep = 7,
  xStep = 18,
  yStep = 10,
  color = "#333",
  fontFamily = "Poppins, sans-serif",
  bg = "#fff",
  showEllipsis = true,
}: FanStackProps) {
  return (
    <div
      className={styles.fan_stack}
      style={{
        width: "100%",
        aspectRatio: "3 / 4",
        position: "relative",
        borderRadius: radius,
      }}
    >
      {items.map((text, i) => {
        const angle = angleStart + i * angleStep;
        const x = i * xStep;
        const y = i * yStep;
        return (
          <div
            key={`${i}-${text.slice(0, 10)}`}
            className={styles.fan_card}
            style={{
              position: "absolute",
              inset: 0,
              transform: `translate(${x}px, ${y}px) rotate(${angle}deg)`,
              borderRadius: radius,
              boxShadow: "0 12px 24px rgba(0,0,0,.22)",
              background: bg,
              overflow: "hidden",
              zIndex: i,
              padding: "clamp(12px, 2vw, 24px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ width: "90%" }}>
              <span
                style={{
                  color,
                  fontFamily,
                  lineHeight: 1.4,
                  fontWeight: 500,
                  fontSize: "clamp(12px, 2vw, 18px)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {text}
              </span>
              {showEllipsis && i < items.length - 1 && (
                <div
                  style={{
                    marginTop: 12,
                    textAlign: "center",
                    color,
                    opacity: 0.6,
                    fontFamily,
                    fontSize: "clamp(10px, 1.5vw, 14px)",
                  }}
                >
                  …
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
