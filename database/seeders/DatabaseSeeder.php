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
                'unit_type' => 'Box of 50', 'unit_cost' => 1250.00, 'quantity' => 100, 'abc' => 125000.00, 'category_slug' => 'medical-supplies',
            ],
            [
                'item_code' => 'IT-102', 'name' => 'Dell Latitude 3420',
                'description' => 'Business laptop suitable for hospital staff and administration.',
                'unit_type' => 'Piece', 'unit_cost' => 45000.00, 'quantity' => 10, 'abc' => 450000.00, 'category_slug' => 'it-equipment',
            ],
            [
                'item_code' => 'OFF-050', 'name' => 'A4 Copy Paper',
                'description' => 'Standard 80gsm white copy paper for daily office printing.',
                'unit_type' => 'Ream', 'unit_cost' => 220.00, 'quantity' => 500, 'abc' => 110000.00, 'category_slug' => 'office-supplies',
            ],
            [
                'item_code' => 'MED-015', 'name' => 'Disposable Syringes (5ml)',
                'description' => 'Sterile, single-use syringes with needles.',
                'unit_type' => 'Box of 100', 'unit_cost' => 450.00, 'quantity' => 200, 'abc' => 90000.00, 'category_slug' => 'medical-supplies',
            ],
            [
                'item_code' => 'PHARM-201', 'name' => 'Paracetamol 500mg',
                'description' => 'Standard pain reliever and fever reducer.',
                'unit_type' => 'Box of 100', 'unit_cost' => 350.00, 'quantity' => 300, 'abc' => 105000.00, 'category_slug' => 'pharmaceuticals',
            ],
            [
                'item_code' => 'IT-105', 'name' => 'Logitech Wireless Mouse',
                'description' => 'Ergonomic wireless mouse for office use.',
                'unit_type' => 'Piece', 'unit_cost' => 850.00, 'quantity' => 50, 'abc' => 42500.00, 'category_slug' => 'it-equipment',
            ],
            [
                'item_code' => 'MED-089', 'name' => 'Digital Thermometer',
                'description' => 'Fast-reading digital thermometer for clinical use.',
                'unit_type' => 'Piece', 'unit_cost' => 280.00, 'quantity' => 150, 'abc' => 42000.00, 'category_slug' => 'medical-supplies',
            ],
            [
                'item_code' => 'OFF-112', 'name' => 'Ergonomic Office Chair',
                'description' => 'High-back mesh ergonomic chair with adjustable armrests and lumbar support.',
                'unit_type' => 'Piece', 'unit_cost' => 4500.00, 'quantity' => 20, 'abc' => 90000.00, 'category_slug' => 'office-supplies',
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