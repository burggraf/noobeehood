export function phoneLinks(value = '') {
  return value.split('/').flatMap((part) => {
    const label = part.trim();
    if (!label) return [];
    const digits = part.replace(/\D/g, '');
    if (!digits) return [];
    const prefix = part.trimStart().startsWith('+') ? '+' : '';
    return [{ label, href: `tel:${prefix}${digits}` }];
  });
}
