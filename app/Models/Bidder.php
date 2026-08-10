<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Bidder extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'name', 'contact_person', 'contact_number', 'email', 'address'
    ];

    public function items(): BelongsToMany
    {
        return $this->belongsToMany(Item::class, 'item_bidder')->withPivot('unit_cost')->withTimestamps();
    }
}
