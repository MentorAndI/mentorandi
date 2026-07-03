export interface CreateReflectionInput {
  summary: string;
}

export interface ReflectionDto {
  createdAt: string;
  id: string;
  summary: string;
}

export interface ReflectionValidationResult<TInput> {
  errors: Record<string, string>;
  input?: TInput;
  isValid: boolean;
}
