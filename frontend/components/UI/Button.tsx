import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  children,
  className = "",
  ...props
}) => {
  const baseStyles =
    "font-mono uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2 border-2 active:translate-y-1 active:shadow-none";

  const variants = {
    primary:
      "bg-walrus-cyan text-black border-walrus-cyan shadow-[4px_4px_0px_0px_rgba(34,211,238,0.3)] hover:shadow-[6px_6px_0px_0px_rgba(34,211,238,0.5)] hover:-translate-y-0.5",
    secondary:
      "bg-walrus-purple text-black border-walrus-purple shadow-[4px_4px_0px_0px_rgba(192,132,252,0.3)] hover:shadow-[6px_6px_0px_0px_rgba(192,132,252,0.5)] hover:-translate-y-0.5",
    outline:
      "bg-transparent text-walrus-cyan border-walrus-cyan hover:bg-walrus-cyan/10",
  };

  const sizes = {
    sm: "px-3 py-1 text-xs",
    md: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base font-bold",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
