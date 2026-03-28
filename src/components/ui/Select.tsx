"use client";

import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type SelectHTMLAttributes,
} from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type BaseSelectProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "children"
>;

export interface SelectProps extends BaseSelectProps {
  label?: string;
  error?: string;
  options: { label: string; value: string }[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      error,
      id,
      options,
      placeholder,
      value,
      defaultValue,
      name,
      required,
      disabled,
      onChange,
      onBlur,
      onFocus,
      onKeyDown,
      autoFocus,
      tabIndex,
      title,
      style,
      "aria-label": ariaLabel,
      "aria-describedby": ariaDescribedBy,
      "aria-labelledby": ariaLabelledBy,
    },
    ref,
  ) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const labelId = `${selectId}-label`;
    const listboxId = `${selectId}-listbox`;
    const wrapperRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const hiddenInputRef = useRef<HTMLSelectElement>(null);
    const [isOpen, setIsOpen] = useState(false);

    useImperativeHandle(ref, () => hiddenInputRef.current as HTMLSelectElement);

    const selectedValue = String(value ?? defaultValue ?? "");
    const selectedOption = useMemo(
      () => options.find((option) => option.value === selectedValue),
      [options, selectedValue],
    );
    const enabledOptions = useMemo(() => options, [options]);
    const initialIndex = Math.max(
      enabledOptions.findIndex((option) => option.value === selectedValue),
      0,
    );
    const [highlightedIndex, setHighlightedIndex] = useState(initialIndex);

    useEffect(() => {
      setHighlightedIndex(initialIndex);
    }, [initialIndex]);

    useEffect(() => {
      if (!isOpen) {
        return;
      }

      function handlePointerDown(event: MouseEvent) {
        if (!wrapperRef.current?.contains(event.target as Node)) {
          setIsOpen(false);
        }
      }

      function handleEscape(event: globalThis.KeyboardEvent) {
        if (event.key === "Escape") {
          setIsOpen(false);
          triggerRef.current?.focus();
        }
      }

      document.addEventListener("mousedown", handlePointerDown);
      document.addEventListener("keydown", handleEscape);

      return () => {
        document.removeEventListener("mousedown", handlePointerDown);
        document.removeEventListener("keydown", handleEscape);
      };
    }, [isOpen]);

    const hasPlaceholderValue = !selectedOption;
    const displayLabel = selectedOption?.label ?? placeholder ?? "Select option";

    function emitChange(nextValue: string) {
      if (!onChange) {
        return;
      }

      const syntheticEvent = {
        target: { value: nextValue, name },
        currentTarget: { value: nextValue, name },
      } as unknown as React.ChangeEvent<HTMLSelectElement>;

      onChange(syntheticEvent);
    }

    function selectValue(nextValue: string) {
      emitChange(nextValue);
      setIsOpen(false);
      triggerRef.current?.focus();
    }

    function moveHighlight(direction: 1 | -1) {
      if (enabledOptions.length === 0) {
        return;
      }

      setHighlightedIndex((current) => {
        const baseIndex = current < 0 ? initialIndex : current;
        return (baseIndex + direction + enabledOptions.length) % enabledOptions.length;
      });
    }

    function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
      onKeyDown?.(event as unknown as React.KeyboardEvent<HTMLSelectElement>);

      if (event.defaultPrevented) {
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          return;
        }
        moveHighlight(1);
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          return;
        }
        moveHighlight(-1);
        return;
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          return;
        }

        const option = enabledOptions[highlightedIndex];
        if (option) {
          selectValue(option.value);
        }
      }
    }

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            id={labelId}
            htmlFor={selectId}
            className="block text-sm font-medium text-[var(--color-text-primary)]"
          >
            {label}
          </label>
        )}
        <div
          ref={wrapperRef}
          className={cn("relative", isOpen ? "z-[70]" : "z-0")}
        >
          <select
            ref={hiddenInputRef}
            name={name}
            required={required}
            value={selectedValue}
            onChange={() => undefined}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <button
            id={selectId}
            ref={triggerRef}
            type="button"
            autoFocus={autoFocus}
            tabIndex={tabIndex}
            title={title}
            style={style}
            aria-label={ariaLabel}
            aria-describedby={ariaDescribedBy}
            aria-labelledby={ariaLabelledBy}
            aria-invalid={error ? "true" : "false"}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-controls={listboxId}
            disabled={disabled}
            onClick={() => {
              if (disabled) {
                return;
              }
              setIsOpen((current) => !current);
            }}
            onBlur={(event) => {
              const nextTarget = event.relatedTarget as Node | null;
              if (nextTarget && wrapperRef.current?.contains(nextTarget)) {
                return;
              }
              setIsOpen(false);
              onBlur?.(event as unknown as React.FocusEvent<HTMLSelectElement>);
            }}
            onFocus={(event) => {
              onFocus?.(event as unknown as React.FocusEvent<HTMLSelectElement>);
            }}
            onKeyDown={handleTriggerKeyDown}
            className={cn(
              "group h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-4 pr-14 text-left text-base shadow-sm transition-[border-color,box-shadow,background-color,color] hover:border-[var(--color-deep-slate-blue)]/30 hover:bg-white/70 hover:shadow-md focus:border-[var(--color-deep-slate-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--color-deep-slate-blue)]/15 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-[var(--color-text-secondary)] disabled:opacity-50",
              hasPlaceholderValue
                ? "text-[var(--color-text-secondary)]"
                : "text-[var(--color-text-primary)]",
              error &&
                "border-[var(--color-rejected)] hover:border-[var(--color-rejected)]/80 focus:border-[var(--color-rejected)] focus:ring-[var(--color-rejected)]/15",
              className,
            )}
          >
            <span className="block truncate pr-2">{displayLabel}</span>
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
              <span className="flex h-8 w-8 items-center justify-center text-[var(--color-text-secondary)] transition-[color,transform] group-hover:text-[var(--color-deep-slate-blue)] group-aria-expanded:-rotate-180">
                <ChevronDown className="h-4 w-4" />
              </span>
            </span>
          </button>

          {isOpen && !disabled && (
            <div
              className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-[80] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-[0_18px_48px_rgba(15,23,42,0.14)]"
            >
              <ul
                id={listboxId}
                role="listbox"
                aria-labelledby={label ? labelId : undefined}
                className="max-h-72 overflow-y-auto p-2"
              >
                {enabledOptions.map((option, index) => {
                  const isSelected = option.value === selectedValue;
                  const isHighlighted = index === highlightedIndex;

                  return (
                    <li key={option.value} role="presentation">
                      <button
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        className={cn(
                          "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                          isHighlighted || isSelected
                            ? "bg-[var(--color-deep-slate-blue)]/8 text-[var(--color-text-primary)]"
                            : "text-[var(--color-text-secondary)] hover:bg-slate-50 hover:text-[var(--color-text-primary)]",
                        )}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        onClick={() => selectValue(option.value)}
                      >
                        <span>{option.label}</span>
                        {isSelected && (
                          <Check className="h-4 w-4 text-[var(--color-deep-slate-blue)]" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
        {error && (
          <p className="text-sm text-[var(--color-rejected)]">{error}</p>
        )}
      </div>
    );
  },
);
Select.displayName = "Select";

export { Select };
