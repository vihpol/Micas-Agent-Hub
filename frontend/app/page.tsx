import { HealthStatus } from "@/components/health-status";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#d7ebff_0%,#eef6ff_42%,#ffffff_100%)] px-6">
      <section className="w-full max-w-xl text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-blue-600">
          Micas
        </p>
        <h1 className="text-4xl font-semibold tracking-normal text-blue-950 sm:text-5xl">
          Micas AgentHub
        </h1>
        <div className="mt-8">
          <HealthStatus />
        </div>
      </section>
    </main>
  );
}
