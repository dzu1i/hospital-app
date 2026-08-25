import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { formatDepartmentLabel } from "@/lib/format-department-label";
import AuthenticatedHeader from "@/components/AuthenticatedHeader";

export default async function DepartmentsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  const userDepartments = await prisma.userDepartment.findMany({
    where: {
      userId: session.userId,
    },
    include: {
      department: true,
    },
    orderBy: {
      department: {
        name: "asc",
      },
    },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <AuthenticatedHeader login={session.login} role={session.role} />
      <main className="px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-7">
            <p className="text-xs font-semibold uppercase tracking-widest text-teal-700">
              Dostupná oddělení
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              Výběr oddělení
            </h1>

            <p className="mt-2 text-sm text-slate-600">
              Vyberte oddělení, ke kterému chcete přistoupit.
            </p>
          </div>

          {userDepartments.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
            Nemáte přístup k žádnému oddělení.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {userDepartments.map(({ department }) => (
              <Link
                key={department.id}
                href={`/departments/${department.id}`}
                className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
              >
                <div className="text-lg font-semibold tracking-tight text-slate-900 group-hover:text-teal-800">
                  {formatDepartmentLabel(department.code, department.name)}
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
