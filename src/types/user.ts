/**
 * 用户相关类型定义
 * 
 * 📚 本文件定义系统中用户、员工、组织等核心类型
 * 可根据实际业务需求扩展字段
 * 
 * @module types/user
 */

import type { UserRole } from '../config/system';

/**
 * 组织/账号信息
 */
export interface Account {
  /** 账号 ID */
  id: string;
  
  /** 账号编号 */
  accountNumber: string;
  
  /** 组织名称 */
  organizationName: string;
  
  /** 组织 Logo */
  organizationLogo?: string;
  
  /** 国家 */
  country?: string;
  
  /** 省份 */
  province?: string;
  
  /** 城市 */
  city?: string;
  
  /** 区县 */
  district?: string;
  
  /** 详细地址 */
  address?: string;
  
  /** 创建时间 */
  createdAt: string;
}

/**
 * 员工信息
 */
export interface Employee {
  /** 员工 ID */
  id: string;
  
  /** 所属账号 ID */
  accountId: string;
  
  /** 员工编号 */
  employeeNumber: string;
  
  /** 姓名 */
  name: string;
  
  /** 手机号 */
  phone: string;
  
  /** 头像 */
  avatar?: string;
  
  /** 角色列表 */
  roles: UserRole[];
  
  /** 账号状态 */
  status: 'active' | 'inactive';
  
  /** 创建时间 */
  createdAt: string;
  
  /** 更新时间 */
  updatedAt: string;
}

/**
 * 当前用户信息
 */
export interface CurrentUser {
  /** 员工信息 */
  employee: Employee;
  
  /** 账号信息 */
  account: Account;
}

/**
 * 密码登录请求
 */
export interface PasswordLoginRequest {
  /** 账号编号 */
  accountNumber: string;
  
  /** 手机号 */
  phone: string;
  
  /** 密码 */
  password: string;
}

/**
 * 短信验证码登录请求
 */
export interface SmsLoginRequest {
  /** 账号编号 */
  accountNumber: string;
  
  /** 手机号 */
  phone: string;
  
  /** 验证码 */
  code: string;
}
