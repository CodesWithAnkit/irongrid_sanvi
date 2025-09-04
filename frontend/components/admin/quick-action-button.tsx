import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

interface QuickActionButtonProps {
  icon: ReactNode;
  label: string;
  variant?: "primary" | "outline";
  onClick?: () => void;
}

export function QuickActionButton({ icon, label, variant = "outline", onClick }: QuickActionButtonProps) {
  return (
    <Button 
      variant={variant} 
      className="h-20 flex flex-col items-center justify-center"
      onClick={onClick}
    >
      <div className="w-6 h-6 mb-2">
        {icon}
      </div>
      {label}
    </Button>
  );
}