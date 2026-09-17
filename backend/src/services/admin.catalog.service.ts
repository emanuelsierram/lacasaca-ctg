export type AdminProduct = {
  id: string;
  name: string;
  category: 'RETROS' | 'ACTUALES' | 'SELECCIONES' | 'FEMENINO' | 'NINOS';
  isActive: boolean;
  variants: Array<{
    id: string;
    label: string;
    price: number;
    stock: number;
    isActive: boolean;
  }>;
};

export const adminCatalogService = {
  createProduct(catalog: AdminProduct[], userId: string, input: { name: string; category: AdminProduct['category']; variants: Array<{ label: string; stock: number; price: number; isActive?: boolean }> }) {
    if (!userId || userId === 'customer-1') {
      throw new Error('Admin access required');
    }

    const product: AdminProduct = {
      id: `prod-admin-${Date.now()}`,
      name: input.name.trim(),
      category: input.category,
      isActive: true,
      variants: input.variants.map((variant, index) => ({
        id: `var-admin-${Date.now()}-${index}`,
        label: variant.label,
        price: Number(variant.price),
        stock: Number(variant.stock),
        isActive: variant.isActive ?? true
      }))
    };

    catalog.push(product);
    return product;
  },

  updateVariant(catalog: AdminProduct[], userId: string, variantId: string, input: Partial<{ price: number; stock: number; isActive: boolean }>) {
    if (!userId || userId === 'customer-1') {
      throw new Error('Admin access required');
    }

    for (const product of catalog) {
      const variant = product.variants.find((item) => item.id === variantId);
      if (!variant) {
        continue;
      }

      if (input.price !== undefined) {
        variant.price = Number(input.price);
      }
      if (input.stock !== undefined) {
        variant.stock = Number(input.stock);
      }
      if (input.isActive !== undefined) {
        variant.isActive = Boolean(input.isActive);
      }
      return variant;
    }

    throw new Error('Variant not found');
  }
};
