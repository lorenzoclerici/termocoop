type ErrorBannerProps = {
  title?: string;
  message: string;
};

export function ErrorBanner({
  title = "Impossibile caricare i dati",
  message,
}: ErrorBannerProps) {
  return (
    <div
      className="border border-brand-crimson/30 bg-brand-crimson/5 px-4 py-3 text-sm"
      role="alert"
    >
      <p className="font-medium text-brand-crimson">{title}</p>
      <p className="mt-1 text-slate">{message}</p>
    </div>
  );
}
