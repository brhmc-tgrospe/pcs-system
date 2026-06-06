<?php
namespace Database\Seeders;

use App\Models\Category;
use App\Models\Item;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create users
        $developer = User::firstOrCreate(
            ['email' => 'developer@pcs.local'],
            [
                'username'   => 'developer',
                'first_name' => 'System',
                'last_name'  => 'Developer',
                'password'   => Hash::make('password'),
                'role'       => 'developer',
            ]
        );

        $admin = User::firstOrCreate(
            ['email' => 'admin@pcs.local'],
            [
                'username'   => 'admin',
                'first_name' => 'Portal',
                'last_name'  => 'Administrator',
                'password'   => Hash::make('password'),
                'role'       => 'administrator',
            ]
        );

        $staff = User::firstOrCreate(
            ['email' => 'staff@pcs.local'],
            [
                'username'   => 'staff',
                'first_name' => 'Staff',
                'last_name'  => 'User',
                'password'   => Hash::make('password'),
                'role'       => 'user',
            ]
        );

        // Seed Categories (skip observers to avoid auth errors during seeding)
        $categories = [
            ['name' => 'Medical Supplies',  'slug' => 'medical-supplies',  'description' => 'Medical consumables and protective equipment.'],
            ['name' => 'IT Equipment',      'slug' => 'it-equipment',      'description' => 'Computers, peripherals, and IT accessories.'],
            ['name' => 'Office Supplies',   'slug' => 'office-supplies',   'description' => 'Stationery, furniture, and office consumables.'],
            ['name' => 'Pharmaceuticals',   'slug' => 'pharmaceuticals',   'description' => 'Medicines and pharmaceutical products.'],
        ];

        $catMap = [];
        foreach ($categories as $catData) {
            $cat = Category::withoutEvents(fn () => Category::firstOrCreate(['slug' => $catData['slug']], $catData));
            $catMap[$catData['slug']] = $cat->id;
        }

        // Seed Items
        $items = [
            [
                'item_code' => 'MED-001', 'name' => 'Surgical Masks (N95)',
                'description' => 'High-filtration particulate respirator masks for surgical use.',
                'specifications' => ['Filtration Efficiency' => '≥ 95%', 'Layers' => '5-ply', 'Color' => 'White', 'Size' => 'Standard', 'Material' => 'Non-woven fabric, Melt-blown fabric'],
                'unit_type' => 'Box of 50', 'unit_price' => 1250.00, 'category_slug' => 'medical-supplies', 'is_active' => true,
            ],
            [
                'item_code' => 'IT-102', 'name' => 'Dell Latitude 3420',
                'description' => 'Business laptop suitable for hospital staff and administration.',
                'specifications' => ['Processor' => 'Intel Core i5-1135G7', 'RAM' => '8GB DDR4', 'Storage' => '256GB SSD NVMe', 'Display' => '14" FHD Anti-glare', 'OS' => 'Windows 11 Pro'],
                'unit_type' => 'Piece', 'unit_price' => 45000.00, 'category_slug' => 'it-equipment', 'is_active' => true,
            ],
            [
                'item_code' => 'OFF-050', 'name' => 'A4 Copy Paper',
                'description' => 'Standard 80gsm white copy paper for daily office printing.',
                'specifications' => ['Size' => 'A4 (210 x 297 mm)', 'Weight' => '80gsm', 'Color' => 'White', 'Sheets per Ream' => '500'],
                'unit_type' => 'Ream', 'unit_price' => 220.00, 'category_slug' => 'office-supplies', 'is_active' => true,
            ],
            [
                'item_code' => 'MED-015', 'name' => 'Disposable Syringes (5ml)',
                'description' => 'Sterile, single-use syringes with needles.',
                'specifications' => ['Volume' => '5ml', 'Needle Gauge' => '21G', 'Material' => 'Medical Grade Plastic', 'Sterility' => 'EO Sterile'],
                'unit_type' => 'Box of 100', 'unit_price' => 450.00, 'category_slug' => 'medical-supplies', 'is_active' => true,
            ],
            [
                'item_code' => 'PHARM-201', 'name' => 'Paracetamol 500mg',
                'description' => 'Standard pain reliever and fever reducer.',
                'specifications' => ['Active Ingredient' => 'Paracetamol', 'Dosage' => '500mg', 'Form' => 'Tablet', 'Manufacturer' => 'PharmaCorp'],
                'unit_type' => 'Box of 100', 'unit_price' => 350.00, 'category_slug' => 'pharmaceuticals', 'is_active' => true,
            ],
            [
                'item_code' => 'IT-105', 'name' => 'Logitech Wireless Mouse',
                'description' => 'Ergonomic wireless mouse for office use.',
                'specifications' => ['Connectivity' => '2.4 GHz Wireless', 'Sensor' => 'Optical', 'Buttons' => '3', 'Battery Life' => 'Up to 12 months'],
                'unit_type' => 'Piece', 'unit_price' => 850.00, 'category_slug' => 'it-equipment', 'is_active' => true,
            ],
            [
                'item_code' => 'MED-089', 'name' => 'Digital Thermometer',
                'description' => 'Fast-reading digital thermometer for clinical use.',
                'specifications' => ['Type' => 'Digital', 'Reading Time' => '10 seconds', 'Display' => 'LCD with backlight', 'Battery' => 'Replaceable Coin Cell'],
                'unit_type' => 'Piece', 'unit_price' => 280.00, 'category_slug' => 'medical-supplies', 'is_active' => true,
            ],
            [
                'item_code' => 'OFF-112', 'name' => 'Ergonomic Office Chair',
                'description' => 'High-back mesh ergonomic chair with adjustable armrests and lumbar support.',
                'specifications' => ['Material' => 'Breathable Mesh', 'Frame' => 'Nylon & Steel', 'Weight Capacity' => '150kg', 'Adjustability' => 'Height, Tilt, Armrests'],
                'unit_type' => 'Piece', 'unit_price' => 4500.00, 'category_slug' => 'office-supplies', 'is_active' => true,
            ],
        ];

        foreach ($items as $itemData) {
            $catSlug = $itemData['category_slug'];
            unset($itemData['category_slug']);
            $itemData['category_id'] = $catMap[$catSlug];
            Item::withoutEvents(fn () => Item::firstOrCreate(['item_code' => $itemData['item_code']], $itemData));
        }
    }
}