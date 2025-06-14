import React from "react";

export const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-white shadow rounded-xl p-4 mb-4">{children}</div>
);

export const CardContent = ({ children }: { children: React.ReactNode }) => (
  <div>{children}</div>
);
