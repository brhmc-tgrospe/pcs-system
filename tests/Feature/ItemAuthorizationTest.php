<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Item;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ItemAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    private Category $category;

    protected function setUp(): void
    {
        parent::setUp();
        $this->category = Category::create([
            'name' => 'General Supplies',
            'cat_code' => 'GEN-01',
            'description' => 'Test category',
        ]);
    }

    public function test_staff_cannot_create_items(): void
    {
        $staff = User::factory()->create(['role' => 'user']);

        $response = $this->actingAs($staff)->post('/catalog/items', [
            'name' => 'Surgical Gloves',
            'description' => 'Box of 100',
            'unit_type' => 'Box',
            'unit_cost' => 250,
            'quantity' => 10,
            'category_id' => $this->category->id,
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_cannot_force_delete_item(): void
    {
        $admin = User::factory()->create(['role' => 'administrator']);
        $item = Item::create([
            'item_code' => 'ITM-001',
            'name' => 'Disposable Syringe',
            'description' => '10ml syringe',
            'unit_type' => 'Piece',
            'unit_cost' => 15,
            'quantity' => 100,
            'abc' => 1500,
            'category_id' => $this->category->id,
        ]);
        $item->delete(); // soft delete

        $response = $this->actingAs($admin)->delete("/catalog/items/{$item->id}/force");
        $response->assertStatus(403);
    }

    public function test_developer_can_force_delete_item(): void
    {
        $dev = User::factory()->create(['role' => 'developer']);
        $item = Item::create([
            'item_code' => 'ITM-002',
            'name' => 'Saline Solution',
            'description' => '500ml',
            'unit_type' => 'Bottle',
            'unit_cost' => 50,
            'quantity' => 50,
            'abc' => 2500,
            'category_id' => $this->category->id,
        ]);
        $item->delete(); // soft delete

        $response = $this->actingAs($dev)->delete("/catalog/items/{$item->id}/force");
        $response->assertRedirect();
        $this->assertDatabaseMissing('items', ['id' => $item->id]);
    }

    public function test_admin_cannot_bulk_force_delete_items(): void
    {
        $admin = User::factory()->create(['role' => 'administrator']);
        $item = Item::create([
            'item_code' => 'ITM-003',
            'name' => 'Gauze Pad',
            'description' => 'Sterile',
            'unit_type' => 'Pack',
            'unit_cost' => 20,
            'quantity' => 10,
            'abc' => 200,
            'category_id' => $this->category->id,
        ]);
        $item->delete();

        $response = $this->actingAs($admin)->post('/catalog/items/bulk/force', [
            'ids' => [$item->id],
        ]);
        $response->assertStatus(403);
    }

    public function test_developer_can_bulk_force_delete_items(): void
    {
        $dev = User::factory()->create(['role' => 'developer']);
        $item = Item::create([
            'item_code' => 'ITM-004',
            'name' => 'Cotton Rolls',
            'description' => 'Dental cotton',
            'unit_type' => 'Roll',
            'unit_cost' => 100,
            'quantity' => 5,
            'abc' => 500,
            'category_id' => $this->category->id,
        ]);
        $item->delete();

        $response = $this->actingAs($dev)->post('/catalog/items/bulk/force', [
            'ids' => [$item->id],
        ]);
        $response->assertRedirect();
        $this->assertDatabaseMissing('items', ['id' => $item->id]);
    }

    public function test_staff_cannot_create_categories(): void
    {
        $staff = User::factory()->create(['role' => 'user']);

        $response = $this->actingAs($staff)->post('/catalog/categories', [
            'name' => 'Unauthorized Category',
            'cat_code' => 'unauth-cat',
            'description' => 'Should fail',
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_cannot_force_delete_category(): void
    {
        $admin = User::factory()->create(['role' => 'administrator']);
        $cat = Category::create([
            'name' => 'Dental Tools',
            'cat_code' => 'dental-tools',
        ]);
        $cat->delete();

        $response = $this->actingAs($admin)->delete("/catalog/categories/{$cat->id}/force");
        $response->assertStatus(403);
    }

    public function test_developer_can_force_delete_category(): void
    {
        $dev = User::factory()->create(['role' => 'developer']);
        $cat = Category::create([
            'name' => 'X-Ray Lab',
            'cat_code' => 'xray-lab',
        ]);
        $cat->delete();

        $response = $this->actingAs($dev)->delete("/catalog/categories/{$cat->id}/force");
        $response->assertRedirect();
        $this->assertDatabaseMissing('categories', ['id' => $cat->id]);
    }

    public function test_admin_cannot_bulk_force_delete_categories(): void
    {
        $admin = User::factory()->create(['role' => 'administrator']);
        $cat = Category::create([
            'name' => 'Surgery Supplies',
            'cat_code' => 'surg-sup',
        ]);
        $cat->delete();

        $response = $this->actingAs($admin)->post('/catalog/categories/bulk/force', [
            'ids' => [$cat->id],
        ]);
        $response->assertStatus(403);
    }

    public function test_developer_can_bulk_force_delete_categories(): void
    {
        $dev = User::factory()->create(['role' => 'developer']);
        $cat = Category::create([
            'name' => 'Pediatric Supplies',
            'cat_code' => 'pedia-sup',
        ]);
        $cat->delete();

        $response = $this->actingAs($dev)->post('/catalog/categories/bulk/force', [
            'ids' => [$cat->id],
        ]);
        $response->assertRedirect();
        $this->assertDatabaseMissing('categories', ['id' => $cat->id]);
    }
}
