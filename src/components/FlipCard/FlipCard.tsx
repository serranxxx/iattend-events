"use client";

import { useState } from "react";
import styles from "./FlipCard.module.css";
import Image from "next/image";
import { Button } from "antd";


type FlipCardProps = {
    width?: number | string;
    height?: number | string;
    frontColor?: string;
    backColor?: string;
    className?: string;
    onCard?: boolean
};

export default function FlipCard({
    width = 280,
    height = 420,
    frontColor = "#f5f5f5",
    backColor = "#e9e9e9",
    className = "",
    onCard = true
}: FlipCardProps) {
    const [flipped, setFlipped] = useState(false);

    return (
        <div
            style={{ top: onCard ? '90px' : '-480px' }}
            className={`${styles.wrapper} ${className}`}>
            <div
                className={`${styles.flipCard} ${flipped ? styles.flipped : ""}`}
                onClick={() => setFlipped((prev) => !prev)}
                style={{ width, height }}
            >
                <div className={styles.flipInner}>
                    <div
                        className={styles.front}
                    >

                        

                    </div>
                    <div
                        className={styles.back}
                    >
                        <Image fill src="/presentation.jpg" alt="" style={{ objectFit: 'cover' }} />
                    </div>
                </div>
            </div>
        </div>
    );
}