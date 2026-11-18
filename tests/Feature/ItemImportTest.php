<?php

namespace Tests\Feature;

use App\Models\Bidder;
use App\Models\Category;
use App\Models\Item;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class ItemImportTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private Category $categoryA;
    private Category $categoryB;
    private Bidder $bidderA;
    private Bidder $bidderB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'username' => 'admin_user',
            'role' => 'administrator',
        ]);

        $this->categoryA = Category::create([
            'name' => 'Medical Supplies',
            'cat_code' => 'med_supp',
            'description' => 'Hospital medical supplies',
        ]);

        $this->categoryB = Category::create([
            'name' => 'IT Equipment',
            'cat_code' => 'itequip',
            'description' => 'Hospital IT hardware',
        ]);

        $this->bidderA = Bidder::create([
            'name' => 'Alpha Medical Supplies Co.',
            'bidder_code' => 'ABC',
            'contact_person' => 'John Doe',
            'email' => 'alpha@example.com',
            'phone' => '09123456789',
        ]);

        $this->bidderB = Bidder::create([
            'name' => 'Beta Tech Solutions',
            'bidder_code' => 'QWE',
            'contact_person' => 'Jane Smith',
            'email' => 'beta@example.com',
            'phone' => '09987654321',
        ]);
    }

    public function test_import_creates_new_items_and_reports_added_count(): void
    {
        $csvContent = implode("\r\n", [
            'Category Code,Name,Description,Unit Type,Baseline Unit Cost,Quantity,Status,Bidders,Awarded Bidder',
            'e.g. med_supp (Required),e.g. Surgical Face Mask N95 (Required),e.g. High-filtration medical mask (Required),e.g. Box (Required),e.g. 1250.00 (Required),e.g. 100 (Required),e.g. Active (Optional),"e.g. ABC: 1200.00, QWE: 1220.00 (Optional)",e.g. ABC (Optional)',
            'med_supp,Surgical Mask,Disposable 3-ply mask,Box,150.00,50,Active,"ABC: 140.00, QWE: 145.00",',
            'itequip,Ethernet Cable Cat6,100m roll,Roll,2500.00,10,Active,"QWE: 2400.00",',
        ]);

        $file = UploadedFile::fake()->createWithContent('items.csv', $csvContent);

        $response = $this->actingAs($this->admin)->post('/catalog/items/import', [
            'csv_file' => $file,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success', 'Successfully processed items: 2 added, 0 updated.');

        $this->assertDatabaseHas('items', [
            'category_id' => $this->categoryA->id,
            'name' => 'Surgical Mask',
            'status' => Item::STATUS_ACTIVE,
            'quantity' => 50,
        ]);

        $this->assertDatabaseHas('items', [
            'category_id' => $this->categoryB->id,
            'name' => 'Ethernet Cable Cat6',
            'status' => Item::STATUS_ACTIVE,
            'quantity' => 10,
        ]);
    }

    public function test_import_updates_existing_item_when_category_code_matches(): void
    {
        $existingItem = Item::create([
            'item_code' => 'MED-001',
            'name' => 'Old Mask Name',
            'description' => 'Old description',
            'unit_type' => 'Box',
            'unit_cost' => 100.00,
            'quantity' => 20,
            'abc' => 2000.00,
            'category_id' => $this->categoryA->id,
            'status' => Item::STATUS_ACTIVE,
        ]);

        $csvContent = implode("\r\n", [
            'Category Code,Name,Description,Unit Type,Baseline Unit Cost,Quantity,Status,Bidders,Awarded Bidder',
            'e.g. med_supp (Required),e.g. Surgical Face Mask N95 (Required),e.g. High-filtration medical mask (Required),e.g. Box (Required),e.g. 1250.00 (Required),e.g. 100 (Required),e.g. Active (Optional),"e.g. ABC: 1200.00, QWE: 1220.00 (Optional)",e.g. ABC (Optional)',
            'med_supp,Updated Surgical Mask,Upgraded 4-ply medical mask,Box,180.00,60,Active,"ABC: 170.00",',
        ]);

        $file = UploadedFile::fake()->createWithContent('items.csv', $csvContent);

        $response = $this->actingAs($this->admin)->post('/catalog/items/import', [
            'csv_file' => $file,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success', 'Successfully processed items: 0 added, 1 updated.');

        $existingItem->refresh();
        $this->assertEquals('MED-001', $existingItem->item_code);
        $this->assertEquals('Updated Surgical Mask', $existingItem->name);
        $this->assertEquals('Upgraded 4-ply medical mask', $existingItem->description);
        $this->assertEquals(180.00, (float) $existingItem->unit_cost);
        $this->assertEquals(60, (int) $existingItem->quantity);
        $this->assertEquals(10800.00, (float) $existingItem->abc);
        $this->assertCount(1, $existingItem->bidders);
    }

    public function test_import_unconditionally_skips_line_2_hints(): void
    {
        $csvContent = implode("\r\n", [
            'Category Code,Name,Description,Unit Type,Baseline Unit Cost,Quantity,Status,Bidders,Awarded Bidder',
            'e.g. med_supp (Required),e.g. Surgical Face Mask N95 (Required),e.g. High-filtration medical mask (Required),e.g. Box (Required),e.g. 1250.00 (Required),e.g. 100 (Required),e.g. Active (Optional),"e.g. ABC: 1200.00, QWE: 1220.00 (Optional)",e.g. ABC (Optional)',
            'med_supp,Real Mask,Real description,Box,100.00,10,Active,,',
        ]);

        $file = UploadedFile::fake()->createWithContent('items.csv', $csvContent);

        $response = $this->actingAs($this->admin)->post('/catalog/items/import', [
            'csv_file' => $file,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success', 'Successfully processed items: 1 added, 0 updated.');

        $this->assertDatabaseMissing('items', [
            'name' => 'e.g. Surgical Face Mask N95 (Required)',
        ]);
        $this->assertDatabaseHas('items', [
            'name' => 'Real Mask',
        ]);
    }

    public function test_awarded_bidder_overrides_status_to_awarded(): void
    {
        $csvContent = implode("\r\n", [
            'Category Code,Name,Description,Unit Type,Baseline Unit Cost,Quantity,Status,Bidders,Awarded Bidder',
            'e.g. med_supp (Required),e.g. Surgical Face Mask N95 (Required),e.g. High-filtration medical mask (Required),e.g. Box (Required),e.g. 1250.00 (Required),e.g. 100 (Required),e.g. Active (Optional),"e.g. ABC: 1200.00, QWE: 1220.00 (Optional)",e.g. ABC (Optional)',
            // Explicitly set Status to "Pending Award", but Awarded Bidder to "ABC"
            'med_supp,Premium Syringe,Sterile 5ml syringe,Box,350.00,100,Pending Award,"ABC: 320.00",ABC',
        ]);

        $file = UploadedFile::fake()->createWithContent('items.csv', $csvContent);

        $response = $this->actingAs($this->admin)->post('/catalog/items/import', [
            'csv_file' => $file,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success', 'Successfully processed items: 1 added, 0 updated.');

        $item = Item::where('name', 'Premium Syringe')->first();
        $this->assertNotNull($item);
        // Status must be overridden to Awarded
        $this->assertEquals(Item::STATUS_AWARDED, $item->status);
        $this->assertEquals($this->bidderA->id, $item->awarded_bidder_id);
    }

    public function test_fallback_to_status_column_when_awarded_bidder_is_empty(): void
    {
        $csvContent = implode("\r\n", [
            'Category Code,Name,Description,Unit Type,Baseline Unit Cost,Quantity,Status,Bidders,Awarded Bidder',
            'e.g. med_supp (Required),e.g. Surgical Face Mask N95 (Required),e.g. High-filtration medical mask (Required),e.g. Box (Required),e.g. 1250.00 (Required),e.g. 100 (Required),e.g. Active (Optional),"e.g. ABC: 1200.00, QWE: 1220.00 (Optional)",e.g. ABC (Optional)',
            'med_supp,No Bid Item,Item with no bidders,Box,500.00,10,No Bid,,',
            'itequip,Default Active Item,Item with blank status,Piece,1200.00,5,,,',
        ]);

        $file = UploadedFile::fake()->createWithContent('items.csv', $csvContent);

        $response = $this->actingAs($this->admin)->post('/catalog/items/import', [
            'csv_file' => $file,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success', 'Successfully processed items: 2 added, 0 updated.');

        $item1 = Item::where('name', 'No Bid Item')->first();
        $this->assertEquals(Item::STATUS_NO_BID, $item1->status);
        $this->assertNull($item1->awarded_bidder_id);

        $item2 = Item::where('name', 'Default Active Item')->first();
        $this->assertEquals(Item::STATUS_ACTIVE, $item2->status);
        $this->assertNull($item2->awarded_bidder_id);
    }

    public function test_case_insensitivity_for_category_bidder_and_status(): void
    {
        $csvContent = implode("\r\n", [
            'Category Code,Name,Description,Unit Type,Baseline Unit Cost,Quantity,Status,Bidders,Awarded Bidder',
            'e.g. med_supp (Required),e.g. Surgical Face Mask N95 (Required),e.g. High-filtration medical mask (Required),e.g. Box (Required),e.g. 1250.00 (Required),e.g. 100 (Required),e.g. Active (Optional),"e.g. ABC: 1200.00, QWE: 1220.00 (Optional)",e.g. ABC (Optional)',
            // Uppercase category code, lowercase bidder code, lowercase status
            'MED_SUPP,Nitrile Gloves,Examination gloves,Box,300.00,50,pending award,"abc: 290.00",abc',
        ]);

        $file = UploadedFile::fake()->createWithContent('items.csv', $csvContent);

        $response = $this->actingAs($this->admin)->post('/catalog/items/import', [
            'csv_file' => $file,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success', 'Successfully processed items: 1 added, 0 updated.');

        $item = Item::where('name', 'Nitrile Gloves')->first();
        $this->assertNotNull($item);
        $this->assertEquals($this->categoryA->id, $item->category_id);
        $this->assertEquals(Item::STATUS_AWARDED, $item->status);
        $this->assertEquals($this->bidderA->id, $item->awarded_bidder_id);
    }

    public function test_error_handling_when_required_column_is_missing(): void
    {
        $csvContent = implode("\r\n", [
            'Category Code,Name,Description,Unit Type,Quantity',
            'e.g. med_supp (Required),e.g. Item (Required),e.g. Desc (Required),Box,10',
            'med_supp,Item 1,Desc 1,Box,10',
        ]);

        $file = UploadedFile::fake()->createWithContent('items.csv', $csvContent);

        $response = $this->actingAs($this->admin)->post('/catalog/items/import', [
            'csv_file' => $file,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('error');
    }

    public function test_error_handling_when_category_does_not_exist(): void
    {
        $csvContent = implode("\r\n", [
            'Category Code,Name,Description,Unit Type,Baseline Unit Cost,Quantity,Status,Bidders,Awarded Bidder',
            'e.g. med_supp (Required),e.g. Surgical Face Mask N95 (Required),e.g. High-filtration medical mask (Required),e.g. Box (Required),e.g. 1250.00 (Required),e.g. 100 (Required),e.g. Active (Optional),"e.g. ABC: 1200.00, QWE: 1220.00 (Optional)",e.g. ABC (Optional)',
            'non_existent_cat,Test Item,Description,Box,100.00,10,Active,,',
        ]);

        $file = UploadedFile::fake()->createWithContent('items.csv', $csvContent);

        $response = $this->actingAs($this->admin)->post('/catalog/items/import', [
            'csv_file' => $file,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('import_errors');
        $this->assertDatabaseMissing('items', ['name' => 'Test Item']);
    }

    public function test_import_with_status_as_last_column_and_various_statuses(): void
    {
        $csvContent = implode("\r\n", [
            'Category Code,Name,Description,Unit Type,Baseline Unit Cost,Quantity,Bidders,Awarded Bidder,Status',
            'e.g. med_supp (Required),e.g. Surgical Face Mask N95 (Required),e.g. High-filtration medical mask (Required),e.g. Box (Required),e.g. 1250.00 (Required),e.g. 100 (Required),"e.g. ABC: 1200.00, QWE: 1220.00 (Optional)",e.g. ABC (Optional),"e.g. Active (Optional)"',
            'med_supp,Closed Item,Completed procurement,Box,100.00,5,,,Closed',
            'itequip,Failed Bid Item,Cancelled procurement,Piece,500.00,2,,,Failed Bid',
        ]);

        $file = UploadedFile::fake()->createWithContent('items.csv', $csvContent);

        $response = $this->actingAs($this->admin)->post('/catalog/items/import', [
            'csv_file' => $file,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success', 'Successfully processed items: 2 added, 0 updated.');

        $item1 = Item::where('name', 'Closed Item')->first();
        $this->assertEquals(Item::STATUS_CLOSED, $item1->status);

        $item2 = Item::where('name', 'Failed Bid Item')->first();
        $this->assertEquals(Item::STATUS_FAILED_BID, $item2->status);
    }
}
