export function phoneLinks(value = '') {
  return value.split('/').flatMap((part) => {
    const label = part.trim();
    if (!label) return [];
    const extension = part.match(/\s*(?:ext\.?|x)\s*(\d+)\s*$/i);
    const mainPart = extension ? part.slice(0, extension.index) : part;
    const digits = mainPart.replace(/\D/g, '');
    if (!digits) return [];
    const prefix = mainPart.trimStart().startsWith('+') ? '+' : '';
    const suffix = extension ? `;ext=${extension[1]}` : '';
    return [{ label, href: `tel:${prefix}${digits}${suffix}` }];
  });
}
