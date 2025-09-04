import React from "react";

type Props = { open: boolean; onClose: () => void; children: React.ReactNode };
export const Modal: React.FC<Props> = ({ open, onClose, children }) =>
  open ? (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white p-4 rounded" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  ) : null;
