import { apiBaseUrl } from './config';

export type AuthMeResponse = {
  id: string;
  authenticated: true;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function fetchAuthMe(token: string): Promise<AuthMeResponse> {
  const response = await fetch(`${apiBaseUrl}/auth/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (response.status === 401) {
    throw new ApiError('Unauthorized', 401);
  }

  if (!response.ok) {
    throw new ApiError(`Request failed with status ${response.status}`, response.status);
  }

  return (await response.json()) as AuthMeResponse;
}
