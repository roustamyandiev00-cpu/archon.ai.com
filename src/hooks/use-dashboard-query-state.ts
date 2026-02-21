import { type Dispatch, type SetStateAction, useEffect, useState } from 'react'

function replaceQueryParam(key: string, nextValue: string | null) {
  if (typeof window === 'undefined') return

  const url = new URL(window.location.href)
  const currentValue = url.searchParams.get(key)

  if (nextValue === null || nextValue === '') {
    if (currentValue === null) return
    url.searchParams.delete(key)
  } else {
    if (currentValue === nextValue) return
    url.searchParams.set(key, nextValue)
  }

  window.history.replaceState({}, '', url.toString())
}

export function useDashboardQueryEnum<const T extends string>(
  key: string,
  defaultValue: T,
  allowedValues: readonly T[]
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(defaultValue)
  const allowedSignature = allowedValues.join('|')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const allowedSet = new Set(allowedSignature.split('|'))

    const syncFromUrl = () => {
      const raw = new URLSearchParams(window.location.search).get(key)
      if (!raw) {
        setValue((current) => (current === defaultValue ? current : defaultValue))
        return
      }

      const nextValue = allowedSet.has(raw) ? (raw as T) : defaultValue
      setValue((current) => (current === nextValue ? current : nextValue))
    }

    syncFromUrl()
    window.addEventListener('popstate', syncFromUrl)
    return () => window.removeEventListener('popstate', syncFromUrl)
  }, [allowedSignature, defaultValue, key])

  useEffect(() => {
    if (value === defaultValue) {
      replaceQueryParam(key, null)
      return
    }
    replaceQueryParam(key, value)
  }, [defaultValue, key, value])

  return [value, setValue]
}

export function useDashboardQueryText(
  key: string,
  defaultValue = ''
): [string, Dispatch<SetStateAction<string>>] {
  const [value, setValue] = useState(defaultValue)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const syncFromUrl = () => {
      const raw = new URLSearchParams(window.location.search).get(key)
      const nextValue = raw ?? defaultValue
      setValue((current) => (current === nextValue ? current : nextValue))
    }

    syncFromUrl()
    window.addEventListener('popstate', syncFromUrl)
    return () => window.removeEventListener('popstate', syncFromUrl)
  }, [defaultValue, key])

  useEffect(() => {
    if (value === defaultValue) {
      replaceQueryParam(key, null)
      return
    }
    replaceQueryParam(key, value)
  }, [defaultValue, key, value])

  return [value, setValue]
}

export function useDashboardQueryNumber(
  key: string,
  defaultValue: number,
  options?: { min?: number; max?: number }
): [number, Dispatch<SetStateAction<number>>] {
  const [value, setValue] = useState(defaultValue)
  const min = options?.min ?? Number.MIN_SAFE_INTEGER
  const max = options?.max ?? Number.MAX_SAFE_INTEGER

  useEffect(() => {
    if (typeof window === 'undefined') return

    const syncFromUrl = () => {
      const raw = new URLSearchParams(window.location.search).get(key)
      if (raw == null) {
        setValue((current) => (current === defaultValue ? current : defaultValue))
        return
      }

      const parsed = Number.parseInt(raw, 10)
      if (!Number.isFinite(parsed)) return

      const clamped = Math.max(min, Math.min(max, parsed))
      setValue((current) => (current === clamped ? current : clamped))
    }

    syncFromUrl()
    window.addEventListener('popstate', syncFromUrl)
    return () => window.removeEventListener('popstate', syncFromUrl)
  }, [defaultValue, key, max, min])

  useEffect(() => {
    if (value === defaultValue) {
      replaceQueryParam(key, null)
      return
    }
    replaceQueryParam(key, String(value))
  }, [defaultValue, key, value])

  return [value, setValue]
}
