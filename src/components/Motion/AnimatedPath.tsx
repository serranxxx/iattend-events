import React, { useId } from 'react';

interface AnimatedPathProps {
  color?: string;
  opacityStart?: number;
  opacityEnd?: number;
  duration?: number;
}

const AnimatedPath: React.FC<AnimatedPathProps> = ({
  color = "white",
  opacityStart = 0.4,
  opacityEnd = 0.8,
  duration = 2.5
}) => {
  const gradientId = useId(); // Genera un ID único para evitar conflictos de gradientes

  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg
        id="Layer_2"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 915.82 550" 
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity={opacityStart} />
            <stop offset="100%" stopColor={color} stopOpacity={opacityEnd} />
          </linearGradient>

          <style>{`
            #strokePath-${gradientId} {
              fill: none;
              stroke: url(#${gradientId});
              stroke-width: 60;
              stroke-linecap: round;
              stroke-linejoin: round;
              stroke-dasharray: 2800;
              stroke-dashoffset: 2800;
              animation: drawStroke-${gradientId} ${duration}s ease-in-out forwards;
            }

            @keyframes drawStroke-${gradientId} {
              0% { stroke-dashoffset: 2800; }
              100% { stroke-dashoffset: 0; }
            }
          `}</style>
        </defs>

        <g id="Layer_1-2">
          <path
            id={`strokePath-${gradientId}`}
            d="
              M 50,80 
              C 20,220 100,450 300,480
              C 500,510 680,450 720,300
              C 750,150 720,60 630,70
              C 550,80 540,180 640,260
              C 750,350 900,280 885,140
              C 875,60 850,45 823,31
            "
          />
        </g>
      </svg>
    </div>
  );
};

export default AnimatedPath;