import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ hospitalizationId: string }> }
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: "Pro tuto akci se musíte přihlásit." },
      { status: 401 }
    );
  }

  const { hospitalizationId } = await params;
  const id = Number(hospitalizationId);

  if (!Number.isInteger(id)) {
    return NextResponse.json(
      { error: "Neplatná hospitalizace." },
      { status: 400 }
    );
  }

  const hospitalization = await prisma.hospitalization.findUnique({
    where: { id },
    select: {
      id: true,
      departmentId: true,
      startAt: true,
      endAt: true,
    },
  });

  if (!hospitalization) {
    return NextResponse.json(
      { error: "Hospitalizace nebyla nalezena." },
      { status: 404 }
    );
  }

  const access = await prisma.userDepartment.findUnique({
    where: {
      userId_departmentId: {
        userId: session.userId,
        departmentId: hospitalization.departmentId,
      },
    },
  });

  if (!access) {
    return NextResponse.json(
      { error: "K tomuto oddělení nemáte přístup." },
      { status: 403 }
    );
  }

  if (hospitalization.endAt !== null) {
    return NextResponse.json(
      { error: "Tato hospitalizace již byla ukončena." },
      { status: 409 }
    );
  }

  let body: { endAt?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Požadavek nemá platný formát." },
      { status: 400 }
    );
  }

  const endAt =
    typeof body.endAt === "string" ? new Date(body.endAt) : new Date(NaN);

  if (Number.isNaN(endAt.getTime())) {
    return NextResponse.json(
      { error: "Zadejte platné datum a čas propuštění." },
      { status: 400 }
    );
  }

  if (endAt < hospitalization.startAt) {
    return NextResponse.json(
      { error: "Datum propuštění nesmí být před datem přijetí." },
      { status: 400 }
    );
  }

  const result = await prisma.hospitalization.updateMany({
    where: {
      id: hospitalization.id,
      endAt: null,
    },
    data: {
      endAt,
      dischargedByUserId: session.userId,
    },
  });

  if (result.count === 0) {
    return NextResponse.json(
      { error: "Tato hospitalizace již byla ukončena." },
      { status: 409 }
    );
  }

  return NextResponse.json({ success: true });
}
