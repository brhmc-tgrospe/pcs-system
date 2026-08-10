<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Category extends Model
{
    use SoftDeletes;

    protected $fillable = ['name', 'cat_code', 'description', 'parent_id'];

    protected static function boot()
    {
        parent::boot();

        static::created(function ($category) {
            ActivityLog::log('category_created', "Category '{$category->name}' was created.", 'Category', $category->id);
        });

        static::updated(function ($category) {
            ActivityLog::log('category_updated', "Category '{$category->name}' was updated.", 'Category', $category->id);
        });

        static::deleted(function ($category) {
            ActivityLog::log('category_deleted', "Category '{$category->name}' was deleted.", 'Category', $category->id);
        });
    }

    public function items(): HasMany
    {
        return $this->hasMany(Item::class);
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Category::class, 'parent_id');
    }
}
