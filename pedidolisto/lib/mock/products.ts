import type { Product } from "@/lib/types";

type ProductSeed = Omit<Product, "status"> & {
  /** Relative popularity used by the order generator. */
  popularity: number;
  /** Typical quantities per order line. */
  quantities: number[];
};

export const PRODUCT_SEEDS: ProductSeed[] = [
  { id: "p01", sku: "BEB-001", name: "Coca-Cola 2L", shortName: "Coca-Cola 2L", category: "Bebidas", brand: "Coca-Cola", basePrice: 11.5, wholesalePrice: 10.2, cost: 8.9, stock: 486, minimumStock: 200, unit: "Botella", color: "#d7262e", popularity: 16, quantities: [6, 12, 12, 18, 24] },
  { id: "p02", sku: "BEB-002", name: "Coca-Cola 3L", shortName: "Coca-Cola 3L", category: "Bebidas", brand: "Coca-Cola", basePrice: 15.5, wholesalePrice: 13.8, cost: 12.1, stock: 238, minimumStock: 120, unit: "Botella", color: "#b91f26", popularity: 8, quantities: [4, 6, 6, 12] },
  { id: "p03", sku: "BEB-003", name: "Coca-Cola 600ml x12", shortName: "Coca-Cola 600ml x12", category: "Bebidas", brand: "Coca-Cola", basePrice: 60, wholesalePrice: 54, cost: 47, stock: 96, minimumStock: 40, unit: "Paquete x12", color: "#e0464d", popularity: 5, quantities: [1, 2, 2, 3] },
  { id: "p04", sku: "BEB-004", name: "Sprite 2L", shortName: "Sprite 2L", category: "Bebidas", brand: "Coca-Cola", basePrice: 10.5, wholesalePrice: 9.4, cost: 8.2, stock: 132, minimumStock: 150, unit: "Botella", color: "#1f9a52", popularity: 8, quantities: [6, 6, 12] },
  { id: "p05", sku: "BEB-005", name: "Fanta Naranja 2L", shortName: "Fanta 2L", category: "Bebidas", brand: "Coca-Cola", basePrice: 10.5, wholesalePrice: 9.4, cost: 8.2, stock: 204, minimumStock: 120, unit: "Botella", color: "#f28a1a", popularity: 7, quantities: [6, 6, 12] },
  { id: "p06", sku: "BEB-006", name: "Agua Vital 2L", shortName: "Agua Vital 2L", category: "Bebidas", brand: "Vital", basePrice: 7, wholesalePrice: 6.2, cost: 5.1, stock: 318, minimumStock: 120, unit: "Botella", color: "#2d8fd5", popularity: 6, quantities: [6, 6, 12] },
  { id: "p07", sku: "BEB-007", name: "Agua Vital 600ml x12", shortName: "Agua Vital x12", category: "Bebidas", brand: "Vital", basePrice: 36, wholesalePrice: 32, cost: 26.5, stock: 164, minimumStock: 80, unit: "Paquete x12", color: "#4aa3e0", popularity: 9, quantities: [2, 3, 4, 6] },
  { id: "p08", sku: "BEB-008", name: "Powerade Mountain Blast 500ml", shortName: "Powerade 500ml", category: "Bebidas", brand: "Powerade", basePrice: 7.5, wholesalePrice: 6.6, cost: 5.4, stock: 64, minimumStock: 100, unit: "Botella", color: "#2657c9", popularity: 6, quantities: [4, 6, 12] },
  { id: "p09", sku: "BEB-009", name: "Pilfrut Durazno 1L", shortName: "Pilfrut 1L", category: "Lácteos", brand: "PIL", basePrice: 7, wholesalePrice: 6.3, cost: 5.2, stock: 188, minimumStock: 80, unit: "Unidad", color: "#f2a33a", popularity: 4, quantities: [6, 12] },
  { id: "p10", sku: "ALI-001", name: "Aceite Fino 900ml", shortName: "Aceite Fino 900ml", category: "Alimentos", brand: "Fino", basePrice: 17, wholesalePrice: 15.6, cost: 13.9, stock: 236, minimumStock: 100, unit: "Botella", color: "#e3b21c", popularity: 8, quantities: [3, 6, 6, 10, 12] },
  { id: "p11", sku: "ALI-002", name: "Aceite Fino 5L", shortName: "Aceite Fino 5L", category: "Alimentos", brand: "Fino", basePrice: 88, wholesalePrice: 82, cost: 74, stock: 0, minimumStock: 12, unit: "Bidón", color: "#c99a10", popularity: 2, quantities: [1, 1, 2] },
  { id: "p12", sku: "ALI-003", name: "Arroz Grano de Oro 5kg", shortName: "Arroz 5kg", category: "Alimentos", brand: "Grano de Oro", basePrice: 52, wholesalePrice: 48, cost: 42.5, stock: 88, minimumStock: 60, unit: "Bolsa", color: "#c8a45a", popularity: 6, quantities: [1, 2, 3, 5] },
  { id: "p13", sku: "ALI-004", name: "Azúcar Guabirá 5kg", shortName: "Azúcar 5kg", category: "Alimentos", brand: "Guabirá", basePrice: 38, wholesalePrice: 35, cost: 31, stock: 42, minimumStock: 60, unit: "Bolsa", color: "#9aa0a8", popularity: 6, quantities: [1, 2, 3, 4] },
  { id: "p14", sku: "ALI-005", name: "Fideo Don Vittorio Tallarín 400g", shortName: "Fideo Don Vittorio", category: "Alimentos", brand: "Don Vittorio", basePrice: 7, wholesalePrice: 6.3, cost: 5.2, stock: 382, minimumStock: 150, unit: "Paquete", color: "#2f6fb5", popularity: 7, quantities: [6, 10, 12, 20] },
  { id: "p15", sku: "ALI-006", name: "Harina Famosa 1kg", shortName: "Harina 1kg", category: "Alimentos", brand: "Famosa", basePrice: 8.5, wholesalePrice: 7.8, cost: 6.6, stock: 146, minimumStock: 60, unit: "Bolsa", color: "#d9c48f", popularity: 3, quantities: [5, 10] },
  { id: "p16", sku: "ALI-007", name: "Atún Van Camps 170g", shortName: "Atún Van Camps", category: "Alimentos", brand: "Van Camps", basePrice: 14, wholesalePrice: 12.6, cost: 10.8, stock: 152, minimumStock: 80, unit: "Lata", color: "#1b4f8f", popularity: 4, quantities: [6, 12] },
  { id: "p17", sku: "ALI-008", name: "Galletas Victoria Soda x6", shortName: "Galletas Soda x6", category: "Alimentos", brand: "Victoria", basePrice: 9, wholesalePrice: 8.1, cost: 6.8, stock: 124, minimumStock: 50, unit: "Paquete", color: "#e3642b", popularity: 3, quantities: [4, 6, 10] },
  { id: "p18", sku: "ALI-009", name: "Sal Yodada Copo de Nieve 1kg", shortName: "Sal 1kg", category: "Alimentos", brand: "Copo de Nieve", basePrice: 3, wholesalePrice: 2.6, cost: 2, stock: 210, minimumStock: 80, unit: "Bolsa", color: "#8fb7d9", popularity: 2, quantities: [10, 20] },
  { id: "p19", sku: "LAC-001", name: "Leche Pil Entera 1L", shortName: "Leche Pil 1L", category: "Lácteos", brand: "PIL", basePrice: 7.5, wholesalePrice: 6.9, cost: 5.9, stock: 296, minimumStock: 150, unit: "Unidad", color: "#2b7fd0", popularity: 7, quantities: [6, 12, 12, 24] },
  { id: "p20", sku: "LAC-002", name: "Yogurt Pil Frutilla 1L", shortName: "Yogurt Pil 1L", category: "Lácteos", brand: "PIL", basePrice: 13, wholesalePrice: 11.8, cost: 10.1, stock: 68, minimumStock: 80, unit: "Unidad", color: "#e0578a", popularity: 3, quantities: [4, 6] },
  { id: "p21", sku: "LAC-003", name: "Mantequilla Pil 200g", shortName: "Mantequilla 200g", category: "Lácteos", brand: "PIL", basePrice: 14, wholesalePrice: 12.8, cost: 11, stock: 38, minimumStock: 40, unit: "Unidad", color: "#e9c13f", popularity: 2, quantities: [3, 6] },
  { id: "p22", sku: "LAC-004", name: "Leche en Polvo Pil 400g", shortName: "Leche en polvo 400g", category: "Lácteos", brand: "PIL", basePrice: 32, wholesalePrice: 29.5, cost: 26, stock: 0, minimumStock: 24, unit: "Bolsa", color: "#5a8fd0", popularity: 2, quantities: [2, 4] },
  { id: "p23", sku: "LIM-001", name: "Detergente OMO 800g", shortName: "Detergente OMO", category: "Limpieza", brand: "OMO", basePrice: 22, wholesalePrice: 20, cost: 17.4, stock: 128, minimumStock: 60, unit: "Bolsa", color: "#1d63c9", popularity: 5, quantities: [3, 6, 6, 12] },
  { id: "p24", sku: "LIM-002", name: "Lavandina Clorox 1L", shortName: "Lavandina 1L", category: "Limpieza", brand: "Clorox", basePrice: 9, wholesalePrice: 8.1, cost: 6.8, stock: 104, minimumStock: 50, unit: "Botella", color: "#4a90c2", popularity: 3, quantities: [6, 12] },
  { id: "p25", sku: "LIM-003", name: "Jabón Bolívar en Barra", shortName: "Jabón Bolívar", category: "Limpieza", brand: "Bolívar", basePrice: 5.5, wholesalePrice: 4.9, cost: 4, stock: 34, minimumStock: 60, unit: "Unidad", color: "#3c7d3a", popularity: 3, quantities: [10, 12, 20] },
  { id: "p26", sku: "HOG-001", name: "Papel Higiénico Nacional x12", shortName: "Papel Higiénico x12", category: "Hogar", brand: "Nacional", basePrice: 38, wholesalePrice: 34.5, cost: 29.8, stock: 58, minimumStock: 50, unit: "Paquete x12", color: "#7c8a99", popularity: 4, quantities: [1, 2, 3, 4] },
  { id: "p27", sku: "HOG-002", name: "Servilletas Nova x100", shortName: "Servilletas x100", category: "Hogar", brand: "Nova", basePrice: 6, wholesalePrice: 5.3, cost: 4.2, stock: 22, minimumStock: 40, unit: "Paquete", color: "#9b7bc4", popularity: 2, quantities: [6, 12] },
  { id: "p28", sku: "HOG-003", name: "Esponja Virutex Doble Uso", shortName: "Esponja Virutex", category: "Hogar", brand: "Virutex", basePrice: 3.5, wholesalePrice: 3, cost: 2.2, stock: 176, minimumStock: 60, unit: "Unidad", color: "#e5a526", popularity: 2, quantities: [6, 12] },
];

export function seedProducts(): Product[] {
  return PRODUCT_SEEDS.map(({ popularity: _p, quantities: _q, ...product }) => ({ ...product, status: "active" }));
}
