import React from 'react';
import { Auth0Provider } from '@auth0/auth0-react';
import type { AccountConfig } from './accountConfig';
import { AccountWorkspace } from './AccountWorkspace';
import './AccountWorkspace.css';

export function AccountEntry({ config, onLocal }: { config: AccountConfig | null; onLocal: () => void }) {
  const heading = React.useRef<HTMLHeadingElement>(null);
  React.useEffect(() => { if (!config) heading.current?.focus(); }, [config]);
  if (!config) return <main className="AccountPage"><section className="AccountCard" aria-labelledby="account-title">
    <p className="AccountEyebrow">TaskFlow</p><h1 id="account-title" ref={heading} tabIndex={-1}>Tu cuenta</h1>
    <p>El acceso con cuenta todavía no está disponible en esta versión. Podés seguir organizándote en este navegador.</p>
    <button type="button" onClick={onLocal}>Volver a mi agenda local</button>
  </section></main>;
  return <Auth0Provider domain={config.domain} clientId={config.clientId} cacheLocation="memory" useRefreshTokens={false}
    authorizationParams={{ redirect_uri: `${window.location.origin}/account`, audience: config.audience, scope: 'openid profile email' }}
    onRedirectCallback={() => window.history.replaceState(null, '', '/account')}>
    <AccountWorkspace config={config} onLocal={onLocal} />
  </Auth0Provider>;
}
