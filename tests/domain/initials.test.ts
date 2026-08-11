import { describe, expect, it } from "vitest";
import { getInitials } from "../../src/lib/profile/initials";

describe("getInitials", () => {
  it("usa primeira letra de nome e sobrenome", () => {
    expect(getInitials("Pedro Admin")).toBe("PA");
  });

  it("usa uma letra quando há só um nome", () => {
    expect(getInitials("Pedro")).toBe("P");
  });

  it("ignora espaços extras e retorna fallback para vazio", () => {
    expect(getInitials("  ")).toBe("?");
    expect(getInitials("")).toBe("?");
  });

  it("pega primeiro e último de três nomes", () => {
    expect(getInitials("Pedro Silva Admin")).toBe("PA");
  });
});
