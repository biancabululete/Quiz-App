import React from "react";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export const ScrollArea = ({ children, className }: Props) => (
  <div className={`max-h-screen overflow-y-auto ${className || ""}`}>
    {children}
  </div>
);
