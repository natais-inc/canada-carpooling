import { MetadataRoute } from 'next';
import { articles } from '@/lib/blog';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://carpoolwork.ca';
  const locales = ['fr', 'en'];
  const pages = ['', '/faq', '/employers', '/employer/inscription', '/blog'];
  const blogPages = articles.map((a) => `/blog/${a.slug}`);

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const page of [...pages, ...blogPages]) {
      entries.push({
        url: `${baseUrl}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: page === '' ? 'daily' : 'weekly',
        priority: page === '' ? 1 : 0.8,
      });
    }
  }

  return entries;
}
