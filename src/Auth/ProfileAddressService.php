<?php

declare(strict_types=1);

namespace Study114\Auth;

use InvalidArgumentException;
use PDO;
use PDOException;
use Study114\Database\Connection;

/**
 * 계정 집주소 — user_profiles.address_zip / address_line1 / address_line2
 * 가입·계정설정에서만 쓰고, 공부방 기본등록·지도·홍보에는 쓰지 않는다.
 */
final class ProfileAddressService
{
    /**
     * @return array{address_zip: string, address_line1: string, address_line2: string}
     */
    public function get(int $userId): array
    {
        if ($userId < 1) {
            throw new InvalidArgumentException('로그인이 필요합니다.');
        }
        $pdo = Connection::get();
        try {
            $stmt = $pdo->prepare(
                'SELECT address_zip, address_line1, address_line2 FROM user_profiles WHERE user_id = ? LIMIT 1'
            );
            $stmt->execute([$userId]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            $stmt = $pdo->prepare(
                'SELECT address_zip, address_line1 FROM user_profiles WHERE user_id = ? LIMIT 1'
            );
            $stmt->execute([$userId]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
        }
        if (!is_array($row)) {
            return ['address_zip' => '', 'address_line1' => '', 'address_line2' => ''];
        }
        return [
            'address_zip' => (string) ($row['address_zip'] ?? ''),
            'address_line1' => (string) ($row['address_line1'] ?? ''),
            'address_line2' => (string) ($row['address_line2'] ?? ''),
        ];
    }

    /**
     * @param array{address_zip?: mixed, address_line1?: mixed, address_line2?: mixed} $input
     * @return array{address_zip: string, address_line1: string, address_line2: string}
     */
    public function update(int $userId, array $input): array
    {
        if ($userId < 1) {
            throw new InvalidArgumentException('로그인이 필요합니다.');
        }

        $zip = trim((string) ($input['address_zip'] ?? ''));
        $line1 = trim((string) ($input['address_line1'] ?? $input['address'] ?? ''));
        $line2 = trim((string) ($input['address_line2'] ?? ''));

        if ($line1 === '' || $zip === '') {
            throw new InvalidArgumentException('주소 검색으로 도로명 주소를 선택해 주세요.');
        }
        if (mb_strlen($line1) > 255) {
            throw new InvalidArgumentException('집주소가 너무 깁니다.');
        }
        if (mb_strlen($line2) > 255) {
            throw new InvalidArgumentException('상세주소가 너무 깁니다.');
        }
        if (mb_strlen($zip) > 20) {
            throw new InvalidArgumentException('우편번호가 올바르지 않습니다.');
        }

        $pdo = Connection::get();
        $exists = $pdo->prepare('SELECT 1 FROM user_profiles WHERE user_id = ? LIMIT 1');
        $exists->execute([$userId]);
        if (!$exists->fetchColumn()) {
            throw new InvalidArgumentException('프로필이 없습니다.');
        }

        try {
            $pdo->prepare(
                'UPDATE user_profiles SET address_line1 = ?, address_zip = ?, address_line2 = ? WHERE user_id = ?'
            )->execute([$line1, $zip, $line2 !== '' ? $line2 : null, $userId]);
        } catch (PDOException $e) {
            $pdo->prepare(
                'UPDATE user_profiles SET address_line1 = ?, address_zip = ? WHERE user_id = ?'
            )->execute([$line1, $zip, $userId]);
            $line2 = '';
        }

        return [
            'address_zip' => $zip,
            'address_line1' => $line1,
            'address_line2' => $line2,
        ];
    }
}
