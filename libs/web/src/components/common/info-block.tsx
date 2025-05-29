export function InfoBlock({ title, value, type }: {
  title: string;
  value: string | null;
  type?: "positive" | "negative";
}){
  const isPositive = type === "positive";
  const isPending = value === null;

  return (
    <div className="flex flex-col gap-[4px] w-[100px] text-left">
      <p>{title}</p>
      <p
        className={`whitespace-nowrap overflow-hidden text-ellipsis ${
          isPending
            ? "text-[var(--content-dimmed-light)]"
            : isPositive
            ? "text-[var(--content-positive)]"
            : "text-[var(--content-tertiary)]"
        }`}
      >
        {value ?? "Awaiting data"}
      </p>
    </div>
  );
};
