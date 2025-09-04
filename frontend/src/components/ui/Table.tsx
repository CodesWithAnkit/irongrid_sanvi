import React from "react";

export const Table: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <table className="w-full border-collapse">{children}</table>
);
