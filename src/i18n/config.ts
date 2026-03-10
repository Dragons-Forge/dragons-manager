import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import ptTranslation from './locales/pt/common.json';
import enTranslation from './locales/en/common.json';

// Tenta carregar o idioma salvo no localStorage ou usa pt como fallback
const idiomaSalvo = localStorage.getItem('multiroblox_idioma') || 'pt';

i18n
    .use(initReactI18next)
    .init({
        resources: {
            en: {
                translation: enTranslation
            },
            pt: {
                translation: ptTranslation
            }
        },
        lng: idiomaSalvo,
        fallbackLng: 'pt',
        interpolation: {
            escapeValue: false // React já protege contra XSS
        }
    });

export default i18n;
