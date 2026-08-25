export type NewPatientField =
  | "title"
  | "firstName"
  | "lastName"
  | "birthNumber"
  | "insuranceCompany";

export type NewPatientValues = Record<NewPatientField, string>;
export type NewPatientFieldErrors = Partial<Record<NewPatientField, string>>;

const titlePattern = /^[\p{L}. -]+$/u;
const namePattern = /^[\p{L} '\u2019-]+$/u;
const birthNumberPattern = /^\d{9,10}$/;
const insuranceCompanyPattern = /^[\p{L}\p{N} -]+$/u;
const letterPattern = /\p{L}/u;
const letterOrNumberPattern = /[\p{L}\p{N}]/u;

export function validateNewPatient(values: NewPatientValues) {
  const normalized: NewPatientValues = {
    title: values.title.trim(),
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    birthNumber: values.birthNumber.trim(),
    insuranceCompany: values.insuranceCompany.trim(),
  };
  const errors: NewPatientFieldErrors = {};

  if (
    normalized.title &&
    (normalized.title.length > 50 ||
      !titlePattern.test(normalized.title) ||
      !letterPattern.test(normalized.title))
  ) {
    errors.title = "Zadejte platný titul.";
  }

  if (!normalized.firstName) {
    errors.firstName = "Jméno je povinné.";
  } else if (
    normalized.firstName.length < 2 ||
    normalized.firstName.length > 100 ||
    !namePattern.test(normalized.firstName) ||
    !letterPattern.test(normalized.firstName)
  ) {
    errors.firstName = "Zadejte platné jméno.";
  }

  if (!normalized.lastName) {
    errors.lastName = "Příjmení je povinné.";
  } else if (
    normalized.lastName.length < 2 ||
    normalized.lastName.length > 100 ||
    !namePattern.test(normalized.lastName) ||
    !letterPattern.test(normalized.lastName)
  ) {
    errors.lastName = "Zadejte platné příjmení.";
  }

  if (!normalized.birthNumber) {
    errors.birthNumber = "Rodné číslo je povinné.";
  } else if (!birthNumberPattern.test(normalized.birthNumber)) {
    errors.birthNumber =
      "Rodné číslo musí obsahovat pouze 9 nebo 10 číslic bez lomítka.";
  }

  if (!normalized.insuranceCompany) {
    errors.insuranceCompany = "Pojišťovna je povinná.";
  } else if (
    normalized.insuranceCompany.length > 100 ||
    !insuranceCompanyPattern.test(normalized.insuranceCompany) ||
    !letterOrNumberPattern.test(normalized.insuranceCompany)
  ) {
    errors.insuranceCompany = "Zadejte platnou pojišťovnu.";
  }

  return { normalized, errors };
}
