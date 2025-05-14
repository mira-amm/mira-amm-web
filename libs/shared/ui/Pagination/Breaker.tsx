import { Select } from "./Select";
import { Button } from "../button";

const range = (start: number, end: number) => {
  const arr = [];
  for (let i = start; i <= end; i++) {
    arr.push(i);
  }
  return arr;
};

interface BreakerProps {
  /** start of the page numbers */
  start: number;
  /** end of page numbers */
  end: number;
  /** callback when a page is clicked */
  onPageClick: Function;
}

export const Breaker = ({ start, end, onPageClick }: BreakerProps) => {
  return (
    <li>
      <Select
        trigger={
          <Button variant="terminalGreen" size="sm">
            {start} - {end}
          </Button>
        }
        options={range(start, end).map((page) => ({
          value: page.toString(),
          label: page.toString(),
        }))}
        onChange={(value) => onPageClick(Number(value))}
        value={start.toString()}
      />
    </li>
  );
};
