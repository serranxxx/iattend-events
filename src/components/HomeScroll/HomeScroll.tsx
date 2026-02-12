"use client";

import { cover_samples } from "@/helpers/images";
import { useEffect, useRef, useState } from "react";

import styles from "./homescroll.module.css";
import Image from "next/image";

export const HomeScroll = () => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [centerIndex, setCenterIndex] = useState<number>(0);
    // const [prevScrollPos, setPrevScrollPos] = useState<number>(0);
    // const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        handleScroll();
    }, []);

    useEffect(() => {
        const container = scrollRef.current;
        const speed = 2;

        let animationFrame: any;

        const autoScroll = () => {
            if (container) {
                container.scrollLeft += speed;
                handleScroll();
            }
            animationFrame = requestAnimationFrame(autoScroll);
        };

        animationFrame = requestAnimationFrame(autoScroll);

        return () => cancelAnimationFrame(animationFrame);
    }, []);

    // useEffect(() => {
    //   const handleScroll = () => {
    //     const currentScrollPos = window.pageYOffset;
    //     const margin = 0; // Ajusta este valor según tu preferencia

    //     // if (currentScrollPos < margin) {
    //     //   setIsVisible(false);
    //     // } else {
    //     //   setIsVisible(prevScrollPos > currentScrollPos);

    //     //   setPrevScrollPos(currentScrollPos);
    //     // }
    //   };

    //   window.addEventListener("scroll", handleScroll);

    //   return () => {
    //     window.removeEventListener("scroll", handleScroll);
    //   };
    // }, [prevScrollPos]);

    const handleScroll = () => {
        const container = scrollRef.current;
        if (!container) return;

        if (container.scrollLeft >= container.scrollWidth / 2) {
            container.scrollLeft = container.scrollLeft - container.scrollWidth / 2;
        }
        if (container.scrollLeft <= 0) {
            container.scrollLeft = container.scrollLeft + container.scrollWidth / 2;
        }

        const containerCenter = container.scrollLeft + container.offsetWidth / 2;
        const items = Array.from(container.children);

        let minDiff = Infinity;
        let closestIndex = 0;

        items.forEach((item, idx) => {
            const element = item as HTMLDivElement; // aseguras que tiene offsetLeft y offsetWidth
            const itemCenter = element.offsetLeft + element.offsetWidth / 2;
            const diff = Math.abs(containerCenter - itemCenter);
            if (diff < minDiff) {
                minDiff = diff;
                closestIndex = idx;
            }
        });

        setCenterIndex(closestIndex);
    };
    return (
        <div className={styles.key_cont}>
            <span className={styles.key_title}>Envía invitaciones fantásticas</span>
            <div ref={scrollRef} onScroll={handleScroll} className={`${styles.cover_samples_container} scroll-invitation`}>

                {[...cover_samples, ...cover_samples].map((cover, idx) => (
                    <div
                        key={idx}
                        style={{
                            transition: "all 0.45s ease",
                            zIndex: centerIndex === idx ? 2 : 1,
                        }}
                        className={`${styles.inv_device_main_container_ios} ${styles.regular_card_cover
                            }`}
                    >
                        <div className={styles.device_buttons_container_ios}>
                            <div className={styles.device_button_ios} />
                            <div className={styles.device_button_ios} />
                            <div className={styles.device_button_ios} />
                        </div>
                        <div className={styles.device_power_button_ios} />
                        <div className={styles.inv_device_container_ios}>
                            <div
                                style={{
                                    width: "100%",
                                }}
                                className={styles.inv_black_space_ios}
                            >
                                <span style={{ color: "#FFF", fontFamily:'Poppins' }}>5:15</span>
                                {/* <div className={`camera-ios`} /> */}
                                <div>
                                    {/* <Image
                  alt=""
                  src={ios_settings}
                  style={{
                    height: "100%",
                    objectFit: "cover",
                    // marginRight: "50px",
                  }}
                /> */}
                                </div>
                            </div>

                            <div className={`${styles.ios_invitation} ${styles.inv_set_position} ${styles.cover_sample_img} scroll-invitation`}>
                                <Image width={214} height={400} alt="" src={cover} />
                            </div>
                            <div className={styles.inv_light_space_ios} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
