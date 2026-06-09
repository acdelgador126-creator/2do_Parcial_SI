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

        // CU22: garantizar gestión activa para el dashboard estadístico
        DB::table('gestiones')->update(['activa' => false]);
        DB::table('gestiones')->where('codigo', '1-2026')->update(['activa' => true]);
        $this->command->info("Gestión 1-2026 activada para el dashboard (CU22).");

        // Forzar contraseñas conocidas para las cuentas de prueba administrativa, coordinación y docente
        DB::statement("UPDATE users SET password = ? WHERE email = ?", [
            '$2y$12$lqHi9fjbEsurjtBPXOuYVO6ZasIkwKxI2/OmiLqufO1824T9tWGy6',
            'admin@ficct.uagrm.edu.bo'
        ]);
        DB::statement("UPDATE users SET password = ? WHERE email = ?", [
            '$2y$12$WxUhNnTFpDvStSZUlTt/uuH7iKvbPzEFSPMnPJRv0LYBT8p0ZSfy6',
            'coordinador@ficct.uagrm.edu.bo'
        ]);
        DB::statement("UPDATE users SET password = ? WHERE email = ?", [
            '$2y$12$Kc6lGL23.CF8Fv8KpzXhxOn/XTMidsOMVNj5UjYoNnQeLusoGghGS',
            'docente@ficct.uagrm.edu.bo'
        ]);
        $this->command->info("Contraseñas de Admin, Coordinador y Docente actualizadas.");

        // Crear cuenta de Postulante Test si no existe
        $postulanteEmail = 'postulante@gmail.com';
        $postulanteUser = \App\Models\User::where('email', $postulanteEmail)->first();
        if (!$postulanteUser) {
            $postulanteUser = \App\Models\User::create([
                'id' => 1999,
                'name' => 'Postulante Test',
                'email' => $postulanteEmail,
                'password' => '$2y$12$4in5.khUQ0ZDJQ/LiovlP.tscLJmECsyaDztgbyGnIm2g12YMNgEi',
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
        $postulante = \App\Models\Postulante::where('email', $postulanteEmail)->first();
        if (!$postulante) {
            $postulante = \App\Models\Postulante::create([
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
                'gestion_id' => 1,
                'estado' => 'Inscrito',
                'recurrente' => false,
                'user_id' => $postulanteUser->id,
            ]);

            \App\Models\RequisitoDocumental::create([
                'postulante_id' => $postulante->id,
                'ci_digitalizado' => true,
                'certificado_nacimiento' => true,
                'titulo_bachiller_legalizado' => true,
                'formulario_preinscripcion' => true,
                'verificado_bd_externa' => true,
            ]);

            \App\Models\Pago::create([
                'postulante_id' => $postulante->id,
                'stripe_checkout_id' => 'cs_test_postulante_default',
                'monto' => 700,
                'estado_pago' => 'Succeeded',
            ]);
        } else {
            $postulante->update([
                'user_id' => $postulanteUser->id,
                'estado' => 'Inscrito',
            ]);
        }
        $this->command->info("Postulante Test (postulante@gmail.com) configurado con contraseña 'Post2026!' y estado 'Inscrito'.");

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
    }
}
