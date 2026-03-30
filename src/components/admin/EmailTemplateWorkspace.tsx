"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Editor from "react-simple-code-editor";
import Prism from "prismjs";
import "prismjs/components/prism-markup";
import { Code2, Laptop, Search, ShieldCheck, Smartphone, Sparkles } from "lucide-react";
import { Badge, Button, Card, CardContent, Select } from "@/components/ui";
import { applySmartNewline, applyTabIndent, formatJsonContent } from "@/lib/jsonEditor";
import type { EmailNotificationSettings } from "@/types";

type EditableField = "subject" | "preheader" | "html" | "sampleData";

interface TemplateDraftState {
  draftSubject: string;
  draftPreheader: string;
  draftHtml: string;
  sampleDataText: string;
}

function renderTemplate(value: string, variables: Record<string, unknown>) {
  return value.replace(/{{\s*([a-zA-Z0-9_]+)\s*}}/g, (_match, key: string) => {
    const variable = variables[key];

    if (variable === null || variable === undefined) {
      return "";
    }

    if (typeof variable === "string") {
      return variable;
    }

    if (typeof variable === "number" || typeof variable === "boolean") {
      return String(variable);
    }

    return JSON.stringify(variable);
  });
}

function toPlainText(html: string) {
  if (!html.trim()) {
    return "";
  }

  if (typeof window !== "undefined") {
    const documentFragment = new window.DOMParser().parseFromString(html, "text/html");
    const body = documentFragment.body;

    body.querySelectorAll("br").forEach((element) => {
      element.replaceWith("\n");
    });

    body.querySelectorAll("p, div, section, article, li, tr, h1, h2, h3, h4, h5, h6").forEach(
      (element) => {
        if (!element.textContent?.endsWith("\n")) {
          element.append("\n");
        }
      },
    );

    return body.textContent?.replace(/\n{3,}/g, "\n\n").trim() ?? "";
  }

  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function formatFallbackLabel(category: EmailNotificationSettings["category"]) {
  return category
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function formatRelativeUpdate(isoDate: string) {
  const now = Date.now();
  const diffMs = new Date(isoDate).getTime() - now;
  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = Math.round(diffMs / dayMs);

  if (!Number.isFinite(diffDays)) {
    return "Updated recently";
  }

  if (Math.abs(diffDays) < 1) {
    return "Updated today";
  }

  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  return `Updated ${formatter.format(diffDays, "day")}`;
}

function summarizeText(value: string | null | undefined, fallback: string) {
  const text = (value ?? "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

function highlightHtml(code: string) {
  return Prism.highlight(code, Prism.languages.markup, "markup");
}

function badgeVariantForClassification(classification: EmailNotificationSettings["classification"]) {
  switch (classification) {
    case "mandatory":
      return "active" as const;
    case "optional":
      return "info" as const;
    case "operational":
      return "pending" as const;
    case "legacy":
      return "default" as const;
  }
}

function isTemplateVisible(setting: EmailNotificationSettings) {
  return setting.classification !== "legacy";
}

function buildInitialDraft(setting: EmailNotificationSettings): TemplateDraftState {
  return {
    draftSubject: setting.draft_subject_template ?? setting.subject_template ?? "",
    draftPreheader: setting.draft_preheader_template ?? setting.preheader_template ?? "",
    draftHtml: setting.draft_html_template ?? setting.html_template ?? "",
    sampleDataText: JSON.stringify(setting.sample_data ?? {}, null, 2),
  };
}

function insertAtCursor(
  element: HTMLInputElement | HTMLTextAreaElement | null,
  value: string,
  setValue: (next: string) => void,
  inserted: string,
) {
  if (!element) {
    setValue(`${value}${inserted}`);
    return;
  }

  const start = element.selectionStart ?? value.length;
  const end = element.selectionEnd ?? value.length;
  const nextValue = `${value.slice(0, start)}${inserted}${value.slice(end)}`;

  setValue(nextValue);

  requestAnimationFrame(() => {
    element.focus();
    const nextPosition = start + inserted.length;
    element.setSelectionRange(nextPosition, nextPosition);
  });
}

function resolveTextareaElement(target: EventTarget | null) {
  if (target instanceof HTMLTextAreaElement) {
    return target;
  }

  if (target instanceof HTMLElement) {
    return target.querySelector("textarea");
  }

  return null;
}

function TemplateCard({
  setting,
  isSelected,
  onSelect,
}: {
  setting: EmailNotificationSettings;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const label = summarizeText(setting.label, formatFallbackLabel(setting.category));

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-[20px] border px-4 py-3 text-left transition-all ${
        isSelected
          ? "border-[var(--color-deep-slate-blue)] bg-white shadow-[0_14px_34px_-24px_rgba(30,58,95,0.55)]"
          : "border-[var(--color-border)] bg-white hover:border-[var(--color-deep-slate-blue)]/30 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-[var(--color-text-primary)]">
            {label}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant={setting.is_enabled ? "active" : "pending"} size="sm">
              {setting.is_enabled ? "Active" : "Paused"}
            </Badge>
            <span className="truncate text-xs text-[var(--color-text-secondary)]">
              {formatRelativeUpdate(setting.updated_at)}
            </span>
          </div>
        </div>
      </div>

      {isSelected ? (
        <div className="mt-3 h-1.5 w-16 rounded-full bg-[var(--color-deep-slate-blue)]/70" />
      ) : null}
    </button>
  );
}

function HtmlEditor({
  value,
  onChange,
  onFocus,
  onKeyDown,
  textareaRef,
}: {
  value: string;
  onChange: (next: string) => void;
  onFocus: () => void;
  onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => void;
  textareaRef: { current: HTMLTextAreaElement | null };
}) {
  const lineCount = Math.max(1, value.split("\n").length);
  const [scrollTop, setScrollTop] = useState(0);

  return (
    <div className="overflow-hidden rounded-[26px] border border-slate-800 bg-[#0d1424] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 text-xs text-slate-400">
        <div className="flex items-center gap-2 font-medium uppercase tracking-[0.24em]">
          <Code2 className="h-4 w-4" />
          HTML
        </div>
        <div>Line numbers and syntax highlighting enabled</div>
      </div>

      <div className="flex min-h-[32rem] bg-[#0d1424]">
        <div className="select-none border-r border-slate-800 bg-[#09101d] px-3 py-4 text-right text-xs leading-6 text-slate-500">
          <div style={{ transform: `translateY(-${scrollTop}px)` }}>
            {Array.from({ length: lineCount }, (_value, index) => (
              <div key={index + 1} className="h-6">
                {index + 1}
              </div>
            ))}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <Editor
            value={value}
            onValueChange={onChange}
            highlight={highlightHtml}
            padding={16}
            onFocus={(event) => {
              textareaRef.current = resolveTextareaElement(event.currentTarget);
              onFocus();
            }}
            onClick={(event) => {
              textareaRef.current = resolveTextareaElement(event.currentTarget);
              onFocus();
            }}
            onKeyDown={onKeyDown}
            onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
            textareaClassName="email-template-editor-textarea"
            preClassName="email-template-editor-pre"
            className="email-template-editor-root"
          />
        </div>
      </div>
    </div>
  );
}

export function EmailTemplateWorkspace({
  notifications,
  isSaving,
  onUpdate,
}: {
  notifications: EmailNotificationSettings[];
  isSaving: boolean;
  onUpdate: (
    id: string,
    data: {
      is_enabled?: boolean;
      provider_override?: EmailNotificationSettings["provider_override"];
      draft_subject_template?: string | null;
      draft_preheader_template?: string | null;
      draft_html_template?: string | null;
      draft_text_template?: string | null;
      sample_data?: Record<string, unknown>;
      publish_changes?: boolean;
    },
  ) => Promise<void>;
}) {
  const visibleNotifications = useMemo(
    () => notifications.filter(isTemplateVisible),
    [notifications],
  );
  const [search, setSearch] = useState("");
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [activeField, setActiveField] = useState<EditableField>("html");
  const [selectedId, setSelectedId] = useState<string>(visibleNotifications[0]?.id ?? "");
  const [draft, setDraft] = useState<TemplateDraftState | null>(
    visibleNotifications[0] ? buildInitialDraft(visibleNotifications[0]) : null,
  );

  const subjectRef = useRef<HTMLInputElement>(null);
  const preheaderRef = useRef<HTMLInputElement>(null);
  const htmlRef = useRef<HTMLTextAreaElement | null>(null);
  const sampleDataRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!visibleNotifications.length) {
      setSelectedId("");
      setDraft(null);
      return;
    }

    if (!visibleNotifications.some((item) => item.id === selectedId)) {
      setSelectedId(visibleNotifications[0].id);
    }
  }, [selectedId, visibleNotifications]);

  const filteredNotifications = useMemo(() => {
    const needle = search.trim().toLowerCase();

    if (!needle) {
      return visibleNotifications;
    }

    return visibleNotifications.filter((setting) => {
      return [
        summarizeText(setting.label, formatFallbackLabel(setting.category)),
        summarizeText(setting.description, ""),
        setting.category,
      ]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [search, visibleNotifications]);

  const selectedTemplate = useMemo(
    () => visibleNotifications.find((item) => item.id === selectedId) ?? null,
    [selectedId, visibleNotifications],
  );

  useEffect(() => {
    if (!selectedTemplate) {
      setDraft(null);
      return;
    }

    setDraft(buildInitialDraft(selectedTemplate));
  }, [selectedTemplate]);

  const parsedSampleData = useMemo(() => {
    if (!draft) {
      return { value: {}, error: null as string | null };
    }

    try {
      return {
        value: draft.sampleDataText.trim() ? JSON.parse(draft.sampleDataText) : {},
        error: null,
      };
    } catch {
      return {
        value: {},
        error: "Sample data must be valid JSON.",
      };
    }
  }, [draft]);

  const validationIssues = useMemo(() => {
    if (!draft) {
      return [] as string[];
    }

    const issues: string[] = [];

    if (!draft.draftSubject.trim()) {
      issues.push("Subject line is required.");
    }

    if (!draft.draftHtml.trim()) {
      issues.push("HTML body is required.");
    }

    if (parsedSampleData.error) {
      issues.push(parsedSampleData.error);
    }

    if (typeof window !== "undefined" && draft.draftHtml.trim()) {
      const parsed = new window.DOMParser().parseFromString(draft.draftHtml, "text/html");
      if (parsed.querySelector("parsererror")) {
        issues.push("HTML contains a parser error.");
      }
    }

    return issues;
  }, [draft, parsedSampleData.error]);

  const isDirty = useMemo(() => {
    if (!draft || !selectedTemplate) {
      return false;
    }

    const initial = buildInitialDraft(selectedTemplate);

    return (
      draft.draftSubject !== initial.draftSubject ||
      draft.draftPreheader !== initial.draftPreheader ||
      draft.draftHtml !== initial.draftHtml ||
      draft.sampleDataText !== initial.sampleDataText
    );
  }, [draft, selectedTemplate]);

  const previewValues = parsedSampleData.value as Record<string, unknown>;
  const previewSubject = draft ? renderTemplate(draft.draftSubject, previewValues) : "";
  const previewPreheader = draft ? renderTemplate(draft.draftPreheader, previewValues) : "";
  const previewHtml = draft ? renderTemplate(draft.draftHtml, previewValues) : "";
  const previewText = toPlainText(previewHtml);

  async function handleTemplateSelection(nextId: string) {
    if (nextId === selectedId) {
      return;
    }

    if (isDirty && typeof window !== "undefined") {
      const shouldContinue = window.confirm(
        "You have unsaved template changes. Switch templates and discard them?",
      );

      if (!shouldContinue) {
        return;
      }
    }

    setSelectedId(nextId);
  }

  function handleHtmlEditorKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (!draft) {
      return;
    }

    const target = resolveTextareaElement(event.currentTarget);

    if (!target) {
      return;
    }

    if (event.key === "Tab") {
      event.preventDefault();
      const edit = applyTabIndent(
        draft.draftHtml,
        target.selectionStart,
        target.selectionEnd,
        event.shiftKey,
      );
      setDraft((current) =>
        current ? { ...current, draftHtml: edit.value } : current,
      );
      requestAnimationFrame(() => {
        target.focus();
        target.setSelectionRange(edit.selectionStart, edit.selectionEnd);
      });
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const edit = applySmartNewline(
        draft.draftHtml,
        target.selectionStart,
        target.selectionEnd,
      );
      setDraft((current) =>
        current ? { ...current, draftHtml: edit.value } : current,
      );
      requestAnimationFrame(() => {
        target.focus();
        target.setSelectionRange(edit.selectionStart, edit.selectionEnd);
      });
    }
  }

  function handleFormatSampleData() {
    if (!draft) {
      return;
    }

    try {
      setDraft((current) =>
        current
          ? {
              ...current,
              sampleDataText: formatJsonContent(current.sampleDataText),
            }
          : current,
      );
    } catch {
      // validation message is derived from JSON parsing state
    }
  }

  async function handleSave(publishChanges: boolean) {
    if (!selectedTemplate || !draft || parsedSampleData.error) {
      return;
    }

    await onUpdate(selectedTemplate.id, {
      draft_subject_template: draft.draftSubject,
      draft_preheader_template: draft.draftPreheader,
      draft_html_template: draft.draftHtml,
      draft_text_template: toPlainText(draft.draftHtml),
      sample_data: parsedSampleData.value as Record<string, unknown>,
      publish_changes: publishChanges,
    });
  }

  async function handlePolicyUpdate(data: {
    is_enabled?: boolean;
    provider_override?: EmailNotificationSettings["provider_override"];
  }) {
    if (!selectedTemplate) {
      return;
    }

    await onUpdate(selectedTemplate.id, data);
  }

  if (!selectedTemplate || !draft) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-[var(--color-text-secondary)]">
          No builder-visible email templates are configured yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-5 lg:p-6">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Email Templates
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Edit HTML, insert approved variables, and preview the final email before publishing.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={badgeVariantForClassification(selectedTemplate.classification)} size="sm">
              {selectedTemplate.classification}
            </Badge>
            <Badge variant={selectedTemplate.is_enabled ? "active" : "default"} size="sm">
              {selectedTemplate.is_enabled ? "Active" : "Paused"}
            </Badge>
          </div>
        </div>

        <div className="mt-6 grid gap-5 2xl:grid-cols-[280px_minmax(0,1fr)_360px] xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="min-w-0 rounded-[28px] border border-[var(--color-border)] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4">
            <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-white px-4 py-3 shadow-sm">
              <Search className="h-4 w-4 text-[var(--color-text-secondary)]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search templates"
                className="search-field-reset w-full border-0 bg-transparent text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none"
              />
            </div>

            <div className="mt-4 space-y-2.5">
              {filteredNotifications.map((setting) => (
                <TemplateCard
                  key={setting.id}
                  setting={setting}
                  isSelected={selectedId === setting.id}
                  onSelect={() => void handleTemplateSelection(setting.id)}
                />
              ))}
              {!filteredNotifications.length ? (
                <div className="rounded-[22px] border border-dashed border-[var(--color-border)] px-4 py-8 text-sm text-[var(--color-text-secondary)]">
                  No templates match this search.
                </div>
              ) : null}
            </div>
          </aside>

          <section className="min-w-0 space-y-4 rounded-[28px] border border-[var(--color-border)] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-text-secondary)]">
                  Editor
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-[var(--color-text-primary)]">
                  {summarizeText(selectedTemplate.label, formatFallbackLabel(selectedTemplate.category))}
                </h3>
                <p className="mt-2 max-w-2xl break-words text-sm text-[var(--color-text-secondary)]">
                  {summarizeText(
                    selectedTemplate.description,
                    "Transactional email template for this workflow.",
                  )}
                </p>
              </div>
              <Button
                type="button"
                onClick={() => void handleSave(true)}
                isLoading={isSaving}
                disabled={!isDirty || validationIssues.length > 0}
              >
                Publish changes
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="email-template-subject" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
                  Subject line
                </label>
                <input
                  id="email-template-subject"
                  ref={subjectRef}
                  value={draft.draftSubject}
                  onFocus={() => setActiveField("subject")}
                  onChange={(event) =>
                    setDraft((current) =>
                      current ? { ...current, draftSubject: event.target.value } : current,
                    )
                  }
                  className="h-12 w-full rounded-xl border border-[var(--color-border)] px-4 text-sm focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
                />
              </div>
              <div>
                <label htmlFor="email-template-preheader" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
                  Preview text (preheader)
                </label>
                <input
                  id="email-template-preheader"
                  ref={preheaderRef}
                  value={draft.draftPreheader}
                  onFocus={() => setActiveField("preheader")}
                  onChange={(event) =>
                    setDraft((current) =>
                      current ? { ...current, draftPreheader: event.target.value } : current,
                    )
                  }
                  className="h-12 w-full rounded-xl border border-[var(--color-border)] px-4 text-sm focus:border-[var(--color-deep-slate-blue)]/30 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
                    HTML body
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    Focused HTML editing with line numbers and syntax highlighting.
                  </p>
                </div>
                <div className="text-xs text-[var(--color-text-secondary)]">
                  Tab indents. Enter preserves indentation.
                </div>
              </div>

              <HtmlEditor
                value={draft.draftHtml}
                onChange={(next) =>
                  setDraft((current) =>
                    current ? { ...current, draftHtml: next } : current,
                  )
                }
                onFocus={() => setActiveField("html")}
                onKeyDown={handleHtmlEditorKeyDown}
                textareaRef={htmlRef}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
              <div className="rounded-[24px] border border-[var(--color-border)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-medium text-[var(--color-text-primary)]">
                      Template variables
                    </h3>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      Click a variable to insert it into the active field.
                    </p>
                  </div>
                  <Sparkles className="h-4 w-4 text-[var(--color-text-secondary)]" />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedTemplate.variable_definitions.map((variable) => {
                    const token = `{{${variable.key}}}`;

                    return (
                      <button
                        key={variable.key}
                        type="button"
                        onClick={() => {
                          switch (activeField) {
                            case "subject":
                              insertAtCursor(subjectRef.current, draft.draftSubject, (next) =>
                                setDraft((current) =>
                                  current ? { ...current, draftSubject: next } : current,
                                ), token);
                              return;
                            case "preheader":
                              insertAtCursor(preheaderRef.current, draft.draftPreheader, (next) =>
                                setDraft((current) =>
                                  current ? { ...current, draftPreheader: next } : current,
                                ), token);
                              return;
                            case "sampleData":
                              return;
                            case "html":
                            default:
                              insertAtCursor(htmlRef.current, draft.draftHtml, (next) =>
                                setDraft((current) =>
                                  current ? { ...current, draftHtml: next } : current,
                                ), token);
                          }
                        }}
                        className="rounded-full border border-[var(--color-deep-slate-blue)]/15 bg-[var(--color-deep-slate-blue)]/5 px-3 py-1.5 text-sm font-medium text-[var(--color-deep-slate-blue)]"
                        title={variable.description}
                      >
                        {token}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 space-y-2 text-sm text-[var(--color-text-secondary)]">
                  {selectedTemplate.variable_definitions.map((variable) => (
                    <p key={variable.key}>
                      <span className="font-medium text-[var(--color-text-primary)]">
                        {`{{${variable.key}}}`}
                      </span>{" "}
                      {variable.description}
                    </p>
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-[var(--color-border)] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-medium text-[var(--color-text-primary)]">
                      Preview sample data
                    </h3>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      Example values used in the live preview.
                    </p>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={handleFormatSampleData}>
                    Format JSON
                  </Button>
                </div>

                <textarea
                  ref={sampleDataRef}
                  rows={11}
                  value={draft.sampleDataText}
                  onFocus={() => setActiveField("sampleData")}
                  onChange={(event) =>
                    setDraft((current) =>
                      current ? { ...current, sampleDataText: event.target.value } : current,
                    )
                  }
                  className="mt-4 min-h-[16rem] w-full rounded-2xl border border-[var(--color-border)] bg-slate-950 px-4 py-3 font-mono text-[13px] leading-6 text-slate-100 focus:border-[var(--color-deep-slate-blue)]/40 focus:outline-none focus:ring-2 focus:ring-[var(--color-deep-slate-blue)]/10"
                  spellCheck={false}
                />
                {parsedSampleData.error ? (
                  <p className="mt-2 text-sm text-[var(--color-rejected)]">{parsedSampleData.error}</p>
                ) : null}
              </div>
            </div>

            <div className="rounded-[24px] border border-[var(--color-border)] p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h3 className="font-medium text-[var(--color-text-primary)]">Category policy</h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Control whether this template is active and whether it overrides global provider routing.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-[220px_auto]">
                  <Select
                    value={selectedTemplate.provider_override ?? ""}
                    onChange={(event) =>
                      void handlePolicyUpdate({
                        provider_override: event.target.value
                          ? (event.target.value as EmailNotificationSettings["provider_override"])
                          : null,
                      })
                    }
                    options={[
                      { value: "", label: "Use global routing" },
                      { value: "ses", label: "Amazon SES" },
                      { value: "brevo", label: "Brevo" },
                      { value: "mailgun", label: "Mailgun" },
                    ]}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() =>
                      void handlePolicyUpdate({ is_enabled: !selectedTemplate.is_enabled })
                    }
                    isLoading={isSaving}
                  >
                    {selectedTemplate.is_enabled ? "Pause category" : "Resume category"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface-alt,#FAFAFA)] p-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-medium text-[var(--color-text-primary)]">
                  {validationIssues.length
                    ? `Fix ${validationIssues.length} issue${validationIssues.length > 1 ? "s" : ""} before publishing`
                    : isDirty
                      ? "Unsaved changes"
                      : "All changes saved"}
                </p>
                {validationIssues.length ? (
                  <p className="mt-1 text-sm text-[var(--color-rejected)]">
                    {validationIssues[0]}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                    Draft saves preserve your current HTML editor state.
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => void handleSave(false)}
                  isLoading={isSaving}
                  disabled={!isDirty || Boolean(parsedSampleData.error)}
                >
                  Save draft
                </Button>
                <Button
                  type="button"
                  onClick={() => void handleSave(true)}
                  isLoading={isSaving}
                  disabled={!isDirty || validationIssues.length > 0}
                >
                  Publish changes
                </Button>
              </div>
            </div>
          </section>

          <aside className="min-w-0 space-y-4 rounded-[28px] border border-[var(--color-border)] bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-5 shadow-sm xl:col-span-2 2xl:col-span-1">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-medium text-[var(--color-text-primary)]">Live preview</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Rendered with the current draft and sample data.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-slate-100 p-1">
                <Button
                  type="button"
                  size="sm"
                  variant={previewMode === "desktop" ? "secondary" : "ghost"}
                  onClick={() => setPreviewMode("desktop")}
                >
                  <Laptop className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={previewMode === "mobile" ? "secondary" : "ghost"}
                  onClick={() => setPreviewMode("mobile")}
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="rounded-[24px] border border-[var(--color-border)] bg-white p-4 text-sm text-[var(--color-text-secondary)]">
              <p className="break-words font-semibold text-[var(--color-text-primary)]">Subj: {previewSubject || "No subject"}</p>
              <p className="mt-1 break-words">Preheader: {previewPreheader || "No preheader"}</p>
            </div>

            <div className="flex justify-center">
              <div
                className={`overflow-hidden rounded-[30px] border border-[var(--color-border)] bg-white shadow-[0_20px_50px_-34px_rgba(15,23,42,0.45)] ${
                  previewMode === "mobile" ? "w-[320px]" : "w-full"
                }`}
              >
                <div className="border-b border-[var(--color-border)] bg-slate-50 px-5 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-[var(--color-text-primary)]">
                        {previewSubject || "Untitled email"}
                      </p>
                      <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                        From: Renyt {"<updates@renyt.ng>"}
                      </p>
                    </div>
                    <ShieldCheck className="h-5 w-5 text-[var(--color-deep-slate-blue)]" />
                  </div>
                  <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
                    {previewPreheader || "No preview text"}
                  </p>
                </div>

                <div className="bg-[linear-gradient(180deg,#1e3a5f_0%,#16314f_100%)] px-6 py-8 text-center text-white">
                  <p className="text-2xl font-semibold tracking-tight">Renyt</p>
                  <p className="mt-2 text-sm text-blue-100">Transactional email preview</p>
                </div>

                <div className="max-h-[34rem] overflow-y-auto px-6 py-7">
                  <div
                    className="prose prose-sm max-w-none text-[var(--color-text-primary)]"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />

                  <div className="mt-8 rounded-[20px] bg-slate-50 px-4 py-4 text-xs text-[var(--color-text-secondary)]">
                    <p className="font-semibold uppercase tracking-[0.2em] text-[var(--color-text-primary)]">
                      Plain text fallback
                    </p>
                    <pre className="mt-3 whitespace-pre-wrap font-sans leading-6">
                      {previewText || "Plain text will be generated from the HTML body."}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </CardContent>
    </Card>
  );
}
