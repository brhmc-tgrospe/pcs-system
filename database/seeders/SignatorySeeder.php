<?php

namespace Database\Seeders;

use App\Models\Signatory;
use Illuminate\Database\Seeder;

class SignatorySeeder extends Seeder
{
    public function run(): void
    {
        $signatories = [
            ['name' => 'ROMMEL M. MILLENA, RME', 'designation' => 'Provisionary Member', 'order' => 1],
            ['name' => 'CYNTHIA B. TUANQUI, RN', 'designation' => 'BAC Member', 'order' => 2],
            ['name' => 'JOSE KRISTOFFER A. CAMBA, RN, MAN, PHd', 'designation' => 'BAC Member', 'order' => 3],
            ['name' => 'JOHN HOMMER E. DY, MD', 'designation' => 'BAC MEMBER', 'order' => 4],
            ['name' => 'PEM DONNA R. DOLLENTAS, DMD', 'designation' => 'BAC Member', 'order' => 5],
            ['name' => 'MARYJEN N. MONREAL, RPh', 'designation' => 'BAC Vice-Chairperson', 'order' => 6],
            ['name' => 'AILEEN C. MERIOLES, MD, FPCP', 'designation' => 'BAC Chairperson', 'order' => 7],
            ['name' => 'HAZEL B. MILLENA, RN', 'designation' => 'TWG Member', 'order' => 8],
            ['name' => 'OSCAR E. EDRALIN JR., RN', 'designation' => 'TWG Member', 'order' => 9],
        ];

        foreach ($signatories as $sig) {
            Signatory::firstOrCreate(['name' => $sig['name']], $sig);
        }
    }
}
