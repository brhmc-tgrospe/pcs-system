<?php

namespace Tests\Feature;

use App\Models\Bidder;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class BidderImportTest extends TestCase
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

    public function test_can_import_bidders_from_valid_csv(): void
    {
        $csvContent = "Bidder Code,Bidder Name,Contact Person,Contact Number,Email,Address,Location\n".
            "BDR-101,Alpha Medtech Corporation,Juan Dela Cruz,+63 912 345 6789,alpha@example.com,\"123 Medical Drive, Manila\",Manila City\n".
            "BDR-102,Beta Diagnostics Inc.,Maria Santos,+63 920 987 6543,beta@example.com,\"456 Science Ave, Quezon City\",Quezon City\n".
            "BDR-103,Gamma Healthcare,Pedro Reyes,+63 933 111 2222,gamma@example.com,\"789 Pharma Road, Pasig City\",Pasig City\n";

        $file = UploadedFile::fake()->createWithContent('bidders.csv', $csvContent);

        $response = $this->actingAs($this->adminUser)->post('/catalog/bidders/import', [
            'csv_file' => $file,
        ]);

        $response->assertSessionHas('success', 'Successfully imported 3 bidders.');
        $this->assertDatabaseHas('bidders', [
            'bidder_code' => 'BDR-101',
            'name' => 'Alpha Medtech Corporation',
            'contact_person' => 'Juan Dela Cruz',
            'contact_number' => '+63 912 345 6789',
            'email' => 'alpha@example.com',
            'address' => '123 Medical Drive, Manila',
            'location' => 'Manila City',
        ]);
        $this->assertDatabaseHas('bidders', ['bidder_code' => 'BDR-102', 'name' => 'Beta Diagnostics Inc.', 'location' => 'Quezon City']);
        $this->assertDatabaseHas('bidders', ['bidder_code' => 'BDR-103', 'name' => 'Gamma Healthcare', 'location' => 'Pasig City']);
    }

    public function test_import_fails_when_required_columns_are_missing(): void
    {
        $csvContent = "Contact Person,Email,Address\n".
            "Juan,juan@example.com,Manila\n";

        $file = UploadedFile::fake()->createWithContent('bidders.csv', $csvContent);

        $response = $this->actingAs($this->adminUser)->post('/catalog/bidders/import', [
            'csv_file' => $file,
        ]);

        $response->assertSessionHas('error');
        $this->assertDatabaseCount('bidders', 0);
    }

    public function test_import_handles_duplicate_codes_gracefully(): void
    {
        // Existing bidder in database
        Bidder::create([
            'bidder_code' => 'BDR-EXISTING',
            'name' => 'Already Existing Corp',
        ]);

        $csvContent = "Bidder Code,Bidder Name,Contact Person,Contact Number,Email,Address\n".
            "BDR-NEW-1,New Company 1,John,123,john@example.com,Address 1\n".
            "BDR-EXISTING,Duplicate Existing,Jane,456,jane@example.com,Address 2\n".
            "BDR-DUP-CSV,Duplicate In CSV,Bob,789,bob@example.com,Address 3\n".
            "BDR-DUP-CSV,Duplicate In CSV Again,Alice,012,alice@example.com,Address 4\n";

        $file = UploadedFile::fake()->createWithContent('bidders.csv', $csvContent);

        $response = $this->actingAs($this->adminUser)->post('/catalog/bidders/import', [
            'csv_file' => $file,
        ]);

        $response->assertSessionHas('import_errors');
        $this->assertDatabaseHas('bidders', ['bidder_code' => 'BDR-NEW-1', 'name' => 'New Company 1']);
        $this->assertDatabaseHas('bidders', ['bidder_code' => 'BDR-DUP-CSV', 'name' => 'Duplicate In CSV']);
        $this->assertDatabaseCount('bidders', 3); // 1 pre-existing + 2 imported
    }

    public function test_import_validates_email_format(): void
    {
        $csvContent = "Bidder Code,Bidder Name,Email\n".
            "BDR-201,Good Email Inc,good@example.com\n".
            "BDR-202,Bad Email Inc,invalid-email-format\n";

        $file = UploadedFile::fake()->createWithContent('bidders.csv', $csvContent);

        $response = $this->actingAs($this->adminUser)->post('/catalog/bidders/import', [
            'csv_file' => $file,
        ]);

        $response->assertSessionHas('import_errors');
        $this->assertDatabaseHas('bidders', ['bidder_code' => 'BDR-201', 'name' => 'Good Email Inc']);
        $this->assertDatabaseMissing('bidders', ['bidder_code' => 'BDR-202']);
    }

    public function test_can_import_bidders_with_brand_name_and_origin_columns(): void
    {
        $csvContent = "Bidder Code,Bidder Name,Brand Name,Origin\n".
            "BDR-301,Biologix Philippines,Biologix,China\n".
            "BDR-302,Karl Storz Distributor,Karl Storz,Germany\n";

        $file = UploadedFile::fake()->createWithContent('bidders.csv', $csvContent);

        $response = $this->actingAs($this->adminUser)->post('/catalog/bidders/import', [
            'csv_file' => $file,
        ]);

        $response->assertSessionHas('success', 'Successfully imported 2 bidders.');
        $this->assertDatabaseHas('bidders', [
            'bidder_code' => 'BDR-301',
            'name' => 'Biologix Philippines',
            'brand_name' => 'Biologix',
            'country_of_origin' => 'China',
        ]);
        $this->assertDatabaseHas('bidders', [
            'bidder_code' => 'BDR-302',
            'name' => 'Karl Storz Distributor',
            'brand_name' => 'Karl Storz',
            'country_of_origin' => 'Germany',
        ]);
    }
}
