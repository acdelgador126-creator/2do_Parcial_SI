<?php

namespace App\Exports\ReportesIA;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class ReporteVozExport implements FromCollection, WithHeadings, WithMapping
{
    protected $resultados;
    protected $counter = 0;

    public function __construct($resultados)
    {
        $this->resultados = $resultados;
    }

    public function collection()
    {
        return $this->resultados;
    }

    public function headings(): array
    {
        return ['Nº', 'CI', 'Apellidos', 'Nombres', 'Estado', 'Turno', '1ra Opción', 'Carrera Asignada', 'Promedio'];
    }

    public function map($p): array
    {
        $this->counter++;
        return [
            $this->counter,
            $p->ci,
            $p->apellidos,
            $p->nombres,
            $p->estado,
            $p->turno_preferencia,
            $p->primeraOpcion?->nombre ?? '-',
            $p->admision?->carrera?->nombre ?? '-',
            $p->promedio_general ?? '-',
        ];
    }
}
