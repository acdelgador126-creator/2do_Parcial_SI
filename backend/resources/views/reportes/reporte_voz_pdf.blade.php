<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>{{ $titulo }}</title>
    <style>
        @page {
            margin: 16mm 10mm 18mm 10mm;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 9px;
            color: #0f172a;
            line-height: 1.35;
        }

        .header {
            text-align: center;
            border-bottom: 2px solid #1e3a8a;
            padding-bottom: 10px;
            margin-bottom: 12px;
        }

        .header .institution {
            font-size: 11px;
            font-weight: bold;
            color: #1e3a8a;
            letter-spacing: 0.3px;
            text-transform: uppercase;
        }

        .header .faculty {
            font-size: 9.5px;
            font-weight: bold;
            color: #334155;
            margin-top: 3px;
        }

        .header .unit {
            font-size: 8.5px;
            color: #64748b;
            margin-top: 2px;
        }

        .report-title {
            margin: 10px 0 8px;
            padding: 6px 8px;
            background-color: #eff6ff;
            border-left: 4px solid #1e40af;
        }

        .report-title h2 {
            font-size: 10px;
            color: #1e3a8a;
            font-weight: bold;
        }

        .meta {
            margin-bottom: 10px;
            border: 1px solid #cbd5e1;
            padding: 8px 10px;
            background-color: #f8fafc;
        }

        .meta-row {
            margin-bottom: 3px;
            font-size: 8px;
            color: #334155;
        }

        .meta-row strong {
            color: #0f172a;
        }

        .badges {
            margin-top: 4px;
        }

        .badge {
            display: inline-block;
            background-color: #dbeafe;
            color: #1e40af;
            border: 1px solid #93c5fd;
            padding: 2px 6px;
            font-size: 7.5px;
            font-weight: bold;
            margin: 0 4px 3px 0;
        }

        table.data {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
            margin-top: 6px;
        }

        table.data thead tr {
            background-color: #1e3a8a;
            color: #ffffff;
        }

        table.data th {
            padding: 5px 3px;
            font-size: 6.5px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.2px;
            text-align: left;
            border: 1px solid #1e3a8a;
            vertical-align: middle;
        }

        table.data td {
            padding: 4px 3px;
            font-size: 7px;
            border: 1px solid #cbd5e1;
            vertical-align: middle;
            word-wrap: break-word;
        }

        table.data tbody tr:nth-child(even) {
            background-color: #f1f5f9;
        }

        .col-num { width: 3%; text-align: center; }
        .col-ci { width: 7%; }
        .col-name { width: 12%; }
        .col-sexo { width: 4%; text-align: center; }
        .col-estado { width: 9%; }
        .col-turno { width: 6%; }
        .col-grupo { width: 8%; }
        .col-carrera { width: 11%; }
        .col-via { width: 6%; }
        .col-prom { width: 5%; text-align: center; font-weight: bold; }

        .estado {
            font-size: 6.5px;
            font-weight: bold;
        }

        .estado-admitido { color: #0369a1; }
        .estado-aprobado { color: #047857; }
        .estado-reprobado { color: #b91c1c; }
        .estado-pendiente { color: #b45309; }
        .estado-otro { color: #4338ca; }

        .footer {
            position: fixed;
            bottom: -8mm;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 7px;
            color: #64748b;
            border-top: 1px solid #cbd5e1;
            padding-top: 4px;
        }

        .summary {
            margin-top: 8px;
            font-size: 8px;
            color: #475569;
            text-align: right;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="institution">Universidad Autónoma Gabriel René Moreno</div>
        <div class="faculty">Facultad de Ingeniería en Ciencias de la Computación y Telecomunicaciones</div>
        <div class="unit">Curso Preuniversitario (CUP) — Sistema Integral de Admisión</div>
    </div>

    <div class="report-title">
        <h2>{{ $titulo }}</h2>
    </div>

    <div class="meta">
        <div class="meta-row"><strong>Fecha de generación:</strong> {{ $fecha }}</div>
        <div class="meta-row">
            <strong>Filtros aplicados (consulta por voz / IA):</strong>
            <span class="badges">
                @if($filtros['estado'])
                    <span class="badge">Estado: {{ $filtros['estado'] }}</span>
                @endif
                @if($filtros['carrera'])
                    <span class="badge">Carrera: {{ $filtros['carrera'] }}</span>
                @endif
                @if($filtros['turno'])
                    <span class="badge">Turno: {{ $filtros['turno'] }}</span>
                @endif
                @if($filtros['sexo'])
                    <span class="badge">Sexo: {{ $filtros['sexo'] === 'M' ? 'Masculino' : 'Femenino' }}</span>
                @endif
                @if(!$filtros['estado'] && !$filtros['carrera'] && !$filtros['turno'] && !$filtros['sexo'])
                    <span style="color:#94a3b8;">Ninguno</span>
                @endif
            </span>
        </div>
        <div class="meta-row"><strong>Total de registros:</strong> {{ count($resultados) }}</div>
    </div>

    <table class="data">
        <thead>
            <tr>
                <th class="col-num">Nº</th>
                <th class="col-name">Postulante</th>
                <th class="col-ci">CI</th>
                <th class="col-sexo">Sexo</th>
                <th class="col-estado">Estado</th>
                <th class="col-turno">Turno</th>
                <th class="col-grupo">Grupo</th>
                <th class="col-carrera">1ra Opción</th>
                <th class="col-carrera">2da Opción</th>
                <th class="col-carrera">Carrera Asignada</th>
                <th class="col-via">Vía</th>
                <th class="col-prom">Promedio</th>
            </tr>
        </thead>
        <tbody>
            @foreach($resultados as $i => $p)
                @php
                    $grupo = $p->asignacionGrupo?->grupo;
                    $grupoLabel = $grupo ? 'G' . $grupo->numero . ' (' . $grupo->turno . ')' : '-';
                    $estadoClass = match ($p->estado) {
                        'Admitido' => 'estado-admitido',
                        'Aprobado' => 'estado-aprobado',
                        'Reprobado' => 'estado-reprobado',
                        'Pendiente Reasignacion' => 'estado-pendiente',
                        default => 'estado-otro',
                    };
                    $promedio = $p->promedio_general;
                    if ($promedio !== null && $promedio !== '' && (float) $promedio > 0) {
                        $promedio = number_format((float) $promedio, 2, '.', '');
                    } else {
                        $promedio = '-';
                    }
                @endphp
                <tr>
                    <td class="col-num">{{ $i + 1 }}</td>
                    <td class="col-name">{{ $p->apellidos }}, {{ $p->nombres }}</td>
                    <td class="col-ci">{{ $p->ci }}</td>
                    <td class="col-sexo">{{ $p->sexo === 'M' ? 'M' : 'F' }}</td>
                    <td class="col-estado"><span class="estado {{ $estadoClass }}">{{ $p->estado }}</span></td>
                    <td class="col-turno">{{ $p->turno_preferencia ?? '-' }}</td>
                    <td class="col-grupo">{{ $grupoLabel }}</td>
                    <td class="col-carrera">{{ $p->primeraOpcion?->nombre ?? '-' }}</td>
                    <td class="col-carrera">{{ $p->segundaOpcion?->nombre ?? '-' }}</td>
                    <td class="col-carrera">{{ $p->admision?->carrera?->nombre ?? '-' }}</td>
                    <td class="col-via">{{ $p->admision?->via ?? '-' }}</td>
                    <td class="col-prom">{{ $promedio }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="summary">
        Documento generado automáticamente — {{ count($resultados) }} registro(s)
    </div>

    <div class="footer">
        FICCT — UAGRM | Reporte oficial del Sistema CUP | {{ $fecha }}
    </div>
</body>
</html>
