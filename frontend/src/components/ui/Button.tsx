import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" };

export const Button: React.FC<Props> = ({ variant = "primary", className = "", ...props }) => (
  <button
    className={`px-3 py-2 rounded ${variant === "primary" ? "bg-black text-white" : "border"} ${className}`}
    {...props}
  />
);
