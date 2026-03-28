import { describe, expect, it } from "vitest";
import {
  applySmartNewline,
  applyTabIndent,
  formatJsonContent,
} from "@/lib/jsonEditor";

describe("jsonEditor", () => {
  it("inserts spaces on tab with no selection", () => {
    const result = applyTabIndent("{}", 1, 1, false);

    expect(result.value).toBe("{  }");
    expect(result.selectionStart).toBe(3);
  });

  it("indents and unindents selected lines", () => {
    const indented = applyTabIndent('{\n"a": 1\n}', 0, 8, false);
    expect(indented.value).toContain('  "a": 1');

    const unindented = applyTabIndent(indented.value, 0, indented.value.length, true);
    expect(unindented.value).toBe('{\n"a": 1\n}');
  });

  it("adds a smart newline inside braces", () => {
    const result = applySmartNewline("{}", 1, 1);

    expect(result.value).toBe("{\n  \n}");
    expect(result.selectionStart).toBe(4);
  });

  it("formats valid json", () => {
    expect(formatJsonContent('{"a":1}')).toBe(`{\n  "a": 1\n}`);
  });
});