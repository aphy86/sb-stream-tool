import { Input } from "./input";
import { Button } from "./button";
import { Minus, Plus } from "lucide-react";
import { forwardRef, useState } from "react";

export interface SpinboxProps extends React.ComponentProps<"input"> {
  value?: number;
  onValueChange?: (value: number) => void;
  defaultValue?: number;
  max?: number;
  min?: number;
  showButtons?: boolean;
  inputClassName?: string;
  leftButtonClassName?: string;
  rightButtonClassName?: string;
}

// number spinbox only (may add non-number elements in the future)
const Spinbox = forwardRef<HTMLInputElement, SpinboxProps>(
  (
    {
      value,
      onValueChange,
      defaultValue = 0,
      max = 100,
      min = 0,
      showButtons = true,
      ...props
    },
    ref,
  ) => {
    // the inner state of the spinbox, allows the component to be both controlled (via numberValue) and uncontrolled
    const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);

    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : uncontrolledValue;

    const clamp = (num: number) => {
      const maxNum = max ?? Number.MAX_SAFE_INTEGER;
      const minNum = min ?? Number.MIN_SAFE_INTEGER;

      if (Number.isNaN(num)) {
        return NaN;
      }
      if (num < minNum) {
        return min;
      }

      if (num > maxNum) {
        return max;
      }

      return num;
    };

    const handleChange = (value: number) => {
      let clampedValue = clamp(value);

      if (!isControlled) {
        setUncontrolledValue(clampedValue);
      }

      if (onValueChange) {
        onValueChange(clampedValue);
      }
    };

    return (
      <div className="flex items-center w-full">
        {showButtons && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() =>
              handleChange(
                (Number.isNaN(currentValue) ? min : currentValue) - 1,
              )
            }
          >
            <Minus />
          </Button>
        )}
        <Input
          ref={ref}
          // using shadcn's input, so className not needed
          // className={cn(
          //   "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          //   "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          //   "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          //   className
          // )}
          {...props}
          type="number"
          value={Number.isNaN(currentValue) ? "" : currentValue}
          onChange={(e) => handleChange(e.currentTarget.valueAsNumber)}
          max={max}
          min={min}
        />
        {showButtons && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() =>
              handleChange(
                (Number.isNaN(currentValue) ? min : currentValue) + 1,
              )
            }
          >
            <Plus />
          </Button>
        )}
      </div>
    );
  },
);
Spinbox.displayName = "Spinbox";

export { Spinbox };
