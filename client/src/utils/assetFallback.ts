const DEFAULT_ASSET_HOST = 'https://hodlhunt.io';
const FALLBACK_PREFIXES = ['/img/', '/font/', '/css/'];

const shouldRewrite = (value: string | null | undefined): value is string => {
  if (!value) return false;
  return FALLBACK_PREFIXES.some((prefix) => value.startsWith(prefix));
};

const normalize = (value: string, host: string) => {
  if (!shouldRewrite(value)) return value;
  return `${host}${value}`;
};

const rewriteElement = (element: Element, host: string) => {
  if (element instanceof HTMLImageElement) {
    if (shouldRewrite(element.getAttribute('src'))) {
      element.src = normalize(element.getAttribute('src')!, host);
    }

    const srcset = element.getAttribute('srcset');
    if (srcset && srcset.includes('/img/')) {
      const normalized = srcset
        .split(',')
        .map((candidate) => {
          const [url, descriptor] = candidate.trim().split(/\s+/, 2);
          const nextUrl = normalize(url, host);
          return descriptor ? `${nextUrl} ${descriptor}` : nextUrl;
        })
        .join(', ');
      element.setAttribute('srcset', normalized);
    }
  }

  if (element instanceof HTMLSourceElement) {
    const srcset = element.getAttribute('srcset');
    if (srcset && srcset.includes('/img/')) {
      const normalized = srcset
        .split(',')
        .map((candidate) => {
          const [url, descriptor] = candidate.trim().split(/\s+/, 2);
          const nextUrl = normalize(url, host);
          return descriptor ? `${nextUrl} ${descriptor}` : nextUrl;
        })
        .join(', ');
      element.setAttribute('srcset', normalized);
    }
  }

  if (element instanceof HTMLLinkElement) {
    const href = element.getAttribute('href');
    if (shouldRewrite(href)) {
      element.href = normalize(href!, host);
    }
  }

  const style = element.getAttribute('style');
  if (style && style.includes('url(/')) {
    const nextStyle = style.replace(/url\((['"]?)(\/(?:img|font|css)\/[^)'"\s]+)\1\)/g, (_m, quote, p1) => {
      const nextUrl = normalize(p1, host);
      return `url(${quote}${nextUrl}${quote})`;
    });

    if (nextStyle !== style) {
      element.setAttribute('style', nextStyle);
    }
  }
};

export function enableAssetFallback(host = (import.meta as any).env?.VITE_ASSET_HOST || DEFAULT_ASSET_HOST) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (!host || window.location.origin === host) return;

  const normalizedHost = host.replace(/\/$/, '');

  const walkAndRewrite = (root: ParentNode) => {
    root.querySelectorAll('*').forEach((el) => rewriteElement(el, normalizedHost));
  };

  rewriteElement(document.documentElement, normalizedHost);
  walkAndRewrite(document);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.target instanceof Element) {
        rewriteElement(mutation.target, normalizedHost);
      }

      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          rewriteElement(node, normalizedHost);
          walkAndRewrite(node);
        });
      }
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['src', 'srcset', 'href', 'style'],
  });
}
