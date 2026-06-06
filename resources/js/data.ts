import { Category, Item, User } from './types';

export const currentUser: User = {
  id: 'u1',
  name: 'System Developer',
  username: 'developer',
  role: 'developer'
};

export const categories: Category[] = [
  { id: 'c1', name: 'Medical Supplies', slug: 'medical-supplies' },
  { id: 'c2', name: 'IT Equipment', slug: 'it-equipment' },
  { id: 'c3', name: 'Office Supplies', slug: 'office-supplies' },
  { id: 'c4', name: 'Pharmaceuticals', slug: 'pharmaceuticals' },
];

export const items: Item[] = [
  {
    id: '1',
    itemCode: 'MED-001',
    name: 'Surgical Masks (N95)',
    description: 'High-filtration particulate respirator masks for surgical use. Protects against airborne particles and liquid contaminating the face.',
    specifications: {
      'Filtration Efficiency': '≥ 95%',
      'Layers': '5-ply',
      'Color': 'White',
      'Size': 'Standard',
      'Material': 'Non-woven fabric, Melt-blown fabric'
    },
    unitType: 'Box of 50',
    unitPrice: 1250.00,
    categoryId: 'c1',
    isActive: true,
  },
  {
    id: '2',
    itemCode: 'IT-102',
    name: 'Dell Latitude 3420',
    description: 'Business laptop suitable for hospital staff and administration. Features enterprise-level security and durability for daily clinical or office workflows.',
    specifications: {
      'Processor': 'Intel Core i5-1135G7',
      'RAM': '8GB DDR4',
      'Storage': '256GB SSD NVMe',
      'Display': '14" FHD (1920x1080) Anti-glare',
      'OS': 'Windows 11 Pro'
    },
    unitType: 'Piece',
    unitPrice: 45000.00,
    categoryId: 'c2',
    isActive: true,
  },
  {
    id: '3',
    itemCode: 'OFF-050',
    name: 'A4 Copy Paper',
    description: 'Standard 80gsm white copy paper for daily office printing.',
    specifications: {
      'Size': 'A4 (210 x 297 mm)',
      'Weight': '80gsm',
      'Color': 'White',
      'Sheets per Ream': '500'
    },
    unitType: 'Ream',
    unitPrice: 220.00,
    categoryId: 'c3',
    isActive: true,
  },
  {
    id: '4',
    itemCode: 'MED-015',
    name: 'Disposable Syringes (5ml)',
    description: 'Sterile, single-use syringes with needles.',
    specifications: {
      'Volume': '5ml',
      'Needle Gauge': '21G',
      'Material': 'Medical Grade Plastic',
      'Sterility': 'EO Sterile'
    },
    unitType: 'Box of 100',
    unitPrice: 450.00,
    categoryId: 'c1',
    isActive: true,
  },
  {
    id: '5',
    itemCode: 'PHARM-201',
    name: 'Paracetamol 500mg',
    description: 'Standard pain reliever and fever reducer.',
    specifications: {
      'Active Ingredient': 'Paracetamol',
      'Dosage': '500mg',
      'Form': 'Tablet',
      'Manufacturer': 'PharmaCorp'
    },
    unitType: 'Box of 100',
    unitPrice: 350.00,
    categoryId: 'c4',
    isActive: true,
  },
  {
    id: '6',
    itemCode: 'IT-105',
    name: 'Logitech Wireless Mouse',
    description: 'Ergonomic wireless mouse for office use.',
    specifications: {
      'Connectivity': '2.4 GHz Wireless',
      'Sensor': 'Optical',
      'Buttons': '3',
      'Battery Life': 'Up to 12 months'
    },
    unitType: 'Piece',
    unitPrice: 850.00,
    categoryId: 'c2',
    isActive: true,
  },
  {
    id: '7',
    itemCode: 'MED-089',
    name: 'Digital Thermometer',
    description: 'Fast-reading digital thermometer for clinical use.',
    specifications: {
      'Type': 'Digital',
      'Reading Time': '10 seconds',
      'Display': 'LCD with backlight',
      'Battery': 'Replaceable Coin Cell'
    },
    unitType: 'Piece',
    unitPrice: 280.00,
    categoryId: 'c1',
    isActive: true,
  },
  {
    id: '8',
    itemCode: 'OFF-112',
    name: 'Ergonomic Office Chair',
    description: 'High-back mesh ergonomic chair with adjustable armrests and lumbar support.',
    specifications: {
      'Material': 'Breathable Mesh',
      'Frame': 'Nylon & Steel',
      'Weight Capacity': '150kg',
      'Adjustability': 'Height, Tilt, Armrests'
    },
    unitType: 'Piece',
    unitPrice: 4500.00,
    categoryId: 'c3',
    isActive: true,
  }
];
