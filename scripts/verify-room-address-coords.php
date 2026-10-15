<?php

declare(strict_types=1);

require dirname(__DIR__) . '/src/bootstrap.php';

/**
 * @param array<string, mixed> $input
 * @return array{0:?string,1:?string}
 */
function coordinate_pair(object $service, array $input): array
{
    $method = new ReflectionMethod($service, 'coordinatePair');
    $method->setAccessible(true);
    /** @var array{0:?string,1:?string} $pair */
    $pair = $method->invoke($service, $input);

    return $pair;
}

function show(?string $value): string
{
    return $value === null ? 'NULL' : $value;
}

$auth = new Study114\Auth\BasicRegisterService();
$room = new Study114\StudyRoom\StudyRoomRegisterService();
$fail = 0;

$cases = [
    'ok' => [['latitude' => '37.5065123', 'longitude' => '127.0536123'], ['37.5065123', '127.0536123']],
    'blank' => [['latitude' => '', 'longitude' => ''], [null, null]],
    'missing' => [[], [null, null]],
    'out_of_range' => [['latitude' => '91', 'longitude' => '127.1'], [null, null]],
    'one_sided' => [['latitude' => '37.5', 'longitude' => ''], [null, null]],
    'junk' => [['latitude' => 'abc', 'longitude' => '127.1'], [null, null]],
    'long' => [['latitude' => '35.16311234', 'longitude' => '129.163612349'], ['35.1631123', '129.1636123']],
];

foreach (['signup' => $auth, 'mypage' => $room] as $label => $service) {
    foreach ($cases as $name => [$input, $expect]) {
        $got = coordinate_pair($service, $input);
        if ($got[0] !== $expect[0] || $got[1] !== $expect[1]) {
            fwrite(STDERR, "{$label} {$name} got " . json_encode($got) . "\n");
            $fail++;
        }
    }
}

$rows = [
    901 => ['address_text' => '서울 강남구 삼성로 212', 'latitude' => null, 'longitude' => null],
    902 => ['address_text' => '경기 성남시 분당구 분당로 50', 'latitude' => '37.1000000', 'longitude' => '127.1000000'],
    903 => ['address_text' => '부산 해운대구 중동2로 11', 'latitude' => '35.1000000', 'longitude' => '129.1000000'],
];

[$signupLat, $signupLng] = coordinate_pair($auth, [
    'latitude' => '37.5065123',
    'longitude' => '127.0536123',
]);
$rows[901]['latitude'] = $signupLat;
$rows[901]['longitude'] = $signupLng;

[$pageLat, $pageLng] = coordinate_pair($room, [
    'latitude' => '35.1631000',
    'longitude' => '129.1636000',
]);
$rows[902]['address_text'] = '부산 해운대구 중동2로 11';
$rows[902]['latitude'] = $pageLat;
$rows[902]['longitude'] = $pageLng;

[$failLat, $failLng] = coordinate_pair($auth, [
    'latitude' => '',
    'longitude' => '',
]);
$rows[903]['address_text'] = '부산 해운대구 중동2로 11';
$rows[903]['latitude'] = $failLat;
$rows[903]['longitude'] = $failLng;

foreach ($rows as $id => $row) {
    echo 'stored id=' . $id
        . ' address_text=' . $row['address_text']
        . ' latitude=' . show($row['latitude'])
        . ' longitude=' . show($row['longitude'])
        . "\n";
}

if ($rows[903]['address_text'] !== '부산 해운대구 중동2로 11' || $rows[903]['latitude'] !== null || $rows[903]['longitude'] !== null) {
    fwrite(STDERR, "geocode fail row was not saved with NULL coordinates\n");
    $fail++;
}

if ($fail > 0) {
    exit(1);
}

echo "OK php {$fail}\n";
