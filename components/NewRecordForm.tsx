"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  hospitalizationId: number;
  authorLogin: string;
  authorRole: "DOCTOR" | "NURSE";
};

const maxRecordTextLength = 5000;

export default function NewRecordForm({
  hospitalizationId,
  authorLogin,
  authorRole,
}: Props) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const normalizedText = text.trim();

    if (!normalizedText) {
      setError("Text zápisu je povinný.");
      return;
    }

    if (normalizedText.length > maxRecordTextLength) {
      setError("Text zápisu je příliš dlouhý.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/hospitalizations/${hospitalizationId}/records`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: normalizedText }),
        }
      );
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Zápis se nepodařilo uložit.");
        return;
      }

      setText("");
      router.refresh();
    } catch {
      setError("Při ukládání zápisu došlo k chybě.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-5 rounded-lg border border-slate-200 bg-slate-50/50 p-4"
    >
      <h3 className="font-semibold text-slate-900">Nový zápis</h3>
      <p className="mt-1 text-xs text-slate-500">
        Zápis bude uložen pod uživatelem {authorLogin} ({
          authorRole === "DOCTOR" ? "Lékař" : "Sestra"
        }).
      </p>

      <label htmlFor="recordText" className="sr-only">
        Text nového zápisu
      </label>
      <textarea
        id="recordText"
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={4}
        maxLength={maxRecordTextLength}
        placeholder="Zadejte text zápisu"
        className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "recordText-error" : undefined}
        required
      />

      {error && (
        <p id="recordText-error" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-3 flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:opacity-50"
        >
          {loading ? "Ukládám..." : "Přidat zápis"}
        </button>
      </div>
    </form>
  );
}
