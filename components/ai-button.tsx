"use client";

///////////////
// Note
// This is the only vibe coded part of the project,
// and this is a bit of a joke about companies putting
// AI into everything
///////////////

import React, { useState } from "react";
import { motion } from "framer-motion";

export interface AIButtonProps {
  variant?: "expanded" | "circle";
  text?: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

export function AIButton({
  variant = "expanded",
  text = "Ask AI",
  onClick = () => {
    import("posthog-js").then(({ default: posthog }) =>
      posthog.capture("support_ai_button_clicked", { variant, text }),
    );
    location.href = "/ai";
  },
  className = "",
  disabled = false,
}: AIButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const isExpanded = variant === "expanded";

  return (
    <div className={`inline-flex z-50 relative ${className}`}>
      {/* Outer glow effect */}
      <motion.div
        className="absolute inset-0 rounded-full blur-xl opacity-0"
        style={{
          background:
            "linear-gradient(135deg, #a855f7, #8b5cf6, #6366f1, #ec4899)",
        }}
        animate={{
          opacity: isHovered ? 0.6 : disabled ? 0 : 0.3,
          scale: isHovered ? 1.1 : 1,
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Main button */}
      <motion.button
        className="relative overflow-hidden"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          width: isExpanded ? "auto" : "3.5rem",
          height: isExpanded ? "auto" : "3.5rem",
          padding: isExpanded ? "0.875rem 1.75rem" : 0,
          borderRadius: "9999px",
          background:
            "linear-gradient(135deg, #9333ea 0%, #7c3aed 25%, #6366f1 50%, #4f46e5 75%, #4338ca 100%)",
          color: "white",
          fontWeight: 600,
          fontSize: isExpanded ? "0.9375rem" : "inherit",
          letterSpacing: "0.02em",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          boxShadow: disabled
            ? "0 4px 14px 0 rgba(147, 51, 234, 0.2)"
            : "0 8px 24px 0 rgba(147, 51, 234, 0.4), 0 4px 8px 0 rgba(0, 0, 0, 0.2)",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.5 : 1,
          outline: "none",
          margin: 0,
          appearance: "none",
          WebkitAppearance: "none",
          MozAppearance: "none",
          userSelect: "none",
          WebkitTapHighlightColor: "transparent",
          transition: "box-shadow 0.3s ease",
        }}
        onClick={onClick}
        disabled={disabled}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        onTapStart={() => setIsPressed(true)}
        onTap={() => setIsPressed(false)}
        onTapCancel={() => setIsPressed(false)}
        whileHover={{ scale: disabled ? 1 : 1.05 }}
        whileTap={{ scale: disabled ? 1 : 0.96 }}
      >
        {/* Glass morphism overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0) 100%)",
            pointerEvents: "none",
          }}
        />

        {/* Animated gradient overlay */}
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(236, 72, 153, 0.4), rgba(168, 85, 247, 0.4), rgba(99, 102, 241, 0.4))",
            opacity: 0,
          }}
          animate={{
            opacity: isHovered ? 1 : 0,
          }}
          transition={{ duration: 0.4 }}
        />

        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%)",
            transform: "translateX(-100%)",
          }}
          animate={{
            transform: isHovered
              ? ["translateX(-100%)", "translateX(100%)"]
              : "translateX(-100%)",
          }}
          transition={{
            duration: 1.2,
            repeat: isHovered ? Infinity : 0,
            ease: "easeInOut",
            repeatDelay: 0.5,
          }}
        />

        {/* Particle effects on click */}
        {isPressed && (
          <>
            {[...Array(8)].map((_, i) => {
              const angle = (i * Math.PI * 2) / 8;
              return (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{
                    width: "0.375rem",
                    height: "0.375rem",
                    borderRadius: "50%",
                    background:
                      "radial-gradient(circle, rgba(255, 255, 255, 1) 0%, rgba(168, 85, 247, 1) 100%)",
                    left: "50%",
                    top: "50%",
                    marginLeft: "-0.1875rem",
                    marginTop: "-0.1875rem",
                  }}
                  initial={{
                    x: 0,
                    y: 0,
                    opacity: 1,
                    scale: 0,
                  }}
                  animate={{
                    x: Math.cos(angle) * 40,
                    y: Math.sin(angle) * 40,
                    opacity: 0,
                    scale: 1,
                  }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              );
            })}
          </>
        )}

        {/* Content container */}
        <div
          className="relative z-10"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: isExpanded ? "0.5rem" : 0,
          }}
        >
          {/* AI Sparkle Icon */}
          <motion.svg
            width={isExpanded ? "20" : "28"}
            height={isExpanded ? "20" : "28"}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              filter: "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))",
            }}
            animate={{
              rotate: isHovered ? [0, 12, -12, 0] : 0,
            }}
            transition={{
              duration: 0.6,
              repeat: isHovered ? Infinity : 0,
              repeatDelay: 0.4,
            }}
          >
            {/* Main star */}
            <motion.path
              d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
              fill="white"
              animate={{
                scale: isHovered ? [1, 1.15, 1] : 1,
              }}
              transition={{
                duration: 0.8,
                repeat: isHovered ? Infinity : 0,
              }}
            />
            {/* Top right sparkle */}
            <motion.path
              d="M19 4L19.5 6.5L22 7L19.5 7.5L19 10L18.5 7.5L16 7L18.5 6.5L19 4Z"
              fill="white"
              animate={{
                opacity: isHovered ? [0.6, 1, 0.6] : 0.8,
                scale: isHovered ? [1, 1.3, 1] : 1,
              }}
              transition={{
                duration: 1.2,
                repeat: isHovered ? Infinity : 0,
                delay: 0.1,
              }}
            />
            {/* Bottom right sparkle */}
            <motion.path
              d="M19 18L19.5 20.5L22 21L19.5 21.5L19 24L18.5 21.5L16 21L18.5 20.5L19 18Z"
              fill="white"
              animate={{
                opacity: isHovered ? [0.5, 1, 0.5] : 0.7,
                scale: isHovered ? [1, 1.25, 1] : 1,
              }}
              transition={{
                duration: 1.5,
                repeat: isHovered ? Infinity : 0,
                delay: 0.2,
              }}
            />
          </motion.svg>

          {/* Text (only in expanded variant) */}
          {isExpanded && (
            <motion.span
              style={{
                fontWeight: 600,
                letterSpacing: "0.02em",
                textShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
              }}
              animate={{
                opacity: isHovered ? [1, 0.9, 1] : 1,
              }}
              transition={{
                duration: 1.8,
                repeat: isHovered ? Infinity : 0,
              }}
            >
              {text}
            </motion.span>
          )}
        </div>

        {/* Pulsing ring effect */}
        <motion.div
          className="absolute inset-0"
          style={{
            borderRadius: "9999px",
            border: "2px solid rgba(255, 255, 255, 0.6)",
            pointerEvents: "none",
          }}
          animate={{
            scale: isHovered ? [1, 1.15, 1.15] : 1,
            opacity: isHovered ? [0.6, 0, 0] : 0,
          }}
          transition={{
            duration: 1.4,
            repeat: isHovered ? Infinity : 0,
            ease: "easeOut",
          }}
        />

        {/* Inner highlight */}
        <div
          className="absolute inset-0"
          style={{
            borderRadius: "9999px",
            background:
              "radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.3) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />
      </motion.button>
    </div>
  );
}
