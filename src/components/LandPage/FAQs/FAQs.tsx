"use client";

import React, { useState } from "react";
import styles from "./faqs.module.css";
import { Button } from "antd";

import { LuChevronDown } from "react-icons/lu";
import { faqs_list } from "@/helpers/SEO/faqs";
import Link from "next/link";

export const FAQs = () => {
  const [activeCard, setActiveCard] = useState<number | null>(null);

  return (
    <div className={styles.main_cont}>
      <div className={styles.key_cont}>
        <span className={styles.key_title}>Lo que necesitas saber</span>

        <div className={styles.ideal_cont}>
          {faqs_list.slice(0, 5).map((q, index) => (
            <div key={index} onClick={() => setActiveCard((prev) => (prev === index ? null : index))} className={styles.ideal_card}>
              <div className={styles.question_head}>
                <span>{q.question}</span>

                <div className={styles.key_wrap}>
                  <Button
                    icon={
                      <LuChevronDown
                        style={{ transform: activeCard === index ? "rotate(180deg)" : "rotate(0deg)", transition: "all 0.3s ease" }}
                        size={16}
                      />
                    }
                    className={styles.key_button}
                  // 
                  ></Button>
                </div>
                {/* <Button
                icon={
                  <LuChevronDown
                    style={{ transform: activeCard === index ? "rotate(180deg)" : "rotate(0deg)", transition: "all 0.3s ease" }}
                    size={16}
                  />
                }
                style={{ backgroundColor: "#FFF", maxHeight: "26px", minWidth: "26px", maxWidth: "26px" }}
              ></Button> */}
              </div>

              {activeCard === index && <span style={{ fontWeight: 200, whiteSpace: "pre-line" }}>{q.answer}</span>}
            </div>
          ))}
        </div>
        <div className={styles.button_cont}>
          <Link href="/about/faqs">
            <Button className={styles.button_see_more} style={{ textDecoration: "underline", fontWeight: 800, color: '#20212B' }} type="text">
              Ver más
            </Button>
          </Link>

        </div>
      </div>
    </div>

  );
};
