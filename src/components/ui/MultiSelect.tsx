"use client";

import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type KeyboardEvent,
} from "react";
import { Check, CheckSquare2, ChevronDown, Square } from "lucide-react";
import { cn } from "@/lib/utils";

type MultiSelectBaseProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "value" | "defaultValue" | "onChange"
>;

export interface MultiSelectProps extends MultiSelectBaseProps {
  label?: string;
  error?: string;
  options: { label: string; value: string }[];
  value: string[];
  onChange?: (nextValue: string[]) => void;
  emptyLabel?: string;
}

const MultiSelect = forwardRef<HTMLButtonElement, MultiSelectProps>(
  (
    {
      className,
      label,
      error,
      id,
      options,
      value,
      onChange,
      emptyLabel = "Any",
      name,
      disabled,
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
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);

    useImperativeHandle(ref, () => triggerRef.current as HTMLButtonElement);

    const selectedValues = useMemo(() => new Set(value), [value]);
    const selectedOptions = useMemo(
      () => options.filter((option) => selectedValues.has(option.value)),
      [options, selectedValues],
    );
    const displayLabel =
      selectedOptions.length === 0
        ? emptyLabel
        : selectedOptions.length === 1
          ? selectedOptions[0]?.label ?? emptyLabel
          : `${selectedOptions.length} selected`;

    useEffect(() => {
      if (!isOpen) {
        return;
      }

      function handlePointerDown(event: PointerEvent) {
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

      document.addEventListener("pointerdown", handlePointerDown);
      document.addEventListener("keydown", handleEscape);

      return () => {
        document.removeEventListener("pointerdown", handlePointerDown);
        document.removeEventListener("keydown", handleEscape);
      };
    }, [isOpen]);

    useEffect(() => {
      if (highlightedIndex >= options.length) {
        setHighlightedIndex(0);
      }
    }, [highlightedIndex, options.length]);

    function toggleValue(nextValue: string) {
      if (!onChange) {
        return;
      }

      if (selectedValues.has(nextValue)) {
        onChange(value.filter((entry) => entry !== nextValue));
        return;
      }

      onChange([...value, nextValue]);
    }

    function moveHighlight(direction: 1 | -1) {
      if (options.length === 0) {
        return;
      }

      setHighlightedIndex((current) => {
        const baseIndex = current < 0 ? 0 : current;
        return (baseIndex + direction + options.length) % options.length;
      });
    }

    function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
      onKeyDown?.(event);

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

        const option = options[highlightedIndex];
        if (option) {
          toggleValue(option.value);
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
          <input
            type="hidden"
            name={name}
            value={value.join(",")}
            readOnly
          />

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
              onBlur?.(event);
            }}
            onFocus={onFocus}
            onKeyDown={handleTriggerKeyDown}
            className={cn(
              "group h-12 w-full rounded-2xl border border-[var(--color-border)] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-4 pr-14 text-left text-base text-[var(--color-text-primary)] shadow-sm transition-[border-color,box-shadow,background-color,color] hover:border-[var(--color-deep-slate-blue)]/30 hover:bg-white/70 hover:shadow-md focus:border-[var(--color-deep-slate-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--color-deep-slate-blue)]/15 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-[var(--color-text-secondary)] disabled:opacity-50",
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
            <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-[80] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white shadow-[0_18px_48px_rgba(15,23,42,0.14)]">
              <ul
                id={listboxId}
                role="listbox"
                aria-multiselectable="true"
                aria-labelledby={label ? labelId : undefined}
                className="max-h-72 overflow-y-auto p-2"
              >
                <li role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={selectedOptions.length === 0}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors",
                      selectedOptions.length === 0
                        ? "bg-[var(--color-deep-slate-blue)]/8 text-[var(--color-text-primary)]"
                        : "text-[var(--color-text-secondary)] hover:bg-slate-50 hover:text-[var(--color-text-primary)]",
                    )}
                    onMouseEnter={() => setHighlightedIndex(0)}
                    onClick={() => onChange?.([])}
                  >
                    <span>{emptyLabel}</span>
                    <CheckSquare2 className="h-4 w-4 text-[var(--color-deep-slate-blue)]" />
                  </button>
                </li>
                {options.map((option, index) => {
                  const isSelected = selectedValues.has(option.value);
                  const isHighlighted = highlightedIndex === index + 1;

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
                        onMouseEnter={() => setHighlightedIndex(index + 1)}
                        onClick={() => toggleValue(option.value)}
                      >
                        <span>{option.label}</span>
                        {isSelected ? (
                          <CheckSquare2 className="h-4 w-4 text-[var(--color-deep-slate-blue)]" />
                        ) : (
                          <Square className="h-4 w-4 text-[var(--color-text-secondary)]" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
        {error && <p className="text-sm text-[var(--color-rejected)]">{error}</p>}
      </div>
    );
  },
);

MultiSelect.displayName = "MultiSelect";

export { MultiSelect };