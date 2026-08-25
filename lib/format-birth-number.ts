export function formatBirthNumber(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length <= 4) {
    return digits;
  }

  return `${digits.slice(0, -4)}/${digits.slice(-4)}`;
}
