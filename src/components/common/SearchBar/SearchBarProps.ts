import {RefObject, ChangeEvent} from "react";

export interface SearchBarProps {
  placeholder: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  inputRef?: RefObject<HTMLInputElement>;
  className?: string;
  value: string;
}
