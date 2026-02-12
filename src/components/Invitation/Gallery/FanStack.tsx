// FanStack.tsx
"use client";
import React, { useEffect, useState } from "react";
import grunge from "../../../assets/textures/grunge.jpg";
import { NewInvitation } from "@/types/new_invitation";
import { lighter } from "@/helpers/functions";
import { Image } from "antd";

type FanStackProps = {
  images: string[];

  radius?: number; // border-radius
  invitation: NewInvitation;
};

export default function FanStack({ images, radius = 24, invitation }: FanStackProps) {
  // centro “conceptual” del abanico

  const [onScroll, setOnScroll] = useState<boolean>(false);
  const [handleImages, setHandleImages] = useState<string[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (onScroll) {
      setHandleImages(images);
    } else {
      setHandleImages(images.slice(0, 3));
    }
  }, [onScroll]);

  return (
    <div
      onClick={() => setOnScroll(!onScroll)}
      className={onScroll ? "fan_container_active" : "fan_container"}
      style={{
        position: "relative",
        maxWidth: "100vw",
        height: "380px",
        // minHeight: onScroll ? "500px" : "",
        minWidth: "100vw",
        padding: "0px 24px",
        marginTop: "-30px",
        overflow: onScroll ? "auto" : "hidden",
        // display:'flex',alignItems:'center',justifyContent:'center'
      }}
    >
      {handleImages.map((src, i) => {
        // ángulo repartido de -maxFanDeg a +maxFanDeg
        // Control manual de posición para hasta 4 imágenes
        let dx = 0;
        let dy = 0;
        let rot = 0;
        let scale = 1;

        if (i === 1) {
          dx = -50; // izquierda
          dy = 10;
          rot = -10;
          scale = 0.9;
        } else if (i === 2) {
          dx = 50; // derecha
          dy = 10;
          rot = 10;
          scale = 0.9;
        }

        // else if (i === 3) {
        //     dx = 40; // derecha
        //     dy = -10;
        //     rot = 30;
        //     scale = 0.9;
        // }

        const z = images.length - i;

        return (
          <div
            key={i}
            className="fan_card"
            style={{
              position: onScroll ? "static" : "absolute",
              left: onScroll ? "" : "50%",
              top: onScroll ? "" : "50%",
              minWidth: "220px",
              // minWidth: onScroll ? "320px" : "",
              // minHeight: onScroll ? "470px" : "",
              width: "220px",
              height: "300px", // proporción 4:3; ajusta a tu gusto
              transform: onScroll ? "" : `translate(-50%, -50%) translate(${dx}px, ${dy}px) rotate(${rot}deg) scale(${scale})`,
              transformOrigin: "center",
              borderRadius: "6px",
              overflow: "hidden",
              boxShadow: "0 0 8px 0 rgba(0, 0, 0, 0.35), 0 0 8px 0 rgba(134, 134, 134, 0.45) inset",
              background: "#e9ecef",
              zIndex: z,
              transition: "all 0.35s ease",
            }}
          >
            <img
              // preview={false}
              src={src}
              alt=""
              // fill
              loading="lazy"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                // display: "block",
              }}
            />
          </div>
        );
      })}
    </div>

    // <div
    //   onClick={() => setOnScroll(!onScroll)}
    //   className={onScroll ? "fan_container_active" : "fan_container"}
    //   style={{
    //     position: "relative",
    //     maxWidth: "100vw",
    //     height: "380px",
    //     minWidth: "100vw",
    //     padding: "0px 24px",
    //     marginTop: "-30px",
    //     overflow: onScroll ? "auto" : "hidden",
    //   }}
    // >
    //   {handleImages.map((src, i) => {
    //     let dx = 0;
    //     let dy = 0;
    //     let rot = 0;
    //     let scale = 1;

    //     if (i === 1) { dx = -50; dy = 10; rot = -10; scale = 0.9; }
    //     else if (i === 2) { dx = 50; dy = 10; rot = 10; scale = 0.9; }

    //     // --- NUEVO: rotación “desacomodada” por índice cuando hay scroll ---
    //     // Angulitos suaves: [-3, 2, -2, 3, -1, 1, ...]
    //     const scrollAngles = [-3, 2, -2, 3, -1, 1];
    //     const rotOnScroll = scrollAngles[i % scrollAngles.length];

    //     const z = images.length - i;

    //     return (
    //       <div key={i}>
    //         <div
    //           className="fan_card"
    //           style={{
    //             position: onScroll ? "relative" : "absolute",
    //             left: onScroll ? "" : "50%",
    //             top: onScroll ? "" : "50%",
    //             minWidth: '220px',
    //             width: '220px',
    //             height: '280px',
    //             // 👇 cuando hay scroll: solo le damos una ligera rotación por índice
    //             // cuando NO hay scroll: tu posición/rotación original
    //             transform: onScroll
    //               ? `rotate(${rotOnScroll}deg) translateZ(0)` // translateZ para suavizar en mobile
    //               : `translate(-50%, -50%) translate(${dx}px, ${dy}px) rotate(${rot}deg) scale(${scale})`,
    //             transformOrigin: "center",
    //             borderRadius: '0px',
    //             overflow: "hidden",
    //             background: "#e9ecef",
    //             zIndex: z,
    //             transition: "transform 0.35s ease", // solo animamos transform
    //             padding: '16px',
    //             backgroundColor: lighter(invitation.generals.colors.primary, 0.1) ?? "#000",
    //             boxSizing: 'border-box',
    //             boxShadow: "0 0 8px 0 rgba(0,0,0,0.35)",
    //             paddingBottom: '44px',
    //             willChange: "transform" // mejora la fluidez en iOS/Android
    //           }}
    //         >
    //           <img
    //             src={src}
    //             alt=""
    //             loading="lazy"
    //             style={{ width: "100%", height: "100%", objectFit: "cover" }}
    //           />
    //         </div>

    //       </div>
    //     );
    //   })}
    // </div>
  );
}
