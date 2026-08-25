# Nemocniční informační systém

Zjednodušená webová aplikace vytvořená jako interview assignment pro evidenci hospitalizovaných pacientů. Uživatel se přihlásí, vybere přidělené oddělení a otevře detail aktuální hospitalizace s údaji o pacientovi, medikaci a lékařských či sesterských záznamech podle své role.

## Funkcionalita

- přihlášení aplikačních uživatelů s rolemi `DOCTOR` a `NURSE`,
- výběr oddělení přiřazených uživateli přes `UserDepartment`,
- serverová kontrola přístupu k oddělením a hospitalizacím,
- seznam aktuálně hospitalizovaných pacientů na oddělení,
- detail pacienta a hospitalizace včetně diagnózy, medikace a auditních údajů,
- přijetí existujícího nebo nového pacienta,
- validace údajů nového pacienta na klientu i serveru,
- vytváření nových zápisů k aktivní hospitalizaci uživateli v rolích `DOCTOR` i `NURSE`,
- automatické přidělení čísla chorobopisu,
- propuštění pacienta s kontrolou data,
- evidence uživatele, který pacienta přijal nebo propustil,
- odhlášení a responzivní, střídmé zdravotnické rozhraní.

Viditelnost záznamů se řídí rolí uživatele:

- **lékař** vidí lékařské i sesterské záznamy,
- **sestra** vidí pouze sesterské záznamy.

Omezení je aplikováno přímo v databázovém dotazu, nejde pouze o skrytí prvků v uživatelském rozhraní.

Nové zápisy lze přidávat pouze k aktivní hospitalizaci. Po jejím ukončení formulář není dostupný a vytvoření zápisu odmítne také serverové API.

## Databázový návrh

| Entita | Účel |
| --- | --- |
| `User` | Aplikační účet, role a čas posledního přihlášení |
| `Department` | Nemocniční oddělení |
| `UserDepartment` | Vazba uživatelů na oddělení |
| `Patient` | Základní identifikační údaje pacienta |
| `Hospitalization` | Pobyt pacienta na oddělení, diagnóza a audit přijetí/propuštění |
| `Record` | Lékařský nebo sesterský záznam k hospitalizaci |
| `Medication` | Lék a textový rozpis podávání v rámci hospitalizace |

`UserDepartment` realizuje vztah M:N mezi uživateli a odděleními. Pacient může mít více hospitalizací a každá hospitalizace patří právě jednomu pacientovi a oddělení. `Record` patří k hospitalizaci a má autora typu `User`; lékařské a sesterské zápisy proto používají jednu tabulku a rozlišují se rolí autora. Čas `createdAt` vytváří automaticky databáze.

`Medication` neobsahuje redundantní `patientId`, protože pacient je jednoznačně dostupný přes příslušnou hospitalizaci. Hospitalizace zároveň ukládá uživatele, který provedl přijetí, a volitelně uživatele, který provedl propuštění.

## Číslo chorobopisu

Číslo se vytváří automaticky ve formátu:

```text
00001/2026
00002/2026
00003/2026
```

Pořadí se generuje samostatně pro každý rok; rok vychází z data přijetí `startAt` v časovém pásmu `Europe/Prague`. Uživatel číslo nezadává a databázový sloupec `medicalRecordNumber` má omezení `UNIQUE`.

Demo používá generování na aplikační úrovni s ošetřením kolize. Produkční řešení by pro vysokou souběžnost mělo využít robustnější databázovou sekvenci nebo zamykání.

## Použité technologie

- Next.js 16 a React 19
- TypeScript
- Tailwind CSS 4
- Prisma ORM 7 s PostgreSQL adaptérem
- PostgreSQL na Aiven
- `jose` pro podepisování JWT session
- Vercel pro hosting aplikace

## Autentizace a autorizace

Po úspěšném přihlášení server vytvoří podepsaný JWT token s osmihodinovou platností a uloží jej do `HttpOnly` cookie `session`. Cookie používá `SameSite=Lax` a v produkci také příznak `Secure`.

Autorizace je vynucována na serveru. Stránky i mutační API ověřují session a přiřazení oddělení v `UserDepartment`; ID uživatele pro audit přijetí a propuštění pochází ze session. Před vytvořením zápisu API znovu ověří přístup uživatele k oddělení dané hospitalizace.

Autor nového zápisu je vždy určen na serveru z přihlášené session (`session.userId`). Klient odesílá pouze text zápisu, nikdy nevybírá ani neposílá `authorUserId`, roli autora nebo čas vytvoření. Omezení záznamů pro sestry zůstává součástí databázového dotazu.

Hesla jsou v této demonstrační aplikaci uložena jako prostý text, protože zadání tuto zjednodušenou variantu dovoluje. Produkční systém musí používat bezpečné hashování hesel.

## Demo účty

| Role | Login | Heslo | Přístupná oddělení |
| --- | --- | --- | --- |
| Lékař | `novak` | `doktor123` | Interní, Chirurgické |
| Lékař | `dvorak` | `doktor456` | Interní, Neurologické |
| Sestra | `svobodova` | `sestra123` | Interní |
| Sestra | `kralova` | `sestra456` | Chirurgické, Neurologické |

Účty a hesla jsou určeny pouze pro demo prostředí.

## Spuštění lokálně

Požadavky: Node.js, npm a dostupná PostgreSQL databáze.

```bash
npm install
```

V kořeni projektu vytvořte soubor `.env` s následujícími proměnnými. Hodnoty nejsou součástí repozitáře:

```dotenv
DATABASE_URL=
DATABASE_URL_SECURE=
SESSION_SECRET=
AIVEN_CA_CERT=
```

- `DATABASE_URL` používá Prisma CLI pro migrace.
- `DATABASE_URL_SECURE` používá aplikace a seed přes PostgreSQL adaptér.
- `SESSION_SECRET` slouží k podpisu session tokenů.
- `AIVEN_CA_CERT` musí obsahovat celý CA certifikát ve formátu PEM, včetně řádků `BEGIN CERTIFICATE` a `END CERTIFICATE`.

Vývojový server spustíte příkazem:

```bash
npm run dev
```

Aplikace je následně dostupná na [http://localhost:3000](http://localhost:3000).

## Databáze a seed

Prisma Client se generuje automaticky po `npm install`; ručně jej lze obnovit příkazem:

```bash
npx prisma generate
```

Existující migrace aplikujte na nakonfigurovanou databázi a poté případně vložte demo data:

```bash
npx prisma migrate deploy
npx prisma db seed
```

`prisma.config.ts` používá pro migrace `DATABASE_URL`; seed používá `DATABASE_URL_SECURE` a ověřuje TLS certifikát z `AIVEN_CA_CERT` pomocí `rejectUnauthorized: true`.

> **Pozor:** aktuální seed před vložením ukázkových dat odstraní obsah demo tabulek. Nespouštějte jej nad produkční databází ani nad databází s daty, která potřebujete zachovat.

## Nasazení

Aplikace je navržena pro nasazení na Vercel a připojení k PostgreSQL databázi na Aiven. V nasazení je nutné nastavit stejné serverové proměnné prostředí jako při lokálním spuštění; certifikát ani jiné tajné hodnoty nesmí být součástí repozitáře.

Live demo: [doplnit odkaz]

## Bezpečnost a omezení

Jde o zjednodušenou demonstrační aplikaci, nikoli o produkční zdravotnický systém.

- hesla nejsou hashována,
- číslo chorobopisu se generuje na aplikační úrovni,
- rozpis medikace je uložen jako volný text,
- aplikace umožňuje přidávat zápisy, ale neposkytuje jejich úpravy ani rozhraní pro správu medikace,
- řešení není určeno pro skutečná pacientská data ani reálný zdravotnický provoz.

## Co bylo přidáno nad rámec zadání

- přijetí existujícího i nového pacienta,
- propuštění pacienta,
- automatické číslování chorobopisů po jednotlivých letech,
- audit uživatele, který provedl přijetí nebo propuštění,
- klientská i serverová validace údajů nového pacienta,
- vytváření nových lékařských a sesterských záznamů s automaticky evidovaným autorem a časem vytvoření,
- bezpečnější serverová autorizace podle přiřazeného oddělení,
- odhlášení a sjednocené responzivní rozhraní.

## Struktura projektu

```text
app/          stránky a serverové Route Handlers
components/   interaktivní formuláře a sdílené UI
lib/          session, Prisma klient, validace a aplikační pomocné funkce
prisma/       schéma, migrace a demo seed
```
