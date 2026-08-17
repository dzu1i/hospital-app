import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createSessionToken } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const login = body.login?.trim();
    const password = body.password;

    if (!login || !password) {
      return NextResponse.json(
        { error: "Vyplňte přihlašovací jméno a heslo." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        login,
      },
    });

    if (!user || user.password !== password) {
      return NextResponse.json(
        { error: "Neplatné přihlašovací údaje." },
        { status: 401 }
      );
    }

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        lastLoginAt: new Date(),
      },
    });

    const token = await createSessionToken({
      userId: user.id,
      login: user.login,
      role: user.role,
    });

    const cookieStore = await cookies();

    cookieStore.set("session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return NextResponse.json({
      id: user.id,
      login: user.login,
      role: user.role,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Při přihlašování došlo k chybě." },
      { status: 500 }
    );
  }
}