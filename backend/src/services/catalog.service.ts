export type CatalogQuery = {
  category?: string;
  search?: string;
};

type ProductSummary = {
  id: string;
  name: string;
  category: 'RETROS' | 'ACTUALES' | 'SELECCIONES' | 'FEMENINO' | 'NINOS';
  availabilityType: 'IMMEDIATE' | 'MADE_TO_ORDER';
  isActive: boolean;
  variants: Array<{
    id: string;
    price: number;
    stock: number;
    isActive: boolean;
  }>;
};

const products: ProductSummary[] = [
  {
    id: 'prod-1',
    name: 'Camiseta FC Barcelona 2024',
    category: 'ACTUALES',
    availabilityType: 'IMMEDIATE',
    isActive: true,
    variants: [
      { id: 'var-1', price: 129.99, stock: 12, isActive: true },
      { id: 'var-2', price: 129.99, stock: 0, isActive: true }
    ]
  },
  {
    id: 'prod-2',
    name: 'Camiseta Argentina Retro 1986',
    category: 'RETROS',
    availabilityType: 'MADE_TO_ORDER',
    isActive: true,
    variants: [
      { id: 'var-3', price: 149, stock: 4, isActive: true }
    ]
  },
  {
    id: 'prod-3',
    name: 'Camiseta Selección Colombia',
    category: 'SELECCIONES',
    availabilityType: 'IMMEDIATE',
    isActive: false,
    variants: [
      { id: 'var-4', price: 139.99, stock: 10, isActive: false }
    ]
  }
];

export const catalogService = {
  listProducts(query: CatalogQuery = {}) {
    const category = query.category?.toUpperCase();
    const search = query.search?.toLowerCase().trim() ?? '';

    const items = products.filter((product) => {
      const matchesCategory = !category || product.category === category;
      const matchesSearch = !search || product.name.toLowerCase().includes(search);
      return product.isActive && matchesCategory && matchesSearch;
    });

    return { items, total: items.length };
  }
};
