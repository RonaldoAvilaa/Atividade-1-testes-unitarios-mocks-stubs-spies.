import { isForeignKeyViolation } from "../../src/database/foreign-key-violation";

describe("isForeignKeyViolation", () => {
  test('retorna true para um objeto com code "23503"', () => {
    expect(isForeignKeyViolation({ code: "23503" })).toBe(true);
  });

  test.each<[string, unknown]>([
    ["null", null],
    ["undefined", undefined],
    ['a string "23505"', "23505"],
    ["o número 23503", 23503],
    ["um objeto vazio", {}],
    ['um objeto com code "outro"', { code: "outro" }],
  ])("retorna false para %s", (_label, value) => {
    expect(isForeignKeyViolation(value)).toBe(false);
  });
});
