import { HttpError } from "../../../src/errors";
import type {
  Course,
  CourseRepository,
} from "../../../src/modules/courses/courses.repository";
import { CoursesService } from "../../../src/modules/courses/courses.service";

async function expectHttpError(promise: Promise<unknown>, statusCode: number) {
  const error: unknown = await promise.then(
    () => undefined,
    (reason: unknown) => reason,
  );
  expect(error).toBeInstanceOf(HttpError);
  expect(error).toMatchObject({ statusCode });
}

describe("CoursesService", () => {
  let repository: jest.Mocked<CourseRepository>;
  let service: CoursesService;

  beforeEach(() => {
    repository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
    };
    service = new CoursesService(repository);
  });

  describe("create", () => {
    test("retorna o registro criado e chama repository.create uma única vez com os dados", async () => {
      const created: Course = { id: 1, name: "Qualidade" };
      repository.create.mockResolvedValue(created);

      const result = await service.create({ name: "Qualidade" });

      expect(result).toEqual(created);
      expect(repository.create).toHaveBeenCalledTimes(1);
      expect(repository.create).toHaveBeenCalledWith({ name: "Qualidade" });
    });

    test.each<[string, unknown]>([
      ["null", null],
      ["um objeto sem nome", {}],
      ['o nome curto "A"', { name: "A" }],
    ])(
      "lança erro 400 e não chama repository.create para %s",
      async (_label, input) => {
        await expectHttpError(service.create(input), 400);

        expect(repository.create).not.toHaveBeenCalled();
      },
    );

    test("lança erro 409 quando o repositório rejeita com violação de unicidade", async () => {
      repository.create.mockRejectedValue({ code: "23505" });

      await expectHttpError(service.create({ name: "Qualidade" }), 409);
    });

    test("envia ao repositório somente o nome quando o corpo tem campos extras", async () => {
      repository.create.mockResolvedValue({ id: 1, name: "Qualidade" });

      await service.create({ name: "Qualidade", extra: true });

      expect(repository.create).toHaveBeenCalledTimes(1);
      expect(repository.create).toHaveBeenCalledWith({ name: "Qualidade" });
    });

    test("propaga a mesma instância de Error quando repository.create falha", async () => {
      const failure = new Error("falha inesperada");
      repository.create.mockRejectedValue(failure);

      await expect(service.create({ name: "Qualidade" })).rejects.toBe(failure);
    });
  });

  describe("findAll", () => {
    test("retorna a lista preparada no stub e chama repository.findAll uma única vez", async () => {
      const courses: Course[] = [
        { id: 1, name: "Qualidade" },
        { id: 2, name: "Testes" },
      ];
      repository.findAll.mockResolvedValue(courses);

      const result = await service.findAll();

      expect(result).toEqual(courses);
      expect(repository.findAll).toHaveBeenCalledTimes(1);
    });

    test("propaga a mesma instância de Error quando repository.findAll falha", async () => {
      const failure = new Error("falha inesperada");
      repository.findAll.mockRejectedValue(failure);

      await expect(service.findAll()).rejects.toBe(failure);
    });
  });

  describe("findOne", () => {
    test("retorna o registro existente e encaminha o identificador ao repositório", async () => {
      const course: Course = { id: 123, name: "Qualidade" };
      repository.findOne.mockResolvedValue(course);

      const result = await service.findOne(123);

      expect(result).toEqual(course);
      expect(repository.findOne).toHaveBeenCalledTimes(1);
      expect(repository.findOne).toHaveBeenCalledWith(123);
    });

    test("lança erro 404 quando o repositório retorna undefined", async () => {
      repository.findOne.mockResolvedValue(undefined);

      await expectHttpError(service.findOne(123), 404);
    });

    test("lança erro 400 e não consulta o repositório para o identificador 0", async () => {
      await expectHttpError(service.findOne(0), 400);

      expect(repository.findOne).not.toHaveBeenCalled();
    });

    test("propaga a mesma instância de Error quando repository.findOne falha", async () => {
      const failure = new Error("falha inesperada");
      repository.findOne.mockRejectedValue(failure);

      await expect(service.findOne(123)).rejects.toBe(failure);
    });

    test("spy observa o findOne de um stub existente e recebe o identificador 1", async () => {
      const course: Course = { id: 1, name: "Qualidade" };
      const stub: CourseRepository = {
        create: async () => course,
        findAll: async () => [course],
        findOne: async () => course,
      };
      const findOneSpy = jest.spyOn(stub, "findOne");
      const serviceWithStub = new CoursesService(stub);

      const result = await serviceWithStub.findOne(1);

      expect(result).toEqual(course);
      expect(findOneSpy).toHaveBeenCalledTimes(1);
      expect(findOneSpy).toHaveBeenCalledWith(1);
    });
  });
});
