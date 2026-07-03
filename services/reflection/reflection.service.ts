import { ReflectionRepository } from "@/services/reflection/reflection.repository";
import type {
  CreateReflectionInput,
  ReflectionDto,
} from "@/services/reflection/reflection.types";
import { validateCreateReflectionInput } from "@/services/reflection/reflection.validators";

export class ReflectionServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "ReflectionServiceError";
  }
}

export class ReflectionService {
  constructor(private readonly repository = new ReflectionRepository()) {}

  async listRecentReflectionsForUserId(
    userId: string,
    limit: number,
  ): Promise<ReflectionDto[]> {
    await this.ensureUserById(userId);

    const reflections = await this.repository.findRecentReflectionsForUser(
      userId,
      limit,
    );

    return reflections.map(toReflectionDto);
  }

  async createReflectionForUserId(
    userId: string,
    input: CreateReflectionInput,
  ): Promise<ReflectionDto> {
    const validation = validateCreateReflectionInput(input);

    if (!validation.isValid || !validation.input) {
      throw new ReflectionServiceError(
        `Invalid reflection input: ${Object.values(validation.errors).join(" ")}`,
        400,
      );
    }

    await this.ensureUserById(userId);

    const reflection = await this.repository.createReflectionForUser(
      userId,
      validation.input,
    );

    return toReflectionDto(reflection);
  }

  private async ensureUserById(userId: string) {
    const user = await this.repository.findUserById(userId);

    if (!user) {
      throw new ReflectionServiceError("User was not found.", 404);
    }

    return user;
  }
}

function toReflectionDto(reflection: {
  createdAt: Date;
  id: string;
  summary: string;
}): ReflectionDto {
  return {
    createdAt: reflection.createdAt.toISOString(),
    id: reflection.id,
    summary: reflection.summary,
  };
}
