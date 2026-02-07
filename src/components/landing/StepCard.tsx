type StepCardProps = {
  num: number;
  icon: React.ReactNode;
  title: string;
  desc: string;
};

export function StepCard({ num, icon, title, desc }: StepCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-surface p-4">
      <div className="flex flex-col items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-primary">
          <span className="text-base font-bold text-white">{num}</span>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-medium">
          {icon}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-bold text-foreground">{title}</span>
        <span className="text-xs text-text-secondary">{desc}</span>
      </div>
    </div>
  );
}
