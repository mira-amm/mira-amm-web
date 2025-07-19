export const Divider: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({children, className}) => {
  return (
    <ul
      className={`flex justify-center list-none box-border ${className ?? ""}`}
    >
      {children}
    </ul>
  );
};
