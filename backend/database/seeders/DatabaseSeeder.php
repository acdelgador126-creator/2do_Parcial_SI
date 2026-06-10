<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $sqlPath = base_path('../BASE_DE_DATOS/INSERTS_POBLACION_COMPLETA.sql');
        
        $this->command->info("Cargando y ejecutando $sqlPath...");
        
        if (!file_exists($sqlPath)) {
            throw new \Exception("No se encontró el archivo SQL en: " . $sqlPath);
        }

        $sql = file_get_contents($sqlPath);
        DB::unprepared($sql);
        
        $this->command->info("Población de datos completada.");

        // CU22: garantizar gestión activa para el dashboard estadístico y la inscripción
        DB::table('gestiones')->update(['activa' => false]);
        DB::table('gestiones')->where('codigo', '1-2026')->update(['activa' => true]);
        $this->command->info("Gestión 1-2026 activada.");

        // Obtener el ID de la gestión activa dynamically
        $activeGestion = DB::table('gestiones')->where('activa', true)->first();
        $activeGestionId = $activeGestion ? $activeGestion->id : 1;

        // Mapear todos los postulantes a la gestión activa y marcarlos como 'Inscrito'
        DB::table('postulantes')->update([
            'gestion_id' => $activeGestionId,
            'estado' => 'Inscrito'
        ]);
        $this->command->info("Todos los postulantes mapeados a la gestión activa y marcados como 'Inscrito'.");

        // Aprobar todos los requisitos documentales para los postulantes
        DB::table('requisitos_documentales')->update([
            'ci_digitalizado' => true,
            'certificado_nacimiento' => true,
            'titulo_bachiller_legalizado' => true,
            'formulario_preinscripcion' => true,
            'verificado_bd_externa' => true,
        ]);
        $this->command->info("Todos los requisitos documentales marcados como verificados (true).");

        // Insertar pagos exitosos en la tabla 'pagos' para todos los postulantes importados
        $this->command->info("Generando registros de pagos exitosos para los postulantes...");
        $postulanteIds = DB::table('postulantes')->pluck('id');
        $pagosData = [];
        $now = now();
        foreach ($postulanteIds as $pid) {
            $exists = DB::table('pagos')->where('postulante_id', $pid)->exists();
            if (!$exists) {
                $pagosData[] = [
                    'postulante_id' => $pid,
                    'stripe_checkout_id' => 'cs_seed_' . $pid,
                    'monto' => 700,
                    'estado_pago' => 'Succeeded',
                    'fecha_pago' => $now,
                ];
            }
        }
        if (!empty($pagosData)) {
            foreach (array_chunk($pagosData, 500) as $chunk) {
                DB::table('pagos')->insert($chunk);
            }
        }
        $this->command->info("Historial de pagos exitosos generado para toda la población.");

        // Forzar existencia y contraseñas conocidas para las cuentas de prueba administrativa, coordinación y docente
        $usersToEnsure = [
            [
                'id' => 1,
                'name' => 'Admin CUP',
                'email' => 'admin@ficct.uagrm.edu.bo',
                'password' => '$2y$12$lqHi9fjbEsurjtBPXOuYVO6ZasIkwKxI2/OmiLqufO1824T9tWGy6', // Admin2026!
                'role' => 'Administrador',
                'active' => true,
            ],
            [
                'id' => 2,
                'name' => 'Coordinador CUP',
                'email' => 'coordinador@ficct.uagrm.edu.bo',
                'password' => '$2y$12$WxUhNnTFpDvStSZUlTt/uuH7iKvbPzEFSPMnPJRv0LYBT8p0ZSfy6', // Coord2026!
                'role' => 'Coordinador',
                'active' => true,
            ],
            [
                'id' => 3,
                'name' => 'Docente Test',
                'email' => 'docente@ficct.uagrm.edu.bo',
                'password' => '$2y$12$Kc6lGL23.CF8Fv8KpzXhxOn/XTMidsOMVNj5UjYoNnQeLusoGghGS', // Docente2026!
                'role' => 'Docente',
                'active' => true,
            ],
        ];

        foreach ($usersToEnsure as $userData) {
            $user = \App\Models\Autenticacion\User::where('email', $userData['email'])->first();
            if (!$user) {
                \App\Models\Autenticacion\User::create($userData);
            } else {
                $user->update([
                    'name' => $userData['name'],
                    'password' => $userData['password'],
                    'role' => $userData['role'],
                    'active' => true,
                ]);
            }
        }
        $this->command->info("Cuentas de Admin, Coordinador y Docente garantizadas.");

        // Crear cuenta de Postulante Test si no existe
        $postulanteEmail = 'postulante@gmail.com';
        $postulanteUser = \App\Models\Autenticacion\User::where('email', $postulanteEmail)->first();
        if (!$postulanteUser) {
            $postulanteUser = \App\Models\Autenticacion\User::create([
                'id' => 1999,
                'name' => 'Postulante Test',
                'email' => $postulanteEmail,
                'password' => '$2y$12$4in5.khUQ0ZDJQ/LiovlP.tscLJmECsyaDztgbyGnIm2g12YMNgEi', // Post2026!
                'role' => 'Postulante',
                'active' => true,
            ]);
        } else {
            $postulanteUser->update([
                'password' => '$2y$12$4in5.khUQ0ZDJQ/LiovlP.tscLJmECsyaDztgbyGnIm2g12YMNgEi',
                'active' => true,
            ]);
        }

        // Crear/vincular postulante asociado
        $postulante = \App\Models\RegistroPostulantes\Postulante::where('email', $postulanteEmail)->first();
        if (!$postulante) {
            $postulante = \App\Models\RegistroPostulantes\Postulante::create([
                'id' => 1999,
                'ci' => '9999999',
                'nombres' => 'Postulante',
                'apellidos' => 'Test',
                'fecha_nacimiento' => '2006-01-01',
                'sexo' => 'M',
                'email' => $postulanteEmail,
                'ciudad' => 'Santa Cruz de la Sierra',
                'primera_opcion_id' => 1,
                'segunda_opcion_id' => 2,
                'turno_preferencia' => 'Manana',
                'gestion_id' => $activeGestionId,
                'estado' => 'Inscrito',
                'recurrente' => false,
                'user_id' => $postulanteUser->id,
            ]);

            \App\Models\RegistroPostulantes\RequisitoDocumental::create([
                'postulante_id' => $postulante->id,
                'ci_digitalizado' => true,
                'certificado_nacimiento' => true,
                'titulo_bachiller_legalizado' => true,
                'formulario_preinscripcion' => true,
                'verificado_bd_externa' => true,
            ]);

            \App\Models\RegistroPostulantes\Pago::create([
                'postulante_id' => $postulante->id,
                'stripe_checkout_id' => 'cs_test_postulante_default',
                'monto' => 700,
                'estado_pago' => 'Succeeded',
            ]);
        } else {
            $postulante->update([
                'user_id' => $postulanteUser->id,
                'estado' => 'Inscrito',
                'gestion_id' => $activeGestionId,
            ]);
        }
        $this->command->info("Postulante Test (postulante@gmail.com) configurado.");

        // Sincronizar secuencias
        $this->command->info("Sincronizando secuencias de PostgreSQL...");
        $tables = DB::select("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'");
        foreach ($tables as $t) {
            $tableName = $t->table_name;
            
            // Check if id column exists in this table first
            $hasIdColumn = DB::select("
                SELECT 1 
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                  AND table_name = ? 
                  AND column_name = 'id'
            ", [$tableName]);

            if (!empty($hasIdColumn)) {
                $seqCheck = DB::select("SELECT pg_get_serial_sequence(?, 'id') as seq", [$tableName]);
                if (!empty($seqCheck) && $seqCheck[0]->seq !== null) {
                    $seqName = $seqCheck[0]->seq;
                    DB::statement("SELECT setval(?, COALESCE((SELECT MAX(id) FROM \"$tableName\"), 1))", [$seqName]);
                    $this->command->info("   Secuencia sincronizada para tabla: $tableName");
                }
            }
        }
        $this->command->info("Sincronización de secuencias completada con éxito.");

        // Horarios institucionales fijos por grupo/materia (carga horaria del CUP)
        $this->call(HorariosGrupoMateriaSeeder::class);
    }
}
