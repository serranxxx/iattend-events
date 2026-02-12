// TextureOverlay.tsx
import { useEffect, useId, useRef } from "react";
import type { StaticImageData } from "next/image";

type Texture = {
  image: StaticImageData | string;
  opacity: number;
  blend: React.CSSProperties["mixBlendMode"];
  filter: React.CSSProperties["filter"];
};

function getSrc(img: StaticImageData | string) {
  return typeof img === "string" ? img : img.src;
}

type Props = {
  containerRef: React.RefObject<HTMLElement> | null;
  coverHeightPx: number;
  texture: Texture;
  tileW?: number;
  tileH?: number;
  zIndex?: number | string;
  extraMarginPx?: number; // 👈 margen extra hacia abajo
};

export function TextureOverlay({
  containerRef,
  coverHeightPx,
  texture,
  tileW = 1024,
  tileH = 1024,
  zIndex = 0,
  extraMarginPx = 0, // 👈 default: 50px de margen
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const patternId = useId();
  const texSrc = getSrc(texture.image);

  useEffect(() => {
    const cont = containerRef?.current;
    const svg = svgRef.current;
    if (!cont || !svg) return;

    const recalc = () => {
      const total = cont.scrollHeight;
      // 👇 le sumamos un margen extra para que la textura sobresalga
      const overlayH = Math.max(0, total - coverHeightPx + extraMarginPx);
      svg.style.top = `${coverHeightPx}px`;
      svg.setAttribute("width", String(cont.clientWidth));
      svg.setAttribute("height", String(overlayH));
      svg.setAttribute("viewBox", `0 0 ${cont.clientWidth} ${overlayH}`);
    };

    recalc();
    const ro = new ResizeObserver(recalc);
    ro.observe(cont);
    window.addEventListener("resize", recalc);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", recalc);
    };
  }, [coverHeightPx, containerRef, extraMarginPx]);

  const scale = 0.6;

  return (
    <svg
      ref={svgRef}
      className="texture_svg_overlay"
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: "100%",
        pointerEvents: "none",
        zIndex, // 👈 configurable
        filter: texture.filter,
        mixBlendMode: texture.blend,
        opacity: texture.opacity,
      }}
      preserveAspectRatio="none"
    >
      <defs>
        <pattern id={patternId} patternUnits="userSpaceOnUse" width={tileW} height={tileH * 2} patternTransform={`scale(${scale})`}>
          <image href={texSrc} x="0" y="0" width={tileW} height={tileH} preserveAspectRatio="none" imageRendering="crisp-edges" />
          <image
            href={texSrc}
            x="0"
            y="0"
            width={tileW}
            height={tileH}
            preserveAspectRatio="none"
            imageRendering="crisp-edges"
            transform={`translate(0, ${2 * tileH}) scale(1, -1)`}
          />
        </pattern>
      </defs>
      <rect x="0" y="0" width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}
