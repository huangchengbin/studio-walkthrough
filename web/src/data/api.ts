// 后端接口封装（未启动时各调用方降级到本地模式）

const TOKEN_KEY = 'lm-token'

export const getToken = () => localStorage.getItem(TOKEN_KEY) || ''
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t)
export const clearToken = () => localStorage.removeItem(TOKEN_KEY)

export class ApiOffline extends Error {}

async function req<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(url, init)
  } catch {
    throw new ApiOffline('服务未启动')
  }
  if (res.status === 401) {
    clearToken()
    throw new Error('未登录或登录已过期')
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error || `请求失败（${res.status}）`)
  }
  return res.json() as Promise<T>
}

export async function apiLogin(account: string, password: string) {
  const data = await req<{ token: string }>('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account, password }),
  })
  setToken(data.token)
  return data
}

export const apiGetLayout = () => req<Record<string, unknown>>('/api/layout')

export const apiPutLayout = (layout: unknown) =>
  req<{ ok: boolean }>('/api/layout', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify(layout),
  })

export interface RemoteAsset { model: string | null; photo: string | null }

export const apiGetAssets = () => req<Record<string, RemoteAsset>>('/api/assets')

async function upload(id: string, kind: 'model' | 'photo', file: File) {
  const fd = new FormData()
  fd.append('file', file)
  return req<{ url: string }>(`/api/assets/${id}/${kind}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${getToken()}` },
    body: fd,
  })
}

export const apiUploadModel = (id: string, file: File) => upload(id, 'model', file)
export const apiUploadPhoto = (id: string, file: File) => upload(id, 'photo', file)

export const apiResetAsset = (id: string) =>
  req<{ ok: boolean }>(`/api/assets/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${getToken()}` },
  })
