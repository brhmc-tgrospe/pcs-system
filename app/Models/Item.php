<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

class Item extends Model
{
    use SoftDeletes;

    public const STATUS_ACTIVE = 'Active';

    public const STATUS_NO_BID = 'No Bid';

    public const STATUS_PENDING_AWARD = 'Pending Award';

    public const STATUS_FAILED_BID = 'Failed Bid';

    public const STATUS_AWARDED = 'Awarded';

    public const STATUS_CLOSED = 'Closed';

    public const STATUSES = [
        self::STATUS_ACTIVE,
        self::STATUS_NO_BID,
        self::STATUS_PENDING_AWARD,
        self::STATUS_FAILED_BID,
        self::STATUS_AWARDED,
        self::STATUS_CLOSED,
    ];

    protected $fillable = [
        'item_code', 'name', 'description',
        'unit_type', 'unit_cost', 'quantity', 'abc', 'category_id', 'image_url', 'status', 'awarded_bidder_id',
    ];

    protected $casts = [
        'unit_cost' => 'decimal:2',
        'quantity' => 'decimal:2',
        'abc' => 'decimal:2',
    ];

    protected $appends = [
        'awarded_unit_cost',
        'awarded_abc',
    ];

    public function getAwardedUnitCostAttribute(): ?float
    {
        if ($this->status !== self::STATUS_AWARDED || ! $this->awarded_bidder_id) {
            return null;
        }

        if ($this->relationLoaded('bidders')) {
            $bidder = $this->bidders->firstWhere('id', $this->awarded_bidder_id);

            return $bidder?->pivot?->unit_cost !== null ? (float) $bidder->pivot->unit_cost : null;
        }

        $pivot = DB::table('item_bidder')
            ->where('item_id', $this->id)
            ->where('bidder_id', $this->awarded_bidder_id)
            ->first();

        return $pivot ? (float) $pivot->unit_cost : null;
    }

    public function getAwardedAbcAttribute(): ?float
    {
        $unitCost = $this->awarded_unit_cost;
        if ($unitCost === null) {
            return null;
        }

        return round($unitCost * (float) $this->quantity, 2);
    }

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

    public function awardedBidder(): BelongsTo
    {
        return $this->belongsTo(Bidder::class, 'awarded_bidder_id');
    }

    public function bidders(): BelongsToMany
    {
        return $this->belongsToMany(Bidder::class, 'item_bidder')->withPivot('unit_cost')->withTimestamps();
    }
}
