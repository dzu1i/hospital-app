import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import DischargeButton from "@/components/DischargeButton";
import AuthenticatedHeader from "@/components/AuthenticatedHeader";

type Props = {
  params: Promise<{
    hospitalizationId: string;
  }>;
};

export default async function HospitalizationPage({ params }: Props) {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  const { hospitalizationId } = await params;
  const id = Number(hospitalizationId);

  if (!Number.isInteger(id)) {
    notFound();
  }

  const hospitalization = await prisma.hospitalization.findUnique({
    where: {
      id,
    },
    include: {
      patient: true,
      department: true,
      admittedBy: true,
      dischargedBy: true,
      medications: {
        orderBy: {
          createdAt: "desc",
        },
      },
      records: {
        where:
          session.role === "NURSE"
            ? {
                author: {
                  role: "NURSE",
                },
              }
            : undefined,
        include: {
          author: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!hospitalization) {
    notFound();
  }

  // Uživatel musí mít přístup k oddělení této hospitalizace
  const access = await prisma.userDepartment.findUnique({
    where: {
      userId_departmentId: {
        userId: session.userId,
        departmentId: hospitalization.departmentId,
      },
    },
  });

  if (!access) {
    notFound();
  }

  const patient = hospitalization.patient;

  return (
    <div className="min-h-screen bg-slate-50">
      <AuthenticatedHeader login={session.login} role={session.role} />
      <main className="px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl">
        <div>
            <Link
                href={`/departments/${hospitalization.departmentId}`}
                className="text-sm font-medium text-slate-500 transition hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            >
                ← Zpět na pacienty
            </Link>
        </div>

        <div className="mt-5">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-teal-700">
                {hospitalization.department.code} ·{" "}
                {hospitalization.department.name}
              </p>

              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                {patient.title && `${patient.title} `}
                {patient.firstName} {patient.lastName}
              </h1>
            </div>

            {hospitalization.endAt === null && (
              <DischargeButton
                hospitalizationId={hospitalization.id}
                departmentId={hospitalization.departmentId}
                patientName={`${patient.title ? `${patient.title} ` : ""}${
                  patient.firstName
                } ${patient.lastName}`}
              />
            )}
          </div>

          {/* Informace o pacientovi */}
          <section className="mb-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">
              Informace o pacientovi
            </h2>
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${hospitalization.endAt === null ? "bg-teal-50 text-teal-800" : "bg-slate-100 text-slate-600"}`}>
              {hospitalization.endAt === null ? "Aktivní hospitalizace" : "Ukončená hospitalizace"}
            </span>
            </div>

            <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
              <Info label="Rodné číslo" value={patient.birthNumber} />

              <Info
                label="Pojišťovna"
                value={patient.insuranceCompany}
              />

              <Info
                label="Číslo chorobopisu"
                value={hospitalization.medicalRecordNumber}
              />

              <Info
                label="Přijat"
                value={formatDateTime(hospitalization.startAt)}
              />

              <Info
                label="Přijetí provedl/a"
                value={hospitalization.admittedBy.login}
              />

              <Info
                label="Propuštěn"
                value={
                  hospitalization.endAt
                    ? formatDateTime(hospitalization.endAt)
                    : "Aktuálně hospitalizován"
                }
              />

              {hospitalization.endAt && hospitalization.dischargedBy && (
                <Info
                  label="Propuštění provedl/a"
                  value={hospitalization.dischargedBy.login}
                />
              )}

              <Info
                label="Diagnóza"
                value={hospitalization.diagnosis}
              />
            </div>

            <p className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-400">
              Záznam vytvořen:{" "}
              {formatDateTime(hospitalization.createdAt)}
            </p>
          </section>

          {/* Medikace */}
          <section className="mb-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              Medikace
            </h2>

            {hospitalization.medications.length === 0 ? (
              <p className="text-sm text-slate-500">
                Pacient nemá evidovanou medikaci.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {hospitalization.medications.map((medication) => (
                  <div
                    key={medication.id}
                    className="grid gap-2 py-4 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-6"
                  >
                    <div>
                    <div className="font-semibold text-slate-900">
                      {medication.drugName}
                    </div>

                    <div className="mt-1 text-sm text-slate-600">
                      {medication.schedule}
                    </div>
                    </div>

                    <div className="text-xs text-slate-400 sm:pt-0.5 sm:text-right">
                      První podání: {formatDateTime(medication.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Záznamy */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Záznamy
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {session.role === "DOCTOR"
                  ? "Lékařské a sesterské záznamy"
                  : "Sesterské záznamy"}
              </p>
            </div>

            {hospitalization.records.length === 0 ? (
              <p className="text-sm text-slate-500">
                Nejsou evidovány žádné záznamy.
              </p>
            ) : (
              <div className="space-y-4">
                {hospitalization.records.map((record) => (
                  <article
                    key={record.id}
                    className="rounded-lg border border-slate-200 bg-slate-50/40 p-4"
                  >
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                        {record.author.role === "DOCTOR"
                          ? "Lékařský záznam"
                          : "Sesterský záznam"}
                      </span>

                      <span className="text-xs text-slate-400">
                        {formatDateTime(record.createdAt)}
                      </span>
                    </div>

                    <p className="text-sm leading-6 text-slate-700">
                      {record.text}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
      </main>
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </div>

      <div className="mt-1 text-sm font-medium text-slate-800">
        {value}
      </div>
    </div>
  );
}

function formatDateTime(date: Date) {
  return date.toLocaleString("cs-CZ", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
