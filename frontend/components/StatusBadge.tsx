export function StatusBadge({ status }: { status: string }) {
  const className =
    status === "GREEN"
      ? "badge green"
      : status === "YELLOW"
        ? "badge yellow"
        : status === "RED"
          ? "badge red"
          : "badge neutral";

  return <span className={className}>{status.replaceAll("_", " ")}</span>;
}
