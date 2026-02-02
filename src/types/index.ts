/**
 * 共通の型定義
 */

// API レスポンスの基本型
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

// ページネーション
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ページネーション付きレスポンス
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: Pagination;
}

// ユーザーの基本型（例）
export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}
