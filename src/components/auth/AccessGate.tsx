import { FormEvent, ReactNode, useState } from 'react';

const ACCESS_PASSWORD = 'trogaikp26';
const ACCESS_STORAGE_KEY = 'kp-maker-access-granted';

function hasAccess() {
  try {
    return window.localStorage.getItem(ACCESS_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

type Props = { children: ReactNode };

export function AccessGate({ children }: Props) {
  const [granted, setGranted] = useState(hasAccess);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  if (granted) return children;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password === ACCESS_PASSWORD) {
      try { window.localStorage.setItem(ACCESS_STORAGE_KEY, '1'); } catch { /* localStorage can be unavailable in private mode */ }
      setGranted(true);
      setError(false);
      return;
    }
    setError(true);
    setPassword('');
  };

  return <main className="access-gate">
    <section className="access-card" aria-labelledby="access-title">
      <div className="access-lock" aria-hidden="true"><img src="/icons/lock.svg" alt="" /></div>
      <div className="access-brand">Конструктор КП</div>
      <h1 id="access-title">Внутренний инструмент</h1>
      <p>Введите пароль, чтобы открыть конструктор коммерческих предложений.</p>
      <form onSubmit={submit}>
        <label htmlFor="access-password">Пароль</label>
        <input
          id="access-password"
          type="password"
          value={password}
          onChange={(event) => { setPassword(event.target.value); setError(false); }}
          placeholder="Введите пароль"
          autoFocus
          autoComplete="current-password"
        />
        {error && <div className="access-error" role="alert">Неверный пароль</div>}
        <button type="submit" className="button primary">Войти</button>
      </form>
    </section>
  </main>;
}
