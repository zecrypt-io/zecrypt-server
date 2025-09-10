import { invoke } from '@tauri-apps/api/core'

export async function settingsGet(key: string): Promise<string | null> {
  const res = await invoke<{ success: boolean; data?: string | null; error?: string }>('settings_get', { key })
  if (!res || (res as any).success === false) {
    throw new Error((res as any).error || 'settings_get failed')
  }
  return (res as any).data ?? null
}

export async function settingsSet(key: string, value: string): Promise<void> {
  const res = await invoke<{ success: boolean; error?: string }>('settings_set', { key, value })
  if (!res || (res as any).success === false) {
    throw new Error((res as any).error || 'settings_set failed')
  }
}

export async function settingsDelete(key: string): Promise<void> {
  const res = await invoke<{ success: boolean; error?: string }>('settings_delete', { key })
  if (!res || (res as any).success === false) {
    throw new Error((res as any).error || 'settings_delete failed')
  }
}
