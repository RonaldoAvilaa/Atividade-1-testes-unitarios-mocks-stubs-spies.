import { HttpError } from "../src/errors";
import {
  parseId,
  positiveInteger,
  validateBody,
  validateName,
} from "../src/validation";

function expectBadRequest(action: () => unknown) {
  let thrown: unknown;
  try {
    action();
  } catch (error) {
    thrown = error;
  }
  expect(thrown).toBeInstanceOf(HttpError);
  expect(thrown).toMatchObject({ statusCode: 400 });
}

describe("positiveInteger", () => {
  test.each([
    ["o limite inferior 1", 1],
    ["o limite superior 2147483647", 2147483647],
  ])("retorna o próprio número para %s", (_label, value) => {
    expect(positiveInteger(value, "RA")).toBe(value);
  });

  test.each<[string, unknown]>([
    ["0", 0],
    ["-1", -1],
    ["1.5", 1.5],
    ["NaN", NaN],
    ["Infinity", Infinity],
    ["2147483648", 2147483648],
    ['a string numérica "123"', "123"],
    ["null", null],
    ["undefined", undefined],
  ])("lança HttpError 400 para %s", (_label, value) => {
    expectBadRequest(() => positiveInteger(value, "RA"));
  });
});

describe("parseId", () => {
  test.each([
    ["1", 1],
    ["2147483647", 2147483647],
  ])('converte a string "%s" para o número %d', (value, expected) => {
    expect(parseId(value, "RA")).toBe(expected);
  });

  test.each<[string, unknown]>([
    ['a conversão parcial "1abc"', "1abc"],
    ['o decimal "1.2"', "1.2"],
    ['a notação exponencial "1e2"', "1e2"],
    ["a string vazia", ""],
    ['o negativo "-1"', "-1"],
    ['o zero "0"', "0"],
    ['o valor acima do limite "2147483648"', "2147483648"],
    ["o número 123", 123],
  ])("lança HttpError 400 para %s", (_label, value) => {
    expectBadRequest(() => parseId(value, "RA"));
  });
});

describe("validateName", () => {
  test.each([
    ['"Ana"', "Ana"],
    ["uma string com 100 letras a", "a".repeat(100)],
  ])("retorna o nome recebido para %s", (_label, value) => {
    expect(validateName(value)).toBe(value);
  });

  test.each<[string, unknown]>([
    ["a string vazia", ""],
    ['o nome curto "ab"', "ab"],
    ["uma string só com espaços", "   "],
    ['o nome curto cercado de espaços " a "', " a "],
    ["uma string com 101 letras a", "a".repeat(101)],
    ["o número 123", 123],
    ["null", null],
    ["undefined", undefined],
  ])("lança HttpError 400 para %s", (_label, value) => {
    expectBadRequest(() => validateName(value));
  });
});

describe("validateBody", () => {
  test("retorna a mesma referência de um objeto congelado sem modificá-lo", () => {
    const body = Object.freeze({ name: "Ana" });

    const result = validateBody(body);

    expect(result).toBe(body);
    expect(result).toEqual({ name: "Ana" });
    expect(Object.isFrozen(result)).toBe(true);
  });

  test.each<[string, unknown]>([
    ["null", null],
    ["undefined", undefined],
    ["um array vazio", []],
    ['a string "Ana"', "Ana"],
    ["o número 12", 12],
  ])("lança HttpError 400 para %s", (_label, value) => {
    expectBadRequest(() => validateBody(value));
  });

  test("aceita campos extras e retorna a mesma referência sem alterar o objeto", () => {
    const body = { name: "Ana", extra: true };

    const result = validateBody(body);

    expect(result).toBe(body);
    expect(result).toEqual({ name: "Ana", extra: true });
  });
});
