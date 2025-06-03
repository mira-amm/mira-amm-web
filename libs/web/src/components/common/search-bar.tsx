import {clsx} from "clsx";
import {SearchIcon} from "@/meshwave-ui/icons";
import {RefObject, ChangeEvent} from "react";

export const SearchBar: React.FC<{
  placeholder: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  inputRef?: RefObject<HTMLInputElement>;
  className?: string;
  value: string;
}> = ({placeholder, onChange, inputRef, className, value}) => {
  return (
    <div
      className={clsx(
        "flex gap-[10px] p-[14px_12px] rounded-lg text-content-grey bg-background-grey-dark",
        className,
      )}
    >
      <SearchIcon />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        ref={inputRef}
        className="flex-1 text-base bg-transparent border-none outline-none text-content-primary placeholder:text-content-grey"
      />
    </div>
  );
};
