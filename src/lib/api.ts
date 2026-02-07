/**
 * API呼び出し用のユーティリティ
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface FetchOptions extends RequestInit {
  params?: Record<string, string>;
}

/**
 * 汎用的なfetchラッパー
 */
export async function fetcher<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const { params, ...fetchOptions } = options;

  let url = `${API_BASE_URL}${endpoint}`;

  if (params) {
    const searchParams = new URLSearchParams(params);
    url += `?${searchParams.toString()}`;
  }

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...fetchOptions.headers,
    },
    ...fetchOptions,
  });

  if (!response.ok) {
    let errorMessage = `API error: ${response.status}`;
    try {
      const data = await response.json();
      if (data?.error) errorMessage = data.error;
    } catch {
      // JSONパース失敗時はデフォルトメッセージを使用
    }
    throw new ApiError(errorMessage, response.status);
  }

  return response.json();
}

/**
 * GET リクエスト
 */
export async function get<T>(
  endpoint: string,
  params?: Record<string, string>
): Promise<T> {
  return fetcher<T>(endpoint, { method: "GET", params });
}

/**
 * POST リクエスト
 */
export async function post<T>(endpoint: string, data?: unknown): Promise<T> {
  return fetcher<T>(endpoint, {
    method: "POST",
    body: data ? JSON.stringify(data) : undefined,
  });
}
