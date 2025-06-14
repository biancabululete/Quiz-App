type ButtonProps = {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const Button = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) => {
  const base = "rounded-xl transition font-semibold";
  
  const variants = {
    primary: "bg-maroInchis text-white hover:bg-maroDeschis",
    secondary: "bg-white text-black border border-black hover:bg-gray-100",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  const sizes = {
    sm: "text-sm px-3 py-2",
    md: "text-base px-5 py-3",
    lg: "text-xl px-8 py-5",
  };

  return (
    <button
      {...props}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
