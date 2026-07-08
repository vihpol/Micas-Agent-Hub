import { HealthStatus } from "@/components/health-status";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <section className="w-full max-w-xl text-center">
        <p className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-500">
          Micas
        </p>
        <h1 className="text-4xl font-semibold tracking-normal text-slate-950 sm:text-5xl">
          Micas AgentHub
        </h1>
        <div className="mt-8">
          <HealthStatus />
        </div>
      </section>
    </main>
  );
}
