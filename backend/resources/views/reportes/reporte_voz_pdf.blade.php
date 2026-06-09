<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>{{ $titulo }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'DejaVu Sans', Arial, sans-serif; font-size: 11px; color: #1a1a1a; }

        .header { text-align: center; border-bottom: 3px solid #1e40af; padding-bottom: 12px; margin-bottom: 16px; }
        .header h1 { font-size: 14px; color: #1e40af; margin-bottom: 2px; }
        .header h2 { font-size: 12px; color: #334155; margin-bottom: 2px; }
        .header h3 { font-size: 11px; color: #64748b; font-weight: normal; }

        .meta { margin-bottom: 14px; }
        .meta p { font-size: 10px; color: #475569; margin-bottom: 2px; }
        .meta .badge { display: inline-block; background: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 4px; font-size: 9px; font-weight: bold; margin-right: 4px; }

        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        thead tr { background-color: #1e40af; color: #ffffff; }
        th { padding: 6px 4px; font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; }
        td { padding: 5px 4px; font-size: 10px; border-bottom: 1px solid #e2e8f0; }
        tbody tr:nth-child(even) { background-color: #f8fafc; }

        .footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-size: 8px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 6px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>UNIVERSIDAD AUTÓNOMA GABRIEL RENÉ MORENO</h1>
        <h2>FACULTAD DE INGENIERÍA EN CIENCIAS DE LA COMPUTACIÓN Y TELECOMUNICACIONES</h2>
        <h3>Curso Preuniversitario (CUP) — Sistema de Admisión</h3>
    </div>

    <div class="meta">
        <p><strong>Reporte:</strong> {{ $titulo }}</p>
        <p><strong>Fecha de generación:</strong> {{ $fecha }}</p>
        <p style="margin-top:4px;">
            <strong>Filtros aplicados (IA):</strong>
            @if($filtros['estado'])
                <span class="badge">Estado: {{ $filtros['estado'] }}</span>
            @endif
            @if($filtros['carrera'])
                <span class="badge">Carrera: {{ $filtros['carrera'] }}</span>
            @endif
            @if($filtros['turno'])
                <span class="badge">Turno: {{ $filtros['turno'] }}</span>
            @endif
            @if(!$filtros['estado'] && !$filtros['carrera'] && !$filtros['turno'])
                <span style="color:#94a3b8;">Ninguno</span>
            @endif
        </p>
        <p><strong>Total registros:</strong> {{ count($resultados) }}</p>
    </div>

    <table>
        <thead>
            <tr>
                <th>Nº</th>
                <th>CI</th>
                <th>Apellidos</th>
                <th>Nombres</th>
                <th>Estado</th>
                <th>Turno</th>
                <th>1ra Opción</th>
                <th>Carrera Asignada</th>
                <th>Promedio</th>
            </tr>
        </thead>
        <tbody>
            @foreach($resultados as $i => $p)
                <tr>
                    <td>{{ $i + 1 }}</td>
                    <td>{{ $p->ci }}</td>
                    <td>{{ $p->apellidos }}</td>
                    <td>{{ $p->nombres }}</td>
                    <td>{{ $p->estado }}</td>
                    <td>{{ $p->turno_preferencia }}</td>
                    <td>{{ $p->primeraOpcion?->nombre ?? '-' }}</td>
                    <td>{{ $p->admision?->carrera?->nombre ?? '-' }}</td>
                    <td>{{ $p->promedio_general ?? '-' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        FICCT — UAGRM | Reporte generado automáticamente por el Sistema CUP | {{ $fecha }}
    </div>
</body>
</html>
