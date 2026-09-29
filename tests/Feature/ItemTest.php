<?php

namespace Tests\Feature;

use App\Models\Bidder;
use App\Models\Category;
use App\Models\Item;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ItemTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;
    protected Category $category;

    protected function setUp(): void
    {
        parent::setUp();
        $this->adminUser = User::factory()->create([
            'role' => 'administrator',
        ]);

        $this->category = Category::create([
            'name' => 'Medical Equipment',
            'cat_code' => 'MED',
            'description' => 'Medical tools and machinery',
        ]);
    }

    public function test_can_create_item_with_custom_status(): void
    {
        $response = $this->actingAs($this->adminUser)->post('/catalog/items', [
            'name' => 'Ultrasound Machine',
            'category_id' => $this->category->id,
            'description' => 'High-resolution ultrasound scanner',
            'unit_type' => 'unit',
            'unit_cost' => 450000.00,
            'quantity' => 2,
            'status' => 'Pending Award',
        ]);

        $response->assertSessionHas('success');
        $this->assertDatabaseHas('items', [
            'name' => 'Ultrasound Machine',
            'status' => 'Pending Award',
        ]);
    }

    public function test_can_create_item_with_awarded_status_and_bidder(): void
    {
        $bidder = Bidder::create([
            'name' => 'MedSupply Phils Inc.',
            'bidder_code' => 'MED-PH',
        ]);

        $response = $this->actingAs($this->adminUser)->post('/catalog/items', [
            'name' => 'MRI Scanner 3T',
            'category_id' => $this->category->id,
            'description' => '3 Tesla MRI System',
            'unit_type' => 'unit',
            'unit_cost' => 25000000.00,
            'quantity' => 1,
            'status' => 'Awarded',
            'awarded_bidder_id' => $bidder->id,
            'bidders' => [
                [
                    'id' => $bidder->id,
                    'unit_cost' => 24500000.00,
                ],
            ],
        ]);

        $response->assertSessionHas('success');
        $this->assertDatabaseHas('items', [
            'name' => 'MRI Scanner 3T',
            'status' => 'Awarded',
            'awarded_bidder_id' => $bidder->id,
        ]);
    }

    public function test_awarded_bidder_must_be_in_quotations(): void
    {
        $bidderA = Bidder::create(['name' => 'Bidder A', 'bidder_code' => 'BIDA']);
        $bidderB = Bidder::create(['name' => 'Bidder B', 'bidder_code' => 'BIDB']);

        $response = $this->actingAs($this->adminUser)->post('/catalog/items', [
            'name' => 'Hospital Bed',
            'category_id' => $this->category->id,
            'description' => 'Electric hospital bed',
            'unit_type' => 'unit',
            'unit_cost' => 50000.00,
            'quantity' => 5,
            'status' => 'Awarded',
            'awarded_bidder_id' => $bidderB->id, // Not in bidders quotation list
            'bidders' => [
                [
                    'id' => $bidderA->id,
                    'unit_cost' => 48000.00,
                ],
            ],
        ]);

        $response->assertSessionHasErrors(['awarded_bidder_id']);
        $this->assertDatabaseMissing('items', [
            'name' => 'Hospital Bed',
        ]);
    }

    public function test_awarded_status_requires_awarded_bidder(): void
    {
        $bidder = Bidder::create(['name' => 'Bidder A', 'bidder_code' => 'BIDA']);

        $response = $this->actingAs($this->adminUser)->post('/catalog/items', [
            'name' => 'Surgical Lamp',
            'category_id' => $this->category->id,
            'description' => 'LED surgical ceiling lamp',
            'unit_type' => 'unit',
            'unit_cost' => 120000.00,
            'quantity' => 2,
            'status' => 'Awarded',
            'awarded_bidder_id' => null,
            'bidders' => [
                [
                    'id' => $bidder->id,
                    'unit_cost' => 115000.00,
                ],
            ],
        ]);

        $response->assertSessionHasErrors(['awarded_bidder_id']);
    }

    public function test_awarded_bidder_cleared_when_status_changes_from_awarded(): void
    {
        $bidder = Bidder::create(['name' => 'Bidder Winner', 'bidder_code' => 'BW']);
        $item = Item::create([
            'item_code' => 'MED-0099',
            'name' => 'Defibrillator',
            'category_id' => $this->category->id,
            'description' => 'Automated external defibrillator',
            'unit_type' => 'unit',
            'unit_cost' => 150000.00,
            'quantity' => 1,
            'status' => 'Awarded',
            'awarded_bidder_id' => $bidder->id,
        ]);
        $item->bidders()->attach($bidder->id, ['unit_cost' => 140000.00]);

        $response = $this->actingAs($this->adminUser)->put("/catalog/items/{$item->id}", [
            'name' => 'Defibrillator',
            'category_id' => $this->category->id,
            'description' => 'Automated external defibrillator',
            'unit_type' => 'unit',
            'unit_cost' => 150000.00,
            'quantity' => 1,
            'status' => 'Active',
            'awarded_bidder_id' => $bidder->id,
            'bidders' => [
                ['id' => $bidder->id, 'unit_cost' => 140000.00],
            ],
        ]);

        $response->assertSessionHas('success');
        $this->assertDatabaseHas('items', [
            'id' => $item->id,
            'status' => 'Active',
            'awarded_bidder_id' => null,
        ]);
    }

    public function test_item_defaults_to_active_status_if_not_specified(): void
    {
        $response = $this->actingAs($this->adminUser)->post('/catalog/items', [
            'name' => 'Stethoscope Pro',
            'category_id' => $this->category->id,
            'description' => 'Standard diagnostic tool',
            'unit_type' => 'pc',
            'unit_cost' => 2500.00,
            'quantity' => 10,
        ]);

        $response->assertSessionHas('success');
        $this->assertDatabaseHas('items', [
            'name' => 'Stethoscope Pro',
            'status' => 'Active',
            'awarded_bidder_id' => null,
        ]);
    }

    public function test_can_update_item_status(): void
    {
        $item = Item::create([
            'item_code' => 'MED-0001',
            'name' => 'X-Ray Machine',
            'category_id' => $this->category->id,
            'unit_type' => 'unit',
            'unit_cost' => 1200000.00,
            'quantity' => 1,
            'status' => 'Active',
        ]);

        $response = $this->actingAs($this->adminUser)->put("/catalog/items/{$item->id}", [
            'name' => 'X-Ray Machine Digital',
            'category_id' => $this->category->id,
            'description' => 'Updated digital x-ray machine specification',
            'unit_type' => 'unit',
            'unit_cost' => 1200000.00,
            'quantity' => 1,
            'status' => 'Pending Award',
        ]);

        $response->assertSessionHas('success');
        $this->assertDatabaseHas('items', [
            'id' => $item->id,
            'name' => 'X-Ray Machine Digital',
            'status' => 'Pending Award',
        ]);
    }

    public function test_invalid_status_fails_validation(): void
    {
        $response = $this->actingAs($this->adminUser)->post('/catalog/items', [
            'name' => 'Invalid Test Item',
            'category_id' => $this->category->id,
            'unit_type' => 'pc',
            'unit_cost' => 100.00,
            'quantity' => 1,
            'status' => 'InvalidStatusValue',
        ]);

        $response->assertSessionHasErrors(['status']);
        $this->assertDatabaseMissing('items', [
            'name' => 'Invalid Test Item',
        ]);
    }

    public function test_awarded_unit_cost_and_awarded_abc_attributes_are_computed(): void
    {
        $bidder = Bidder::create([
            'name' => 'Apex Healthcare',
            'bidder_code' => 'APEX',
        ]);

        $item = Item::create([
            'item_code' => 'MED-5555',
            'name' => 'Dialysis Machine',
            'category_id' => $this->category->id,
            'description' => 'Automated dialysis system',
            'unit_type' => 'unit',
            'unit_cost' => 800000.00,
            'quantity' => 3,
            'status' => 'Awarded',
            'awarded_bidder_id' => $bidder->id,
        ]);
        $item->bidders()->attach($bidder->id, ['unit_cost' => 750000.00]);

        $item->load('bidders');
        $this->assertEquals(750000.00, $item->awarded_unit_cost);
        $this->assertEquals(2250000.00, $item->awarded_abc);

        // When not awarded, attributes should be null
        $item->update(['status' => 'Active', 'awarded_bidder_id' => null]);
        $this->assertNull($item->fresh()->awarded_unit_cost);
        $this->assertNull($item->fresh()->awarded_abc);
    }

    public function test_catalog_dashboard_receives_awarded_items_with_winning_bidder_and_costs(): void
    {
        $bidder = Bidder::create([
            'name' => 'Premier Medical Supplies',
            'bidder_code' => 'PREM-01',
            'brand_name' => 'Premier',
            'country_of_origin' => 'Philippines',
        ]);

        $item = Item::create([
            'item_code' => 'MED-777',
            'name' => 'Defibrillator Monitor',
            'category_id' => $this->category->id,
            'description' => 'Biphasic defibrillator with ECG',
            'unit_type' => 'unit',
            'unit_cost' => 350000.00,
            'quantity' => 2,
            'status' => 'Awarded',
            'awarded_bidder_id' => $bidder->id,
        ]);
        $item->bidders()->attach($bidder->id, ['unit_cost' => 320000.00]);

        $response = $this->actingAs($this->adminUser)->get('/catalog');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('CatalogApp')->has('items'));

        $items = $response->original->getData()['page']['props']['items'];
        $awardedItem = collect($items)->firstWhere('item_code', 'MED-777');

        $this->assertNotNull($awardedItem);
        $this->assertEquals('Awarded', $awardedItem['status']);
        $this->assertEquals('Premier Medical Supplies', $awardedItem['awarded_bidder']['name']);
        $this->assertEquals(320000.00, $awardedItem['awarded_unit_cost']);
        $this->assertEquals(640000.00, $awardedItem['awarded_abc']);
    }
}
