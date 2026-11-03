import { AxiosError, type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  enableAutoRefresh,
  apiClient,
  createApiClient,
  getSessionGeneration,
  invalidateSession,
  refreshAccessToken,
  setAccessToken,
} from './api-client'

const API = 'http://api.test'
const EXTERNAL = 'https://external.test/data'
const TOKEN_BODY = { success: true, message: 'ok', data: { token: 'new', tokenType: 'Bearer', expiresIn: 900 } }

type Reply = { status: number; data?: unknown }
type Handler = (config: InternalAxiosRequestConfig) => Promise<Reply> | Reply

function routeAdapter(routes: Record<string, Handler>) {
  return async (config: InternalAxiosRequestConfig): Promise<AxiosResponse> => {
    const key = `${config.method?.toUpperCase()} ${config.url}`
    const handler = routes[key]
    if (!handler) throw new Error(`Requisicao inesperada: ${key}`)
    const { status, data } = await handler(config)
    const response = { data, status, statusText: '', headers: {}, config, request: {} } as AxiosResponse
    if (status >= 400) {
      throw new AxiosError(`Request failed with status code ${status}`, AxiosError.ERR_BAD_RESPONSE, config, {}, response)
    }
    return response
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((res) => {
    resolve = res
  })
  return { promise, resolve }
}

function networkError(config: InternalAxiosRequestConfig) {
  return new AxiosError('Network Error', AxiosError.ERR_NETWORK, config)
}

describe('api client — configuracao', () => {
  it('configura URL, timeout e cabecalhos', () => {
    const client = createApiClient('http://localhost:8080')

    expect(client.defaults.baseURL).toBe('http://localhost:8080')
    expect(client.defaults.timeout).toBe(10_000)
    expect(client.defaults.headers['Content-Type']).toBe('application/json')
  })

  it.each([undefined, '', 'not-a-url'])('rejeita configuracao invalida: %s', (url) => {
    expect(() => createApiClient(url as string)).toThrow('Configure VITE_API_BASE_URL')
  })

  it('exporta o cliente da loja com a URL do ambiente', () => {
    expect(apiClient.defaults.baseURL).toBe('http://localhost:8080')
  })
})

describe('transporte autenticado da loja', () => {
  let client: AxiosInstance
  let protectedHandler: Handler
  let refreshHandler: Handler
  let logoutHandler: Handler
  let refreshCalls: number

  const authorizedOnly: Handler = (config) =>
    config.headers.get('Authorization') === 'Bearer new' ? { status: 200, data: { ok: true } } : { status: 401 }

  const routes = (): Record<string, Handler> => ({
    'GET /api/v1/protected': (config) => protectedHandler(config),
    'POST /api/v1/auth/refresh': (config) => {
      refreshCalls += 1
      return refreshHandler(config)
    },
    'POST /api/v1/auth/logout': (config) => logoutHandler(config),
  })

  beforeEach(() => {
    invalidateSession()
    localStorage.clear()
    sessionStorage.clear()
    refreshCalls = 0
    protectedHandler = authorizedOnly
    refreshHandler = () => ({ status: 200, data: TOKEN_BODY })
    logoutHandler = () => ({ status: 200, data: {} })
    client = createApiClient(API)
    client.defaults.adapter = routeAdapter(routes()) as never
  })

  afterEach(() => {
    invalidateSession()
  })

  it('envia Bearer e credenciais apenas para chamadas autenticadas da API', async () => {
    const seen: Record<string, { auth: string | null; credentials: boolean | undefined }> = {}
    setAccessToken('new')
    protectedHandler = (config) => {
      seen[config.authenticated ? 'auth' : 'public'] = {
        auth: (config.headers.get('Authorization') as string | undefined) ?? null,
        credentials: config.withCredentials,
      }
      return { status: 200, data: {} }
    }

    await client.get('/api/v1/protected', { authenticated: true })
    await client.get('/api/v1/protected')

    expect(seen.auth).toEqual({ auth: 'Bearer new', credentials: true })
    expect(seen.public).toEqual({ auth: null, credentials: false })
  })

  it('compartilha um unico refresh entre 401 concorrentes e repete cada chamada no maximo uma vez', async () => {
    enableAutoRefresh()
    setAccessToken('old')
    const gate = deferred<void>()
    let protectedCalls = 0
    protectedHandler = (config) => {
      protectedCalls += 1
      return authorizedOnly(config)
    }
    refreshHandler = async () => {
      await gate.promise
      return { status: 200, data: TOKEN_BODY }
    }

    const first = client.get('/api/v1/protected', { authenticated: true })
    const second = client.get('/api/v1/protected', { authenticated: true })
    await vi.waitFor(() => expect(refreshCalls).toBe(1))
    gate.resolve()

    await expect(Promise.all([first, second])).resolves.toHaveLength(2)
    expect(refreshCalls).toBe(1)
    expect(protectedCalls).toBe(4)
  })

  it('nao repete novamente quando a chamada repetida recebe 401', async () => {
    enableAutoRefresh()
    setAccessToken('old')
    let protectedCalls = 0
    protectedHandler = () => {
      protectedCalls += 1
      return { status: 401 }
    }

    await expect(client.get('/api/v1/protected', { authenticated: true })).rejects.toMatchObject({
      response: { status: 401 },
    })
    expect(refreshCalls).toBe(1)
    expect(protectedCalls).toBe(2)
  })

  it.each([
    ['403', (): Reply => ({ status: 403 })],
    ['500', (): Reply => ({ status: 500 })],
  ])('nao renova nem repete em %s', async (_label, reply) => {
    enableAutoRefresh()
    setAccessToken('old')
    let protectedCalls = 0
    protectedHandler = () => {
      protectedCalls += 1
      return reply()
    }

    await expect(client.get('/api/v1/protected', { authenticated: true })).rejects.toBeInstanceOf(AxiosError)
    expect(refreshCalls).toBe(0)
    expect(protectedCalls).toBe(1)
  })

  it('nao renova nem repete em falha de rede', async () => {
    enableAutoRefresh()
    setAccessToken('old')
    protectedHandler = (config) => {
      throw networkError(config)
    }

    await expect(client.get('/api/v1/protected', { authenticated: true })).rejects.toMatchObject({
      code: 'ERR_NETWORK',
    })
    expect(refreshCalls).toBe(0)
  })

  it('consultas publicas nao renovam nem enviam Bearer mesmo com 401', async () => {
    enableAutoRefresh()
    setAccessToken('old')
    let authSeen: string | null | undefined
    protectedHandler = (config) => {
      authSeen = config.headers.get('Authorization') as string | null | undefined
      return { status: 401 }
    }

    await expect(client.get('/api/v1/protected')).rejects.toMatchObject({ response: { status: 401 } })
    expect(refreshCalls).toBe(0)
    expect(authSeen).toBeFalsy()
  })

  it.each(['login', 'logout'])('nao intercepta 401 de POST auth %s', async (endpoint) => {
    enableAutoRefresh()
    setAccessToken('old')
    logoutHandler = () => ({ status: 401 })
    client.defaults.adapter = routeAdapter({
      ...routes(),
      'POST /api/v1/auth/login': () => ({ status: 401 }),
    }) as never

    await expect(
      client.post(`/api/v1/auth/${endpoint}`, {}, { authenticated: true }),
    ).rejects.toMatchObject({ response: { status: 401 } })
    expect(refreshCalls).toBe(0)
  })

  it('protocolo completo: 401 com access antigo, refresh com cookie e X-Auth-Request, retry com access novo', async () => {
    enableAutoRefresh()
    setAccessToken('old')
    const trace: string[] = []
    protectedHandler = (config) => {
      trace.push(`GET protected ${config.headers.get('Authorization')}`)
      return authorizedOnly(config)
    }
    refreshHandler = (config) => {
      trace.push(
        `POST refresh xauth=${config.headers.get('X-Auth-Request')} auth=${config.headers.get('Authorization') ?? null} credentials=${config.withCredentials}`,
      )
      return { status: 200, data: TOKEN_BODY }
    }

    const response = await client.get('/api/v1/protected', { authenticated: true })

    expect(response.data).toEqual({ ok: true })
    expect(trace).toEqual([
      'GET protected Bearer old',
      'POST refresh xauth=1 auth=null credentials=true',
      'GET protected Bearer new',
    ])
  })

  it('limpa o access quando o refresh responde 401 e propaga o 401 original', async () => {
    enableAutoRefresh()
    setAccessToken('old')
    refreshHandler = () => ({ status: 401 })
    protectedHandler = () => ({ status: 401 })

    await expect(client.get('/api/v1/protected', { authenticated: true })).rejects.toMatchObject({
      response: { status: 401 },
    })
    expect(refreshCalls).toBe(1)
    await expect(refreshAccessToken(client)).resolves.toBeNull()
  })

  it('propaga falha de rede do refresh em vez de sessao valida', async () => {
    enableAutoRefresh()
    setAccessToken('old')
    refreshHandler = (config) => {
      throw networkError(config)
    }
    protectedHandler = () => ({ status: 401 })

    await expect(client.get('/api/v1/protected', { authenticated: true })).rejects.toMatchObject({
      code: 'ERR_NETWORK',
    })
  })

  it('descarta refresh tardio depois de invalidar a sessao e nao reabre o access', async () => {
    enableAutoRefresh()
    setAccessToken('old')
    const gate = deferred<void>()
    refreshHandler = async () => {
      await gate.promise
      return { status: 200, data: TOKEN_BODY }
    }
    protectedHandler = () => ({ status: 401 })

    const pending = client.get('/api/v1/protected', { authenticated: true })
    await vi.waitFor(() => expect(refreshCalls).toBe(1))
    invalidateSession()
    gate.resolve()

    await expect(pending).rejects.toMatchObject({ response: { status: 401 } })
    let authSeen: string | null | undefined = 'unset'
    refreshHandler = () => ({ status: 401 })
    protectedHandler = (config) => {
      authSeen = (config.headers.get('Authorization') as string | undefined) ?? null
      return { status: 401 }
    }
    await expect(client.get('/api/v1/protected', { authenticated: true })).rejects.toMatchObject({
      response: { status: 401 },
    })
    expect(authSeen).toBeFalsy()
    expect(refreshCalls).toBe(1)
  })

  it('nao renova automaticamente sem sessao autorizada', async () => {
    setAccessToken('old')
    protectedHandler = () => ({ status: 401 })

    await expect(client.get('/api/v1/protected', { authenticated: true })).rejects.toMatchObject({
      response: { status: 401 },
    })
    expect(refreshCalls).toBe(0)
  })

  it('nunca envia Bearer nem credenciais para destino externo', async () => {
    enableAutoRefresh()
    setAccessToken('new')
    const seen: { auth?: string | null; credentials?: boolean } = {}
    client.defaults.adapter = routeAdapter({
      ...routes(),
      [`GET ${EXTERNAL}`]: (config) => {
        seen.auth = (config.headers.get('Authorization') as string | undefined) ?? null
        seen.credentials = config.withCredentials
        return { status: 401 }
      },
    }) as never

    await expect(client.get(EXTERNAL, { authenticated: true })).rejects.toMatchObject({
      response: { status: 401 },
    })
    expect(seen).toEqual({ auth: null, credentials: false })
    expect(refreshCalls).toBe(0)
  })

  it('mantem tokens fora de Storage', async () => {
    enableAutoRefresh()
    setAccessToken('old')
    protectedHandler = (config) => (config.headers.get('Authorization') === 'Bearer new' ? { status: 200, data: {} } : { status: 401 })

    await client.get('/api/v1/protected', { authenticated: true })

    expect(localStorage.length).toBe(0)
    expect(sessionStorage.length).toBe(0)
  })

  it('controla geracao de access para descartar escritas tardias', () => {
    const generation = getSessionGeneration()
    invalidateSession()

    expect(setAccessToken('stale', generation)).toBe(false)
    expect(setAccessToken('fresh')).toBe(true)
  })
})

describe('consultas publicas da loja no cliente singleton', () => {
  it('catalogo e consultas publicas nao disparam POST de refresh', async () => {
    enableAutoRefresh()
    setAccessToken('old')
    const calls: string[] = []
    const previous = apiClient.defaults.adapter
    apiClient.defaults.adapter = routeAdapter({
      'GET /api/v1/catalog/products': () => {
        calls.push('GET /api/v1/catalog/products')
        return { status: 401 }
      },
      'POST /api/v1/auth/refresh': () => {
        calls.push('POST /api/v1/auth/refresh')
        return { status: 200, data: TOKEN_BODY }
      },
    }) as never

    try {
      await expect(apiClient.get('/api/v1/catalog/products')).rejects.toMatchObject({ response: { status: 401 } })
      expect(calls).toEqual(['GET /api/v1/catalog/products'])
    } finally {
      apiClient.defaults.adapter = previous
      invalidateSession()
    }
  })
})
