type LoadingSpinnerProps = {
  size?: "sm" | "md" | "lg";
  fullHeight?: boolean;
};

const sizeMap = {
  sm: "h-5 w-5 border-2",
  md: "h-8 w-8 border-4",
  lg: "h-12 w-12 border-4",
};

export function LoadingSpinner({ size = "md", fullHeight }: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${fullHeight ? "h-[400px]" : ""}`}>
      <div className={`animate-spin rounded-full border-primary border-t-transparent ${sizeMap[size]}`} />
    </div>
  );
}
