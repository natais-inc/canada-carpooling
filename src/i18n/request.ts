import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale } from './config';

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;
  const resolvedLocale = locales.includes(locale as any) ? locale : defaultLocale;
  return {
    locale: resolvedLocale,
    message