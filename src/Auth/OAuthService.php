<?php

declare(strict_types=1);

namespace Study114\Auth;

use InvalidArgumentException;
use PDO;
use RuntimeException;
use Study114\Database\Connection;

final class OAuthService
{
    /** @var array<string, mixed> */
    private array $config;

  public function __construct()
    {
        $this->config = study114_config('oauth');
    }

    /** @return list<string> */
    public static function providers(): array
    {
        return ['naver', 'kakao', 'google'];
    }

    public function isConfigured(string $provider): bool
    {
        $p = $this->providerConfig($provider);
        return match ($provider) {
            'naver'  => $p['client_id'] !== '' && $p['client_secret'] !== '',
            'kakao'  => $p['rest_api_key'] !== '',
            'google' => $p['client_id'] !== '' && $p['client_secret'] !== '',
            default  => false,
        };
    }

    public function authorizeUrl(string $provider, string $state): string
    {
        $p = $this->providerConfig($provider);
        return match ($provider) {
            'naver' => 'https://nid.naver.com/oauth2.0/authorize?' . http_build_query([
                'response_type' => 'code',
                'client_id'     => $p['client_id'],
                'redirect_uri'  => $p['redirect_uri'],
                'state'         => $state,
            ]),
            'kakao' => 'https://kauth.kakao.com/oauth/authorize?' . http_build_query([
                'response_type' => 'code',
                'client_id'     => $p['rest_api_key'],
                'redirect_uri'  => $p['redirect_uri'],
                'state'         => $state,
            ]),
            'google' => 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query([
                'response_type' => 'code',
                'client_id'     => $p['client_id'],
                'redirect_uri'  => $p['redirect_uri'],
                'scope'         => 'openid email profile',
                'state'         => $state,
                'access_type'   => 'online',
                'prompt'        => 'select_account',
            ]),
            default => throw new InvalidArgumentException('지원하지 않는 소셜 로그인입니다.'),
        };
    }

    /**
     * @return array{user_id: int, email: string, role_type: string, name: string, is_new: bool}
     */
    public function authenticate(string $provider, string $code): array
    {
        $profile = $this->fetchProfile($provider, $code);
        $pdo = Connection::get();

        $existing = $this->findByProvider($pdo, $provider, $profile['provider_user_id']);
        if ($existing) {
            $this->touchLogin($pdo, (int) $existing['user_id']);
            return [
                'user_id'   => (int) $existing['user_id'],
                'email'     => (string) $existing['email'],
                'role_type' => (string) $existing['role_type'],
                'name'      => (string) $existing['name'],
                'is_new'    => false,
            ];
        }

        if ($profile['email'] !== '') {
            $byEmail = $this->findByEmail($pdo, $profile['email']);
            if ($byEmail) {
                $this->linkProvider($pdo, (int) $byEmail['user_id'], $provider, $profile);
                $this->touchLogin($pdo, (int) $byEmail['user_id']);
                return [
                    'user_id'   => (int) $byEmail['user_id'],
                    'email'     => (string) $byEmail['email'],
                    'role_type' => (string) $byEmail['role_type'],
                    'name'      => (string) $byEmail['name'],
                    'is_new'    => false,
                ];
            }
        }

        $created = $this->createUserFromProfile($pdo, $profile);
        $this->linkProvider($pdo, $created['user_id'], $provider, $profile);

        return [
            'user_id'   => $created['user_id'],
            'email'     => $created['email'],
            'role_type' => $created['role_type'],
            'name'      => $created['name'],
            'is_new'    => true,
        ];
    }

    public function homeUiBase(): string
    {
        return (string) $this->config['home_ui'];
    }

    public function authUiBase(): string
    {
        return (string) $this->config['auth_ui'];
    }

    /** @return array<string, string> */
    private function providerConfig(string $provider): array
    {
        if (!in_array($provider, self::providers(), true)) {
            throw new InvalidArgumentException('지원하지 않는 소셜 로그인입니다.');
        }
        /** @var array<string, string> $cfg */
        $cfg = $this->config['providers'][$provider] ?? [];
        return $cfg;
    }

    /**
     * @return array{provider_user_id: string, email: string, name: string, raw: array<string, mixed>}
     */
    private function fetchProfile(string $provider, string $code): array
    {
        return match ($provider) {
            'naver'  => $this->fetchNaverProfile($code),
            'kakao'  => $this->fetchKakaoProfile($code),
            'google' => $this->fetchGoogleProfile($code),
            default  => throw new InvalidArgumentException('지원하지 않는 소셜 로그인입니다.'),
        };
    }

    /** @return array{provider_user_id: string, email: string, name: string, raw: array<string, mixed>} */
    private function fetchNaverProfile(string $code): array
    {
        $p = $this->providerConfig('naver');
        $token = $this->httpForm('https://nid.naver.com/oauth2.0/token', [
            'grant_type'    => 'authorization_code',
            'client_id'     => $p['client_id'],
            'client_secret' => $p['client_secret'],
            'code'          => $code,
            'state'         => $_SESSION['oauth']['state'] ?? '',
        ]);
        $accessToken = (string) ($token['access_token'] ?? '');
        if ($accessToken === '') {
            throw new RuntimeException('네이버 토큰 발급에 실패했습니다.');
        }
        $me = $this->httpGetJson(
            'https://openapi.naver.com/v1/nid/me',
            ['Authorization: Bearer ' . $accessToken],
        );
        $response = is_array($me['response'] ?? null) ? $me['response'] : [];
        $id = (string) ($response['id'] ?? '');
        if ($id === '') {
            throw new RuntimeException('네이버 프로필을 가져오지 못했습니다.');
        }
        return [
            'provider_user_id' => $id,
            'email'            => (string) ($response['email'] ?? ''),
            'name'             => (string) ($response['name'] ?? $response['nickname'] ?? '네이버 회원'),
            'raw'              => $response,
        ];
    }

    /** @return array{provider_user_id: string, email: string, name: string, raw: array<string, mixed>} */
    private function fetchKakaoProfile(string $code): array
    {
        $p = $this->providerConfig('kakao');
        $body = [
            'grant_type'   => 'authorization_code',
            'client_id'    => $p['rest_api_key'],
            'redirect_uri' => $p['redirect_uri'],
            'code'         => $code,
        ];
        if (($p['client_secret'] ?? '') !== '') {
            $body['client_secret'] = $p['client_secret'];
        }
        $token = $this->httpForm('https://kauth.kakao.com/oauth/token', $body);
        $accessToken = (string) ($token['access_token'] ?? '');
        if ($accessToken === '') {
            throw new RuntimeException('카카오 토큰 발급에 실패했습니다.');
        }
        $me = $this->httpGetJson(
            'https://kapi.kakao.com/v2/user/me',
            ['Authorization: Bearer ' . $accessToken],
        );
        $id = (string) ($me['id'] ?? '');
        if ($id === '') {
            throw new RuntimeException('카카오 프로필을 가져오지 못했습니다.');
        }
        $account = is_array($me['kakao_account'] ?? null) ? $me['kakao_account'] : [];
        $profile = is_array($me['properties'] ?? null) ? $me['properties'] : [];
        $kakaoProfile = is_array($account['profile'] ?? null) ? $account['profile'] : [];
        return [
            'provider_user_id' => $id,
            'email'            => (string) ($account['email'] ?? ''),
            'name'             => (string) ($kakaoProfile['nickname'] ?? $profile['nickname'] ?? '카카오 회원'),
            'raw'              => $me,
        ];
    }

    /** @return array{provider_user_id: string, email: string, name: string, raw: array<string, mixed>} */
    private function fetchGoogleProfile(string $code): array
    {
        $p = $this->providerConfig('google');
        $token = $this->httpForm('https://oauth2.googleapis.com/token', [
            'grant_type'    => 'authorization_code',
            'client_id'     => $p['client_id'],
            'client_secret' => $p['client_secret'],
            'code'          => $code,
            'redirect_uri'  => $p['redirect_uri'],
        ]);
        $accessToken = (string) ($token['access_token'] ?? '');
        if ($accessToken === '') {
            throw new RuntimeException('Google 토큰 발급에 실패했습니다.');
        }
        $me = $this->httpGetJson(
            'https://www.googleapis.com/oauth2/v2/userinfo',
            ['Authorization: Bearer ' . $accessToken],
        );
        $id = (string) ($me['id'] ?? '');
        if ($id === '') {
            throw new RuntimeException('Google 프로필을 가져오지 못했습니다.');
        }
        return [
            'provider_user_id' => $id,
            'email'            => (string) ($me['email'] ?? ''),
            'name'             => (string) ($me['name'] ?? 'Google 회원'),
            'raw'              => $me,
        ];
    }

    /** @param array<string, string> $fields @return array<string, mixed> */
    private function httpForm(string $url, array $fields): array
    {
        $ch = curl_init($url);
        if ($ch === false) {
            throw new RuntimeException('HTTP 클라이언트 초기화 실패');
        }
        curl_setopt_array($ch, [
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => http_build_query($fields),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 15,
        ]);
        $raw = curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if (!is_string($raw) || $code >= 400) {
            throw new RuntimeException('소셜 인증 서버 응답 오류');
        }
        $data = json_decode($raw, true);
        return is_array($data) ? $data : [];
    }

    /** @param list<string> $headers @return array<string, mixed> */
    private function httpGetJson(string $url, array $headers = []): array
    {
        $ch = curl_init($url);
        if ($ch === false) {
            throw new RuntimeException('HTTP 클라이언트 초기화 실패');
        }
        curl_setopt_array($ch, [
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 15,
        ]);
        $raw = curl_exec($ch);
        $code = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if (!is_string($raw) || $code >= 400) {
            throw new RuntimeException('소셜 프로필 조회 실패');
        }
        $data = json_decode($raw, true);
        return is_array($data) ? $data : [];
    }

    /** @return array{user_id: int, email: string, role_type: string, name: string}|null */
    private function findByProvider(PDO $pdo, string $provider, string $providerUserId): ?array
    {
        $stmt = $pdo->prepare(
            'SELECT u.id AS user_id, u.email, p.real_name AS name, r.role_type
             FROM user_oauth_accounts o
             INNER JOIN users u ON u.id = o.user_id
             INNER JOIN user_profiles p ON p.user_id = u.id
             LEFT JOIN user_roles r ON r.user_id = u.id AND r.is_primary = 1 AND r.status = ?
             WHERE o.provider = ? AND o.provider_user_id = ?
             LIMIT 1'
        );
        $stmt->execute(['active', $provider, $providerUserId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return is_array($row) ? $row : null;
    }

    /** @return array{user_id: int, email: string, role_type: string, name: string}|null */
    private function findByEmail(PDO $pdo, string $email): ?array
    {
        $stmt = $pdo->prepare(
            'SELECT u.id AS user_id, u.email, p.real_name AS name, r.role_type
             FROM users u
             INNER JOIN user_profiles p ON p.user_id = u.id
             LEFT JOIN user_roles r ON r.user_id = u.id AND r.is_primary = 1 AND r.status = ?
             WHERE u.email = ? AND u.status = ?
             LIMIT 1'
        );
        $stmt->execute(['active', $email, 'active']);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return is_array($row) ? $row : null;
    }

    /**
     * @param array{provider_user_id: string, email: string, name: string, raw: array<string, mixed>} $profile
     */
    private function linkProvider(PDO $pdo, int $userId, string $provider, array $profile): void
    {
        $stmt = $pdo->prepare(
            'INSERT INTO user_oauth_accounts (user_id, provider, provider_user_id, provider_email, profile_json)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE provider_email = VALUES(provider_email), profile_json = VALUES(profile_json), updated_at = NOW()'
        );
        $stmt->execute([
            $userId,
            $provider,
            $profile['provider_user_id'],
            $profile['email'] !== '' ? $profile['email'] : null,
            json_encode($profile['raw'], JSON_UNESCAPED_UNICODE),
        ]);
    }

    /**
     * @param array{provider_user_id: string, email: string, name: string, raw: array<string, mixed>} $profile
     * @return array{user_id: int, email: string, role_type: string, name: string}
     */
    private function createUserFromProfile(PDO $pdo, array $profile): array
    {
        $email = $profile['email'] !== ''
            ? $profile['email']
            : sprintf('oauth_%s_%s@users.study114.local', $profile['provider_user_id'], bin2hex(random_bytes(4)));

        $hash = password_hash(bin2hex(random_bytes(24)), PASSWORD_BCRYPT);
        if ($hash === false) {
            throw new RuntimeException('계정 생성 실패');
        }

        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare(
                'INSERT INTO users (email, password_hash, status, email_verified_at, oauth_role_pending)
                 VALUES (?, ?, ?, NOW(), 1)'
            );
            $stmt->execute([$email, $hash, 'active']);
            $userId = (int) $pdo->lastInsertId();

            $stmt = $pdo->prepare(
                'INSERT INTO user_profiles (user_id, real_name, phone, gender, address_line1) VALUES (?, ?, ?, NULL, ?)'
            );
            $stmt->execute([$userId, $profile['name'], null, '']);

            $roleType = 'guardian_student';
            $stmt = $pdo->prepare(
                'INSERT INTO user_roles (user_id, role_type, is_primary, status) VALUES (?, ?, 1, ?)'
            );
            $stmt->execute([$userId, $roleType, 'active']);

            $pdo->commit();
            return [
                'user_id'   => $userId,
                'email'     => $email,
                'role_type' => $roleType,
                'name'      => $profile['name'],
            ];
        } catch (\Throwable $e) {
            $pdo->rollBack();
            throw $e;
        }
    }

    private function touchLogin(PDO $pdo, int $userId): void
    {
        $stmt = $pdo->prepare('UPDATE users SET last_login_at = NOW() WHERE id = ?');
        $stmt->execute([$userId]);
    }
}
