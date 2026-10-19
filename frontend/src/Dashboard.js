// frontend/src/Dashboard.js

import { useEffect, useMemo, useState } from "react";
import { api } from "./api";
import Transactions from "./Transactions";

export default function Dashboard({ token }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        setErr("");
        const insights = await api("/ai/insights", {
          method: "POST",
          token,
          body: {},
        });
        setData(insights);
      } catch (e) {
        setErr(e.message);
      }
    })();
  }, [token, refresh]);

  const sortedCategoryEntries = useMemo(() => {
    if (!data?.categoryTotals) return [];
    return Object.entries(data.categoryTotals)
      .sort((a, b) => Number(b[1]) - Number(a[1]))
      .slice(0, 8);
  }, [data]);

  if (err) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="rounded-2xl border border-red-900/40 bg-red-950/30 p-5">
            <p className="text-red-200 font-medium">Something went wrong</p>
            <p className="mt-1 text-red-200/80 text-sm">{err}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-5xl px-4 py-10">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <p className="text-slate-300">Loading your insights…</p>
            <p className="mt-1 text-slate-500 text-sm">
              This should only take a moment.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const safeToSpend = Number(data.safeToSpendToday ?? 0);
  const totalSpent30d = Number(data.totalSpent30d ?? 0);
  const alerts = Array.isArray(data.alerts) ? data.alerts : [];
  const topLeak = data.topLeak || "";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-slate-400 text-sm">
              Calm, conservative guidance based on your last 30 days.
            </p>
          </div>

          <button
            onClick={() => setRefresh((r) => r + 1)}
            className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-2 text-sm text-slate-200 hover:bg-slate-900/70 active:scale-[0.99]"
          >
            Refresh
          </button>
        </div>

        {/* Hero */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-sm">
          <p className="text-sm text-slate-400">Safe to spend today</p>

          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="text-5xl font-bold tracking-tight">
              ${Number.isFinite(safeToSpend) ? safeToSpend.toFixed(0) : "0"}
            </div>

            <div className="text-slate-400 text-sm">
              last 30d spent:{" "}
              <span className="text-slate-200">
                ${Number.isFinite(totalSpent30d) ? totalSpent30d.toFixed(0) : "0"}
              </span>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <p className="text-slate-200 font-medium">AI summary</p>
            <p className="mt-1 text-slate-300 leading-relaxed">
              {data.summary || "No summary yet."}
            </p>
          </div>
        </div>

        {/* Grid */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {/* Alerts */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Alerts</h2>
              <span className="text-xs text-slate-400">
                {alerts.length} active
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {(alerts.length ? alerts : ["No alerts right now — keep it up."]).map(
                (a, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-slate-200"
                  >
                    {a}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Spending / Top Leak / Categories */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <h2 className="text-lg font-semibold">Spending</h2>

            <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <div className="flex items-center justify-between">
                <p className="text-slate-300">Last 30 days</p>
                <p className="text-slate-200 font-semibold">
                  ${Number.isFinite(totalSpent30d) ? totalSpent30d.toFixed(0) : "0"}
                </p>
              </div>

              <div className="mt-2 text-sm text-slate-400">
                Top leak:{" "}
                <span className="text-slate-200">
                  {topLeak || "Not enough data yet."}
                </span>
              </div>
            </div>

            <div className="mt-5">
              <h3 className="text-sm font-medium text-slate-200">
                Category totals
              </h3>

              <div className="mt-3 space-y-2">
                {sortedCategoryEntries.length ? (
                  sortedCategoryEntries.map(([cat, amt]) => (
                    <div
                      key={cat}
                      className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-2"
                    >
                      <span className="text-slate-200 capitalize">
                        {String(cat)}
                      </span>
                      <span className="text-slate-300">
                        ${Number(amt).toFixed(0)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-slate-400">
                    No category totals yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Transactions</h2>
            <p className="text-xs text-slate-400">
              Adding/deleting refreshes insights automatically.
            </p>
          </div>

          <Transactions
            token={token}
            onAdded={() => setRefresh((r) => r + 1)}
          />
        </div>

        {/* Footer */}
        <p className="mt-10 text-center text-xs text-slate-500">
          Numbers are deterministic. AI only explains.
        </p>
      </div>
    </div>
  );
}