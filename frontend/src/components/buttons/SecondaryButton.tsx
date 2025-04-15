// src/componrnts/buttons/SecondaryButton.tsx
import Button from "./Button";

const SecondaryButton = ({ children, className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <Button variant="secondary" className={className} {...props}>
    {children}
  </Button>
);

export default SecondaryButton;
