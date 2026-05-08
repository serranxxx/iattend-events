"use client";
import styles from "./extra-info.module.css";

type ExtraInfoProps = { info: string };

function renderTextWithStrong(text: string) {
  return text.split(/(\*[^*]+\*)/g).map((part, i) =>
    part.startsWith("*") && part.endsWith("*")
      ? <strong key={i}>{part.slice(1, -1)}</strong>
      : <span key={i}>{part}</span>
  );
}

export function ExtraInfo({ info }: ExtraInfoProps) {
  return (
    <div className={styles.container}>
      <span className={styles.text}>{renderTextWithStrong(info)}</span>
    </div>
  );
}
