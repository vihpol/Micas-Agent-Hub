"use client";

import { useState } from "react";
import { HealthStatus } from "@/components/health-status";

const departments = ["Sales", "Operations", "Networking", "Marketing"] as const;

const outputCards = [
  "Agent activity will appear here",
  "Recommended next steps",
  "Draft output summary",
];

export default function Home() {
  const [selectedDepartment, setSelectedDepartment] =
    useState<(typeof departments)[number]>("Sales");

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#d7ebff_0%,#eef6ff_34%,#f8fbff_68%,#ffffff_100%)] text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-5 px-4 py-4 sm:px-6 lg:flex-row lg:p-6">
        <aside className="flex shrink-0 flex-col rounded-lg border border-blue-100 bg-white/90 p-4 shadow-sm shadow-blue-950/5 lg:w-72">
          <div className="border-b border-blue-100 pb-5">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              Micas
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-normal text-blue-950">
              Micas AgentHub
            </h1>
            <div className="mt-4">
              <HealthStatus />
            </div>
          </div>

          <nav className="mt-5 grid gap-2 sm:grid-cols-4 lg:grid-cols-1">
            {departments.map((department) => {
              const isSelected = selectedDepartment === department;

              return (
                <button
                  key={department}
                  type="button"
                  onClick={() => setSelectedDepartment(department)}
                  className={`flex min-h-12 items-center justify-between rounded-lg border px-4 text-left text-sm font-semibold transition ${
                    isSelected
                      ? "border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-900/20"
                      : "border-blue-100 bg-blue-50/60 text-blue-950 hover:border-blue-200 hover:bg-blue-100"
                  }`}
                >
                  <span>{department}</span>
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      isSelected ? "bg-white" : "bg-blue-300"
                    }`}
                  />
                </button>
              );
            })}
          </nav>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col rounded-lg border border-blue-100 bg-white/95 shadow-sm shadow-blue-950/5">
          <header className="border-b border-blue-100 px-5 py-5 sm:px-7">
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
              Department
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal text-blue-950 sm:text-4xl">
              {selectedDepartment}
            </h2>
          </header>

          <div className="grid flex-1 gap-5 p-5 sm:p-7 xl:grid-cols-[minmax(0,0.92fr)_minmax(360px,1fr)]">
            <section className="flex flex-col">
              <label
                htmlFor="agent-request"
                className="text-sm font-semibold text-slate-800"
              >
                Request
              </label>
              <textarea
                id="agent-request"
                rows={12}
                placeholder={`Paste a ${selectedDepartment.toLowerCase()} request here...`}
                className="mt-3 min-h-72 resize-none rounded-lg border border-blue-100 bg-blue-50/50 px-4 py-4 text-base leading-7 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
              />
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  className="min-h-12 rounded-lg bg-blue-700 px-6 text-sm font-semibold text-white shadow-sm shadow-blue-900/20 transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200"
                >
                  Run Agents
                </button>
              </div>
            </section>

            <section className="flex min-h-96 flex-col rounded-lg border border-blue-100 bg-slate-50/80 p-4">
              <div className="flex items-center justify-between border-b border-blue-100 pb-4">
                <h3 className="text-lg font-semibold text-blue-950">Output</h3>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  Empty
                </span>
              </div>

              <div className="grid flex-1 gap-3 pt-4">
                {outputCards.map((title) => (
                  <article
                    key={title}
                    className="rounded-lg border border-dashed border-blue-200 bg-white/80 p-4"
                  >
                    <p className="text-sm font-semibold text-slate-500">
                      {title}
                    </p>
                    <div className="mt-4 space-y-2">
                      <div className="h-2 rounded-full bg-blue-100" />
                      <div className="h-2 w-4/5 rounded-full bg-blue-50" />
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
