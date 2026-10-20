import * as React from "react";
import { cn } from "@/lib/utils";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "success" | "warning" | "error" | "info";
  title?: string;
  children: React.ReactNode;
}

const alertStyles = {
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  error: "bg-error/10 text-error border-error/20",
  info: "bg-sage/20 text-text-primary border-border",
};

const Alert = ({ type = "info", title, children, className, ...props }: AlertProps) => {
  return (
    <div
      className={cn(
        "rounded-md border p-4 flex gap-3",
        alertStyles[type],
        className
      )}
      {...props}
    >
      <div className="flex-1">
        {title && <div className="font-semibold mb-1">{title}</div>}
        <div className="text-sm">{children}</div>
      </div>
    </div>
  );
};

export { Alert };
