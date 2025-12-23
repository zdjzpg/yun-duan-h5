import { post } from '@/services/request'

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
