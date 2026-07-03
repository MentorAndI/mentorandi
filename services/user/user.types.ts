export interface UserDto {
  authUserId: string;
  createdAt: string;
  id: string;
  updatedAt: string;
}

export interface UserValidationResult<TInput> {
  errors: Record<string, string>;
  input?: TInput;
  isValid: boolean;
}

export interface AuthUserIdInput {
  authUserId: string;
}
