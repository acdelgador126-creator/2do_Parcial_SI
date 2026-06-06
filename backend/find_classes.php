<?php
$file = 'c:/Users/User/Documents/1-2026/proto/2do_Parcial_SI_intento/documentacion/documento_parcial2.md';
$content = file_get_contents($file);

preg_match_all('/(class\s+\w+|@startuml.*?@enduml)/s', $content, $matches);
echo "Found " . count($matches[0]) . " patterns.\n";

// Let's search for the class diagram specifically or sections containing "class " or "class diagram"
$lines = explode("\n", $content);
foreach ($lines as $i => $line) {
    if (stripos($line, 'class ') !== false || stripos($line, 'interface ') !== false || stripos($line, 'controlador') !== false) {
        if ($i > 3300 && $i < 3450) { // Let's check where the class diagram is (we saw line 3344 consulted in previous grep search)
            echo "Line " . ($i + 1) . ": " . trim($line) . "\n";
        }
    }
}
