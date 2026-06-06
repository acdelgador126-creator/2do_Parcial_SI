<?php
$file = 'c:/Users/User/Documents/1-2026/proto/2do_Parcial_SI_intento/documentacion/documento_parcial2.md';
$content = file_get_contents($file);
$lines = explode("\n", $content);
for ($i = 3300; $i < 3445; $i++) {
    echo ($i + 1) . ": " . $lines[$i] . "\n";
}
