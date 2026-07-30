import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const migrationsDirectory = join(root, "supabase", "migrations");
const migrationName = readdirSync(migrationsDirectory).find((name) =>
  name.endsWith("_harden_interpreter_applications.sql"),
);

if (!migrationName) {
  throw new Error("Migration harden_interpreter_applications não encontrada.");
}

const migration = readFileSync(
  join(migrationsDirectory, migrationName),
  "utf8",
);
const action = readFileSync(
  join(root, "src", "actions", "interpreters.ts"),
  "utf8",
);
const adminClient = readFileSync(
  join(root, "src", "lib", "supabase", "admin.ts"),
  "utf8",
);
const proxy = readFileSync(join(root, "src", "proxy.ts"), "utf8");
const interpreterPage = readFileSync(
  join(root, "src", "app", "app", "interpreter", "page.tsx"),
  "utf8",
);
const onboardingPage = readFileSync(
  join(
    root,
    "src",
    "app",
    "app",
    "interpreter",
    "onboarding",
    "page.tsx",
  ),
  "utf8",
);

describe("migration de hardening das candidaturas", () => {
  it.each([
    "certificates_insert_own",
    "certificates_update_own",
    "certificates_delete_own_or_admin",
    "interpreter_applications_insert_own",
  ])("remove a policy mutável %s", (policy) => {
    expect(migration).toMatch(
      new RegExp(`drop policy if exists ${policy}\\s+on`, "i"),
    );
  });

  it("restringe UPDATE de candidaturas a admins autenticados", () => {
    expect(migration).toMatch(
      /create policy interpreter_applications_update[\s\S]+for update[\s\S]+using \(private\.is_admin\(\)\)[\s\S]+with check \(private\.is_admin\(\)\)/i,
    );
  });

  it("torna certificate_path imutável para não-admin", () => {
    expect(migration).toMatch(
      /not private\.is_admin\(\)[\s\S]+new\.certificate_path is distinct from old\.certificate_path/i,
    );
  });

  it("impede atomicamente mais de uma candidatura ativa por perfil", () => {
    expect(migration).toMatch(
      /create unique index[\s\S]+on public\.interpreter_applications \(profile_id\)[\s\S]+where status in \('pending', 'approved'\)/i,
    );
  });

  it("revoga INSERT do candidato e mantém UPDATE para a Task 6", () => {
    expect(migration).toMatch(
      /revoke insert on table public\.interpreter_applications from authenticated/i,
    );
    expect(migration).toMatch(
      /grant select, update on table public\.interpreter_applications to authenticated/i,
    );
  });
});

describe("caminhos privilegiados e gates", () => {
  it("marca o client service role como server-only", () => {
    expect(adminClient).toContain('import "server-only"');
  });

  it("autentica por SSR e escreve somente com o admin client", () => {
    expect(action).toContain('import { createClient } from "@/lib/supabase/server"');
    expect(action).toContain(
      'import { createAdminClient } from "@/lib/supabase/admin"',
    );
    expect(action).toMatch(/admin = createAdminClient\(\)/);
    expect(action).toMatch(/admin\.storage[\s\S]+\.upload\(/);
    expect(action).toMatch(
      /admin[\s\S]+\.from\("interpreter_applications"\)[\s\S]+\.insert\(/,
    );
  });

  it("trata conflito único removendo o objeto recém-enviado", () => {
    expect(action).toContain("isActiveApplicationConflict");
    expect(action).toMatch(/insertError[\s\S]+admin\.storage[\s\S]+\.remove\(/);
  });

  it.each([
    ["proxy", proxy],
    ["página principal", interpreterPage],
    ["onboarding", onboardingPage],
  ])("usa ordenação determinística no %s", (_name, source) => {
    expect(source).toMatch(
      /\.order\("created_at", \{ ascending: false \}\)[\s\S]+\.order\("id", \{ ascending: false \}\)/,
    );
  });

  it("repete a validação de aprovação na página principal", () => {
    expect(interpreterPage).toContain('status !== "approved"');
    expect(interpreterPage).toContain('redirect("/app/interpreter/onboarding")');
  });
});
