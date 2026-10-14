<?php

$fp = fopen('C:/Users/Programmer/.gemini/antigravity/brain/8204cc94-6f8c-4828-ba2e-8e6345e63d79/.system_generated/logs/transcript.jsonl', 'r');
$count = 0;
while (($line = fgets($fp)) !== false) {
    if (stripos($line, 'Endure, China') !== false || stripos($line, 'option') !== false) {
        $data = json_decode($line, true);
        if (isset($data['content']) && is_string($data['content'])) {
            // Find matches in content
            if (preg_match_all('/.{0,100}(?:Endure, China|option).{0,100}/i', $data['content'], $matches)) {
                foreach (array_slice($matches[0], 0, 5) as $m) {
                    echo '[Match '.(++$count).']: '.trim($m)."\n";
                }
            }
        }
    }
}
fclose($fp);
