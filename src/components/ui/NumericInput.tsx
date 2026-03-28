"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type InputHTMLAttributes,
} from "react";
import {
  countDigits,
  formatNumericInput,
  formatNumericValue,
  getCaretPositionFromDigitCount,
  parseNumericInput,
  sanitizeNumericInput,
} from "@/lib/numericInput";
import { cn } from "@/lib/utils";

type NativeInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "onChange"
>;

export interface NumericInputProps extends NativeInputProps {
  label?: string;
  error?: string;
  value: number | null | undefined;
  onValueChange: (value: number | null) => void;
  format?: "number" | "currency" | "decimal";
}

const NumericInput = forwardRef<HTMLInputElement, NumericInputProps>(
  (
    {
      className,
      label,
      error,
      id,
      value,
      onValueChange,
      format = "number",
      onBlur,
      onFocus,
      inputMode,
      ...props
    },
    ref,
  ) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const isFocusedRef = useRef(false);
    const useGrouping = format === "currency";
    const allowDecimal = format === "decimal";
    const [displayValue, setDisplayValue] = useState(() =>
      formatNumericValue(value, { allowDecimal, useGrouping }),
    );

    useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    useEffect(() => {
      if (isFocusedRef.current) {
        return;
      }

      setDisplayValue(formatNumericValue(value, { allowDecimal, useGrouping }));
    }, [allowDecimal, useGrouping, value]);

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-[var(--color-text-primary)]"
          >
            {label}
          </label>
        )}
        <input
          {...props}
          id={id}
          ref={inputRef}
          type="text"
          inputMode={inputMode ?? (allowDecimal ? "decimal" : "numeric")}
          value={displayValue}
          onFocus={(event) => {
            isFocusedRef.current = true;
            onFocus?.(event);
          }}
          onBlur={(event) => {
            isFocusedRef.current = false;
            setDisplayValue(formatNumericValue(value, { allowDecimal, useGrouping }));
            onBlur?.(event);
          }}
          onChange={(event) => {
            const rawValue = event.target.value;
            const caretStart = event.target.selectionStart ?? rawValue.length;
            const digitsBeforeCaret = countDigits(rawValue.slice(0, caretStart));
            const normalized = sanitizeNumericInput(rawValue, { allowDecimal });

            if (!normalized) {
              setDisplayValue("");
              onValueChange(null);
              return;
            }

            const nextDisplayValue = formatNumericInput(normalized, {
              allowDecimal,
              useGrouping,
            });
            setDisplayValue(nextDisplayValue);
            onValueChange(parseNumericInput(normalized));

            if (useGrouping) {
              requestAnimationFrame(() => {
                if (!inputRef.current) {
                  return;
                }

                const nextCaret = getCaretPositionFromDigitCount(
                  nextDisplayValue,
                  digitsBeforeCaret,
                );
                inputRef.current.setSelectionRange(nextCaret, nextCaret);
              });
            }
          }}
          className={cn(
            "flex h-12 w-full rounded-xl border border-[var(--color-border)] bg-white px-4 text-base text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] transition-colors focus:border-[var(--color-deep-slate-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/20 disabled:cursor-not-allowed disabled:opacity-50",
            error &&
              "border-[var(--color-rejected)] focus:ring-[var(--color-rejected)]/20",
            className,
          )}
        />
        {error && (
          <p className="text-sm text-[var(--color-rejected)]">{error}</p>
        )}
      </div>
    );
  },
);

NumericInput.displayName = "NumericInput";

export { NumericInput };