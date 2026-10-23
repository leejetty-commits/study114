<?php

declare(strict_types=1);

require dirname(__DIR__) . '/src/Media/PromoImageProcessor.php';

$processor = new Study114\Media\PromoImageProcessor();
$saved = $processor->shrinkLongEdgeWebp(
    sys_get_temp_dir() . '/c240-noise.jpg',
    sys_get_temp_dir() . '/c240-noise-tight.webp',
    1600,
    82,
    600000,
);
echo json_encode($saved, JSON_UNESCAPED_UNICODE), PHP_EOL;
if (($saved['quality'] ?? 82) >= 82) {
    fwrite(STDERR, "quality did not drop\n");
    exit(1);
}
if (($saved['bytes'] ?? 0) > 600000) {
    fwrite(STDERR, "still over target\n");
    exit(1);
}
echo "PASS quality dropped\n";
