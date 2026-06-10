<?php

namespace App\Exports\ReportesIA;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithTitle;

class ReporteVozExport implements FromCollection, WithHeadings, WithMapping, WithTitle
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

    public function title(): string
    {
        return 'Reporte Comando Voz';
    }

    public function headings(): array
    {
        return [
            'Nº',
            'Postulante',
            'CI',
            'Sexo',
            'Estado',
            'Turno',
            'Grupo',
            '1ra Opción',
            '2da Opción',
            'Carrera Asignada',
            'Vía',
            'Promedio',
        ];
    }

    public function map($p): array
    {
        $this->counter++;

        $grupo = $p->asignacionGrupo?->grupo;
        $grupoLabel = $grupo ? 'G' . $grupo->numero . ' (' . $grupo->turno . ')' : '-';

        $promedio = $p->promedio_general;
        if ($promedio !== null && $promedio !== '' && (float) $promedio > 0) {
            $promedio = number_format((float) $promedio, 2, '.', '');
        } else {
            $promedio = '-';
        }

        return [
            $this->counter,
            trim($p->apellidos . ', ' . $p->nombres),
            $p->ci,
            $p->sexo === 'M' ? 'M' : 'F',
            $p->estado,
            $p->turno_preferencia ?? '-',
            $grupoLabel,
            $p->primeraOpcion?->nombre ?? '-',
            $p->segundaOpcion?->nombre ?? '-',
            $p->admision?->carrera?->nombre ?? '-',
            $p->admision?->via ?? '-',
            $promedio,
        ];
    }
}
