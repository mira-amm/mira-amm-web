import {clsx} from "clsx";
import {RefObject, ChangeEvent} from "react";
import {Search} from "lucide-react";

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
        "flex items-center gap-[10px] py-2 px-4 rounded-ten text-content-grey bg-background-secondary dark:bg-background-grey-dark max-w-[160px]",
        className
      )}
    >
      <Search className="w-4 h-4 flex-shrink-0" />
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
