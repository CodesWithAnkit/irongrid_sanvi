import React from "react";

export const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`border rounded p-4 shadow ${className}`}>{children}</div>
);
