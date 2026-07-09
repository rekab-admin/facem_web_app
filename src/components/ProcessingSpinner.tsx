export function ProcessingSpinner({ label = "Processing…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
      <div className="size-8 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
