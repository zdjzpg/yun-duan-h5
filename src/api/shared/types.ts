 /**
 * API 公共类型定义
 * 包含 API 响应结构、分页相关类型等
 */

import type { ApiResponseCode } from "./response-codes";

/**
 * 统一 API 响应结构
 * @template T - 响应数据的类型
 */
export type ApiResponse<T = any> = {
  /** 状态码：使用 ApiResponseCode 常量 */
  code: ApiResponseCode;
  /** 响应消息 */
  message: string;
  /** 响应数据 */
  data: T;
};

/**
 * 分页请求参数
 */
export type PaginationRequest = {
  /** 当前页码，从 1 开始 */
  page: number;
  /** 每页数量 */
  pageSize: number;
};

/**
 * 分页响应数据
 * @template T - 列表项的类型
 */
export type PaginationResponse<T> = {
  /** 数据列表 */
  list: T[];
  /** 总记录数 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  pageSize: number;
};

/**
 * 空响应（仅返回 code 和 message）
 */
export type EmptyResponse = null;
