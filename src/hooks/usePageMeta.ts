import { useEffect } from "react";
import { useTranslation } from "react-i18next";

const SITE_URL = "https://alvine.id";

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export function usePageMeta(seoKey: string, extra?: { noindex?: boolean }) {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const title = t(`seo.${seoKey}.title`);
    const description = t(`seo.${seoKey}.description`);
    const ogImage = t(`seo.${seoKey}.ogImage`, "/og/og-home.png");

    document.title = title;

    upsertMeta("name", "description", description);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:url", `${SITE_URL}${window.location.pathname}`);
    upsertMeta("property", "og:image", `${SITE_URL}${ogImage}`);
    upsertMeta("property", "og:locale", i18n.language);
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", `${SITE_URL}${ogImage}`);

    // Canonical: point the localised SPA at the default locale URL
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", `${SITE_URL}${window.location.pathname}`);

    // hreflang alternates for the three supported locales
    const locales = ["en", "id", "zh"];
    document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => el.remove());
    locales.forEach((locale) => {
      const link = document.createElement("link");
      link.setAttribute("rel", "alternate");
      link.setAttribute("hreflang", locale);
      link.setAttribute("href", `${SITE_URL}${window.location.pathname}`);
      document.head.appendChild(link);
    });

    // Private/authed pages should not be indexed
    if (extra?.noindex) {
      upsertMeta("name", "robots", "noindex, nofollow");
    } else {
      document.head.querySelectorAll('meta[name="robots"]').forEach((el) => el.remove());
    }
  }, [seoKey, t, i18n.language, extra?.noindex]);
}
