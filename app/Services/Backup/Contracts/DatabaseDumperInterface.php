<?php

namespace App\Services\Backup\Contracts;

interface DatabaseDumperInterface
{
    /**
     * Dump the configured database into a compressed .sql.gz target path.
     *
     * @param  string  $targetGzPath  Destination .sql.gz path
     *
     * @throws \RuntimeException
     */
    public function dump(string $targetGzPath): bool;
}
