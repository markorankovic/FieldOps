import { useState } from 'react';

type LoginScreenProps = {
  error: string | null;
  isSubmitting: boolean;
  onSubmit: (email: string, password: string) => Promise<void>;
};

const adminEmail = 'admin@fieldops.local';
const adminPassword = 'demo-admin';
const contractorEmail = 'maya@fieldops.local';
const contractorPassword = 'demo-contractor';

export const LoginScreen = ({
  error,
  isSubmitting,
  onSubmit,
}: LoginScreenProps) => {
  const [email, setEmail] = useState(adminEmail);
  const [password, setPassword] = useState(adminPassword);

  const handleSubmit = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(email, password);
  };

  return (
    <main className="auth-shell">
      <section className="auth-card panel">
        <p className="eyebrow">FieldOps Full-Stack Demo</p>
        <h1>Sign in to FieldOps</h1>
        <p className="hero-copy">
          This branch uses the NestJS API for auth, roles, job persistence, and audit history.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>Email</span>
            <input
              autoComplete="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label className="auth-field">
            <span>Password</span>
            <input
              autoComplete="current-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {error ? <p className="error-banner">{error}</p> : null}

          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="demo-credentials">
          <div>
            <span className="detail-label">Admin demo</span>
            <p>
              {adminEmail} / {adminPassword}
            </p>
          </div>
          <div>
            <span className="detail-label">Contractor demo</span>
            <p>
              {contractorEmail} / {contractorPassword}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};
