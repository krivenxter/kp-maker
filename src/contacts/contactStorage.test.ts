import { describe, expect, it } from 'vitest';
import { readSavedContacts, serializeSavedContacts } from './contactStorage';

describe('saved contacts', () => {
  const contact = { id: 'saved-1', firstName: 'Анна', lastName: 'Смирнова', position: 'Аккаунт-директор', email: 'anna@example.com', phone: '+7 999 000-00-00' };

  it('сохраняет и восстанавливает локальные контакты', () => {
    expect(readSavedContacts(serializeSavedContacts([contact]))).toEqual([contact]);
  });

  it('игнорирует повреждённые записи', () => {
    expect(readSavedContacts(JSON.stringify([contact, { id: 'broken' }, 'nope']))).toEqual([contact]);
    expect(readSavedContacts('{broken')).toEqual([]);
  });
});
