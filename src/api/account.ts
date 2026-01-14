import { get, post } from '@/services/request'

export interface SignInParams {
  account: string
  cashierJobNumber: string
  password: string
}

export interface CheckPoint {
  Text: string
  Value: string
}

export interface SignInResult {
  CheckPoints: CheckPoint[]
  BaseUrl: string
  CashierName: string
}

export async function signIn(params: SignInParams): Promise<SignInResult> {
  return post<SignInResult>('/TMSH5/Account/SignIn', params)
}

export interface CheckPointSignInParams extends SignInParams {
  checkPointUid: string
}

export type CheckPointSignInResult = Record<string, unknown>

export async function checkPointSignIn(
  params: CheckPointSignInParams,
): Promise<CheckPointSignInResult> {
  return post<CheckPointSignInResult>('/TMSH5/Account/CheckPointSignIn', params)
}

export interface GetUserTokenUser {
  userId: number
  account: string
  areaId: string
  industry: string
  createdDatetime: string
}

export interface GetUserTokenResult {
  token: string
  user: GetUserTokenUser
}

/**
 * 获取当前云端登录用户的 Token 和基础信息
 * 接口依赖云端的 Cookie 做鉴权，不需要额外参数
 */
export async function getUserToken(): Promise<GetUserTokenResult> {
  return post<GetUserTokenResult>('/Account/GetUserToken')
}
