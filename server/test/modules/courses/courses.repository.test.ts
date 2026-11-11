import type { Database } from "../../../src/database/connection";
import {
  PgCourseRepository,
  type Course,
} from "../../../src/modules/courses/courses.repository";

function normalizeSql(sql: unknown) {
  return String(sql).replace(/\s+/g, " ").trim();
}

describe("PgCourseRepository", () => {
  let query: jest.Mock;
  let repository: PgCourseRepository;

  beforeEach(() => {
    query = jest.fn();
    const db: Database = { query };
    repository = new PgCourseRepository(db);
  });

  describe("create", () => {
    test("insere o nome em courses com $1 e retorna a linha devolvida", async () => {
      const row: Course = { id: 1, name: "Qualidade" };
      query.mockResolvedValue({ rows: [row] });

      const result = await repository.create({ name: "Qualidade" });

      expect(result).toEqual(row);
      expect(query).toHaveBeenCalledTimes(1);
      const [sql, params] = query.mock.calls[0];
      expect(normalizeSql(sql)).toBe(
        "INSERT INTO courses (name) VALUES ($1) RETURNING id, name",
      );
      expect(params).toEqual(["Qualidade"]);
    });

    test("propaga a mesma instância de Error quando query falha", async () => {
      const failure = new Error("falha no banco");
      query.mockRejectedValue(failure);

      await expect(repository.create({ name: "Qualidade" })).rejects.toBe(
        failure,
      );
    });
  });

  describe("findAll", () => {
    test("seleciona id e name ordenados por id, sem parâmetros, e retorna as linhas", async () => {
      const rows: Course[] = [
        { id: 1, name: "Qualidade" },
        { id: 2, name: "Testes" },
      ];
      query.mockResolvedValue({ rows });

      const result = await repository.findAll();

      expect(result).toEqual(rows);
      expect(query).toHaveBeenCalledTimes(1);
      expect(query.mock.calls[0]).toHaveLength(1);
      expect(normalizeSql(query.mock.calls[0][0])).toBe(
        "SELECT id, name FROM courses ORDER BY id",
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
    test("filtra por id = $1 com [7] e retorna a primeira linha", async () => {
      const row: Course = { id: 7, name: "Qualidade" };
      query.mockResolvedValue({ rows: [row] });

      const result = await repository.findOne(7);

      expect(result).toEqual(row);
      expect(query).toHaveBeenCalledTimes(1);
      const [sql, params] = query.mock.calls[0];
      expect(normalizeSql(sql)).toBe(
        "SELECT id, name FROM courses WHERE id = $1",
      );
      expect(params).toEqual([7]);
    });

    test("retorna undefined quando rows é vazio", async () => {
      query.mockResolvedValue({ rows: [] });

      await expect(repository.findOne(7)).resolves.toBeUndefined();
    });

    test("propaga a mesma instância de Error quando query falha", async () => {
      const failure = new Error("falha no banco");
      query.mockRejectedValue(failure);

      await expect(repository.findOne(7)).rejects.toBe(failure);
    });
  });
});
