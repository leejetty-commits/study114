<?php

declare(strict_types=1);

namespace Study114\Auth;

use Study114\Mail\MemberMailRole;
use Study114\Mail\MemberMailTemplate;

/**
 * 가입 확인 메일 — 역할 배지(공부방 원장님 / 과외쌤 선생님 / 학생·학부모님)를 맨 위에, 제목에도 역할.
 * 제목의 「이메일 확인」은 AuthMailer::mailKind 분류(email_verify) 기준이라 유지한다.
 */
final class EmailVerifyMailTemplate
{
    /**
     * @param string $role user_roles.role_type 또는 MemberMailRole 값 ('' = 역할 모름 → 중립 문구)
     * @return array{subject: string, plain: string, html: string}
     */
    public static function build(string $role, string $verifyUrl, int $ttlMinutes, string $supportUrl): array
    {
        $role = MemberMailRole::normalize($role);
        $label = MemberMailRole::label($role);
        $ttl = MemberMailTemplate::ttlLabel($ttlMinutes);

        $subject = $label !== ''
            ? '[우동공과] ' . $label . ', 이메일 확인만 남았어요'
            : '[우동공과] 이메일 확인만 남았어요';

        return MemberMailTemplate::render([
            'subject'     => $subject,
            'support_url' => $supportUrl,
            'role'        => $role,
            'badge'       => $label !== '' ? $label . ' 가입' : '우동공과 가입',
            'preheader'   => '버튼 한 번이면 가입 확인이 끝나요. 링크는 ' . $ttl . ' 동안 쓸 수 있어요.',
            'heading'     => '이메일 확인만 남았어요',
            'paragraphs'  => self::paragraphs($role),
            'button'      => ['label' => '이메일 확인하고 계속하기', 'url' => $verifyUrl],
            'notes'       => [
                '이 링크는 ' . $ttl . ' 동안 쓸 수 있어요. 시간이 지났다면 가입 화면의 「확인 메일 다시 보내기」를 눌러 주세요.',
                '링크는 새 탭에서 열려요. 확인이 끝나면 가입을 시작했던 원래 화면으로 돌아가 기본정보를 이어서 입력해 주세요.',
                '메일이 스팸함에 있었다면 ‘스팸 아님’을 눌러 주세요. 다음 안내를 놓치지 않게 돼요.',
                '직접 가입하신 적이 없다면 이 메일은 무시하셔도 괜찮아요. 아무 일도 일어나지 않아요.',
            ],
        ]);
    }

    /** @return list<string> */
    private static function paragraphs(string $role): array
    {
        return match ($role) {
            MemberMailRole::STUDY_ROOM => [
                '원장님, 우동공과에 오신 것을 진심으로 환영해요. 우리 동네 학부모님과 학생이 원장님의 공부방을 만날 준비를 하고 있어요.',
                '아래 버튼을 한 번만 눌러 이메일을 확인해 주세요. 확인이 끝나면 공부방 기본정보를 입력하고 우리 동네 카드를 올릴 수 있어요.',
            ],
            MemberMailRole::TUTOR => [
                '선생님, 우동공과에 오신 것을 진심으로 환영해요. 근처 학생과 학부모님이 선생님을 찾을 수 있도록 준비하고 있어요.',
                '아래 버튼을 한 번만 눌러 이메일을 확인해 주세요. 확인이 끝나면 과외 기본정보와 수업 가능한 지역을 입력할 수 있어요.',
            ],
            MemberMailRole::STUDENT => [
                '안녕하세요, 우동공과에 오신 것을 환영해요. 우리 동네에서 꼭 맞는 공부방과 과외쌤을 함께 찾아 드릴게요.',
                '아래 버튼을 한 번만 눌러 이메일을 확인해 주세요. 전화번호와 상세 주소는 다른 회원에게 공개되지 않아요.',
            ],
            default => [
                '안녕하세요, 우동공과에 오신 것을 환영해요.',
                '아래 버튼을 한 번만 눌러 이메일을 확인해 주세요. 확인이 끝나면 가입을 시작했던 화면에서 기본정보를 이어서 입력할 수 있어요.',
            ],
        };
    }
}
