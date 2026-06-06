<?php

namespace App\Services;

/**
 * Mock de servicios externos SEGIP y SEDUCA.
 * En produccion se reemplaza con HTTP requests reales.
 *
 * SEGIP: Verificar identidad del ciudadano por CI + fecha nacimiento
 * SEDUCA: Verificar titulo de bachiller por CI
 */
class VerificacionExternaService
{
    public function verificarSEGIP(string $ci, string $fechaNacimiento): array
    {
        // Mock: CI con 7+ digitos = valido
        $valido = strlen(preg_replace('/\D/', '', $ci)) >= 7;

        return [
            'verificado' => $valido,
            'fuente' => 'SEGIP_MOCK',
            'mensaje' => $valido ? 'Identidad verificada.' : 'CI no encontrado en SEGIP.',
        ];
    }

    public function verificarSEDUCA(string $ci): array
    {
        // Mock: siempre retorna bachiller valido
        return [
            'verificado' => true,
            'fuente' => 'SEDUCA_MOCK',
            'mensaje' => 'Titulo de bachiller verificado.',
        ];
    }

    public function verificarCompleto(string $ci, string $fechaNacimiento): array
    {
        // CU06 - Paso 3: Ctrl -> API SEGIP : ConsultarIdentidad(ci)
        $segip = $this->verificarSEGIP($ci, $fechaNacimiento);

        // CU06 - Paso 4: API SEGIP --> Ctrl : ResultadoVerificacion
        if (! $segip['verificado']) {
            return [
                'aprobado' => false,
                'segip' => $segip,
                'seduca' => null,
                'mensaje' => 'Verificacion fallida: identidad no confirmada en SEGIP.',
            ];
        }

        // CU06 - Paso 5 (alt verificado): Ctrl -> API SEDUCA : ConsultarBachiller(ci)
        $seduca = $this->verificarSEDUCA($ci);

        // CU06 - Paso 6 (alt verificado): API SEDUCA --> Ctrl : ResultadoBachiller
        return [
            'aprobado' => $segip['verificado'] && $seduca['verificado'],
            'segip' => $segip,
            'seduca' => $seduca,
            'mensaje' => $seduca['verificado']
                ? 'Verificacion completa exitosa.'
                : 'Verificacion fallida: titulo no encontrado en SEDUCA.',
        ];
    }
}
