export const SAVED_CONTACTS_STORAGE_KEY = 'calltouch-saved-manager-contacts-v1';

export type SavedManagerContact = {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  email: string;
  phone: string;
  photoDataUrl?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isContact(value: unknown): value is SavedManagerContact {
  if (!isRecord(value)) return false;
  return ['id', 'firstName', 'lastName', 'position', 'email', 'phone'].every((key) => typeof value[key] === 'string')
    && (value.photoDataUrl === undefined || typeof value.photoDataUrl === 'string');
}

export function readSavedContacts(serialized: string | null): SavedManagerContact[] {
  if (!serialized) return [];
  try {
    const parsed = JSON.parse(serialized) as unknown;
    return Array.isArray(parsed) ? parsed.filter(isContact).slice(0, 30) : [];
  } catch {
    return [];
  }
}

export function serializeSavedContacts(contacts: SavedManagerContact[]) {
  return JSON.stringify(contacts.slice(0, 30));
}

export function makeSavedContactId() {
  return `saved-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
