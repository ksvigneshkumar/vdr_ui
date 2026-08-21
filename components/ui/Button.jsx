export default function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}) {

  const baseStyle =
    "px-5 py-3 rounded-xl font-medium transition-all duration-300";

  const variants = {
    primary:
      "bg-[var(--brand)] hover:bg-[var(--brand-dark)] text-white",

    secondary:
      "bg-gray-200 hover:bg-gray-300 text-gray-800",

    dark:
      "bg-slate-900 hover:bg-slate-800 text-white",

    outline:
      "border border-gray-300 hover:bg-gray-100 text-gray-700",
  };

  return (
    <button
      className={`
        ${baseStyle}
        ${variants[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
