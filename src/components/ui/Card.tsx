export default function Card({
  children,
  className = ""
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-[--line] bg-[var(--panel)] shadow-lg ${className}`}
    >
      {children}
    </div>
  );
}
