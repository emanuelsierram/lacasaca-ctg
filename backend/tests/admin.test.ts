import assert from 'node:assert/strict';
import test from 'node:test';

import { adminCatalogService } from '../src/services/admin.catalog.service';

test('admin catalog service allows authorized updates and rejects non-admin changes', () => {
  const catalog = [
    {
      id: 'prod-admin-1',
      name: 'Camiseta Real Madrid 2025',
      category: 'ACTUALES',
      isActive: true,
      variants: [
        { id: 'var-admin-1', label: 'M - Home', stock: 10, price: 120, isActive: true }
      ]
    }
  ] as any;

  const created = adminCatalogService.createProduct(catalog, 'admin-1', {
    name: 'Camiseta Juventus 2025',
    category: 'SELECCIONES',
    variants: [{ label: 'L - Home', stock: 5, price: 135, isActive: true }]
  });

  assert.equal(created.name, 'Camiseta Juventus 2025');
  assert.equal(created.variants[0].stock, 5);

  const updated = adminCatalogService.updateVariant(catalog, 'admin-1', 'var-admin-1', {
    price: 130,
    stock: 7,
    isActive: true
  });

  assert.equal(updated.price, 130);
  assert.equal(updated.stock, 7);

  assert.throws(
    () => adminCatalogService.updateVariant(catalog, 'customer-1', 'var-admin-1', { stock: 2 }),
    /Admin access required/
  );
});
