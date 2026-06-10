<?php

// Conectar a la base de datos PostgreSQL para obtener TODOS los CIs de postulantes
$host = '127.0.0.1';
$port = '5432';
$dbname = 'ficct_cup_db';
$user = 'cup_user';
$password = 'cup2026';

try {
    $pdo = new PDO("pgsql:host=$host;port=$port;dbname=$dbname", $user, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Error de conexión: " . $e->getMessage() . "\n");
}

// Obtener todos los CIs de postulantes que están en estado 'En Evaluacion'
$stmt = $pdo->query("SELECT ci FROM postulantes WHERE estado = 'En Evaluacion' ORDER BY id");
$cis = $stmt->fetchAll(PDO::FETCH_COLUMN);

if (empty($cis)) {
    // Si no hay postulantes en evaluación, tomar todos los postulantes
    $stmt = $pdo->query("SELECT ci FROM postulantes ORDER BY id");
    $cis = $stmt->fetchAll(PDO::FETCH_COLUMN);
}

echo "Total de postulantes encontrados: " . count($cis) . "\n";

$f1 = fopen('public/notas_examen1.csv', 'w');
$f2 = fopen('public/notas_examen2.csv', 'w');
$f3 = fopen('public/notas_examen3.csv', 'w');

// Some will fail (scores below 60), some will pass (scores above 60)
foreach($cis as $ci) {
    fputcsv($f1, [$ci, rand(30, 100)]);
    fputcsv($f2, [$ci, rand(30, 100)]);
    fputcsv($f3, [$ci, rand(40, 100)]);
}

fclose($f1);
fclose($f2);
fclose($f3);

echo "Archivos generados exitosamente en backend/public/\n";
