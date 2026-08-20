<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryTest extends TestCase
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

    public function test_can_create_single_category(): void
    {
        $response = $this->actingAs($this->adminUser)->post('/catalog/categories', [
            'name' => 'Single Category',
            'cat_code' => 'single-category',
            'description' => 'A single category description',
        ]);

        $response->assertSessionHas('success', "Category 'Single Category' created successfully.");
        $this->assertDatabaseHas('categories', [
            'name' => 'Single Category',
            'cat_code' => 'single-category',
        ]);
    }

    public function test_can_create_multiple_categories_simultaneously(): void
    {
        $response = $this->actingAs($this->adminUser)->post('/catalog/categories', [
            'categories' => [
                [
                    'name' => 'Category One',
                    'cat_code' => 'cat-one',
                    'description' => 'Description 1',
                ],
                [
                    'name' => 'Category Two',
                    'cat_code' => 'cat-two',
                    'description' => 'Description 2',
                ],
                [
                    'name' => 'Category Three',
                    'cat_code' => 'cat-three',
                    'description' => 'Description 3',
                ],
            ],
        ]);

        $response->assertSessionHas('success', '3 categories created successfully.');
        $this->assertDatabaseHas('categories', ['name' => 'Category One', 'cat_code' => 'cat-one']);
        $this->assertDatabaseHas('categories', ['name' => 'Category Two', 'cat_code' => 'cat-two']);
        $this->assertDatabaseHas('categories', ['name' => 'Category Three', 'cat_code' => 'cat-three']);
    }

    public function test_validation_fails_for_duplicate_category_codes_in_multiple_categories(): void
    {
        $response = $this->actingAs($this->adminUser)->post('/catalog/categories', [
            'categories' => [
                [
                    'name' => 'First Category',
                    'cat_code' => 'duplicate-code',
                ],
                [
                    'name' => 'Second Category',
                    'cat_code' => 'duplicate-code',
                ],
            ],
        ]);

        $response->assertSessionHasErrors(['categories.0.cat_code', 'categories.1.cat_code']);
        $this->assertDatabaseCount('categories', 0);
    }

    public function test_validation_fails_for_invalid_cat_code_format(): void
    {
        $response = $this->actingAs($this->adminUser)->post('/catalog/categories', [
            'categories' => [
                [
                    'name' => 'Invalid Code Category',
                    'cat_code' => 'INVALID CODE with Spaces!',
                ],
            ],
        ]);

        $response->assertSessionHasErrors(['categories.0.cat_code']);
    }

    public function test_can_update_category(): void
    {
        $category = Category::create([
            'name' => 'Old Category Name',
            'cat_code' => 'old-category-code',
        ]);

        $response = $this->actingAs($this->adminUser)->put("/catalog/categories/{$category->id}", [
            'name' => 'Updated Category Name',
            'cat_code' => 'updated-category-code',
            'description' => 'Updated Description',
        ]);

        $response->assertSessionHas('success', "Category 'Updated Category Name' updated successfully.");
        $this->assertDatabaseHas('categories', [
            'id' => $category->id,
            'name' => 'Updated Category Name',
            'cat_code' => 'updated-category-code',
        ]);
    }
}
