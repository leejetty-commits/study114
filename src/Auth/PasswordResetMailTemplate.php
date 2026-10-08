<?php

declare(strict_types=1);

namespace Study114\Auth;

use Study114\Mail\MemberMailRole;
use Study114\Mail\MemberMailTemplate;

/**
 * 9장 부록 §17-5 — 비밀번호 재설정 메일 (plain + HTML 버튼).
 * 제목의 「비밀번호」는 AuthMailer::mailKind 분류(password_reset) 기준이라 유지한다.
 */
final class PasswordResetMailTemplate
{
    public const SUBJECT = '[우동공과] 비밀번호 재설정 안내드려요';
    public const SUBJECT_SOCIAL_ONLY = '[우동공과] 비밀번호 대신 소셜 로그인으로 들어와 주세요';

    /**
     * @param list<string> $providerLabels 연동된 소셜 표시명 (예: ['구글','네이버'])
     * @param string $role user_roles.role_type 또는 MemberMailRole 값 ('' = 역할 모름)
     * @param string $supportUrl 고객센터 1:1 문의 전체 주소 ('' = 운영 기본값)
     * @return array{subject: string, plain: string, html: string}
     */
    public static function build(
        string $resetUrl,
        int $ttlMinutes = 30,
        array $providerLabels = [],
        string $role = '',
        string $supportUrl = ''
    ): array {
        $role = MemberMailRole::normalize($role);
        $ttl = MemberMailTemplate::ttlLabel($ttlMinutes);

        $paragraphs = [
            self::greeting($role) . ' 비밀번호 재설정 요청을 받았어요.',
            '아래 버튼을 눌러 새 비밀번호를 만들어 주세요. 새 비밀번호를 정하면 바로 그 비밀번호로 로그인할 수 있어요.',
        ];
        if ($providerLabels !== []) {
            $paragraphs[] = '참고로 이 계정은 ' . implode(', ', $providerLabels)
                . ' 로그인과도 연결되어 있어요. 소셜 로그인으로도 들어오실 수 있어요.';
        }

        return MemberMailTemplate::render([
            'subject'     => self::SUBJECT,
            'support_url' => self::supportUrlOrDefault($supportUrl),
            'role'        => $role,
            'badge'       => self::badge($role),
            'preheader'   => '버튼을 눌러 새 비밀번호를 만들어 주세요. 링크는 ' . $ttl . ' 동안 쓸 수 있어요.',
            'heading'     => '새 비밀번호를 만들어 주세요',
            'paragraphs'  => $paragraphs,
            'button'      => ['label' => '새 비밀번호 만들기', 'url' => $resetUrl],
            'notes'       => [
                '이 링크는 ' . $ttl . ' 동안 쓸 수 있어요. 시간이 지났다면 로그인 화면의 「비밀번호 찾기」에서 다시 요청해 주세요.',
                '링크는 한 번만 쓸 수 있어요. 새 비밀번호를 정하면 이전 비밀번호로는 로그인할 수 없어요.',
                '요청하지 않았다면 이 메일은 무시하셔도 괜찮아요. 비밀번호는 바뀌지 않아요. 걱정되면 고객센터로 알려 주세요.',
            ],
        ]);
    }

    /**
     * 소셜 전용 안내 (재설정 링크 없음) — 계정 열거 방지를 위해 발송은 서버에서만 결정.
     *
     * @param list<string> $providerLabels
     * @return array{subject: string, plain: string, html: string}
     */
    public static function buildSocialOnly(
        array $providerLabels,
        string $role = '',
        string $loginUrl = '',
        string $supportUrl = ''
    ): array {
        $role = MemberMailRole::normalize($role);
        $names = $providerLabels !== [] ? implode(', ', $providerLabels) : '소셜';

        return MemberMailTemplate::render([
            'subject'     => self::SUBJECT_SOCIAL_ONLY,
            'support_url' => self::supportUrlOrDefault($supportUrl),
            'role'        => $role,
            'badge'       => self::badge($role),
            'preheader'   => '이 계정은 ' . $names . ' 로그인으로 들어오실 수 있어요.',
            'heading'     => $names . ' 로그인으로 들어와 주세요',
            'paragraphs'  => [
                self::greeting($role) . ' 비밀번호 재설정 요청을 받았어요.',
                '이 계정은 ' . $names . ' 로그인으로 가입·연결되어 있어서 따로 만든 비밀번호가 없어요. '
                    . '로그인 화면에서 ' . $names . ' 버튼을 눌러 들어와 주세요.',
            ],
            'button'      => $loginUrl !== '' ? ['label' => '로그인 화면으로 가기', 'url' => $loginUrl] : null,
            'notes'       => [
                '요청하지 않았다면 이 메일은 무시하셔도 괜찮아요. 계정에는 아무 변화가 없어요. 걱정되면 고객센터로 알려 주세요.',
            ],
        ]);
    }

    private static function supportUrlOrDefault(string $supportUrl): string
    {
        return $supportUrl !== '' ? $supportUrl : MemberMailTemplate::supportUrl('');
    }

    private static function greeting(string $role): string
    {
        $address = MemberMailRole::address($role);

        return $address !== '' ? $address . ',' : '안녕하세요,';
    }

    private static function badge(string $role): ?string
    {
        $label = MemberMailRole::label($role);

        return $label !== '' ? $label . ' 계정' : null;
    }
}
