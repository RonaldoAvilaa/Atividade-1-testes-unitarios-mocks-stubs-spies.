import { HttpError } from "../../../src/errors";
import type {
  Student,
  StudentRepository,
} from "../../../src/modules/students/students.repository";
import { StudentsService } from "../../../src/modules/students/students.service";

async function expectHttpError(promise: Promise<unknown>, statusCode: number) {
  const error: unknown = await promise.then(
    () => undefined,
    (reason: unknown) => reason,
  );
  expect(error).toBeInstanceOf(HttpError);
  expect(error).toMatchObject({ statusCode });
}

describe("StudentsService", () => {
  let repository: jest.Mocked<StudentRepository>;
  let service: StudentsService;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
    };
    service = new StudentsService(repository);
  });

  describe("create", () => {
    test("retorna o registro criado e encaminha os dados a repository.create", async () => {
      const created: Student = { ra: 123, name: "Ana" };
      repository.create.mockResolvedValue(created);

      const result = await service.create({ ra: 123, name: "Ana" });

      expect(result).toEqual(created);
      expect(repository.create).toHaveBeenCalledTimes(1);
      expect(repository.create).toHaveBeenCalledWith({ ra: 123, name: "Ana" });
    });

    test("lança erro 400 e não chama repository.create para o RA 0", async () => {
      await expectHttpError(service.create({ ra: 0, name: "Ana" }), 400);

      expect(repository.create).not.toHaveBeenCalled();
    });

    test("lança erro 409 quando o repositório rejeita com violação de unicidade", async () => {
      repository.create.mockRejectedValue({ code: "23505" });

      await expectHttpError(service.create({ ra: 123, name: "Ana" }), 409);
    });

    test("propaga a mesma instância de Error quando repository.create falha", async () => {
      const failure = new Error("falha inesperada");
      repository.create.mockRejectedValue(failure);

      await expect(service.create({ ra: 123, name: "Ana" })).rejects.toBe(
        failure,
      );
    });
  });

  describe("findAll", () => {
    test("retorna a lista de alunos e chama repository.findAll uma única vez sem argumentos", async () => {
      const students: Student[] = [
        { ra: 123, name: "Ana" },
        { ra: 456, name: "Bruno" },
      ];
      repository.findAll.mockResolvedValue(students);

      const result = await service.findAll();

      expect(result).toEqual(students);
      expect(repository.findAll).toHaveBeenCalledTimes(1);
      expect(repository.findAll).toHaveBeenCalledWith();
    });
  });

  describe("findOne", () => {
    test("retorna o aluno existente e chama repository.findOne uma única vez com o RA 123", async () => {
      const student: Student = { ra: 123, name: "Ana" };
      repository.findOne.mockResolvedValue(student);

      const result = await service.findOne(123);

      expect(result).toEqual(student);
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.findOne).toHaveBeenCalledWith(123);
    });

    test("lança erro 404 quando o repositório retorna undefined para o RA 123", async () => {
      repository.findOne.mockResolvedValue(undefined);

      await expectHttpError(service.findOne(123), 404);

      expect(repository.findOne).toHaveBeenCalledWith(123);
    });
  });
});
