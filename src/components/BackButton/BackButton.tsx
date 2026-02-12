"use client";

import { IoMdReturnLeft } from "react-icons/io";
import styles from "./backbutton.module.css"

export default function BackButton() {
    return (
        <button
            className={styles.action_button}
            type="button"
            onClick={() => {
                if (window.history.length > 1) {
                    window.history.back();
                } else {
                    window.location.href = "/about";
                }
            }}
        >
            <IoMdReturnLeft />
            <span> Regresar</span>
        </button>
    );
}
