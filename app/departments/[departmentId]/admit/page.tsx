import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AdmissionForm from "@/components/AdmissionForm";
import AuthenticatedHeader from "@/components/AuthenticatedHeader";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{
    departmentId: string;
  }>;
};

export default async function AdmitPatientPage({ params }: Props) {
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

  const patients = await prisma.patient.findMany({
    select: {
      id: true,
      title: true,
      firstName: true,
      lastName: true,
      birthNumber: true,
      insuranceCompany: true,
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <AuthenticatedHeader login={session.login} role={session.role} />
      <main className="px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-4xl">
        <div>
          <Link
            href={`/departments/${id}`}
            className="text-sm font-medium text-slate-500 transition hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
          >
            ← Zpět na pacienty
          </Link>
        </div>

        <div className="mb-7 mt-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-teal-700">
            {access.department.code} · {access.department.name}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            Přijmout pacienta
          </h1>
        </div>

        <AdmissionForm departmentId={id} patients={patients} />
      </div>
      </main>
    </div>
  );
}
