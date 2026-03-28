export interface TextEditResult {
  value: string;
  selectionStart: number;
  selectionEnd: number;
}

const INDENT = "  ";

function getLineStart(value: string, index: number) {
  return value.lastIndexOf("\n", Math.max(index - 1, 0)) + 1;
}

function getLineIndent(value: string, index: number) {
  const lineStart = getLineStart(value, index);
  const line = value.slice(lineStart, index);
  const match = line.match(/^[\t ]*/);
  return match?.[0] ?? "";
}

export function applyTabIndent(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  shiftKey: boolean,
): TextEditResult {
  if (selectionStart === selectionEnd) {
    if (shiftKey) {
      const lineStart = getLineStart(value, selectionStart);
      const beforeCursor = value.slice(lineStart, selectionStart);
      const removableSpaces = beforeCursor.match(/[ ]{1,2}$/)?.[0].length ?? 0;
      if (removableSpaces === 0) {
        return { value, selectionStart, selectionEnd };
      }

      const nextValue =
        value.slice(0, selectionStart - removableSpaces) +
        value.slice(selectionStart);

      return {
        value: nextValue,
        selectionStart: selectionStart - removableSpaces,
        selectionEnd: selectionEnd - removableSpaces,
      };
    }

    const nextValue =
      value.slice(0, selectionStart) + INDENT + value.slice(selectionEnd);

    return {
      value: nextValue,
      selectionStart: selectionStart + INDENT.length,
      selectionEnd: selectionStart + INDENT.length,
    };
  }

  const blockStart = getLineStart(value, selectionStart);
  const nextLineBreak = value.indexOf("\n", selectionEnd);
  const blockEnd = nextLineBreak === -1 ? value.length : nextLineBreak;
  const block = value.slice(blockStart, blockEnd);
  const lines = block.split("\n");

  if (shiftKey) {
    let removedFromFirstLine = 0;
    let removedTotal = 0;
    const nextLines = lines.map((line, index) => {
      if (line.startsWith(INDENT)) {
        removedTotal += INDENT.length;
        if (index === 0) {
          removedFromFirstLine = INDENT.length;
        }
        return line.slice(INDENT.length);
      }

      if (line.startsWith("\t")) {
        removedTotal += 1;
        if (index === 0) {
          removedFromFirstLine = 1;
        }
        return line.slice(1);
      }

      return line;
    });

    const replacement = nextLines.join("\n");
    return {
      value: value.slice(0, blockStart) + replacement + value.slice(blockEnd),
      selectionStart: Math.max(blockStart, selectionStart - removedFromFirstLine),
      selectionEnd: Math.max(blockStart, selectionEnd - removedTotal),
    };
  }

  const replacement = lines.map((line) => `${INDENT}${line}`).join("\n");
  return {
    value: value.slice(0, blockStart) + replacement + value.slice(blockEnd),
    selectionStart: selectionStart + INDENT.length,
    selectionEnd: selectionEnd + INDENT.length * lines.length,
  };
}

export function applySmartNewline(
  value: string,
  selectionStart: number,
  selectionEnd: number,
): TextEditResult {
  const currentIndent = getLineIndent(value, selectionStart);
  const previousChar = value[selectionStart - 1] ?? "";
  const nextChar = value[selectionEnd] ?? "";
  const opensBlock = previousChar === "{" || previousChar === "[";
  const closesBlock = nextChar === "}" || nextChar === "]";

  let insertion = `\n${currentIndent}`;
  let cursorOffset = insertion.length;

  if (opensBlock && closesBlock) {
    insertion = `\n${currentIndent}${INDENT}\n${currentIndent}`;
    cursorOffset = (`\n${currentIndent}${INDENT}`).length;
  } else if (opensBlock) {
    insertion = `\n${currentIndent}${INDENT}`;
    cursorOffset = insertion.length;
  }

  const nextValue =
    value.slice(0, selectionStart) + insertion + value.slice(selectionEnd);
  const nextCursor = selectionStart + cursorOffset;

  return {
    value: nextValue,
    selectionStart: nextCursor,
    selectionEnd: nextCursor,
  };
}

export function formatJsonContent(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  return JSON.stringify(JSON.parse(trimmed), null, 2);
}