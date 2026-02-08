type SectionLabelProps = {
  children: React.ReactNode;
};

export function SectionLabel({ children }: SectionLabelProps) {
  return (
    <span className="text-[13px] font-medium text-text-secondary">
      {children}
    </span>
  );
}
