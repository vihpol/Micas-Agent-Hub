"use client";

import { useEffect, useState } from "react";

type ConnectionState = "checking" | "connected" | "disconnected";

export function HealthStatus() {
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("checking");

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

    fetch(`${apiUrl}/health`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Backend health check failed");
        }

        return response.json() as Promise<{ status: string }>;
      })
      .then((body) => {
        setConnectionState(body.status === "ok" ? "connected" : "disconnected");
      })
      .catch(() => {
        setConnectionState("disconnected");
      });
  }, []);

  if (connectionState === "checking") {
    return (
      <p className="text-sm font-medium text-blue-100">
        Checking backend connection...
      </p>
    );
  }

  if (connectionState === "connected") {
    return (
      <p className="text-sm font-semibold text-white">
        Backend connected
      </p>
    );
  }

  return (
    <p className="text-sm font-semibold text-red-100">Backend disconnected</p>
  );
}
