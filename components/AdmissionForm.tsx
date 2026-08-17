"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type PatientOption = {
  id: number;
  title: string | null;
  firstName: string;
  lastName: string;
  birthNumber: string;
  insuranceCompany: string;
};

type AdmissionMode = "existing" | "new";

type Props = {
  departmentId: number;
  patients: PatientOption[];
};

const inputClassName =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15";

function localDateTimeValue() {
  const now = new Date();
  const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);

  return localTime.toISOString().slice(0, 16);
}

export default function AdmissionForm({ departmentId, patients }: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<AdmissionMode>("existing");
  const [search, setSearch] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(
    null
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const filteredPatients = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase("cs-CZ");

    if (!normalizedSearch) {
      return patients;
    }

    return patients.filter((patient) =>
      [patient.firstName, patient.lastName, patient.birthNumber]
        .join(" ")
        .toLocaleLowerCase("cs-CZ")
        .includes(normalizedSearch)
    );
  }, [patients, search]);

  function changeMode(nextMode: AdmissionMode) {
    setMode(nextMode);
    setError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (mode === "existing" && selectedPatientId === null) {
      setError("Vyberte existujícího pacienta.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const startAtValue = String(formData.get("startAt") ?? "");
    const startAt = new Date(startAtValue);

    if (!startAtValue || Number.isNaN(startAt.getTime())) {
      setError("Zadejte platné datum a čas přijetí.");
      return;
    }

    const payload = {
      mode,
      patientId: mode === "existing" ? selectedPatientId : undefined,
      title: mode === "new" ? formData.get("title") : undefined,
      firstName: mode === "new" ? formData.get("firstName") : undefined,
      lastName: mode === "new" ? formData.get("lastName") : undefined,
      birthNumber: mode === "new" ? formData.get("birthNumber") : undefined,
      insuranceCompany:
        mode === "new" ? formData.get("insuranceCompany") : undefined,
      startAt: startAt.toISOString(),
      diagnosis: formData.get("diagnosis"),
    };

    setLoading(true);

    try {
      const response = await fetch(`/api/departments/${departmentId}/admissions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Přijetí pacienta se nezdařilo.");
        return;
      }

      router.push(`/hospitalizations/${data.hospitalizationId}`);
      router.refresh();
    } catch {
      setError("Při přijímání pacienta došlo k chybě.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Pacient</h2>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => changeMode("existing")}
            className={`rounded-lg border px-4 py-3 text-left text-sm font-medium transition ${
              mode === "existing"
                ? "border-teal-700 bg-teal-700 text-white"
                : "border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50"
            }`}
          >
            Existující pacient
          </button>

          <button
            type="button"
            onClick={() => changeMode("new")}
            className={`rounded-lg border px-4 py-3 text-left text-sm font-medium transition ${
              mode === "new"
                ? "border-teal-700 bg-teal-700 text-white"
                : "border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50"
            }`}
          >
            Nový pacient
          </button>
        </div>

        {mode === "existing" ? (
          <div className="mt-5">
            <label
              htmlFor="patientSearch"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Vyhledat pacienta
            </label>
            <input
              id="patientSearch"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Jméno, příjmení nebo rodné číslo"
              className={inputClassName}
            />

            <div className="mt-3 max-h-80 space-y-2 overflow-y-auto">
              {filteredPatients.length === 0 ? (
                <p className="rounded-lg border border-slate-200 p-4 text-sm text-slate-500">
                  Nebyl nalezen žádný pacient.
                </p>
              ) : (
                filteredPatients.map((patient) => (
                  <label
                    key={patient.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition ${
                      selectedPatientId === patient.id
                        ? "border-teal-700 bg-teal-50/50"
                        : "border-slate-200 hover:border-slate-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="patientId"
                      value={patient.id}
                      checked={selectedPatientId === patient.id}
                      onChange={() => setSelectedPatientId(patient.id)}
                      className="mt-1"
                    />
                    <span>
                      <span className="block font-medium text-slate-900">
                        {patient.title && `${patient.title} `}
                        {patient.firstName} {patient.lastName}
                      </span>
                      <span className="mt-1 block text-sm text-slate-500">
                        RČ: {patient.birthNumber} · {patient.insuranceCompany}
                      </span>
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Titul" name="title" />
            <Field label="Jméno" name="firstName" required />
            <Field label="Příjmení" name="lastName" required />
            <Field label="Rodné číslo" name="birthNumber" required />
            <Field
              label="Pojišťovna"
              name="insuranceCompany"
              required
              className="sm:col-span-2"
            />
          </div>
        )}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Informace o hospitalizaci
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field
            label="Datum a čas přijetí"
            name="startAt"
            type="datetime-local"
            defaultValue={localDateTimeValue()}
            required
          />
          <div className="sm:col-span-2">
            <label
              htmlFor="diagnosis"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Diagnóza
            </label>
            <textarea
              id="diagnosis"
              name="diagnosis"
              rows={4}
              className={inputClassName}
              required
            />
          </div>
        </div>
      </section>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-3">
        <Link
          href={`/departments/${departmentId}`}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
        >
          Zrušit
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:opacity-50"
        >
          {loading ? "Přijímám..." : "Přijmout pacienta"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  defaultValue,
  className,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label
        htmlFor={name}
        className="mb-1.5 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        className={inputClassName}
        required={required}
      />
    </div>
  );
}
