-- Add the audit columns as nullable first so existing hospitalizations can be backfilled safely.
ALTER TABLE "Hospitalization"
ADD COLUMN "admittedByUserId" INTEGER,
ADD COLUMN "dischargedByUserId" INTEGER,
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Existing records predate audit tracking. Attribute them to an existing doctor.
-- Already discharged historical records receive the same doctor as their discharge auditor.
DO $$
DECLARE
    doctor_id INTEGER;
BEGIN
    SELECT "id" INTO doctor_id
    FROM "User"
    WHERE "role" = 'DOCTOR'
    ORDER BY "id"
    LIMIT 1;

    IF doctor_id IS NULL AND EXISTS (SELECT 1 FROM "Hospitalization") THEN
        RAISE EXCEPTION 'Cannot backfill hospitalization audit data: no DOCTOR user exists';
    END IF;

    UPDATE "Hospitalization"
    SET "admittedByUserId" = doctor_id
    WHERE "admittedByUserId" IS NULL;

    UPDATE "Hospitalization"
    SET "dischargedByUserId" = doctor_id
    WHERE "endAt" IS NOT NULL
      AND "dischargedByUserId" IS NULL;
END $$;

ALTER TABLE "Hospitalization"
ALTER COLUMN "admittedByUserId" SET NOT NULL;

CREATE INDEX "Hospitalization_admittedByUserId_idx"
ON "Hospitalization"("admittedByUserId");

CREATE INDEX "Hospitalization_dischargedByUserId_idx"
ON "Hospitalization"("dischargedByUserId");

ALTER TABLE "Hospitalization"
ADD CONSTRAINT "Hospitalization_admittedByUserId_fkey"
FOREIGN KEY ("admittedByUserId") REFERENCES "User"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Hospitalization"
ADD CONSTRAINT "Hospitalization_dischargedByUserId_fkey"
FOREIGN KEY ("dischargedByUserId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
