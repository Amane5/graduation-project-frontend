import {
  buildAuthHeaders,
  fetchWithSession,
} from "./auth-session";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

export type ApiResponse<DATA = unknown> = {
  statusCode: number;
  message: string;
  success: boolean;
  data: DATA;
};

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type ErrorResponse = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

const parseJsonSafely = async <T>(response: Response) => {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
};

const getErrorMessage = (status: number) => {
  switch (status) {
    case 400:
      return "Bad request";
    case 401:
      return "Unauthorized - please login again";
    case 403:
      return "Forbidden";
    case 404:
      return "Not found";
    case 409:
      return "Already exists";
    case 422:
      return "Validation error (check your inputs)";
    case 500:
      return "Server error";
    default:
      return "Something went wrong";
  }
};

const throwApiError = async (response: Response) => {
  const data = await parseJsonSafely<ErrorResponse>(response);
  const message = Array.isArray(data?.message)
    ? data.message.join(", ")
    : data?.message || getErrorMessage(response.status);

  throw new ApiError(response.status, message);
};

const buildJsonHeaders = (headers?: HeadersInit) => {
  const nextHeaders = buildAuthHeaders(headers);
  nextHeaders.set("Content-Type", "application/json");
  return nextHeaders;
};

const request = async <TResponse>(
  url: string,
  init: RequestInit = {},
) => {
  const response = await fetchWithSession(`${API}${url}`, init);

  if (!response.ok) {
    await throwApiError(response);
  }

  if (response.status === 204) {
    return null as TResponse;
  }

  const data = await parseJsonSafely<TResponse>(response);

  return data as TResponse;
};

const http = {
  post: async <TResponse, TBody = unknown>(
    url: string,
    body?: TBody,
  ): Promise<TResponse> =>
    request<TResponse>(url, {
      method: "POST",
      headers: buildJsonHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    }),

  get: async <TResponse>(url: string): Promise<TResponse> =>
    request<TResponse>(url, {
      method: "GET",
      headers: buildJsonHeaders(),
    }),

  put: async <TResponse, TBody = unknown>(
    url: string,
    body?: TBody,
  ): Promise<TResponse> =>
    request<TResponse>(url, {
      method: "PUT",
      headers: buildJsonHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: async <TResponse>(url: string): Promise<TResponse> =>
    request<TResponse>(url, {
      method: "DELETE",
      headers: buildJsonHeaders(),
    }),
};

export default http;
