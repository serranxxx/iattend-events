"use client";

import { useCallback, useEffect } from "react";
import confetti from "canvas-confetti";
import { CoverSection, Generals } from "@/types/new_invitation";
import { Button } from "antd";
import { PiConfetti } from "react-icons/pi";
import styles from './confetti.module.css'
import { darker } from "@/helpers/functions";

type CountdownProps = {
  cover: CoverSection;
  generals?: Generals;
  validated?: boolean
};


export default function ConfettiButton({ cover, generals, validated = true }: CountdownProps) {

  const onClick = useCallback(() => {
    confetti({
      particleCount: 200,
      spread: 80,
      angle: 90,                 // 90 = hacia abajo, 270 = hacia arriba
      origin: { x: 0.5, y: 0.9 }
    });
  }, []);

  useEffect(() => {
    if (validated) {
      onClick()
    }
  }, [validated])
  

  return (
    <Button 
    icon={<PiConfetti />}
    className={`${styles.animate} ${styles.action_button}`}
    style={{
      backgroundColor: generals?.colors.actions!,
      borderBottom: `5px solid ${darker(generals?.colors.actions!, 0.8)}`
    }} 
      onClick={onClick}>
      ¡Es hoy!
    </Button>
  );
}

// export default function ConfettiButton() {
//     useEffect(() => {
//       // Ejecuta confetti una vez al cargar el componente
//       // confetti({
//       //   particleCount: 150,
//       //   spread: 60,
//       // });
  
//       // Si quieres que se repita cada cierto tiempo:
//       const interval = setInterval(() => {
//         confetti({
//           particleCount: 150,
//           spread: 60,
//         });
//       }, 2000);
      
//       return () => clearInterval(interval);
//     }, []);