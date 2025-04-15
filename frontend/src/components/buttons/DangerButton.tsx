// src/components/buttons/DangerButton.tsx
import Button from "./Button";

const DangerButton = ({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <Button variant="danger" className={className} {...props}>
    {children}
  </Button>
);

export default DangerButton;
