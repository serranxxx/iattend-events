"use client";

import { motion } from "motion/react";

type FadeDownProps = {
    children: React.ReactNode;
    duration?: number; 
    zIndex?: number;
    start?: number | string;
    end?: number | string;
  };
  
  export default function FadeLeft({ children, duration = 0, zIndex = 1, start = -40, end = 0}: FadeDownProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: start }}
            whileInView={{ opacity: 1, x: end }}
            transition={{ duration: ((duration*0.2) * 0.8) + 1, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.3 }}
            style={{zIndex: zIndex, opacity:1}}
        >
            {children}
        </motion.div>
    );
}