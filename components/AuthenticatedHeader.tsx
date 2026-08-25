import Link from "next/link";
import LogoutButton from "@/components/LogoutButton";

type Props = {
  login: string;
  role: "DOCTOR" | "NURSE";
};

export default function AuthenticatedHeader({ login, role }: Props) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex min-h-16 max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-6">
          <div className="truncate text-sm font-semibold tracking-tight text-slate-950 sm:text-base">
            Nemocniční informační systém
          </div>

          <nav aria-label="Hlavní navigace" className="hidden sm:block">
            <Link
              href="/departments"
              className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            >
              Výběr oddělení
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <div className="text-sm font-medium text-slate-800">{login}</div>
            <div className="text-xs text-slate-500">
              {role === "DOCTOR" ? "Lékař" : "Sestra"}
            </div>
          </div>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
