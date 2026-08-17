import { NextResponse } from "next/server";
import { Prisma } from "@/app/generated/prisma/client";
import { getSession } from "@/lib/auth";
import { generateNextMedicalRecordNumber } from "@/lib/medical-record-number";
import { prisma } from "@/lib/prisma";

type AdmissionBody = {
  mode?: unknown;
  patientId?: unknown;
  title?: unknown;
  firstName?: unknown;
  lastName?: unknown;
  birthNumber?: unknown;
  insuranceCompany?: unknown;
  startAt?: unknown;
  diagnosis?: unknown;
};

function requiredString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function isMedicalRecordNumberConflict(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    JSON.stringify(error.meta ?? {}).includes("medicalRecordNumber")
  );
}

const medicalRecordNumberAttempts = 2;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ departmentId: string }> }
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: "Pro tuto akci se musíte přihlásit." },
      { status: 401 }
    );
  }

  const { departmentId } = await params;
  const id = Number(departmentId);

  if (!Number.isInteger(id)) {
    return NextResponse.json(
      { error: "Neplatné oddělení." },
      { status: 400 }
    );
  }

  const access = await prisma.userDepartment.findUnique({
    where: {
      userId_departmentId: {
        userId: session.userId,
        departmentId: id,
      },
    },
  });

  if (!access) {
    return NextResponse.json(
      { error: "K tomuto oddělení nemáte přístup." },
      { status: 403 }
    );
  }

  let body: AdmissionBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Požadavek nemá platný formát." },
      { status: 400 }
    );
  }

  const diagnosis = requiredString(body.diagnosis);
  const startAt =
    typeof body.startAt === "string" ? new Date(body.startAt) : new Date(NaN);

  if (
    !diagnosis ||
    Number.isNaN(startAt.getTime())
  ) {
    return NextResponse.json(
      { error: "Vyplňte všechny povinné údaje o hospitalizaci." },
      { status: 400 }
    );
  }

  if (body.mode === "existing") {
    const patientId = Number(body.patientId);

    if (!Number.isInteger(patientId)) {
      return NextResponse.json(
        { error: "Vyberte existujícího pacienta." },
        { status: 400 }
      );
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        hospitalizations: {
          where: { endAt: null },
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Vybraný pacient neexistuje." },
        { status: 404 }
      );
    }

    if (patient.hospitalizations.length > 0) {
      return NextResponse.json(
        { error: "Pacient již má aktivní hospitalizaci." },
        { status: 409 }
      );
    }

    for (let attempt = 0; attempt < medicalRecordNumberAttempts; attempt++) {
      try {
        const hospitalization = await prisma.$transaction(async (tx) => {
          const medicalRecordNumber =
            await generateNextMedicalRecordNumber(startAt, tx);

          return tx.hospitalization.create({
            data: {
              patientId: patient.id,
              departmentId: id,
              admittedByUserId: session.userId,
              medicalRecordNumber,
              startAt,
              diagnosis,
            },
          });
        });

        return NextResponse.json(
          { hospitalizationId: hospitalization.id },
          { status: 201 }
        );
      } catch (error) {
        if (
          isMedicalRecordNumberConflict(error) &&
          attempt + 1 < medicalRecordNumberAttempts
        ) {
          continue;
        }

        if (isMedicalRecordNumberConflict(error)) {
          return NextResponse.json(
            {
              error:
                "Číslo chorobopisu se nepodařilo přidělit. Zkuste přijetí znovu.",
            },
            { status: 409 }
          );
        }

        console.error(error);
        return NextResponse.json(
          { error: "Při přijímání pacienta došlo k chybě." },
          { status: 500 }
        );
      }
    }
  }

  if (body.mode === "new") {
    const title = requiredString(body.title) || null;
    const firstName = requiredString(body.firstName);
    const lastName = requiredString(body.lastName);
    const birthNumber = requiredString(body.birthNumber);
    const insuranceCompany = requiredString(body.insuranceCompany);

    if (!firstName || !lastName || !birthNumber || !insuranceCompany) {
      return NextResponse.json(
        { error: "Vyplňte všechny povinné údaje o pacientovi." },
        { status: 400 }
      );
    }

    const existingPatient = await prisma.patient.findUnique({
      where: { birthNumber },
      select: { id: true },
    });

    if (existingPatient) {
      return NextResponse.json(
        {
          error:
            "Pacient s tímto rodným číslem již existuje. Vyberte jej ze seznamu existujících pacientů.",
        },
        { status: 409 }
      );
    }

    for (let attempt = 0; attempt < medicalRecordNumberAttempts; attempt++) {
      try {
        const hospitalization = await prisma.$transaction(async (tx) => {
          const medicalRecordNumber =
            await generateNextMedicalRecordNumber(startAt, tx);
          const patient = await tx.patient.create({
            data: {
              title,
              firstName,
              lastName,
              birthNumber,
              insuranceCompany,
            },
          });

          return tx.hospitalization.create({
            data: {
              patientId: patient.id,
              departmentId: id,
              admittedByUserId: session.userId,
              medicalRecordNumber,
              startAt,
              diagnosis,
            },
          });
        });

        return NextResponse.json(
          { hospitalizationId: hospitalization.id },
          { status: 201 }
        );
      } catch (error) {
        if (
          isMedicalRecordNumberConflict(error) &&
          attempt + 1 < medicalRecordNumberAttempts
        ) {
          continue;
        }

        if (isUniqueConstraintError(error)) {
          const duplicatePatient = await prisma.patient.findUnique({
            where: { birthNumber },
            select: { id: true },
          });

          if (duplicatePatient) {
            return NextResponse.json(
              {
                error:
                  "Pacient s tímto rodným číslem již existuje. Vyberte jej ze seznamu existujících pacientů.",
              },
              { status: 409 }
            );
          }

          return NextResponse.json(
            {
              error:
                "Číslo chorobopisu se nepodařilo přidělit. Zkuste přijetí znovu.",
            },
            { status: 409 }
          );
        }

        console.error(error);
        return NextResponse.json(
          { error: "Při přijímání pacienta došlo k chybě." },
          { status: 500 }
        );
      }
    }
  }

  return NextResponse.json(
    { error: "Vyberte, zda přijímáte existujícího nebo nového pacienta." },
    { status: 400 }
  );
}
