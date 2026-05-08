"use client";

import { useState } from "react";
import { Button, Input } from "antd";
import { FaLock } from "react-icons/fa";
import styles from "./private-access.module.css";

type PrivateAccessProps = {
  validated: boolean;
  onValidate: (code: string) => void;
};

export function PrivateAccess({ validated, onValidate }: PrivateAccessProps) {
  const [code, setCode] = useState("");

  return (
    <div
      className={styles.overlay}
      style={{
        pointerEvents: validated ? "none" : undefined,
        opacity: validated ? 0 : 1,
      }}
    >
      <div className={styles.icon}>
        <FaLock size={32} style={{ color: "#FFF" }} />
      </div>

      <span className={styles.title}>Invitación Privada</span>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
        <span className={styles.text}>
          Nos alegra mucho que seas parte de este evento tan especial.
        </span>
        <span className={styles.text}>
          Esta invitación es exclusiva para ti. Ingresa tu código de invitado para continuar y disfrutar de esta experiencia única.
        </span>
      </div>

      <Input
        value={code}
        size="large"
        onChange={(e) => setCode(e.target.value)}
        onPressEnter={() => onValidate(code)}
        placeholder="Código de invitado"
        className={styles.input}
        style={{
          backgroundColor: "#FFFFFF20",
          boxShadow: "0px 0px 12px rgba(0,0,0,0.2)",
          borderWidth: "2px",
          color: "#FFF",
          fontSize: "18px",
          textAlign: "center",
          maxWidth: "280px",
          borderRadius: "99px",
          minHeight: "56px",
          fontFamily: "Poppins",
        }}
      />

      <Button
        className={styles.btn}
        style={{
          height: "56px",
          width: "280px",
          fontSize: "18px",
          fontWeight: 600,
          letterSpacing: "2px",
          boxShadow: "0px 0px 12px rgba(0,0,0,0.2)",
          fontFamily: "Poppins",
        }}
        onClick={() => onValidate(code)}
      >
        ACCEDER
      </Button>
    </div>
  );
}
