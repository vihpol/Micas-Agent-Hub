"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { HealthStatus } from "@/components/health-status";

const departments = [
  {
    name: "Sales",
    icon: "sales",
    description:
      "Qualify leads, prepare account notes, and turn requests into next steps.",
  },
  {
    name: "Operations",
    icon: "operations",
    description:
      "Summarize workflows, route tasks, and organize internal requests.",
  },
  {
    name: "Networking",
    icon: "networking",
    description:
      "Review infrastructure needs, draft checks, and outline follow-up actions.",
  },
  {
    name: "Marketing",
    icon: "marketing",
    description: "Shape campaign briefs, messaging, and content requests.",
  },
] as const;

const outputCards = [
  {
    title: "Summary",
    text: "Run agents to generate a concise overview of the request.",
  },
  {
    title: "Missing Information",
    text: "Gaps and details needed before acting will be listed here.",
  },
  {
    title: "Recommended Next Steps",
    text: "Suggested follow-up actions will be organized here.",
  },
  {
    title: "Draft Output",
    text: "Generated replies, plans, or working drafts will show here.",
  },
  {
    title: "Assumptions",
    text: "Important assumptions behind the response will be captured here.",
  },
  {
    title: "Agent Trace",
    text: "The agent sequence will appear after a run.",
  },
];

const outputTypes = [
  "Summary",
  "Reply Draft",
  "Checklist",
  "Follow-up Questions",
  "Action Plan",
] as const;

type DepartmentName = (typeof departments)[number]["name"];
type DepartmentIconName = (typeof departments)[number]["icon"];
type OutputType = (typeof outputTypes)[number];

type AgentTraceItem = {
  agent: string;
  role: string;
  output: string;
};

type AnalyzeResponse = {
  summary: string;
  analysis: string;
  missing_information: string[];
  recommended_next_steps: string[];
  draft_output: string;
  assumptions: string[];
  agent_trace: AgentTraceItem[];
};

export default function Home() {
  const [selectedDepartment, setSelectedDepartment] =
    useState<DepartmentName>("Sales");
  const [selectedOutputType, setSelectedOutputType] =
    useState<OutputType>("Summary");
  const [requestText, setRequestText] = useState("");
  const [analysisResult, setAnalysisResult] = useState<AnalyzeResponse | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [copiedDraft, setCopiedDraft] = useState(false);

  const activeDepartment =
    departments.find((department) => department.name === selectedDepartment) ??
    departments[0];
  const isRequestEmpty = requestText.trim().length === 0;
  const requestWordCount = requestText.trim()
    ? requestText.trim().split(/\s+/).length
    : 0;

  async function handleRunAgents() {
    if (isRequestEmpty || isLoading) {
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setCopiedDraft(false);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
      const response = await fetch(`${apiUrl}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: selectedDepartment,
          output_type: selectedOutputType,
          request: requestText,
        }),
      });

      if (!response.ok) {
        throw new Error("Backend analyze request failed");
      }

      const result = (await response.json()) as AnalyzeResponse;
      setAnalysisResult(result);
    } catch {
      setErrorMessage(
        "Could not connect to the backend. Check that FastAPI is running and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCopyDraft() {
    if (!analysisResult?.draft_output) {
      return;
    }

    let didCopy = false;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(analysisResult.draft_output);
        didCopy = true;
      }
    } catch {
      didCopy = false;
    }

    if (!didCopy) {
      const textarea = document.createElement("textarea");
      textarea.value = analysisResult.draft_output;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    setCopiedDraft(true);
    window.setTimeout(() => setCopiedDraft(false), 1800);
  }

  return (
    <main className="min-h-screen bg-[color:var(--micas-ice)] text-[color:var(--micas-ink)]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:p-6">
        <aside className="flex shrink-0 flex-col rounded-xl border border-[color:var(--micas-line)] bg-white shadow-[0_18px_70px_rgba(10,47,95,0.08)] lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-80">
          <div className="border-b border-[color:var(--micas-line)] p-5">
            <div className="rounded-xl bg-[linear-gradient(145deg,var(--micas-navy),var(--micas-blue))] p-5 text-white shadow-[0_14px_36px_rgba(0,103,177,0.22)]">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">
                  Micas
                </p>
                <span className="rounded-full bg-white/14 px-2.5 py-1 text-[11px] font-semibold text-blue-50">
                  Internal
                </span>
              </div>
              <h1 className="mt-3 text-2xl font-semibold leading-tight tracking-normal">
                Micas AgentHub
              </h1>
              <div className="mt-5 rounded-lg bg-white/12 px-3 py-2.5 ring-1 ring-white/10">
                <HealthStatus />
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 p-4">
            <div className="flex items-center justify-between px-1">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Departments
              </p>
              <span className="text-xs font-medium text-slate-400">
                {departments.length} teams
              </span>
            </div>
            <nav className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {departments.map((department) => {
                const isSelected = selectedDepartment === department.name;

                return (
                  <button
                    key={department.name}
                    type="button"
                    onClick={() => setSelectedDepartment(department.name)}
                    className={`group relative overflow-hidden rounded-xl border p-3.5 text-left transition ${
                      isSelected
                        ? "border-[color:var(--micas-sky)] bg-[color:var(--micas-soft-blue)] shadow-[0_10px_30px_rgba(0,103,177,0.12)]"
                        : "border-transparent bg-white text-slate-700 hover:border-[color:var(--micas-line)] hover:bg-blue-50/60"
                    }`}
                    aria-pressed={isSelected}
                  >
                    {isSelected ? (
                      <span className="absolute inset-y-3 left-0 w-1 rounded-r-full bg-[color:var(--micas-blue)]" />
                    ) : null}
                    <span className="flex items-start gap-3">
                      <DepartmentIcon
                        name={department.icon}
                        active={isSelected}
                      />
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block text-sm font-semibold ${
                            isSelected
                              ? "text-[color:var(--micas-navy)]"
                              : "text-slate-800"
                          }`}
                        >
                          {department.name}
                        </span>
                        <span className="mt-1.5 block text-xs leading-5 text-slate-500">
                          {department.description}
                        </span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-[color:var(--micas-line)] bg-white shadow-[0_18px_70px_rgba(10,47,95,0.08)]">
          <header className="border-b border-[color:var(--micas-line)] bg-white px-5 py-5 sm:px-7">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-start gap-4">
                <DepartmentIcon name={activeDepartment.icon} active large />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--micas-blue)]">
                    Active Department
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-normal text-[color:var(--micas-navy)] sm:text-4xl">
                    {activeDepartment.name}
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    {activeDepartment.description}
                  </p>
                </div>
              </div>
              <div className="grid gap-2 rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-sm text-[color:var(--micas-navy)] sm:grid-cols-3 xl:min-w-[420px]">
                <StatPill label="Mode" value="Mocked" />
                <StatPill label="Output" value={selectedOutputType} />
                <StatPill label="Words" value={String(requestWordCount)} />
              </div>
            </div>
          </header>

          <div className="grid flex-1 gap-5 bg-[linear-gradient(180deg,#f8fbff_0%,#eef7ff_100%)] p-4 sm:p-6 xl:grid-cols-[minmax(340px,0.88fr)_minmax(480px,1.12fr)]">
            <section className="flex flex-col rounded-xl border border-[color:var(--micas-line)] bg-white p-4 shadow-sm shadow-blue-950/5 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <label
                    htmlFor="agent-request"
                    className="text-base font-semibold text-slate-950"
                  >
                    Paste a customer email, internal request, or technical issue
                  </label>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Keep the original wording intact so the mocked workflow can
                    preserve context.
                  </p>
                </div>
                <span className="w-fit rounded-full bg-[color:var(--micas-soft-blue)] px-3 py-1 text-xs font-semibold text-[color:var(--micas-blue)]">
                  No backend change
                </span>
              </div>

              <textarea
                id="agent-request"
                rows={12}
                value={requestText}
                onChange={(event) => setRequestText(event.target.value)}
                placeholder={`Example: Paste a ${activeDepartment.name.toLowerCase()} email, internal request, or technical issue here...`}
                className="mt-4 min-h-72 flex-1 resize-none rounded-xl border border-blue-100 bg-blue-50/30 px-4 py-4 text-base leading-7 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[color:var(--micas-sky)] focus:bg-white focus:ring-4 focus:ring-blue-100"
              />

              <div className="mt-4 rounded-xl border border-blue-100 bg-slate-50/70 p-3">
                <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                  <div>
                    <label
                      htmlFor="output-type"
                      className="text-sm font-semibold text-slate-800"
                    >
                      Output type
                    </label>
                    <select
                      id="output-type"
                      value={selectedOutputType}
                      onChange={(event) =>
                        setSelectedOutputType(event.target.value as OutputType)
                      }
                      className="mt-2 min-h-12 w-full rounded-lg border border-blue-100 bg-white px-3 text-sm font-medium text-slate-900 outline-none transition focus:border-[color:var(--micas-sky)] focus:ring-4 focus:ring-blue-100"
                    >
                      {outputTypes.map((outputType) => (
                        <option key={outputType} value={outputType}>
                          {outputType}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={handleRunAgents}
                    disabled={isRequestEmpty || isLoading}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[color:var(--micas-blue)] px-6 text-sm font-semibold text-white shadow-sm shadow-blue-900/20 transition hover:bg-[color:var(--micas-navy)] focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
                  >
                    {isLoading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        Running
                      </>
                    ) : (
                      "Run Agents"
                    )}
                  </button>
                </div>
                <div className="mt-3 min-h-5">
                  {errorMessage ? (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold leading-5 text-red-700">
                      {errorMessage}
                    </p>
                  ) : (
                    <p className="text-xs leading-5 text-slate-500">
                      {isRequestEmpty
                        ? "Add a request to enable the agent workflow."
                        : `Ready to generate a ${selectedOutputType.toLowerCase()} for ${selectedDepartment}.`}
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section className="flex min-h-[640px] flex-col rounded-xl border border-[color:var(--micas-line)] bg-white p-4 shadow-sm shadow-blue-950/5 sm:p-5">
              <div className="flex flex-col gap-3 border-b border-blue-100 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-[color:var(--micas-navy)]">
                    Output Workspace
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Results from the existing backend analyze endpoint appear
                    here.
                  </p>
                </div>
                <StatusBadge loading={isLoading} ready={Boolean(analysisResult)} />
              </div>

              <div className="grid flex-1 gap-3 pt-4 lg:grid-cols-2">
                {!analysisResult && !isLoading ? (
                  <div className="lg:col-span-2">
                    <EmptyState />
                  </div>
                ) : null}

                <OutputCard
                  title="Summary"
                  placeholder={outputCards[0].text}
                  loading={isLoading}
                >
                  {analysisResult ? (
                    <div className="space-y-3">
                      <p>{analysisResult.summary}</p>
                      <div className="rounded-lg border border-blue-100 bg-blue-50/70 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--micas-blue)]">
                          Analysis
                        </p>
                        <p className="mt-1">{analysisResult.analysis}</p>
                      </div>
                    </div>
                  ) : null}
                </OutputCard>
                <OutputCard
                  title="Missing Information"
                  placeholder={outputCards[1].text}
                  loading={isLoading}
                >
                  {analysisResult ? (
                    <ListItems items={analysisResult.missing_information} />
                  ) : null}
                </OutputCard>
                <OutputCard
                  title="Recommended Next Steps"
                  placeholder={outputCards[2].text}
                  loading={isLoading}
                >
                  {analysisResult ? (
                    <ListItems items={analysisResult.recommended_next_steps} />
                  ) : null}
                </OutputCard>
                <OutputCard
                  title="Draft Output"
                  placeholder={outputCards[3].text}
                  loading={isLoading}
                  action={
                    analysisResult?.draft_output ? (
                      <button
                        type="button"
                        onClick={handleCopyDraft}
                        className="inline-flex items-center gap-2 rounded-lg border border-blue-100 bg-white px-3 py-1.5 text-xs font-semibold text-[color:var(--micas-blue)] shadow-sm transition hover:border-[color:var(--micas-sky)] hover:bg-blue-50"
                      >
                        <span className="relative h-3.5 w-3.5 rounded-[3px] border border-current before:absolute before:-right-1 before:-top-1 before:h-3.5 before:w-3.5 before:rounded-[3px] before:border before:border-current before:bg-white" />
                        {copiedDraft ? "Copied" : "Copy"}
                      </button>
                    ) : null
                  }
                >
                  {analysisResult?.draft_output}
                </OutputCard>
                <OutputCard
                  title="Assumptions"
                  placeholder={outputCards[4].text}
                  loading={isLoading}
                >
                  {analysisResult ? (
                    <ListItems items={analysisResult.assumptions} />
                  ) : null}
                </OutputCard>
                <OutputCard
                  title="Agent Trace"
                  placeholder={outputCards[5].text}
                  loading={isLoading}
                  className="lg:col-span-2"
                >
                  {analysisResult ? (
                    <AgentTimeline items={analysisResult.agent_trace} />
                  ) : null}
                </OutputCard>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function DepartmentIcon({
  name,
  active,
  large = false,
}: {
  name: DepartmentIconName;
  active?: boolean;
  large?: boolean;
}) {
  const baseClasses = large ? "h-12 w-12" : "h-10 w-10";
  const barClasses = active ? "bg-[color:var(--micas-blue)]" : "bg-slate-400";

  return (
    <span
      className={`${baseClasses} flex shrink-0 items-center justify-center rounded-xl border ${
        active
          ? "border-blue-200 bg-white text-[color:var(--micas-blue)] shadow-sm shadow-blue-900/10"
          : "border-slate-200 bg-slate-50 text-slate-500"
      }`}
      aria-hidden="true"
    >
      {name === "sales" ? (
        <span className="flex h-5 w-5 items-end gap-0.5">
          <span className={`h-2 w-1.5 rounded-sm ${barClasses}`} />
          <span className={`h-4 w-1.5 rounded-sm ${barClasses}`} />
          <span className={`h-5 w-1.5 rounded-sm ${barClasses}`} />
        </span>
      ) : null}
      {name === "operations" ? (
        <span className="grid h-5 w-5 grid-cols-2 gap-1">
          <span className={`rounded-sm ${barClasses}`} />
          <span className={`rounded-sm ${barClasses}`} />
          <span className={`rounded-sm ${barClasses}`} />
          <span className={`rounded-sm ${barClasses}`} />
        </span>
      ) : null}
      {name === "networking" ? (
        <span className="relative h-5 w-5">
          <span className={`absolute left-2 top-0 h-2 w-2 rounded-full ${barClasses}`} />
          <span className={`absolute bottom-0 left-0 h-2 w-2 rounded-full ${barClasses}`} />
          <span className={`absolute bottom-0 right-0 h-2 w-2 rounded-full ${barClasses}`} />
          <span className="absolute left-[9px] top-[7px] h-2.5 w-px rotate-45 bg-blue-200" />
          <span className="absolute right-[9px] top-[7px] h-2.5 w-px -rotate-45 bg-blue-200" />
        </span>
      ) : null}
      {name === "marketing" ? (
        <span className="relative h-5 w-5">
          <span className={`absolute left-0 top-1 h-3 w-4 rounded-sm ${barClasses}`} />
          <span className={`absolute right-0 top-0 h-5 w-1 rounded-sm ${barClasses}`} />
          <span className={`absolute bottom-0 left-1 h-1.5 w-1.5 rounded-full ${barClasses}`} />
        </span>
      ) : null}
    </span>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/80 px-3 py-2 ring-1 ring-blue-100">
      <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
        {label}
      </span>
      <span className="mt-1 block truncate text-sm font-semibold text-[color:var(--micas-navy)]">
        {value}
      </span>
    </div>
  );
}

function StatusBadge({ loading, ready }: { loading: boolean; ready: boolean }) {
  return (
    <span
      className={`w-fit rounded-full px-3 py-1.5 text-xs font-semibold ${
        ready
          ? "bg-green-50 text-green-700 ring-1 ring-green-200"
          : loading
            ? "bg-blue-50 text-[color:var(--micas-blue)] ring-1 ring-blue-100"
            : "bg-slate-100 text-slate-500 ring-1 ring-slate-200"
      }`}
    >
      {loading ? "Running workflow" : ready ? "Results ready" : "Waiting"}
    </span>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-blue-200 bg-[color:var(--micas-ice)] p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ring-blue-100">
          <span className="h-5 w-5 rounded-full border-4 border-[color:var(--micas-sky)] border-t-blue-100" />
        </div>
        <div>
          <p className="font-semibold text-[color:var(--micas-navy)]">
            Your workspace is ready
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            Paste a request, choose an output type, and run agents to populate
            these cards.
          </p>
        </div>
      </div>
    </div>
  );
}

function OutputCard({
  title,
  placeholder,
  loading,
  action,
  className = "",
  children,
}: {
  title: string;
  placeholder: string;
  loading: boolean;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const hasContent = Boolean(children);

  return (
    <article
      className={`rounded-xl border bg-white p-4 shadow-sm transition ${
        hasContent
          ? "border-blue-100 shadow-blue-950/5"
          : "border-dashed border-blue-200"
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 ring-1 ring-blue-100">
            <span className="h-2.5 w-2.5 rounded-full bg-[color:var(--micas-sky)]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-800">{title}</p>
            {hasContent ? (
              <div className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-600">
                {children}
              </div>
            ) : loading ? (
              <LoadingSkeleton />
            ) : (
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {placeholder}
              </p>
            )}
          </div>
        </div>
        {action}
      </div>
    </article>
  );
}

function LoadingSkeleton() {
  return (
    <div className="mt-4 animate-pulse space-y-3">
      <div className="h-2.5 rounded-full bg-blue-100" />
      <div className="h-2.5 w-5/6 rounded-full bg-blue-100" />
      <div className="h-2.5 w-2/3 rounded-full bg-blue-50" />
    </div>
  );
}

function ListItems({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5">
          <span className="mt-2 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-50 ring-1 ring-blue-100">
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--micas-blue)]" />
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function AgentTimeline({ items }: { items: AgentTraceItem[] }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-blue-100 bg-blue-50/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--micas-blue)]">
          Why multiple agents?
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Each agent handles a different responsibility: classify, extract,
          check missing info, draft, and review.
        </p>
      </div>

      <div className="grid gap-0">
        {items.map((item, index) => (
          <div
            key={`${item.agent}-${index}`}
            className="relative flex gap-3 pb-4 last:pb-0"
          >
            {index < items.length - 1 ? (
              <span className="absolute left-[15px] top-9 h-[calc(100%-1.25rem)] w-px bg-blue-200" />
            ) : null}
            <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-100 bg-white shadow-sm shadow-blue-900/10">
              <span className="h-3.5 w-3.5 rounded-full bg-[color:var(--micas-blue)]" />
            </span>
            <div className="min-w-0 flex-1 rounded-xl border border-blue-100 bg-white p-3.5 shadow-sm shadow-blue-950/5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800">
                    {agentDisplayName(item.agent)}
                  </p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--micas-blue)]">
                    {item.role}
                  </p>
                </div>
                <span className="w-fit rounded-full border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                  Completed
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {item.output}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function agentDisplayName(agent: string) {
  if (agent.includes("Specialist")) {
    return "Specialist Agent";
  }

  if (agent.includes("Risk")) {
    return "Risk Agent";
  }

  return agent;
}
