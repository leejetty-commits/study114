<?php

declare(strict_types=1);

namespace Study114\Auth;

use InvalidArgumentException;
use PDO;
use PDOException;
use RuntimeException;
use Study114\Database\Connection;

final class SignupService
{
    /** @var array<string, string> UI role → DB role_type (4장 §6) */
    private const ROLE_MAP = [
        'student'    => 'guardian_student',
        'study_room' => 'study_room_owner',
        'tutor'      => 'tutor',
    ];

    /**
     * @param array<string, mixed> $input
     * @return array{user_id: int, email: string, role_type: string}
     */
    public function register(array $input): array
    {
        $email = $this->requireString($input, 'email');
        $password = $this->requireString($input, 'password');
        $passwordConfirm = $this->requireString($input, 'password_confirm');
        $name = $this->requireString($input, 'name');
        $gender = $this->requireString($input, 'gender');
        $birthDate = $this->requireString($input, 'birth_date');
        $phone = $this->requireString($input, 'phone');
        $address = $this->requireString($input, 'address');
        $roleUi = $this->requireString($input, 'role');

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('email: 유효한 이메일 형식이 아닙니다.');
        }
        if (strlen($password) < 8) {
            throw new InvalidArgumentException('password: 8자 이상 입력해 주세요.');
        }
        if ($password !== $passwordConfirm) {
            throw new InvalidArgumentException('password_confirm: 비밀번호가 일치하지 않습니다.');
        }
        if (!in_array($gender, ['male', 'female'], true)) {
            throw new InvalidArgumentException('gender: male 또는 female만 허용됩니다.');
        }
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $birthDate)) {
            throw new InvalidArgumentException('birth_date: YYYY-MM-DD 형식이어야 합니다.');
        }
        if (!isset(self::ROLE_MAP[$roleUi])) {
            throw new InvalidArgumentException('role: student, study_room, tutor 중 하나여야 합니다.');
        }

        $roleType = self::ROLE_MAP[$roleUi];
        $smsOptIn = !empty($input['sms_consent']) ? 1 : 0;
        $emailOptIn = !empty($input['email_consent']) ? 1 : 0;
        $safeNumberOptIn = !empty($input['safe_number_use']) ? 1 : 0;

        $addressZip = isset($input['address_zip']) && $input['address_zip'] !== ''
            ? (string) $input['address_zip'] : null;
        $addressLine2 = isset($input['address_line2']) && $input['address_line2'] !== ''
            ? (string) $input['address_line2'] : null;
        $defaultRegionId = isset($input['default_region_id']) && $input['default_region_id'] !== ''
            ? (int) $input['default_region_id'] : null;
        $defaultComplexId = isset($input['default_complex_id']) && $input['default_complex_id'] !== ''
            ? (int) $input['default_complex_id'] : null;

        $pdo = Connection::get();

        if ($this->emailExists($pdo, $email)) {
            throw new InvalidArgumentException('email: 이미 사용 중인 이메일입니다.');
        }

        $pdo->beginTransaction();
        try {
            $userId = $this->insertUser($pdo, $email, $password);
            $this->insertProfile(
                $pdo,
                $userId,
                $name,
                $phone,
                $gender,
                $birthDate,
                $addressZip,
                $address,
                $addressLine2,
                $defaultRegionId,
                $defaultComplexId,
                $smsOptIn,
                $emailOptIn,
                $safeNumberOptIn
            );
            $this->insertRole($pdo, $userId, $roleType);
            $pdo->commit();
        } catch (PDOException $e) {
            $pdo->rollBack();
            throw new RuntimeException('DB insert failed: ' . $e->getMessage(), 0, $e);
        }

        return [
            'user_id'   => $userId,
            'email'     => $email,
            'role_type' => $roleType,
        ];
    }

    private function emailExists(PDO $pdo, string $email): bool
    {
        $stmt = $pdo->prepare('SELECT 1 FROM users WHERE email = ? LIMIT 1');
        $stmt->execute([$email]);
        return (bool) $stmt->fetchColumn();
    }

    private function insertUser(PDO $pdo, string $email, string $password): int
    {
        $hash = password_hash($password, PASSWORD_BCRYPT);
        if ($hash === false) {
            throw new RuntimeException('password_hash failed');
        }

        $stmt = $pdo->prepare(
            'INSERT INTO users (email, password_hash, status) VALUES (?, ?, ?)'
        );
        $stmt->execute([$email, $hash, 'active']);

        return (int) $pdo->lastInsertId();
    }

    private function insertProfile(
        PDO $pdo,
        int $userId,
        string $realName,
        string $phone,
        string $gender,
        string $birthDate,
        ?string $addressZip,
        string $addressLine1,
        ?string $addressLine2,
        ?int $defaultRegionId,
        ?int $defaultComplexId,
        int $smsOptIn,
        int $emailOptIn,
        int $safeNumberOptIn
    ): void {
        $stmt = $pdo->prepare(
            'INSERT INTO user_profiles (
                user_id, real_name, phone, gender, birth_date,
                address_zip, address_line1, address_line2,
                default_region_id, default_complex_id,
                sms_opt_in, email_opt_in, safe_number_opt_in
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $userId,
            $realName,
            $phone,
            $gender,
            $birthDate,
            $addressZip,
            $addressLine1,
            $addressLine2,
            $defaultRegionId,
            $defaultComplexId,
            $smsOptIn,
            $emailOptIn,
            $safeNumberOptIn,
        ]);
    }

    private function insertRole(PDO $pdo, int $userId, string $roleType): void
    {
        $stmt = $pdo->prepare(
            'INSERT INTO user_roles (user_id, role_type, is_primary, status) VALUES (?, ?, 1, ?)'
        );
        $stmt->execute([$userId, $roleType, 'active']);
    }

    /** @param array<string, mixed> $input */
    private function requireString(array $input, string $key): string
    {
        if (!isset($input[$key]) || trim((string) $input[$key]) === '') {
            throw new InvalidArgumentException("{$key}: 필수 입력입니다.");
        }
        return trim((string) $input[$key]);
    }
}
