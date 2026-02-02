/**
 * API呼び出し用のユーティリティ
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

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
    throw new Error(`API error: ${response.status} ${response.statusText}`);
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
