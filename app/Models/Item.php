<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Item extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'item_code', 'name', 'description', 
        'unit_type', 'unit_cost', 'quantity', 'abc', 'category_id', 'image_url'
    ];


    protected $casts = [
        'unit_cost'      => 'decimal:2',
        'quantity'       => 'decimal:2',
        'abc'            => 'decimal:2',
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

    public function bidders(): \Illuminate\Database\Eloquent\Relations\BelongsToMany
    {
        return $this->belongsToMany(Bidder::class, 'item_bidder')->withPivot('unit_cost')->withTimestamps();
    }
}
