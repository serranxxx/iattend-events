"use client";

import { motion } from "motion/react";

export default function FadeRight({ children }: { children: React.ReactNode }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.3 }}
            // style={{width:'100%'}}
        >
            {children}
        </motion.div>
    );
}