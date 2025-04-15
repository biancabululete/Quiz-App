// src/components/buttons/PrimaryButton.tsx
import Button from "./Button";

const PrimaryButton = ({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <Button variant="primary" className={className} {...props}>
    {children}
  </Button>
);

export default PrimaryButton;
