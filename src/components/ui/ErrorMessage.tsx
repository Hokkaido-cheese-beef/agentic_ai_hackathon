type ErrorMessageProps = {
  message: string | null;
  centered?: boolean;
};

export function ErrorMessage({ message, centered }: ErrorMessageProps) {
  if (!message) return null;

  return (
    <p className={`text-sm text-red-600 ${centered ? "text-center" : ""}`}>
      {message}
    </p>
  );
}
