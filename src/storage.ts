import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'

export const STORAGE_PREFIX = 'hayko:'

export function useStoredState<T>(
  key: string,
  fallback: T
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const data = window.localStorage.getItem(STORAGE_PREFIX + key)
      return data === null ? fallback : JSON.parse(data) as T
    } catch {
      return fallback
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value))
    } catch {
      // Browsers can disable or exhaust local storage.
    }
  }, [key, value])

  return [value, setValue]
}
