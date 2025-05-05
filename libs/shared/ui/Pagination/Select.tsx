import * as React from "react";
import { Select as SelectRoot, SelectContent, SelectGroup, SelectTrigger, SelectItem } from "../select";

interface SelectProps {
  /** The value of the select */
  value: string;
  /** The options for the select */
  options: Array<{ value: string; label: string }>;
  /** The callback function when the value changes */
  onChange: (value: string) => void;
  /** The placeholder for the select */
  placeholder?: string;
  /** The class name for the select */
  className?: string;
  /** The class name for the trigger */
  trigger: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({ trigger, options, onChange, value }) => (
  <SelectRoot onValueChange={onChange} value={value}>
    <SelectTrigger>{trigger}</SelectTrigger>
    <SelectContent className="bg-slate-900 text-terminal-green border-terminal-green/30 shadow-lg rounded-md">
      <SelectGroup>
        {options.map((option) => (
          <SelectItem
            className="justify-center hover:bg-slate-900 focus:bg-slate-950 focus:text-terminal-green"
            key={option.value}
            value={option.value}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectGroup>
    </SelectContent>
  </SelectRoot>
);
