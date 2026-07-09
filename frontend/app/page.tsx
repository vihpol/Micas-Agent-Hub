"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import { HealthStatus } from "@/components/health-status";

const departments = [
  {
    name: "Sales",
    description: "Qualify leads, prepare account notes, and turn requests into next steps.",
  },
  {
    name: "Operations",
    description: "Summarize workflows, route tasks, and organize internal requests.",
  },
  {
    name: "Networking",
    description: "Review infrastructure needs, draft checks, and outline follow-up actions.",
  },
  {
    name: "Marketing",
    description: "Shape campaign briefs, messaging, and content requests.",
  },
] as const;

const outputCards = [
  {
    title: "Summary",
    text: "A concise overview of the request will appear here.",
  },
  {
    title: "Missing Information",
    text: "Any gaps or details needed before acting will be listed here.",
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
    text: "Mocked agent routing and reasoning notes will appear here.",
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

  const activeDepartment =
    departments.find((department) => department.name === selectedDepartment) ??
    departments[0];
  const isRequestEmpty = requestText.trim().length === 0;

  async function handleRunAgents() {
    if (isRequestEmpty || isLoading) {
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

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

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,var(--micas-ice)_0%,#ffffff_42%,var(--micas-soft-blue)_100%)] text-[color:var(--micas-ink)]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:p-6">
        <aside className="flex shrink-0 flex-col rounded-lg border border-[color:var(--micas-line)] bg-white/95 p-4 shadow-[0_18px_60px_rgba(10,47,95,0.08)] lg:w-80">
          <div className="rounded-lg bg-[color:var(--micas-navy)] p-5 text-white">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-100">
              Micas
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-normal">
              Micas AgentHub
            </h1>
            <div className="mt-4 rounded-lg bg-white/10 px-3 py-2">
              <HealthStatus />
            </div>
          </div>

          <div className="mt-5">
            <p className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Departments
            </p>
            <nav className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {departments.map((department) => {
                const isSelected = selectedDepartment === department.name;

                return (
                  <button
                    key={department.name}
                    type="button"
                    onClick={() => setSelectedDepartment(department.name)}
                    className={`rounded-lg border p-4 text-left transition ${
                      isSelected
                        ? "border-[color:var(--micas-blue)] bg-[color:var(--micas-soft-blue)] shadow-sm shadow-blue-950/10"
                        : "border-transparent bg-white text-slate-700 hover:border-[color:var(--micas-line)] hover:bg-blue-50/70"
                    }`}
                    aria-pressed={isSelected}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span
                        className={`text-sm font-semibold ${
                          isSelected
                            ? "text-[color:var(--micas-navy)]"
                            : "text-slate-800"
                        }`}
                      >
                        {department.name}
                      </span>
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${
                          isSelected
                            ? "bg-[color:var(--micas-blue)]"
                            : "bg-slate-300"
                        }`}
                      />
                    </span>
                    <span className="mt-2 block text-xs leading-5 text-slate-500">
                      {department.description}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border border-[color:var(--micas-line)] bg-white shadow-[0_18px_60px_rgba(10,47,95,0.08)]">
          <header className="border-b border-[color:var(--micas-line)] bg-white px-5 py-5 sm:px-7">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--micas-blue)]">
                  Active Department
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-normal text-[color:var(--micas-navy)] sm:text-4xl">
                  {activeDepartment.name}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
                  {activeDepartment.description}
                </p>
              </div>
              <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-[color:var(--micas-navy)]">
                <span className="block font-semibold">Ready for input</span>
                <span className="mt-1 block text-xs text-slate-500">
                  Choose an output type, then run when agents are connected.
                </span>
              </div>
            </div>
          </header>

          <div className="grid flex-1 gap-5 bg-[color:var(--micas-ice)] p-4 sm:p-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(360px,1fr)]">
            <section className="flex flex-col rounded-lg border border-[color:var(--micas-line)] bg-white p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <label
                    htmlFor="agent-request"
                    className="text-base font-semibold text-slate-900"
                  >
                    Paste a customer email, internal request, or technical issue
                  </label>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Keep the original wording intact so the mocked agent workspace can preserve context.
                  </p>
                </div>
                <span className="rounded-full bg-[color:var(--micas-soft-blue)] px-3 py-1 text-xs font-semibold text-[color:var(--micas-blue)]">
                  Mocked
                </span>
              </div>

              <textarea
                id="agent-request"
                rows={12}
                value={requestText}
                onChange={(event) => setRequestText(event.target.value)}
                placeholder={`Example: Paste a ${activeDepartment.name.toLowerCase()} email, internal request, or technical issue here...`}
                className="mt-4 min-h-80 resize-none rounded-lg border border-blue-100 bg-blue-50/40 px-4 py-4 text-base leading-7 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[color:var(--micas-sky)] focus:bg-white focus:ring-4 focus:ring-blue-100"
              />

              <div className="mt-4 rounded-lg border border-blue-100 bg-white p-3">
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
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
                      className="mt-2 min-h-12 w-full rounded-lg border border-blue-100 bg-blue-50/50 px-3 text-sm font-medium text-slate-900 outline-none transition focus:border-[color:var(--micas-sky)] focus:bg-white focus:ring-4 focus:ring-blue-100"
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
                    className="min-h-12 rounded-lg bg-[color:var(--micas-blue)] px-6 text-sm font-semibold text-white shadow-sm shadow-blue-900/20 transition hover:bg-[color:var(--micas-navy)] focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
                  >
                    {isLoading ? "Running..." : "Run Agents"}
                  </button>
                </div>
                <div className="mt-3 min-h-5">
                  {errorMessage ? (
                    <p className="text-xs font-semibold leading-5 text-red-600">
                      {errorMessage}
                    </p>
                  ) : (
                    <p className="text-xs leading-5 text-slate-500">
                      Selected output: {selectedOutputType}.
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section className="flex min-h-96 flex-col rounded-lg border border-[color:var(--micas-line)] bg-white p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4 border-b border-blue-100 pb-4">
                <div>
                  <h3 className="text-base font-semibold text-[color:var(--micas-navy)]">
                    Output
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Results from the backend analyze endpoint appear here.
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  analysisResult
                    ? "bg-green-50 text-green-700"
                    : isLoading
                      ? "bg-blue-50 text-[color:var(--micas-blue)]"
                      : "bg-slate-100 text-slate-500"
                }`}>
                  {isLoading ? "Running" : analysisResult ? "Ready" : "Empty"}
                </span>
              </div>

              <div className="grid flex-1 gap-3 pt-4">
                <OutputCard
                  title="Summary"
                  placeholder={outputCards[0].text}
                  loading={isLoading}
                >
                  {analysisResult ? (
                    <div className="space-y-3">
                      <p>{analysisResult.summary}</p>
                      <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--micas-blue)]">
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

function OutputCard({
  title,
  placeholder,
  loading,
  children,
}: {
  title: string;
  placeholder: string;
  loading: boolean;
  children: ReactNode;
}) {
  const hasContent = Boolean(children);

  return (
    <article
      className={`rounded-lg border p-4 ${
        hasContent
          ? "border-blue-100 bg-white"
          : "border-dashed border-blue-200 bg-[color:var(--micas-ice)]"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[color:var(--micas-sky)]" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-700">{title}</p>
          {hasContent ? (
            <div className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
              {children}
            </div>
          ) : (
            <p className="mt-1 text-sm leading-6 text-slate-500">
              {loading ? "Waiting for backend response..." : placeholder}
            </p>
          )}
        </div>
      </div>
      {!hasContent ? (
        <div className="mt-4 space-y-2">
          <div className="h-2 rounded-full bg-blue-100" />
          <div className="h-2 w-3/5 rounded-full bg-blue-50" />
        </div>
      ) : null}
    </article>
  );
}

function ListItems({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--micas-blue)]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function AgentTimeline({ items }: { items: AgentTraceItem[] }) {
  return (
    <div className="space-y-0">
      {items.map((item, index) => (
        <div key={`${item.agent}-${index}`} className="relative flex gap-3 pb-4 last:pb-0">
          {index < items.length - 1 ? (
            <span className="absolute left-[5px] top-4 h-full w-px bg-blue-100" />
          ) : null}
          <span className="relative mt-1 h-3 w-3 shrink-0 rounded-full border-2 border-white bg-[color:var(--micas-blue)] shadow-sm shadow-blue-900/20" />
          <div className="min-w-0">
            <p className="font-semibold text-slate-800">{item.agent}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[color:var(--micas-blue)]">
              {item.role}
            </p>
            <p className="mt-1 text-sm leading-6 text-slate-600">{item.output}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
