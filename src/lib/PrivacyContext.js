import { createContext } from 'react';

export const PrivacyContext = createContext({
  isPrivacyMode: true,
  togglePrivacyMode: () => {}
});
