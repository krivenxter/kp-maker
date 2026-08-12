export function safeClientName(value: string) {
  return value.trim().replace(/[^a-zа-яё0-9_-]+/gi, '-').replace(/^-|-$/g, '') || 'client';
}

