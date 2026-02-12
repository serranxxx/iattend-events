"use client";

import { motion } from "motion/react";

type FadeDownProps = {
    children: React.ReactNode;
    side?: boolean; // 👈 z-index opcional
  };
  
  export default function FadeSides({ children, side}: FadeDownProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: side ? -40 : 40}}
            whileInView={{ opacity: 1, x: 0}}
            transition={{ duration: 1, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.3 }}
            style={{width:'50%', display:'flex',alignItems:'center',justifyContent:'center'}}
        >
            {children}
        </motion.div>
    );
}