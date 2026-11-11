import { HttpError } from "../../../src/errors";
import type {
  Enrollment,
  EnrollmentRepository,
} from "../../../src/modules/enrollments/enrollments.repository";
import { EnrollmentsService } from "../../../src/modules/enrollments/enrollments.service";

async function expectHttpError(promise: Promise<unknown>, statusCode: number) {
  const error: unknown = await promise.then(
    () => undefined,
    (reason: unknown) => reason,
  );
  expect(error).toBeInstanceOf(HttpError);
  expect(error).toMatchObject({ statusCode });
}

describe("EnrollmentsService", () => {
  const enrolledAt = new Date("2026-01-15T12:00:00.000Z");
  let repository: jest.Mocked<EnrollmentRepository>;
  let service: EnrollmentsService;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
    };
    service = new EnrollmentsService(repository);
  });

  describe("create", () => {
    test("retorna a matrícula criada e chama repository.create com 123 e 1, nessa ordem", async () => {
      const created: Enrollment = { studentRa: 123, courseId: 1, enrolledAt };
      repository.create.mockResolvedValue(created);

      const result = await service.create({ studentRa: 123, courseId: 1 });

      expect(result).toEqual(created);
      expect(repository.create).toHaveBeenCalledTimes(1);
      expect(repository.create).toHaveBeenCalledWith(123, 1);
    });

    test.each([
      ["studentRa 0", { studentRa: 0, courseId: 1 }],
      ["courseId 0", { studentRa: 123, courseId: 0 }],
    ])(
      "lança erro 400 e não chama repository.create para %s",
      async (_label, input) => {
        await expectHttpError(service.create(input), 400);

        expect(repository.create).not.toHaveBeenCalled();
      },
    );

    test("lança erro 404 quando o repositório rejeita com violação de chave estrangeira", async () => {
      repository.create.mockRejectedValue({ code: "23503" });

      await expectHttpError(
        service.create({ studentRa: 123, courseId: 1 }),
        404,
      );
    });

    test("lança erro 409 quando o repositório rejeita com violação de unicidade", async () => {
      repository.create.mockRejectedValue({ code: "23505" });

      await expectHttpError(
        service.create({ studentRa: 123, courseId: 1 }),
        409,
      );
    });

    test("propaga a mesma instância de Error quando repository.create falha", async () => {
      const failure = new Error("falha inesperada");
      repository.create.mockRejectedValue(failure);

      await expect(
        service.create({ studentRa: 123, courseId: 1 }),
      ).rejects.toBe(failure);
    });
  });

  describe("findAll", () => {
    test("retorna a lista de matrículas e chama repository.findAll uma única vez sem argumentos", async () => {
      const enrollments: Enrollment[] = [
        { studentRa: 123, courseId: 1, enrolledAt },
        { studentRa: 123, courseId: 2, enrolledAt },
      ];
      repository.findAll.mockResolvedValue(enrollments);

      const result = await service.findAll();

      expect(result).toEqual(enrollments);
      expect(repository.findAll).toHaveBeenCalledTimes(1);
      expect(repository.findAll).toHaveBeenCalledWith();
    });
  });

  describe("findOne", () => {
    test("retorna a matrícula existente e chama repository.findOne uma única vez com 123 e 1", async () => {
      const enrollment: Enrollment = { studentRa: 123, courseId: 1, enrolledAt };
      repository.findOne.mockResolvedValue(enrollment);

      const result = await service.findOne(123, 1);

      expect(result).toEqual(enrollment);
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.findOne).toHaveBeenCalledWith(123, 1);
    });

    test("lança erro 404 quando o repositório retorna undefined e encaminha 123 e 1 na ordem correta", async () => {
      repository.findOne.mockResolvedValue(undefined);

      await expectHttpError(service.findOne(123, 1), 404);

      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.findOne).toHaveBeenCalledWith(123, 1);
    });
  });
});
