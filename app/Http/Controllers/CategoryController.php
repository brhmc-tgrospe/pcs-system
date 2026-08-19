<?php
namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

class CategoryController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        if ($request->has('categories') && is_array($request->input('categories'))) {
            $validated = $request->validate([
                'categories' => ['required', 'array', 'min:1'],
                'categories.*.name' => ['required', 'string', 'max:255', 'distinct', 'unique:categories,name'],
                'categories.*.cat_code' => ['required', 'string', 'max:255', 'distinct', 'unique:categories,cat_code', 'regex:/^[a-z0-9-]+$/'],
                'categories.*.description' => ['nullable', 'string', 'max:1000'],
                'categories.*.parent_id' => ['nullable', 'exists:categories,id'],
            ], [
                'categories.*.name.required' => 'Category name is required.',
                'categories.*.name.distinct' => 'Each category name must be unique.',
                'categories.*.name.unique' => 'The category name :input has already been taken.',
                'categories.*.cat_code.required' => 'Category code is required.',
                'categories.*.cat_code.distinct' => 'Each category code must be unique.',
                'categories.*.cat_code.unique' => 'The category code :input has already been taken.',
                'categories.*.cat_code.regex' => 'The category code must only contain lowercase letters, numbers, and hyphens.',
            ]);

            DB::transaction(function () use ($validated) {
                foreach ($validated['categories'] as $catData) {
                    Category::create($catData);
                }
            });

            $count = count($validated['categories']);
            return back()->with('success', $count > 1 ? "{$count} categories created successfully." : 'Category created successfully.');
        }

        $validated = $request->validate([
            'name'        => ['required', 'string', 'max:255', 'unique:categories,name'],
            'cat_code'    => ['required', 'string', 'max:255', 'unique:categories,cat_code', 'regex:/^[a-z0-9-]+$/'],
            'description' => ['nullable', 'string', 'max:1000'],
            'parent_id'   => ['nullable', 'exists:categories,id'],
        ]);

        $category = Category::create($validated);

        return back()->with('success', "Category '{$category->name}' created successfully.");
    }

    public function update(Request $request, Category $category): RedirectResponse
    {
        $validated = $request->validate([
            'name'        => ['required', 'string', 'max:255', 'unique:categories,name,' . $category->id],
            'cat_code'    => ['required', 'string', 'max:255', 'unique:categories,cat_code,' . $category->id, 'regex:/^[a-z0-9-]+$/'],
            'description' => ['nullable', 'string', 'max:1000'],
            'parent_id'   => ['nullable', 'exists:categories,id', function ($attribute, $value, $fail) use ($category) {
                if ($value == $category->id) {
                    $fail('A category cannot be its own parent.');
                }
            }],
        ]);

        $category->update($validated);

        return back()->with('success', "Category '{$category->name}' updated successfully.");
    }

    public function destroy(Category $category): RedirectResponse
    {
        if ($category->items()->withTrashed()->exists()) {
            return back()->with('error', "Cannot delete '{$category->name}' because it has items. Remove or reassign the items first.");
        }

        $name = $category->name;
        $category->delete();

        return back()->with('success', "Category '{$name}' deleted successfully.");
    }

    public function restore($id): RedirectResponse
    {
        $category = Category::withTrashed()->findOrFail($id);
        $category->restore();
        return back()->with('success', "Category '{$category->name}' restored successfully.");
    }

    public function forceDelete($id): RedirectResponse
    {
        if (auth()->user()->role !== 'developer') {
            return back()->with('error', 'Only developers can permanently delete data. Please contact the developer team to have this category permanently removed.');
        }

        $category = Category::withTrashed()->findOrFail($id);
        
        if ($category->items()->withTrashed()->exists()) {
            return back()->with('error', "Cannot permanently delete '{$category->name}' because it has items.");
        }

        $name = $category->name;
        $category->forceDelete();
        return back()->with('success', "Category '{$name}' permanently deleted.");
    }

    public function bulkDelete(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids'   => ['required', 'array'],
            'ids.*' => ['integer', 'exists:categories,id'],
        ]);

        $categories = Category::whereIn('id', $validated['ids'])->get();
        $deletedCount = 0;
        $failedNames = [];

        foreach ($categories as $category) {
            if ($category->items()->withTrashed()->exists()) {
                $failedNames[] = $category->name;
            } else {
                $category->delete();
                $deletedCount++;
            }
        }

        if (count($failedNames) > 0) {
            $failedStr = implode(', ', $failedNames);
            return back()->with('error', "Deleted {$deletedCount} category/categories. Failed to delete: {$failedStr} (they have items connected).");
        }

        return back()->with('success', "{$deletedCount} category/categories deleted successfully.");
    }

    public function bulkRestore(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids'   => ['required', 'array'],
            'ids.*' => ['integer'],
        ]);

        $count = Category::withTrashed()->whereIn('id', $validated['ids'])->restore();
        return back()->with('success', "{$count} category/categories restored successfully.");
    }

    public function bulkForceDelete(Request $request): RedirectResponse
    {
        if (auth()->user()->role !== 'developer') {
            return back()->with('error', 'Only developers can permanently delete data. Please contact the developer team to have these categories permanently removed.');
        }

        $validated = $request->validate([
            'ids'   => ['required', 'array'],
            'ids.*' => ['integer'],
        ]);

        $categories = Category::withTrashed()->whereIn('id', $validated['ids'])->get();
        $deletedCount = 0;
        $failedNames = [];

        foreach ($categories as $category) {
            if ($category->items()->withTrashed()->exists()) {
                $failedNames[] = $category->name;
            } else {
                $category->forceDelete();
                $deletedCount++;
            }
        }

        if (count($failedNames) > 0) {
            $failedStr = implode(', ', $failedNames);
            return back()->with('error', "Permanently deleted {$deletedCount} category/categories. Failed to delete: {$failedStr} (they have items connected).");
        }

        return back()->with('success', "{$deletedCount} category/categories permanently deleted.");
    }
}
