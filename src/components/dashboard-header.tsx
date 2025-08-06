interface DashboardHeaderProps {
  title: string;
}

export default function DashboardHeader({ title }: DashboardHeaderProps) {
  return (
    <header className="mb-8">
      <h1 className="text-4xl font-bold">{title}</h1>
    </header>
  );
}
