<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Bidder extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name', 'contact_person', 'contact_number', 'email', 'address', 'location', 'bidder_code',
        'brand_name', 'country_of_origin',
    ];

    protected $appends = [
        'origin',
    ];

    public function getOriginAttribute(): ?string
    {
        return $this->country_of_origin;
    }

    public function setOriginAttribute(?string $value): void
    {
        $this->attributes['country_of_origin'] = $value;
    }

    public function items(): BelongsToMany
    {
        return $this->belongsToMany(Item::class, 'item_bidder')->withPivot('unit_cost')->withTimestamps();
    }
}
