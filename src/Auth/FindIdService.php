<?php

declare(strict_types=1);

namespace Study114\Auth;

use PDO;
use Study114\Database\Connection;

/**
 * 이름 + 휴대폰 → 마스킹된 이메일(ID) 목록 + 로그인 수단(이메일/소셜) 안내.
 */
final class FindIdService
{
    /**
     * @return array{
     *   ok: true,
     *   accounts: list<array{
     *     masked_email: string,
     *     providers: list<string>,
     *     provider_labels: list<string>,
     *     login_methods: list<string>
     *   }>
     * }
     */
    public function findByNameAndPhone(string $name, string $phone): array
    {
        $name = trim($name);
        $digits = PhoneNormalizer::digits($phone);

        if ($name === '' || !PhoneNormalizer::isValidMobile($digits)) {
            throw new \InvalidArgumentException('이름과 휴대폰 번호를 정확히 입력해 주세요.');
        }

        $pdo = Connection::get();
        // phone 컬럼에 하이픈 유무가 섞일 수 있어 숫자만 비교
        $stmt = $pdo->prepare(
            'SELECT u.id, u.email
             FROM users u
             INNER JOIN user_profiles p ON p.user_id = u.id
             WHERE p.real_name = ?
               AND REPLACE(REPLACE(REPLACE(IFNULL(p.phone, \'\'), \'-\', \'\'), \' \', \'\'), \'.\', \'\') = ?
               AND u.status = ?
             ORDER BY u.id ASC
             LIMIT 20'
        );
        $stmt->execute([$name, $digits, 'active']);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $accounts = [];
        foreach ($rows as $row) {
            if (!is_array($row)) {
                continue;
            }
            $userId = (int) ($row['id'] ?? 0);
            $email = (string) ($row['email'] ?? '');
            if ($userId < 1 || $email === '') {
                continue;
            }

            $providers = $this->providersForUser($pdo, $userId);
            $loginMethods = ['email'];
            foreach ($providers as $p) {
                $loginMethods[] = $p;
            }

            $accounts[] = [
                'masked_email'    => EmailMasker::mask($email),
                'providers'       => $providers,
                'provider_labels' => OAuthProviderLabels::labels($providers),
                'login_methods'   => array_values(array_unique($loginMethods)),
            ];
        }

        return [
            'ok'       => true,
            'accounts' => $accounts,
        ];
    }

    /**
     * @return list<string>
     */
    private function providersForUser(PDO $pdo, int $userId): array
    {
        $stmt = $pdo->prepare(
            'SELECT provider FROM user_oauth_accounts WHERE user_id = ? ORDER BY linked_at ASC'
        );
        $stmt->execute([$userId]);
        $out = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            if (!is_array($row)) {
                continue;
            }
            $p = (string) ($row['provider'] ?? '');
            if ($p !== '') {
                $out[] = $p;
            }
        }

        return $out;
    }
}
