import React from "react";

interface LogoProps {
  className?: string;
  /** Show "GumGauge" text next to the logo (use false when the image already includes the wordmark) */
  showText?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "light" | "dark";
}

const sizeClasses = { sm: "h-8", md: "h-10", lg: "h-14", xl: "h-32 sm:h-40 md:h-48" };
const textSizes = { sm: "text-lg", md: "text-xl", lg: "text-2xl", xl: "text-3xl" };

export default function Logo({ className = "", showText = false, size = "md", variant = "light" }: LogoProps) {
  const [imgFailed, setImgFailed] = React.useState(false);
  const textColor = variant === "dark" ? "text-white" : "text-navy";

  return (
    <div className={`flex items-center gap-2 bg-transparent ${className}`}>
      {!imgFailed ? (
        <img
          src="/logo.png"
          alt="GumGauge"
          className={`${sizeClasses[size]} w-auto object-contain flex-shrink-0 bg-transparent`}
          onError={() => setImgFailed(true)}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} min-w-[2.5rem] flex items-center justify-center rounded-lg px-2 ${
            variant === "dark" ? "bg-white/20" : "bg-navy"
          }`}
          aria-hidden
        >
          <span className="text-white font-bold text-sm">GG</span>
        </div>
      )}
      {showText && (
        <span className={`font-semibold ${textColor} ${textSizes[size]}`}>GumGauge</span>
      )}
    </div>
  );
}
