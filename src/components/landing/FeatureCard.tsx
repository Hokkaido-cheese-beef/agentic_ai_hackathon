type FeatureCardProps = {
  icon: React.ReactNode;
  label: string;
};

export function FeatureCard({ icon, label }: FeatureCardProps) {
  return (
    <div data-testid="feature-card" className="flex w-20 flex-col items-center gap-2">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light">
        {icon}
      </div>
      <span className="text-xs font-medium text-text-secondary text-center leading-[1.3] whitespace-pre-line">
        {label}
      </span>
    </div>
  );
}
