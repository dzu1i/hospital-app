import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, UserRole } from "../app/generated/prisma/client";

const ca = fs.readFileSync(
  path.join(process.cwd(), "certs", "ca.pem"),
  "utf8"
);

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL_SECURE!,
  ssl: {
    ca,
    rejectUnauthorized: true,
  },
});

const prisma = new PrismaClient({ adapter });

async function main() {
  // --------------------------------------------------
  // VYČIŠTĚNÍ DATABÁZE
  // --------------------------------------------------

  await prisma.medication.deleteMany();
  await prisma.record.deleteMany();
  await prisma.hospitalization.deleteMany();
  await prisma.userDepartment.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.department.deleteMany();
  await prisma.user.deleteMany();

  // --------------------------------------------------
  // UŽIVATELÉ
  // --------------------------------------------------

  const doctorNovak = await prisma.user.create({
    data: {
      login: "novak",
      password: "doktor123",
      role: UserRole.DOCTOR,
    },
  });

  const doctorDvorak = await prisma.user.create({
    data: {
      login: "dvorak",
      password: "doktor456",
      role: UserRole.DOCTOR,
    },
  });

  const nurseSvobodova = await prisma.user.create({
    data: {
      login: "svobodova",
      password: "sestra123",
      role: UserRole.NURSE,
    },
  });

  const nurseKralova = await prisma.user.create({
    data: {
      login: "kralova",
      password: "sestra456",
      role: UserRole.NURSE,
    },
  });

  // --------------------------------------------------
  // ODDĚLENÍ
  // --------------------------------------------------

  const internal = await prisma.department.create({
    data: {
      code: "INT",
      name: "Interní oddělení",
    },
  });

  const surgery = await prisma.department.create({
    data: {
      code: "CHI",
      name: "Chirurgické oddělení",
    },
  });

  const neurology = await prisma.department.create({
    data: {
      code: "NEU",
      name: "Neurologické oddělení",
    },
  });

  // --------------------------------------------------
  // PŘÍSTUPY UŽIVATELŮ K ODDĚLENÍM
  // --------------------------------------------------

  await prisma.userDepartment.createMany({
    data: [
      {
        userId: doctorNovak.id,
        departmentId: internal.id,
      },
      {
        userId: doctorNovak.id,
        departmentId: surgery.id,
      },
      {
        userId: doctorDvorak.id,
        departmentId: internal.id,
      },
      {
        userId: doctorDvorak.id,
        departmentId: neurology.id,
      },
      {
        userId: nurseSvobodova.id,
        departmentId: internal.id,
      },
      {
        userId: nurseKralova.id,
        departmentId: surgery.id,
      },
      {
        userId: nurseKralova.id,
        departmentId: neurology.id,
      },
    ],
  });

  // --------------------------------------------------
  // PACIENTI
  // --------------------------------------------------

  const jan = await prisma.patient.create({
    data: {
      title: "Ing.",
      firstName: "Jan",
      lastName: "Novák",
      birthNumber: "800101/1234",
      insuranceCompany: "VZP",
    },
  });

  const eva = await prisma.patient.create({
    data: {
      firstName: "Eva",
      lastName: "Svobodová",
      birthNumber: "905512/5678",
      insuranceCompany: "ČPZP",
    },
  });

  const petr = await prisma.patient.create({
    data: {
      title: "Mgr.",
      firstName: "Petr",
      lastName: "Dvořák",
      birthNumber: "740303/2468",
      insuranceCompany: "OZP",
    },
  });

  const jana = await prisma.patient.create({
    data: {
      firstName: "Jana",
      lastName: "Křížová",
      birthNumber: "845624/1357",
      insuranceCompany: "VZP",
    },
  });

  const martin = await prisma.patient.create({
    data: {
      firstName: "Martin",
      lastName: "Černý",
      birthNumber: "920708/4321",
      insuranceCompany: "ZPMV",
    },
  });

  const alena = await prisma.patient.create({
    data: {
      title: "Bc.",
      firstName: "Alena",
      lastName: "Benešová",
      birthNumber: "675418/9876",
      insuranceCompany: "VoZP",
    },
  });

  const tomas = await prisma.patient.create({
    data: {
      firstName: "Tomáš",
      lastName: "Procházka",
      birthNumber: "880914/7412",
      insuranceCompany: "VZP",
    },
  });

  const lucie = await prisma.patient.create({
    data: {
      firstName: "Lucie",
      lastName: "Horáková",
      birthNumber: "995101/3579",
      insuranceCompany: "RBP",
    },
  });

  // --------------------------------------------------
// HOSPITALIZACE
// --------------------------------------------------

const tomasHistorical = await prisma.hospitalization.create({
  data: {
    patientId: tomas.id,
    departmentId: surgery.id,
    admittedByUserId: doctorNovak.id,
    dischargedByUserId: nurseKralova.id,
    medicalRecordNumber: "00001/2026",
    startAt: new Date("2026-08-02T15:45:00"),
    endAt: new Date("2026-08-06T11:15:00"),
    diagnosis: "Tříštivá zlomenina levého kotníku",
  },
});

const alenaHistorical = await prisma.hospitalization.create({
  data: {
    patientId: alena.id,
    departmentId: internal.id,
    admittedByUserId: doctorDvorak.id,
    dischargedByUserId: nurseSvobodova.id,
    medicalRecordNumber: "00002/2026",
    startAt: new Date("2026-08-05T12:20:00"),
    endAt: new Date("2026-08-08T10:00:00"),
    diagnosis: "Hypertenzní krize",
  },
});

const janCurrent = await prisma.hospitalization.create({
  data: {
    patientId: jan.id,
    departmentId: internal.id,
    admittedByUserId: doctorNovak.id,
    medicalRecordNumber: "00003/2026",
    startAt: new Date("2026-08-10T08:30:00"),
    diagnosis: "Zápal plic",
  },
});

const evaCurrent = await prisma.hospitalization.create({
  data: {
    patientId: eva.id,
    departmentId: surgery.id,
    admittedByUserId: doctorNovak.id,
    medicalRecordNumber: "00004/2026",
    startAt: new Date("2026-08-11T14:00:00"),
    diagnosis: "Zlomenina pravého předloktí",
  },
});

const petrCurrent = await prisma.hospitalization.create({
  data: {
    patientId: petr.id,
    departmentId: neurology.id,
    admittedByUserId: doctorDvorak.id,
    medicalRecordNumber: "00005/2026",
    startAt: new Date("2026-08-12T10:15:00"),
    diagnosis: "Podezření na tranzitorní ischemickou ataku",
  },
});

const janaCurrent = await prisma.hospitalization.create({
  data: {
    patientId: jana.id,
    departmentId: internal.id,
    admittedByUserId: doctorDvorak.id,
    medicalRecordNumber: "00006/2026",
    startAt: new Date("2026-08-12T16:40:00"),
    diagnosis: "Dehydratace a celková slabost",
  },
});

const martinCurrent = await prisma.hospitalization.create({
  data: {
    patientId: martin.id,
    departmentId: surgery.id,
    admittedByUserId: doctorNovak.id,
    medicalRecordNumber: "00007/2026",
    startAt: new Date("2026-08-13T07:20:00"),
    diagnosis: "Akutní apendicitida",
  },
});

const lucieCurrent = await prisma.hospitalization.create({
  data: {
    patientId: lucie.id,
    departmentId: neurology.id,
    admittedByUserId: doctorDvorak.id,
    medicalRecordNumber: "00008/2026",
    startAt: new Date("2026-08-13T09:10:00"),
    diagnosis: "Migréna s neurologickou aurou",
  },
});

// Historická hospitalizace z roku 2025
const janHistorical = await prisma.hospitalization.create({
  data: {
    patientId: jan.id,
    departmentId: internal.id,
    admittedByUserId: doctorNovak.id,
    dischargedByUserId: nurseSvobodova.id,
    medicalRecordNumber: "00412/2025",
    startAt: new Date("2025-11-03T11:00:00"),
    endAt: new Date("2025-11-07T09:30:00"),
    diagnosis: "Akutní gastroenteritida",
  },
});

  // --------------------------------------------------
  // ZÁZNAMY
  // --------------------------------------------------

  await prisma.record.createMany({
    data: [
      {
        hospitalizationId: janCurrent.id,
        authorUserId: doctorNovak.id,
        createdAt: new Date("2026-08-10T09:15:00"),
        text: "Pacient přijat s horečkou a produktivním kašlem. Zahájena antibiotická léčba.",
      },
      {
        hospitalizationId: janCurrent.id,
        authorUserId: nurseSvobodova.id,
        createdAt: new Date("2026-08-10T10:30:00"),
        text: "Pacient odpočívá, teplota 38,1 °C, krevní tlak 125/80 mmHg.",
      },
      {
        hospitalizationId: janCurrent.id,
        authorUserId: nurseSvobodova.id,
        createdAt: new Date("2026-08-11T08:00:00"),
        text: "Pacient dnes ráno bez horečky, udává zlepšení stavu.",
      },

      {
        hospitalizationId: evaCurrent.id,
        authorUserId: doctorNovak.id,
        createdAt: new Date("2026-08-11T14:30:00"),
        text: "RTG potvrzuje zlomeninu pravého předloktí. Končetina zafixována.",
      },
      {
        hospitalizationId: evaCurrent.id,
        authorUserId: nurseKralova.id,
        createdAt: new Date("2026-08-11T18:00:00"),
        text: "Pacientka udává bolest 4/10, analgetická léčba podána dle ordinace.",
      },

      {
        hospitalizationId: petrCurrent.id,
        authorUserId: doctorDvorak.id,
        createdAt: new Date("2026-08-12T11:00:00"),
        text: "Přechodná porucha řeči před přijetím, nyní bez ložiskového neurologického nálezu.",
      },
      {
        hospitalizationId: petrCurrent.id,
        authorUserId: nurseKralova.id,
        createdAt: new Date("2026-08-12T12:15:00"),
        text: "Pacient orientovaný, spolupracuje, vitální funkce stabilní.",
      },

      {
        hospitalizationId: janaCurrent.id,
        authorUserId: doctorDvorak.id,
        createdAt: new Date("2026-08-12T17:10:00"),
        text: "Pacientka přijata pro celkovou slabost a známky dehydratace. Zahájena infuzní terapie.",
      },
      {
        hospitalizationId: janaCurrent.id,
        authorUserId: nurseSvobodova.id,
        createdAt: new Date("2026-08-13T06:30:00"),
        text: "Pacientka toleruje tekutiny, bez zvracení, stav se postupně zlepšuje.",
      },

      {
        hospitalizationId: martinCurrent.id,
        authorUserId: doctorNovak.id,
        createdAt: new Date("2026-08-13T07:50:00"),
        text: "Klinický obraz odpovídá akutní apendicitidě. Indikován operační výkon.",
      },
      {
        hospitalizationId: martinCurrent.id,
        authorUserId: nurseKralova.id,
        createdAt: new Date("2026-08-13T08:20:00"),
        text: "Pacient nalačno, připraven k operačnímu výkonu dle standardu oddělení.",
      },

      {
        hospitalizationId: lucieCurrent.id,
        authorUserId: doctorDvorak.id,
        createdAt: new Date("2026-08-13T09:45:00"),
        text: "Pacientka udává zrakovou auru a následnou intenzivní bolest hlavy. Neurologický nález bez akutní patologie.",
      },
      {
        hospitalizationId: lucieCurrent.id,
        authorUserId: nurseKralova.id,
        createdAt: new Date("2026-08-13T10:20:00"),
        text: "Pacientka v klidovém režimu, intenzita bolesti po medikaci klesla.",
      },

      {
        hospitalizationId: janHistorical.id,
        authorUserId: doctorNovak.id,
        createdAt: new Date("2025-11-03T11:30:00"),
        text: "Pacient přijat pro průjem, zvracení a známky dehydratace.",
      },
      {
        hospitalizationId: janHistorical.id,
        authorUserId: nurseSvobodova.id,
        createdAt: new Date("2025-11-04T07:20:00"),
        text: "Pacient po infuzní terapii stabilní, bez dalšího zvracení.",
      },

      {
        hospitalizationId: alenaHistorical.id,
        authorUserId: doctorDvorak.id,
        createdAt: new Date("2026-08-05T13:00:00"),
        text: "Pacientka přijata pro výrazně zvýšený krevní tlak a cefaleu.",
      },
      {
        hospitalizationId: alenaHistorical.id,
        authorUserId: nurseSvobodova.id,
        createdAt: new Date("2026-08-06T07:45:00"),
        text: "Krevní tlak po terapii stabilizován, pacientka bez obtíží.",
      },

      {
        hospitalizationId: tomasHistorical.id,
        authorUserId: doctorNovak.id,
        createdAt: new Date("2026-08-02T16:30:00"),
        text: "RTG potvrzuje tříštivou zlomeninu levého kotníku. Indikována operační stabilizace.",
      },
      {
        hospitalizationId: tomasHistorical.id,
        authorUserId: nurseKralova.id,
        createdAt: new Date("2026-08-03T08:10:00"),
        text: "Pacient po výkonu stabilní, bolest 3/10, rána bez známek komplikací.",
      },
    ],
  });

  // --------------------------------------------------
  // MEDIKACE
  // --------------------------------------------------

  await prisma.medication.createMany({
    data: [
      {
        hospitalizationId: janCurrent.id,
        createdAt: new Date("2026-08-10T09:30:00"),
        drugName: "Paracetamol 500 mg",
        schedule: "1 tableta dle potřeby, maximálně 4× denně",
      },
      {
        hospitalizationId: janCurrent.id,
        createdAt: new Date("2026-08-10T09:30:00"),
        drugName: "Amoxicilin 500 mg",
        schedule: "1-1-1",
      },

      {
        hospitalizationId: evaCurrent.id,
        createdAt: new Date("2026-08-11T15:00:00"),
        drugName: "Ibuprofen 400 mg",
        schedule: "1-0-1",
      },

      {
        hospitalizationId: petrCurrent.id,
        createdAt: new Date("2026-08-12T11:15:00"),
        drugName: "Kyselina acetylsalicylová 100 mg",
        schedule: "0-1-0",
      },

      {
        hospitalizationId: janaCurrent.id,
        createdAt: new Date("2026-08-12T17:20:00"),
        drugName: "Fyziologický roztok 0,9 %",
        schedule: "1000 ml intravenózně dle ordinace",
      },

      {
        hospitalizationId: martinCurrent.id,
        createdAt: new Date("2026-08-13T08:00:00"),
        drugName: "Metamizol 500 mg",
        schedule: "Dle bolesti, maximálně 4× denně",
      },

      {
        hospitalizationId: lucieCurrent.id,
        createdAt: new Date("2026-08-13T10:00:00"),
        drugName: "Sumatriptan 50 mg",
        schedule: "1 tableta při záchvatu",
      },

      {
        hospitalizationId: janHistorical.id,
        createdAt: new Date("2025-11-03T12:00:00"),
        drugName: "Fyziologický roztok 0,9 %",
        schedule: "1000 ml intravenózně",
      },

      {
        hospitalizationId: alenaHistorical.id,
        createdAt: new Date("2026-08-05T13:10:00"),
        drugName: "Captopril 25 mg",
        schedule: "Dle krevního tlaku dle ordinace lékaře",
      },

      {
        hospitalizationId: tomasHistorical.id,
        createdAt: new Date("2026-08-02T17:00:00"),
        drugName: "Enoxaparin 40 mg",
        schedule: "1× denně subkutánně",
      },
    ],
  });

  console.log("Databáze byla úspěšně vyčištěna a naplněna demo daty.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });