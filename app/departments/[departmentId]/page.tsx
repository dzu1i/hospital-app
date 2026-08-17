import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import AuthenticatedHeader from "@/components/AuthenticatedHeader";

type Props = {
  params: Promise<{
    departmentId: string;
  }>;
};

export default async function DepartmentPage({ params }: Props) {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  const { departmentId } = await params;
  const id = Number(departmentId);

  if (!Number.isInteger(id)) {
    notFound();
  }

  const access = await prisma.userDepartment.findUnique({
    where: {
      userId_departmentId: {
        userId: session.userId,
        departmentId: id,
      },
    },
    include: {
      department: true,
    },
  });

  if (!access) {
    notFound();
  }

  const hospitalizations = await prisma.hospitalization.findMany({
    where: {
      departmentId: id,
      endAt: null,
    },
    include: {
      patient: true,
    },
    orderBy: {
      patient: {
        lastName: "asc",
      },
    },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <AuthenticatedHeader login={session.login} role={session.role} />
      <main className="px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <div>
          <Link
            href="/departments"
            className="text-sm font-medium text-slate-500 transition hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
          >
            ← Zpět na oddělení
          </Link>
        </div>

        <div className="mb-7 mt-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-teal-700">
              {access.department.code}
            </div>

            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              {access.department.name}
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              Aktuálně hospitalizovaní pacienti
            </p>
          </div>

          <Link
            href={`/departments/${id}/admit`}
            className="rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
          >
            Přijmout pacienta
          </Link>
        </div>

        {hospitalizations.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
            Na oddělení nejsou aktuálně hospitalizováni žádní pacienti.
          </div>
        ) : (
          <div className="space-y-3">
            {hospitalizations.map((hospitalization) => (
              <Link
                key={hospitalization.id}
                href={`/hospitalizations/${hospitalization.id}`}
                className="group block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-base font-semibold text-slate-900 group-hover:text-teal-800">
                      {hospitalization.patient.title &&
                        `${hospitalization.patient.title} `}
                      {hospitalization.patient.firstName}{" "}
                      {hospitalization.patient.lastName}
                    </div>

                    <div className="mt-1.5 text-sm text-slate-500">
                      R. č.: {hospitalization.patient.birthNumber}
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <div className="text-xs font-medium uppercase tracking-wide text-slate-400">Chorobopis</div>

                    <div className="mt-1 font-mono text-sm font-medium text-slate-700">
                      {hospitalization.medicalRecordNumber}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      </main>
    </div>
  );
}
