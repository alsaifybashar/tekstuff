// src/components/SEO/SEOMeta.jsx
import { Helmet } from 'react-helmet-async';

const SEOMeta = ({
  title = 'TekStuff - Premium elektronik och tillbehör',
  description = 'Köp laddare, kablar och tekniktillbehör från ledande varumärken. Snabb leverans och bra priser.',
  keywords = 'laddare, kablar, elektronik, tillbehör, USB-C, Lightning, HDMI',
  image = '/images/og-default.jpg',
  url = window.location.href,
  type = 'website',
  locale = 'sv_SE',
  jsonLd = null
}) => {
  const siteName = 'TekStuff';
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={url} />
      
      {/* Open Graph Tags */}
      <meta property="og:site_name" content={siteName} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:locale" content={locale} />
      
      {/* Twitter Card Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Additional SEO Tags */}
      <meta name="robots" content="index, follow" />
      <meta name="googlebot" content="index, follow" />
      
      {/* Structured Data */}
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
};

// Product page structured data helper
export const generateProductSchema = (product) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.title,
  description: product.description,
  image: product.images,
  brand: {
    '@type': 'Brand',
    name: product.brand
  },
  offers: {
    '@type': 'Offer',
    price: product.price,
    priceCurrency: 'SEK',
    availability: product.inStock 
      ? 'https://schema.org/InStock' 
      : 'https://schema.org/OutOfStock',
    seller: {
      '@type': 'Organization',
      name: 'TekStuff'
    }
  },
  aggregateRating: product.rating ? {
    '@type': 'AggregateRating',
    ratingValue: product.rating,
    reviewCount: product.reviewCount || 1
  } : undefined
});

// Breadcrumb structured data helper
export const generateBreadcrumbSchema = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url
  }))
});

export default SEOMeta;