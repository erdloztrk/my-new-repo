import React from "react";
import Svg, { Path, Circle, Ellipse } from "react-native-svg";

interface SeasideIconProps {
  size?: number;
  color?: string;
}

export const SeasideIcon: React.FC<SeasideIconProps> = ({ size = 24, color = "#000000" }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      {/* Palm Tree - Left side with curved trunk */}
      <Path
        d="M5 20 Q5 14 7 12 Q7 10 6 8 Q5 6 7 6 Q9 6 8 8 Q9 10 9 12 Q11 14 11 20"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Palm fronds - three fronds */}
      <Path
        d="M7 12 Q4 10 3 7 Q2 5 3 4"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7 12 Q7 8 8 5 Q9 3 10 4"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7 12 Q9 10 10 7 Q11 5 10 6"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Beach Umbrella - Center with curved top */}
      <Path
        d="M13 20 L13 15 Q13 9 18 9 Q23 9 23 15 L23 20"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Umbrella curved top */}
      <Path
        d="M13 9 Q18 7 23 9"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Umbrella vertical stripes */}
      <Path
        d="M15 9 L15 15"
        fill="none"
        stroke={color}
        strokeWidth="1"
      />
      <Path
        d="M18 9 L18 15"
        fill="none"
        stroke={color}
        strokeWidth="1"
      />
      <Path
        d="M21 9 L21 15"
        fill="none"
        stroke={color}
        strokeWidth="1"
      />
      
      {/* Beach Ball - Right side, circular */}
      <Circle
        cx="26"
        cy="15"
        r="3.5"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
      />
      {/* Beach ball pattern */}
      <Path
        d="M26 11.5 L26 18.5"
        fill="none"
        stroke={color}
        strokeWidth="1"
      />
      <Path
        d="M22.5 15 L29.5 15"
        fill="none"
        stroke={color}
        strokeWidth="1"
      />
      
      {/* Water/Sand wavy line - Bottom */}
      <Path
        d="M2 25 Q5 23 8 25 T14 25 T20 25 T26 25 T30 25"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      
      {/* Small boat/raft on water */}
      <Ellipse
        cx="19"
        cy="24"
        rx="2.5"
        ry="1.2"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
      />
      <Path
        d="M16.5 24 L21.5 24"
        fill="none"
        stroke={color}
        strokeWidth="1"
      />
    </Svg>
  );
};

