'use client';

interface AnimatedLogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export default function AnimatedLogo({ className = 'brand-logo', width = 185, height = 40 }: AnimatedLogoProps) {
  return (
    <svg
      className={`animated-brand-logo ${className}`}
      viewBox="0 0 240 52"
      fill="none"
      width={width}
      height={height}
      aria-label="VERIDEX - Truth in every control"
    >
      <defs>
        <linearGradient id="anim-amber" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFC46B" />
          <stop offset="60%" stopColor="#F29A3D" />
          <stop offset="100%" stopColor="#D97A1E" />
        </linearGradient>
        <linearGradient id="anim-olive" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2A3827" />
          <stop offset="55%" stopColor="#4F6440" />
          <stop offset="100%" stopColor="#86AA70" />
        </linearGradient>
        <filter id="anim-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="glow" />
          <feComposite in="SourceGraphic" in2="glow" operator="over" />
        </filter>
      </defs>

      {/* V Mark Group */}
      <g transform="translate(2, 2)">
        {/* Animated Left Glowing Amber Ribbon */}
        <path
          className="logo-v-left"
          d="M6 8 L18 8 L24 38 L15 38 Z"
          fill="url(#anim-amber)"
          stroke="#FFC46B"
          strokeWidth="1.5"
          filter="url(#anim-glow)"
        />
        {/* Highlight Fold Overlay */}
        <path
          className="logo-v-fold"
          d="M18 8 L24 38 L28 26 Z"
          fill="#FFE2A8"
          opacity="0.65"
        />
        {/* Animated Right Olive Ribbon */}
        <path
          className="logo-v-right"
          d="M42 8 L30 8 L22 38 L31 38 Z"
          fill="url(#anim-olive)"
          stroke="#86AA70"
          strokeWidth="1"
        />
        {/* Vertex Point */}
        <circle className="logo-v-dot" cx="23.5" cy="38" r="1.5" fill="#FFC46B" />
      </g>

      {/* Wordmark VERIDEX in Cream (#F6F1E7) */}
      <text
        className="logo-wordmark"
        x="56"
        y="27"
        fill="#F6F1E7"
        fontFamily="var(--font-sora), system-ui, sans-serif"
        fontSize="21"
        fontWeight="700"
        letterSpacing="0.18em"
      >
        VERIDEX
      </text>

      {/* Tagline in Amber (#F29A3D) */}
      <text
        className="logo-tagline"
        x="56.5"
        y="40"
        fill="#F29A3D"
        fontFamily="var(--font-inter), system-ui, sans-serif"
        fontSize="6.2"
        fontWeight="600"
        letterSpacing="0.28em"
      >
        TRUTH IN EVERY CONTROL
      </text>
    </svg>
  );
}
