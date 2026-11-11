import type { Database } from "../../../src/database/connection";
import {
  PgEnrollmentRepository,
  type Enrollment,
} from "../../../src/modules/enrollments/enrollments.repository";

function normalizeSql(sql: unknown) {
  return String(sql).replace(/\s+/g, " ").trim();
}

const columns =
  'student_ra AS "studentRa", course_id AS "courseId", enrolled_at AS "enrolledAt"';

describe("PgEnrollmentRepository", () => {
  const enrolledAt = new Date("2026-01-15T12:00:00.000Z");
  let query: jest.Mock;
  let repository: PgEnrollmentRepository;

  beforeEach(() => {
    query = jest.fn();
    const db: Database = { query };
    repository = new PgEnrollmentRepository(db);
  });

  describe("create", () => {
    test("insere student_ra e course_id com $1 e $2 e retorna a linha em camelCase", async () => {
      const row: Enrollment = { studentRa: 123, courseId: 7, enrolledAt };
      query.mockResolvedValue({ rows: [row] });

      const result = await repository.create(123, 7);

      expect(result).toEqual({ studentRa: 123, courseId: 7, enrolledAt });
      expect(result.enrolledAt).toBe(enrolledAt);
      expect(query).toHaveBeenCalledTimes(1);
      const [sql, params] = query.mock.calls[0];
      expect(normalizeSql(sql)).toBe(
        `INSERT INTO enrollments (student_ra, course_id) VALUES ($1, $2) RETURNING ${columns}`,
      );
      expect(params).toEqual([123, 7]);
    });

    test("propaga a mesma instância de Error quando query falha", async () => {
      const failure = new Error("falha no banco");
      query.mockRejectedValue(failure);

      await expect(repository.create(123, 7)).rejects.toBe(failure);
    });
  });

  describe("findAll", () => {
    test("seleciona os campos com aliases ordenados por student_ra e course_id, sem parâmetros", async () => {
      const rows: Enrollment[] = [
        { studentRa: 123, courseId: 7, enrolledAt },
        { studentRa: 123, courseId: 8, enrolledAt },
      ];
      query.mockResolvedValue({ rows });

      const result = await repository.findAll();

      expect(result).toEqual([
        { studentRa: 123, courseId: 7, enrolledAt },
        { studentRa: 123, courseId: 8, enrolledAt },
      ]);
      expect(query).toHaveBeenCalledTimes(1);
      expect(query.mock.calls[0]).toHaveLength(1);
      expect(normalizeSql(query.mock.calls[0][0])).toBe(
        `SELECT ${columns} FROM enrollments ORDER BY student_ra, course_id`,
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
    test("filtra por student_ra = $1 AND course_id = $2 com [123, 7] e retorna a primeira linha em camelCase", async () => {
      const row: Enrollment = { studentRa: 123, courseId: 7, enrolledAt };
      query.mockResolvedValue({ rows: [row] });

      const result = await repository.findOne(123, 7);

      expect(result).toEqual({ studentRa: 123, courseId: 7, enrolledAt });
      expect(result?.enrolledAt).toBe(enrolledAt);
      expect(query).toHaveBeenCalledTimes(1);
      const [sql, params] = query.mock.calls[0];
      expect(normalizeSql(sql)).toBe(
        `SELECT ${columns} FROM enrollments WHERE student_ra = $1 AND course_id = $2`,
      );
      expect(params).toEqual([123, 7]);
    });

    test("retorna undefined quando rows é vazio", async () => {
      query.mockResolvedValue({ rows: [] });

      await expect(repository.findOne(123, 7)).resolves.toBeUndefined();
    });

    test("propaga a mesma instância de Error quando query falha", async () => {
      const failure = new Error("falha no banco");
      query.mockRejectedValue(failure);

      await expect(repository.findOne(123, 7)).rejects.toBe(failure);
    });
  });
});
