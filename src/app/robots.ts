import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/auth/', '/fr/auth/', '/en/auth/',
          '/admin', '/fr/admin', '/en/admin',
          '/employer', '/fr/employer', '/en/employer',
          '/mon-covoiturage', '/fr/mon-covoiturage', '/en/mon-covoiturage',
          '/profile', '/fr/profile', '/en/profile',
          '/rejoindre', '/fr/rejoindre', '/en/rejoindre',
          '/rejoindre-entreprise', '/fr/rejoindre-entreprise', '/en/rejoindre-entreprise',
          '/verifier-courriel', '/fr/verifier-courriel', '/en/verifier-courriel',
        ],
      },
    ],
    sitemap: 'https://carpoolwork.ca/sitemap.xml',
  };
}
