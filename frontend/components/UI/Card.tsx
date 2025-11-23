import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  hoverEffect = false,
}) => {
  return (
    <div
      className={`
      bg-walrus-card border-2 border-walrus-border p-6 
      ${hoverEffect ? "hover:border-walrus-cyan transition-colors duration-300 group" : ""}
      ${className}
    `}
    >
      {children}
    </div>
  );
};
