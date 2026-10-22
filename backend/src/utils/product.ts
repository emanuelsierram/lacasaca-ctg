export function slugifyProductName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function nextProductLegacyId(lastLegacyId: string | null | undefined): string {
  const lastNumber = lastLegacyId ? Number(lastLegacyId.match(/^prod-(\d+)$/)?.[1] ?? 0) : 0;
  return `prod-${String(lastNumber + 1).padStart(3, '0')}`;
}
