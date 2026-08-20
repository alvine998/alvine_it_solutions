import { useEffect } from "react";

const SITE_URL = "https://alvineitsolutions.com";

function JsonLd({ data }: { data: object }) {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(data);
    script.dataset.seoJsonLd = "true";
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, [data]);

  return null;
}

export default function Seo() {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Alvine IT Solution",
    url: SITE_URL,
    logo: `${SITE_URL}/favicon.svg`,
    description:
      "Software house building desktop apps, websites, RESTful APIs, and mobile apps for businesses.",
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "sales",
      url: `${SITE_URL}/#contact`,
    },
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Alvine IT Solution",
    url: SITE_URL,
    inLanguage: ["en", "id", "zh"],
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <JsonLd data={organization} />
      <JsonLd data={website} />
    </>
  );
}
