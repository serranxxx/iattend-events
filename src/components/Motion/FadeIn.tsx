"use client";

import { motion } from "motion/react";

type FadeDownProps = {
    children: React.ReactNode;
    zIndex?: number; // 👈 z-index opcional
  };
  
  export default function FadeIn({ children, zIndex = 1 }: FadeDownProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.3 }}
            style={{width:'100%', zIndex: zIndex, display:'flex',alignItems:'center',justifyContent:'center'}}
        >
            {children}
        </motion.div>
    );
}