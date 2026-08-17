import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type MedicalRecordNumberClient = Pick<
  Prisma.TransactionClient,
  "hospitalization"
>;

function hospitalizationYear(startAt: Date) {
  return Number(
    new Intl.DateTimeFormat("en", {
      timeZone: "Europe/Prague",
      year: "numeric",
    }).format(startAt)
  );
}

export async function generateNextMedicalRecordNumber(
  startAt: Date,
  client: MedicalRecordNumberClient = prisma
) {
  const year = hospitalizationYear(startAt);
  const suffix = `/${year}`;
  const existingNumbers = await client.hospitalization.findMany({
    where: {
      medicalRecordNumber: {
        endsWith: suffix,
      },
    },
    select: {
      medicalRecordNumber: true,
    },
  });
  const pattern = new RegExp(`^(\\d{5})/${year}$`);
  const highestSequence = existingNumbers.reduce((highest, hospitalization) => {
    const match = pattern.exec(hospitalization.medicalRecordNumber);

    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);

  return `${String(highestSequence + 1).padStart(5, "0")}/${year}`;
}
