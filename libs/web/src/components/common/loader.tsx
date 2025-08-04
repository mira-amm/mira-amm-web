import {clsx} from "clsx";
import LoaderBar from "./loader-bar";

export function Loader({
  variant = "outlined",
  color = "gray",
  rebrand = false,
}: {
  variant?: "primary" | "secondary" | "outlined";
  color?: "gray";
  rebrand?: boolean;
}) {
  if (rebrand) {
    return <LoaderBar />;
  }

  return (
    <div
      className={clsx(
        "inline-block animate-spin rounded-full box-border w-5 h-5 border-2 border-b-transparent",
        variant === "outlined" && "border-2 border-accent-primary",
        color === "gray" &&
          "border-2 border-content-tertiary border-b-transparent"
      )}
    />
  );
}
