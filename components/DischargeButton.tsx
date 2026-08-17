"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  hospitalizationId: number;
  departmentId: number;
  patientName: string;
};

function localDateTimeValue() {
  const now = new Date();
  const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);

  return localTime.toISOString().slice(0, 16);
}

export default function DischargeButton({
  hospitalizationId,
  departmentId,
  patientName,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [endAt, setEndAt] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function openConfirmation() {
    setEndAt(localDateTimeValue());
    setError("");
    setOpen(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const dischargeDate = new Date(endAt);

    if (!endAt || Number.isNaN(dischargeDate.getTime())) {
      setError("Zadejte platné datum a čas propuštění.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/hospitalizations/${hospitalizationId}/discharge`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ endAt: dischargeDate.toISOString() }),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Propuštění pacienta se nezdařilo.");
        return;
      }

      router.push(`/departments/${departmentId}`);
      router.refresh();
    } catch {
      setError("Při propouštění pacienta došlo k chybě.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openConfirmation}
        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
      >
        Propustit pacienta
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="discharge-title"
        >
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl"
          >
            <h2
              id="discharge-title"
              className="text-lg font-semibold text-slate-900"
            >
              Propuštění pacienta
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Opravdu chcete ukončit hospitalizaci pacienta/pacientky {patientName}?
            </p>

            <label
              htmlFor="endAt"
              className="mb-1.5 mt-5 block text-sm font-medium text-slate-700"
            >
              Datum a čas propuštění
            </label>
            <input
              id="endAt"
              type="datetime-local"
              value={endAt}
              onChange={(event) => setEndAt(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
              required
            />

            {error && (
              <p className="mt-3 text-sm text-red-600">{error}</p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 disabled:opacity-50"
              >
                Zrušit
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:opacity-50"
              >
                {loading ? "Propouštím..." : "Propustit"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
