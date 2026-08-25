import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const maxRecordTextLength = 5000;

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

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Přihlášený uživatel již neexistuje." },
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
    select: { userId: true },
  });

  if (!access) {
    return NextResponse.json(
      { error: "K tomuto oddělení nemáte přístup." },
      { status: 403 }
    );
  }

  if (hospitalization.endAt !== null) {
    return NextResponse.json(
      { error: "Do ukončené hospitalizace nelze přidávat nové zápisy." },
      { status: 409 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Požadavek nemá platný formát." },
      { status: 400 }
    );
  }

  const text =
    typeof body === "object" &&
    body !== null &&
    "text" in body &&
    typeof body.text === "string"
      ? body.text.trim()
      : "";

  if (!text) {
    return NextResponse.json(
      { error: "Text zápisu je povinný." },
      { status: 400 }
    );
  }

  if (text.length > maxRecordTextLength) {
    return NextResponse.json(
      { error: "Text zápisu je příliš dlouhý." },
      { status: 400 }
    );
  }

  try {
    const record = await prisma.record.create({
      data: {
        hospitalizationId: hospitalization.id,
        authorUserId: session.userId,
        text,
      },
      select: { id: true },
    });

    return NextResponse.json({ recordId: record.id }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Při ukládání zápisu došlo k chybě." },
      { status: 500 }
    );
  }
}
