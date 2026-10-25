import {useCurrentUserStore} from '@/stores/current-user'
import {ApiError} from '@/data/api-error'

interface RequestOptions {
    method?: 'GET' | 'POST' | 'DELETE'
    query?: Record<string, string | number | undefined>
    body?: unknown
    signal?: AbortSignal
}

export function useAPI() {
    const user = useCurrentUserStore()
    const base = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

    async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
        const identity = user.selectedId
        const query = new URLSearchParams()
        for (const [key, value] of Object.entries(options.query ?? {})) {
            if (value !== undefined && value !== '') query.set(key, String(value))
        }
        const suffix = query.size ? '?' + query.toString() : ''
        let response: Response
        try {
            response = await fetch(base + path + suffix, {
                method: options.method ?? 'GET',
                headers: {
                    Accept: 'application/json',
                    'X-User-Id': identity,
                    ...(options.body === undefined ? {} : {'Content-Type': 'application/json'}),
                },
                body: options.body === undefined ? undefined : JSON.stringify(options.body),
                signal: options.signal,
            })
        } catch (cause) {
            if (options.signal?.aborted) throw cause
            throw new ApiError(0, 'Impossible de joindre le serveur. Vérifiez votre connexion puis réessayez.')
        }
        if (response.status === 204) return undefined as T
        let payload: unknown
        try {
            payload = await response.json()
        } catch (cause) {
            if (options.signal?.aborted) throw cause
            throw new ApiError(response.ok ? 502 : response.status,
                response.ok ? 'La réponse du serveur est invalide.' : 'Le serveur ne peut pas traiter la demande (' + response.status + ').')
        }
        if (!response.ok) {
            const body = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {}
            const message = typeof body.message === 'string' ? body.message :
                Array.isArray(body.message) ? body.message.filter(item => typeof item === 'string').join(' · ') : ''
            const errors = Array.isArray(body.errors) ? body.errors.flatMap(issue => {
                if (!issue || typeof issue !== 'object') return []
                const entry = issue as Record<string, unknown>
                return typeof entry.field === 'string' && typeof entry.message === 'string' ?
                    [{field: entry.field, message: entry.message}] : []
            }) : []
            throw new ApiError(response.status, message || 'La demande a échoué (' + response.status + ').', errors)
        }
        return payload as T
    }

    return {request}
}
