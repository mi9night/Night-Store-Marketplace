export const SENSITIVE_VISIBILITY_KEY = 'nightstore-sensitive-hidden';
export const SENSITIVE_VISIBILITY_EVENT = 'nightstore:sensitive-visibility';

export const readSensitiveHidden = (defaultValue = true) => {
  if (typeof window === 'undefined') return defaultValue;
  const saved = window.localStorage.getItem(SENSITIVE_VISIBILITY_KEY);
  if (saved === null) return defaultValue;
  return saved === 'true';
};

export const writeSensitiveHidden = (value: boolean) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SENSITIVE_VISIBILITY_KEY, String(value));
  window.dispatchEvent(new CustomEvent<boolean>(SENSITIVE_VISIBILITY_EVENT, { detail: value }));
};

export const subscribeSensitiveHidden = (callback: (value: boolean) => void, defaultValue = true) => {
  if (typeof window === 'undefined') return () => {};

  const customHandler = (event: Event) => {
    const customEvent = event as CustomEvent<boolean>;
    callback(Boolean(customEvent.detail));
  };

  const storageHandler = (event: StorageEvent) => {
    if (event.key !== SENSITIVE_VISIBILITY_KEY) return;
    callback(event.newValue === null ? defaultValue : event.newValue === 'true');
  };

  window.addEventListener(SENSITIVE_VISIBILITY_EVENT, customHandler as EventListener);
  window.addEventListener('storage', storageHandler);

  return () => {
    window.removeEventListener(SENSITIVE_VISIBILITY_EVENT, customHandler as EventListener);
    window.removeEventListener('storage', storageHandler);
  };
};

export const maskEmail = (email?: string | null) => {
  if (!email) return '••••••';
  const [name, domain = ''] = email.split('@');
  if (!domain) return email;

  const visibleName = name.length <= 2
    ? `${name[0] || ''}•`
    : `${name.slice(0, 2)}${'•'.repeat(Math.max(2, Math.min(name.length - 2, 6)))}`;

  const domainParts = domain.split('.');
  const mainDomain = domainParts[0] || '';
  const domainZone = domainParts.slice(1).join('.');
  const visibleDomain = mainDomain.length <= 2
    ? `${mainDomain[0] || ''}•`
    : `${mainDomain.slice(0, 2)}${'•'.repeat(Math.max(2, Math.min(mainDomain.length - 2, 6)))}`;

  return `${visibleName}@${visibleDomain}${domainZone ? `.${domainZone}` : ''}`;
};
