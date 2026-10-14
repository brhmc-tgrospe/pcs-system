<?php

$handle = fopen(__DIR__.'/../database/data/abstract_of_bids_raw.csv', 'r');
$rows = [];
while (($d = fgetcsv($handle)) !== false) {
    $rows[] = $d;
}
fclose($handle);

$currentItemNo = null;
$itemLines = [];

foreach ($rows as $index => $row) {
    if (empty(array_filter($row, fn ($c) => trim((string) $c) !== ''))) {
        continue;
    }

    $col0 = trim($row[0] ?? '');
    if (is_numeric($col0)) {
        $currentItemNo = (int) $col0;
        $itemLines[$currentItemNo] = [
            'main' => $row,
            'extra' => [],
        ];
    } elseif ($currentItemNo !== null) {
        $itemLines[$currentItemNo]['extra'][] = $row;
    }
}

echo 'Total items indexed: '.count($itemLines)."\n";

foreach ($itemLines as $num => $data) {
    if (count($data['extra']) > 2) {
        echo "========================================\n";
        echo "Item {$num} has ".count($data['extra'])." extra lines!\n";
        echo 'Main: '.implode(' , ', array_slice($data['main'], 0, 11))."\n";
        foreach ($data['extra'] as $idx => $ex) {
            echo "  Extra {$idx}: ".implode(' , ', array_slice($ex, 0, 11))."\n";
        }
    }
}
