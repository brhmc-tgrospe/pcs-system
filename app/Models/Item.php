<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Item extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'item_code', 'name', 'description', 'specifications',
        'unit_type', 'unit_price', 'price_referral', 'category_id', 'is_active', 'image_url'
    ];


    protected $casts = [
        'specifications'  => 'array',
        'price_referral' => 'array',
        'is_active'       => 'boolean',
        'unit_price'      => 'decimal:2',
    ];


    protected static function boot()
    {
        parent::boot();

        static::created(function ($item) {
            ActivityLog::log('item_created', "Item '{$item->name}' ({$item->item_code}) was created.", 'Item', $item->id);
        });

        static::updated(function ($item) {
            ActivityLog::log('item_updated', "Item '{$item->name}' ({$item->item_code}) was updated.", 'Item', $item->id);
        });

        static::deleted(function ($item) {
            ActivityLog::log('item_deleted', "Item '{$item->name}' ({$item->item_code}) was deleted.", 'Item', $item->id);
        });
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}
