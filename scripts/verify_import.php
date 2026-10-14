<?php

require __DIR__.'/../vendor/autoload.php';

$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

use App\Models\Bidder;
use App\Models\Category;
use App\Models\Item;
use App\Models\Signatory;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

echo 'Categories count: '.Category::count().PHP_EOL;
echo 'Items count: '.Item::count().PHP_EOL;
echo 'Bidders count: '.Bidder::count().PHP_EOL;
echo 'Item-Bidder links count: '.DB::table('item_bidder')->count().PHP_EOL;
echo 'Signatories count: '.Signatory::count().PHP_EOL;

echo "\n--- All Bidders with Location in Database ---\n";
$bidders = Bidder::all();
foreach ($bidders as $b) {
    echo "- Code: {$b->bidder_code} | Name: {$b->name} | Location: {$b->location}\n";
}
