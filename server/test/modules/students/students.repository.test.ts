import type { Database } from "../../../src/database/connection";
import {
  PgStudentRepository,
  type Student,
} from "../../../src/modules/students/students.repository";

function normalizeSql(sql: unknown) {
  return String(sql).replace(/\s+/g, " ").trim();
}

describe("PgStudentRepository", () => {
  let query: jest.Mock;
  let repository: PgStudentRepository;

  beforeEach(() => {
    query = jest.fn();
    const db: Database = { query };
    repository = new PgStudentRepository(db);
  });

  describe("create", () => {
    test("insere ra e name em students com $1 e $2 e retorna a linha devolvida", async () => {
      const row: Student = { ra: 123, name: "Ana" };
      query.mockResolvedValue({ rows: [row] });

      const result = await repository.create({ ra: 123, name: "Ana" });

      expect(result).toEqual(row);
      expect(query).toHaveBeenCalledTimes(1);
      const [sql, params] = query.mock.calls[0];
      expect(normalizeSql(sql)).toBe(
        "INSERT INTO students (ra, name) VALUES ($1, $2) RETURNING ra, name",
      );
      expect(params).toEqual([123, "Ana"]);
    });

    test("propaga a mesma instância de Error quando query falha", async () => {
      const failure = new Error("falha no banco");
      query.mockRejectedValue(failure);

      await expect(repository.create({ ra: 123, name: "Ana" })).rejects.toBe(
        failure,
      );
    });
  });

  describe("findAll", () => {
    test("seleciona ra e name ordenados por name, sem parâmetros, e retorna as linhas", async () => {
      const rows: Student[] = [
        { ra: 123, name: "Ana" },
        { ra: 456, name: "Bruno" },
      ];
      query.mockResolvedValue({ rows });

      const result = await repository.findAll();

      expect(result).toEqual(rows);
      expect(query).toHaveBeenCalledTimes(1);
      expect(query.mock.calls[0]).toHaveLength(1);
      expect(normalizeSql(query.mock.calls[0][0])).toBe(
        "SELECT ra, name FROM students ORDER BY name",
      );
    });

    test("retorna lista vazia quando rows é vazio", async () => {
      query.mockResolvedValue({ rows: [] });

      await expect(repository.findAll()).resolves.toEqual([]);
    });

    test("propaga a mesma instância de Error quando query falha", async () => {
      const failure = new Error("falha no banco");
      query.mockRejectedValue(failure);

      await expect(repository.findAll()).rejects.toBe(failure);
    });
  });

  describe("findOne", () => {
    test("filtra por ra = $1 com [123] e retorna a primeira linha", async () => {
      const row: Student = { ra: 123, name: "Ana" };
      query.mockResolvedValue({ rows: [row] });

      const result = await repository.findOne(123);

      expect(result).toEqual(row);
      expect(query).toHaveBeenCalledTimes(1);
      const [sql, params] = query.mock.calls[0];
      expect(normalizeSql(sql)).toBe(
        "SELECT ra, name FROM students WHERE ra = $1",
      );
      expect(params).toEqual([123]);
    });

    test("retorna undefined quando rows é vazio", async () => {
      query.mockResolvedValue({ rows: [] });

      await expect(repository.findOne(123)).resolves.toBeUndefined();
    });

    test("propaga a mesma instância de Error quando query falha", async () => {
      const failure = new Error("falha no banco");
      query.mockRejectedValue(failure);

      await expect(repository.findOne(123)).rejects.toBe(failure);
    });
  });
});
