<?php

declare(strict_types=1);

namespace Study114\Mail;

/**
 * 「우동공과 편지」 생활 메일 문안 — 카드 게시 환영 · Prime/Pick 구매 감사 · 탈퇴 완료.
 * 실명은 쓰지 않는다. 공부방 이름(카드에 노출되는 상호)만 넣는다. 권유·할인 문구 없음.
 */
final class MemberLifecycleMailTemplate
{
    public const REGISTRATIONS_PATH = '/mypage/registrations';
    public const PLANS_PATH = '/mypage/plans';

    public const ROOM_PRIME_SLOTS = 3;

    /**
     * @param array{home_ui: string, room_name?: string, region_label?: string} $ctx
     * @return array{subject: string, plain: string, html: string}
     */
    public static function cardPosted(string $role, array $ctx): array
    {
        $homeUi = self::base($ctx['home_ui']);
        $support = MemberMailTemplate::supportUrl($homeUi);
        $cardUrl = $homeUi . self::REGISTRATIONS_PATH;

        if ($role === MemberMailRole::STUDY_ROOM) {
            $room = self::clean($ctx['room_name'] ?? '');
            $subjectName = $room !== '' ? $room : '원장님의 공부방';

            return MemberMailTemplate::render([
                'subject' => '[우동공과] ' . $subjectName . ', 오늘부터 우리 동네 지도에 올랐어요',
                'support_url' => $support,
                'role' => $role,
                'badge' => '공부방 원장님 · 카드 게시',
                'preheader' => '근처 학부모님이 지금부터 원장님의 공부방을 찾을 수 있어요.',
                'heading' => '우리 동네 카드가 게시되었어요',
                'paragraphs' => [
                    '원장님, 반갑습니다.',
                    ($room !== '' ? $room . '의 카드가' : '원장님의 공부방 카드가')
                        . ' 우동공과에 게시되었어요. 이제 근처 학부모님과 학생이 지도와 찾기에서 원장님의 공부방을 만나요.',
                    '좋은 수업은 이미 하고 계시니, 알리는 일은 저희가 함께할게요.',
                ],
                'button' => ['label' => '내 공부방 카드 보기', 'url' => $cardUrl],
                'notes_title' => '첫인상을 한 단계 올리는 세 가지',
                'notes' => [
                    '대표 사진 — 밝은 교실 사진 한 장이 클릭을 바꿔요.',
                    '수업 소개 — 원장님만의 수업 방식을 두세 줄로 적어 주세요.',
                    '쪽지설정 — 문의를 놓치지 않도록 받는 상태로 두세요.',
                    '카드 내용은 마이페이지 「내 등록」에서 언제든 고칠 수 있어요.',
                ],
            ]);
        }

        if ($role === MemberMailRole::TUTOR) {
            $region = self::clean($ctx['region_label'] ?? '');

            return MemberMailTemplate::render([
                'subject' => '[우동공과] 과외쌤 선생님, 첫 수업의 문이 열렸어요',
                'support_url' => $support,
                'role' => $role,
                'badge' => '과외쌤 선생님 · 카드 게시',
                'preheader' => '근처 학생과 학부모님이 이제 선생님을 찾을 수 있어요.',
                'heading' => '과외쌤 카드가 게시되었어요',
                'paragraphs' => [
                    '선생님, 반갑습니다.',
                    '선생님의 카드가 우동공과에 게시되었어요. 오늘부터 '
                        . ($region !== '' ? $region . '의 ' : '')
                        . '학생과 학부모님이 선생님을 만날 수 있어요.',
                    '가르치는 일의 설렘, 처음 그대로 응원할게요.',
                ],
                'button' => ['label' => '내 카드 보기', 'url' => $cardUrl],
                'notes_title' => '먼저 눈에 띄는 카드의 공통점',
                'notes' => [
                    '가르치는 과목과 학년이 한눈에 보여요.',
                    '수업 가능한 지역이 정확해요.',
                    '쪽지설정이 받는 상태예요.',
                    '카드 내용은 마이페이지 「내 등록」에서 언제든 고칠 수 있어요.',
                ],
            ]);
        }

        return MemberMailTemplate::render([
            'subject' => '[우동공과] 학생·학부모님, 공부 카드가 올라갔어요',
            'support_url' => $support,
            'role' => MemberMailRole::STUDENT,
            'badge' => '학생·학부모님 · 카드 게시',
            'preheader' => '근처 과외쌤과 공부방이 꼭 맞는 수업을 먼저 제안할 수 있어요.',
            'heading' => '공부 카드가 게시되었어요',
            'paragraphs' => [
                '안녕하세요.',
                '공부 카드가 우동공과에 게시되었어요. 이제 근처 과외쌤과 공부방이 카드를 보고 쪽지로 먼저 인사를 건넬 수 있어요.',
                '좋은 선생님을 만나는 일, 서두르지 않고 함께 찾을게요.',
            ],
            'button' => ['label' => '내 카드 보기', 'url' => $cardUrl],
            'notes_title' => '안심하세요',
            'notes' => [
                '전화번호와 상세 주소는 다른 회원에게 보이지 않아요.',
                '대화는 쪽지로만 시작돼요. 원하지 않으면 답하지 않아도 괜찮아요.',
                '카드 내용은 마이페이지 「내 등록」에서 언제든 고칠 수 있어요.',
            ],
        ]);
    }

    /**
     * @param array{
     *   home_ui: string,
     *   product: 'prime'|'pick',
     *   extend?: bool,
     *   period_label?: string,
     *   started_on?: string,
     *   ends_on?: string,
     *   amount_won?: int,
     *   room_name?: string,
     *   scope_label?: string,
     *   city_label?: string,
     *   subject_label?: string,
     * } $ctx
     * @return array{subject: string, plain: string, html: string}
     */
    public static function purchaseThanks(string $role, array $ctx): array
    {
        $homeUi = self::base($ctx['home_ui']);
        $support = MemberMailTemplate::supportUrl($homeUi);
        $plansUrl = $homeUi . self::PLANS_PATH;
        $isPrime = $ctx['product'] === 'prime';
        $extend = (bool) ($ctx['extend'] ?? false);
        $product = $isPrime ? 'Prime' : 'Pick';
        $address = $role === MemberMailRole::STUDY_ROOM ? '원장님' : '선생님';
        $roleLabel = MemberMailRole::label($role);
        $room = self::clean($ctx['room_name'] ?? '');
        $who = $role === MemberMailRole::STUDY_ROOM
            ? ($room !== '' ? $room : '원장님의 공부방')
            : '선생님';

        $summary = self::purchaseSummary($product, $ctx);

        if ($extend) {
            $subject = '[우동공과] ' . $address . ', ' . $product . ' 기간을 이어 가 주셔서 고맙습니다';
            $heading = $product . ' 기간이 늘어났어요';
            $preheader = $product . ' 자리를 그대로 이어 가요.';
        } elseif ($isPrime) {
            $subject = '[우동공과] ' . $address . ', Prime 자리에 오르셨어요. 진심으로 고맙습니다';
            $heading = 'Prime 자리에 오르셨어요';
            $preheader = '이용 기간 동안 우리 동네 가장 앞자리에서 소개돼요.';
        } else {
            $subject = '[우동공과] ' . $address . ', 한 걸음 앞에 서셨어요. 고맙습니다';
            $heading = 'Pick 자리에 오르셨어요';
            $preheader = '이용 기간 동안 찾기 결과에서 먼저 눈에 띄는 자리로 소개돼요.';
        }

        $paragraphs = [$address . ', ' . ($extend ? '계속 함께해 주셔서 고맙습니다.' : '결정해 주셔서 고맙습니다.')];
        if ($summary !== '') {
            $paragraphs[] = $summary;
        }

        $highlight = null;
        if ($isPrime && $role === MemberMailRole::STUDY_ROOM) {
            $scope = self::clean($ctx['scope_label'] ?? '');
            $paragraphs[] = 'Prime은 우리 동네의 가장 앞자리예요. 학부모님이 동네를 열었을 때 가장 먼저 만나는 얼굴, 이제 ' . $who . '이에요.';
            $highlight = [
                'title' => 'Prime, 이 동네 단 ' . self::ROOM_PRIME_SLOTS . '자리',
                'items' => [
                    ($scope !== '' ? $scope . '에서' : '이 동네에서') . ' 단 ' . self::ROOM_PRIME_SLOTS . '곳만 앉을 수 있는 자리예요.',
                    '학부모님이 동네를 열면 가장 앞줄에서 먼저 만나요.',
                    '이용 기간이 끝날 때까지 그 자리는 원장님 몫이에요.',
                ],
            ];
        } elseif ($isPrime) {
            $axis = self::tutorAxis($ctx);
            $paragraphs[] = 'Prime은 ' . ($axis !== '' ? $axis . ' ' : '') . '과외쌤 찾기에서 가장 앞쪽에 소개되는 자리예요. 학생과 학부모님이 가장 먼저 만나는 얼굴, 이제 선생님이에요.';
        } else {
            $axis = $role === MemberMailRole::TUTOR ? self::tutorAxis($ctx) : '';
            $paragraphs[] = 'Pick은 학부모님이 「먼저 골라 보는」 자리예요. '
                . ($axis !== '' ? $axis . '에서 ' : '')
                . '비슷한 카드들 사이에서 ' . ($role === MemberMailRole::STUDY_ROOM ? $who . '의 카드가' : '선생님의 카드가')
                . ' 한 걸음 앞에 서요.';
        }
        $paragraphs[] = '좋은 수업이 더 멀리 닿도록, 저희도 같은 마음으로 응원할게요.';

        return MemberMailTemplate::render([
            'subject' => $subject,
            'support_url' => $support,
            'role' => $role,
            'badge' => $roleLabel . ' · ' . $product . ' 노출',
            'preheader' => $preheader,
            'heading' => $heading,
            'paragraphs' => $paragraphs,
            'highlight' => $highlight,
            'button' => ['label' => '구매이력에서 확인하기', 'url' => $plansUrl],
            'notes_title' => '이 기간을 가장 빛나게 쓰는 법',
            'notes' => [
                '대표 사진을 최신 모습으로 바꿔 주세요.',
                '쪽지설정이 받는 상태인지 한 번 더 확인해 주세요.',
                '첫 문의에는 하루 안에 답장해 주세요. 답이 빠를수록 믿음이 쌓여요.',
                '결제 내역은 마이페이지 「구매이력」에서 언제든 볼 수 있어요.',
            ],
        ]);
    }

    /**
     * @param array{home_ui: string, withdrawn_at: string} $ctx
     * @return array{subject: string, plain: string, html: string}
     */
    public static function withdrawn(string $role, array $ctx): array
    {
        $homeUi = self::base($ctx['home_ui']);
        $support = MemberMailTemplate::supportUrl($homeUi);
        $label = MemberMailRole::label($role);
        $when = self::dateTimeLabel($ctx['withdrawn_at']);

        return MemberMailTemplate::render([
            'subject' => '[우동공과] 그동안 우동공과와 함께해 주셔서 고맙습니다',
            'support_url' => $support,
            'role' => $role,
            'badge' => ($label !== '' ? $label . ' · ' : '') . '탈퇴 완료',
            'preheader' => '탈퇴가 완료되었어요. 정리된 내용과 다시 오시는 방법을 알려 드릴게요.',
            'heading' => '탈퇴가 완료되었어요',
            'paragraphs' => [
                '그동안 고마웠어요.',
                ($when !== '' ? $when . '에 ' : '') . '탈퇴가 완료되었어요.',
                '아이들의 공부가 계속되는 한, 우리 동네 어딘가에서 다시 만나길 바라요.',
            ],
            'notes_title' => '정리된 내용',
            'notes' => [
                '노출되던 카드는 이제 다른 회원에게 보이지 않아요.',
                '이용 중이던 Prime·Pick이 있었다면 오늘 자로 끝났어요.',
                '같은 이메일로 새로 가입할 수 있어요. 다만 이전 기록은 되살릴 수 없어요.',
                '직접 탈퇴하지 않으셨다면, 같은 이메일로 다시 가입한 뒤 고객센터 1:1 문의로 바로 알려 주세요.',
            ],
        ]);
    }

    /** @param array<string, mixed> $ctx */
    private static function purchaseSummary(string $product, array $ctx): string
    {
        $parts = [$product . ' 노출'];
        $period = self::clean((string) ($ctx['period_label'] ?? ''));
        if ($period !== '') {
            $parts[0] .= ' ' . $period;
        }
        $from = self::dateLabel((string) ($ctx['started_on'] ?? ''));
        $to = self::dateLabel((string) ($ctx['ends_on'] ?? ''));
        if ($from !== '' && $to !== '') {
            $parts[] = $from . ' ~ ' . $to;
        }
        $amount = (int) ($ctx['amount_won'] ?? 0);
        if ($amount > 0) {
            $parts[] = number_format($amount) . '원 결제 완료';
        }

        return implode(' · ', $parts);
    }

    /** @param array<string, mixed> $ctx */
    private static function tutorAxis(array $ctx): string
    {
        $city = self::clean((string) ($ctx['city_label'] ?? ''));
        $subject = self::clean((string) ($ctx['subject_label'] ?? ''));

        return trim($city . ($city !== '' && $subject !== '' ? ' · ' : '') . $subject);
    }

    /** 'Y-m-d' → 「2026년 10월 9일」 */
    public static function dateLabel(string $ymd): string
    {
        $ymd = trim($ymd);
        if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})/', $ymd, $m)) {
            return '';
        }

        return (int) $m[1] . '년 ' . (int) $m[2] . '월 ' . (int) $m[3] . '일';
    }

    /** 'Y-m-d H:i[:s]'(이미 한국 시각) → 「2026년 10월 9일 오전 8시 5분」. 시간대 변환 없음. */
    public static function dateTimeLabel(string $dateTime): string
    {
        if (!preg_match('/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/', trim($dateTime), $m)) {
            return self::dateLabel($dateTime);
        }
        $hour = (int) $m[4];
        $minute = (int) $m[5];
        $ampm = $hour < 12 ? '오전' : '오후';
        $h12 = $hour % 12 === 0 ? 12 : $hour % 12;

        return (int) $m[1] . '년 ' . (int) $m[2] . '월 ' . (int) $m[3] . '일 '
            . $ampm . ' ' . $h12 . '시' . ($minute > 0 ? ' ' . $minute . '분' : '');
    }

    private static function base(string $homeUi): string
    {
        $base = rtrim(trim($homeUi), '/');

        return $base === '' ? MemberMailTemplate::SITE_URL : $base;
    }

    /** 제목·본문에 넣는 회원 입력값 — 줄바꿈·제어문자 제거, 길이 제한 */
    private static function clean(string $value): string
    {
        $value = preg_replace('/[\p{C}]+/u', ' ', $value) ?? '';
        $value = trim(preg_replace('/\s+/u', ' ', $value) ?? '');

        return preg_replace('/^(.{40}).+$/us', '$1', $value) ?? '';
    }
}
