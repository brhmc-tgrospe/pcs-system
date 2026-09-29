<?php

namespace Tests\Feature;

use App\Models\Bidder;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BidderTest extends TestCase
{
    use RefreshDatabase;

    protected User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();
        $this->adminUser = User::factory()->create([
            'role' => 'administrator',
        ]);
    }

    public function test_can_render_bidders_page(): void
    {
        $response = $this->actingAs($this->adminUser)->get('/catalog/bidders');
        $response->assertStatus(200);
    }

    public function test_can_create_single_bidder(): void
    {
        $response = $this->actingAs($this->adminUser)->post('/catalog/bidders', [
            'name' => 'Single Bidder Inc.',
            'bidder_code' => 'BDR-SINGLE-1',
            'contact_person' => 'John Doe',
            'contact_number' => '123456',
            'email' => 'single@example.com',
            'address' => '123 Street',
        ]);

        $response->assertSessionHas('success', 'Bidder added successfully.');
        $this->assertDatabaseHas('bidders', [
            'name' => 'Single Bidder Inc.',
            'bidder_code' => 'BDR-SINGLE-1',
        ]);
    }

    public function test_can_create_multiple_bidders_simultaneously(): void
    {
        $response = $this->actingAs($this->adminUser)->post('/catalog/bidders', [
            'bidders' => [
                [
                    'name' => 'Alpha Corporation',
                    'bidder_code' => 'BDR-ALPHA',
                ],
                [
                    'name' => 'Beta Enterprises',
                    'bidder_code' => 'BDR-BETA',
                ],
                [
                    'name' => 'Gamma Solutions',
                    'bidder_code' => 'BDR-GAMMA',
                ],
            ],
        ]);

        $response->assertSessionHas('success', '3 bidders added successfully.');
        $this->assertDatabaseHas('bidders', ['name' => 'Alpha Corporation', 'bidder_code' => 'BDR-ALPHA']);
        $this->assertDatabaseHas('bidders', ['name' => 'Beta Enterprises', 'bidder_code' => 'BDR-BETA']);
        $this->assertDatabaseHas('bidders', ['name' => 'Gamma Solutions', 'bidder_code' => 'BDR-GAMMA']);
    }

    public function test_validation_fails_for_duplicate_bidder_codes_in_multiple_bidders(): void
    {
        $response = $this->actingAs($this->adminUser)->post('/catalog/bidders', [
            'bidders' => [
                [
                    'name' => 'First Company',
                    'bidder_code' => 'BDR-DUPLICATE',
                ],
                [
                    'name' => 'Second Company',
                    'bidder_code' => 'BDR-DUPLICATE',
                ],
            ],
        ]);

        $response->assertSessionHasErrors(['bidders.0.bidder_code', 'bidders.1.bidder_code']);
        $this->assertDatabaseCount('bidders', 0);
    }

    public function test_validation_fails_for_existing_bidder_code_in_database(): void
    {
        Bidder::create([
            'name' => 'Existing Company',
            'bidder_code' => 'BDR-EXISTING',
        ]);

        $response = $this->actingAs($this->adminUser)->post('/catalog/bidders', [
            'bidders' => [
                [
                    'name' => 'New Company',
                    'bidder_code' => 'BDR-EXISTING',
                ],
            ],
        ]);

        $response->assertSessionHasErrors(['bidders.0.bidder_code']);
    }

    public function test_can_update_bidder(): void
    {
        $bidder = Bidder::create([
            'name' => 'Original Name',
            'bidder_code' => 'BDR-ORIG',
        ]);

        $response = $this->actingAs($this->adminUser)->put("/catalog/bidders/{$bidder->id}", [
            'name' => 'Updated Name',
            'bidder_code' => 'BDR-ORIG-UPDATED',
        ]);

        $response->assertSessionHas('success', 'Bidder updated successfully.');
        $this->assertDatabaseHas('bidders', [
            'id' => $bidder->id,
            'name' => 'Updated Name',
            'bidder_code' => 'BDR-ORIG-UPDATED',
        ]);
    }

    public function test_can_create_bidder_with_brand_name_and_origin(): void
    {
        $response = $this->actingAs($this->adminUser)->post('/catalog/bidders', [
            'name' => 'Biologix Supplier Ltd.',
            'bidder_code' => 'BDR-BIO-1',
            'brand_name' => 'Biologix',
            'origin' => 'China',
        ]);

        $response->assertSessionHas('success', 'Bidder added successfully.');
        $this->assertDatabaseHas('bidders', [
            'name' => 'Biologix Supplier Ltd.',
            'bidder_code' => 'BDR-BIO-1',
            'brand_name' => 'Biologix',
            'country_of_origin' => 'China',
        ]);
    }
}
