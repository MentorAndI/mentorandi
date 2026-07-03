import { createSupabaseServerClient } from "@/lib/supabase/server";
import { UserRepository } from "@/services/user/user.repository";
import type { UserDto } from "@/services/user/user.types";
import { validateAuthUserId } from "@/services/user/user.validators";

const developmentAuthUserId = "00000000-0000-0000-0000-000000000001";

export class UserServiceError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = "UserServiceError";
  }
}

export class UserService {
  constructor(private readonly repository = new UserRepository()) {}

  async getUserByAuthUserId(authUserId: string): Promise<UserDto | null> {
    const validatedAuthUserId = validateUserAuthId(authUserId);
    const user =
      await this.repository.findUserByAuthUserId(validatedAuthUserId);

    return user ? toUserDto(user) : null;
  }

  async getOrCreateUserByAuthUserId(authUserId: string): Promise<UserDto> {
    const validatedAuthUserId = validateUserAuthId(authUserId);
    const user =
      await this.repository.upsertUserByAuthUserId(validatedAuthUserId);

    return toUserDto(user);
  }

  async getDevelopmentUser(): Promise<UserDto> {
    if (process.env.NODE_ENV === "production") {
      throw new UserServiceError(
        "Development user fallback is disabled in production.",
        401,
      );
    }

    return this.getOrCreateUserByAuthUserId(developmentAuthUserId);
  }

  async resolveCurrentUser(): Promise<UserDto> {
    const authUserId = await this.getCurrentSupabaseAuthUserId();

    if (authUserId) {
      return this.getOrCreateUserByAuthUserId(authUserId);
    }

    if (process.env.NODE_ENV !== "production") {
      return this.getDevelopmentUser();
    }

    throw new UserServiceError("Unauthorized.", 401);
  }

  private async getCurrentSupabaseAuthUserId() {
    try {
      const supabase = await createSupabaseServerClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        return null;
      }

      return user.id;
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        return null;
      }

      if (error instanceof Error) {
        throw new UserServiceError(error.message, 500);
      }

      throw new UserServiceError("Unable to resolve authenticated user.", 500);
    }
  }
}

function validateUserAuthId(authUserId: string) {
  const validation = validateAuthUserId(authUserId);

  if (!validation.isValid || !validation.input) {
    throw new UserServiceError(
      `Invalid auth user ID: ${Object.values(validation.errors).join(" ")}`,
      400,
    );
  }

  return validation.input.authUserId;
}

function toUserDto(user: {
  authUserId: string;
  createdAt: Date;
  id: string;
  updatedAt: Date;
}): UserDto {
  return {
    authUserId: user.authUserId,
    createdAt: user.createdAt.toISOString(),
    id: user.id,
    updatedAt: user.updatedAt.toISOString(),
  };
}
