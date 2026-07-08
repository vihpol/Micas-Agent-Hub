"use client";

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

export default function Home() {
  const [selectedDepartment, setSelectedDepartment] =
    useState<DepartmentName>("Sales");
  const [selectedOutputType, setSelectedOutputType] =
    useState<OutputType>("Summary");

  const activeDepartment =
    departments.find((department) => department.name === selectedDepartment) ??
    departments[0];

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
                    className="min-h-12 rounded-lg bg-[color:var(--micas-blue)] px-6 text-sm font-semibold text-white shadow-sm shadow-blue-900/20 transition hover:bg-[color:var(--micas-navy)] focus:outline-none focus:ring-4 focus:ring-blue-200"
                  >
                    Run Agents
                  </button>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Mocked frontend only. Selected output: {selectedOutputType}.
                </p>
              </div>
            </section>

            <section className="flex min-h-96 flex-col rounded-lg border border-[color:var(--micas-line)] bg-white p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4 border-b border-blue-100 pb-4">
                <div>
                  <h3 className="text-base font-semibold text-[color:var(--micas-navy)]">
                    Output
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Placeholder cards are ready for mocked agent results.
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                  Empty
                </span>
              </div>

              <div className="grid flex-1 gap-3 pt-4">
                {outputCards.map((card) => (
                  <article
                    key={card.title}
                    className="rounded-lg border border-dashed border-blue-200 bg-[color:var(--micas-ice)] p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[color:var(--micas-sky)]" />
                      <div>
                        <p className="text-sm font-semibold text-slate-700">
                          {card.title}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-slate-500">
                          {card.text}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="h-2 rounded-full bg-blue-100" />
                      <div className="h-2 w-3/5 rounded-full bg-blue-50" />
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
