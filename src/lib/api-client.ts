import axios, { type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { z } from 'zod'

declare module 'axios' {
  interface AxiosRequestConfig {
    authenticated?: boolean
    authRetried?: boolean
  }
}

const AUTH_PATH = '/api/v1/auth'
const AUTH_REQUEST_HEADER = 'X-Auth-Request'
const AUTH_ENDPOINTS = ['login', 'refresh', 'logout']

export const accessTokenEnvelope = z.object({
  data: z.object({
    token: z.string().min(1),
    tokenType: z.literal('Bearer'),
    expiresIn: z.number().int().positive(),
  }),
})

type Session = {
  token: string | null
  generation: number
  autoRefresh: boolean
  refresh: Promise<string | null> | null
}

const session: Session = { token: null, generation: 0, autoRefresh: false, refresh: null }

export function createApiClient(baseURL: string): AxiosInstance {
  const result = z.url().safeParse(baseURL)

  if (!result.success) {
    throw new Error('Configure VITE_API_BASE_URL com uma URL valida.')
  }

  const apiUrl = new URL(result.data)
  const root = new URL(apiUrl.href.replace(/\/?$/, '/'))
  const authPaths = new Set(AUTH_ENDPOINTS.map((endpoint) => new URL(`${AUTH_PATH.slice(1)}/${endpoint}`, root).pathname))
  const isSameOrigin = (target: URL) => target.origin === apiUrl.origin

  const client = axios.create({
    baseURL: result.data,
    timeout: 10_000,
    headers: { 'Content-Type': 'application/json' },
  })

  const isAuthPost = (config: InternalAxiosRequestConfig, target: URL) =>
    config.method?.toLowerCase() === 'post' && authPaths.has(target.pathname)

  // Credenciais e Bearer só saem para a API configurada e apenas em chamadas marcadas como autenticadas.
  client.interceptors.request.use((config) => {
    const target = resolveTarget(config, root)
    const sameApi = isSameOrigin(target)
    const authPost = isAuthPost(config, target)

    config.withCredentials = sameApi && (config.authenticated === true || authPost)

    if (!sameApi) {
      config.headers.delete('Authorization')
      return config
    }

    if (authPost) {
      config.headers.set(AUTH_REQUEST_HEADER, '1')
      config.headers.delete('Authorization')
      return config
    }

    if (config.authenticated === true && session.token) {
      config.headers.set('Authorization', `Bearer ${session.token}`)
    } else {
      config.headers.delete('Authorization')
    }
    return config
  })

  client.interceptors.response.use(undefined, async (error: unknown) => {
    if (!isHttpStatus(error, 401)) throw error

    const config = error.config
    if (!config || config.authRetried || config.authenticated !== true || !session.autoRefresh) throw error

    const target = resolveTarget(config, root)
    if (!isSameOrigin(target) || isAuthPost(config, target)) throw error

    const generation = session.generation
    const sentToken = String(config.headers.get('Authorization') ?? '').replace(/^Bearer /, '') || null
    const token = session.token && session.token !== sentToken
      ? session.token
      : await refreshAccessToken(client)

    if (!token || !isCurrentSession(generation)) throw error

    return client.request({ ...config, authRetried: true })
  })

  return client
}

const configuredBaseURL = import.meta.env.VITE_API_BASE_URL

if (!configuredBaseURL) {
  throw new Error('VITE_API_BASE_URL must be configured before starting the frontend.')
}

export const apiClient = createApiClient(configuredBaseURL)

export function getSessionGeneration() {
  return session.generation
}

function isCurrentSession(generation: number) {
  return generation === session.generation
}

function isHttpStatus(error: unknown, status: number) {
  return axios.isAxiosError(error) && error.response?.status === status
}

// Retorna false quando a sessao foi invalidada depois de a operacao comecar.
export function setAccessToken(token: string | null, generation = session.generation): boolean {
  if (!isCurrentSession(generation)) return false
  session.token = token
  return true
}

export function enableAutoRefresh() {
  session.autoRefresh = true
}

export function invalidateSession() {
  session.generation += 1
  session.token = null
  session.refresh = null
  session.autoRefresh = false
}

// Compartilha um unico refresh em voo; chamadas concorrentes recebem o mesmo resultado.
export function refreshAccessToken(client: AxiosInstance = apiClient): Promise<string | null> {
  if (!session.refresh) {
    const generation = session.generation
    const pending: Promise<string | null> = requestRefresh(client, generation).finally(() => {
      if (session.refresh === pending) session.refresh = null
    })
    session.refresh = pending
  }
  return session.refresh
}

async function requestRefresh(client: AxiosInstance, generation: number): Promise<string | null> {
  try {
    const response: AxiosResponse<unknown> = await client.post(`${AUTH_PATH}/refresh`)
    const { token } = accessTokenEnvelope.parse(response.data).data
    if (!isCurrentSession(generation)) return null
    session.token = token
    return token
  } catch (error) {
    if (isHttpStatus(error, 401)) {
      if (generation === session.generation) session.token = null
      return null
    }
    throw error
  }
}

function resolveTarget(config: InternalAxiosRequestConfig, root: URL): URL {
  const url = config.url ?? ''
  if (/^[a-z][a-z\d+\-.]*:/i.test(url)) return new URL(url)
  return new URL(url.replace(/^\/+/, ''), root)
}
    