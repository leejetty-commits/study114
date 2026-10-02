<?php

declare(strict_types=1);

namespace Study114\Board;

/**
 * Channel ACL — FE board-channel-acl.js 와 동일 규칙
 * concern-family ≡ concern-parent
 *
 * 축: discover(소개) / list(글 목록) / detail / compose / comment / react / download
 */
final class BoardChannelAcl
{
    /** @var list<string> */
    private const BOARD_ROLES = ['guest', 'member', 'demand', 'supply-room', 'supply-tutor', 'verified', 'admin'];

    /** @var list<string> */
    private const ALL_ROLES = ['guest', 'member', 'demand', 'supply-room', 'supply-tutor', 'admin'];

    /** @var list<string> */
    private const LOGGED_IN = ['member', 'demand', 'supply-room', 'supply-tutor', 'admin'];

    /** @var list<string> */
    private const PROVIDERS = ['supply-room', 'supply-tutor', 'admin'];

    /**
     * 서버 저장 정보 게시판. info-room·info-tutor(공급자 전용): 게스트 제목만, 학생·member 차단.
     * info-student(학생 꿀팁 가이드): 게스트·member 제목만, 학생·공부방·과외쌤·관리자 읽기.
     */
    public const INFO_BOARD_KEYS = ['info-room', 'info-tutor', 'info-student'];

    public const STUDENT_TIPS_BOARD_KEY = 'info-student';

    /** @var list<string> */
    private const INFO_DISCOVER = ['guest', 'supply-room', 'supply-tutor', 'admin'];

    /** @var list<string> */
    private const STUDENT_TIPS_READERS = ['demand', 'supply-room', 'supply-tutor', 'admin'];

    public const LIBRARY_FILE_DOWNLOAD_IMPLEMENTED = false;

    /** @var array<string, list<string>> */
    private const DISCOVER_ROLES = [
        'notice' => self::ALL_ROLES,
        'faq' => self::ALL_ROLES,
        'safe-guide' => self::ALL_ROLES,
        'library' => self::LOGGED_IN,
        'library-template' => self::LOGGED_IN,
        'library-guide-pdf' => self::ALL_ROLES,
        'submission' => ['supply-tutor', 'admin'],
        'concern-director' => self::ALL_ROLES,
        'concern-tutor' => self::ALL_ROLES,
        'concern-parent' => self::ALL_ROLES,
        'concern-solved' => self::ALL_ROLES,
        'info-room' => self::INFO_DISCOVER,
        'info-tutor' => self::INFO_DISCOVER,
        'info-student' => self::ALL_ROLES,
    ];

    /** @var array<string, list<string>> */
    private const LIST_ROLES = [
        'notice' => self::ALL_ROLES,
        'faq' => self::ALL_ROLES,
        'safe-guide' => self::ALL_ROLES,
        'library' => self::LOGGED_IN,
        'library-template' => self::LOGGED_IN,
        'library-guide-pdf' => self::ALL_ROLES,
        'submission' => ['supply-tutor', 'admin'],
        'concern-director' => self::PROVIDERS,
        'concern-tutor' => self::PROVIDERS,
        'concern-parent' => ['demand', 'member', 'supply-room', 'supply-tutor', 'admin'],
        'concern-solved' => self::LOGGED_IN,
        'info-room' => self::PROVIDERS,
        'info-tutor' => self::PROVIDERS,
        'info-student' => self::STUDENT_TIPS_READERS,
    ];

    /** @var array<string, list<string>> */
    private const DETAIL_ROLES = [
        'notice' => self::ALL_ROLES,
        'faq' => self::ALL_ROLES,
        'safe-guide' => self::ALL_ROLES,
        'library' => self::LOGGED_IN,
        'library-template' => self::LOGGED_IN,
        'library-guide-pdf' => self::ALL_ROLES,
        'submission' => ['supply-tutor', 'admin'],
        'concern-director' => self::PROVIDERS,
        'concern-tutor' => self::PROVIDERS,
        'concern-parent' => ['demand', 'member', 'supply-room', 'supply-tutor', 'admin'],
        'concern-solved' => self::LOGGED_IN,
        'info-room' => self::PROVIDERS,
        'info-tutor' => self::PROVIDERS,
        'info-student' => self::STUDENT_TIPS_READERS,
    ];

    /** @var array<string, list<string>> */
    private const COMPOSE_ROLES = [
        'notice' => ['admin'],
        'faq' => ['admin'],
        'safe-guide' => ['admin'],
        'library' => ['admin'],
        'library-template' => ['admin'],
        'library-guide-pdf' => ['admin'],
        'submission' => ['supply-tutor', 'admin'],
        'concern-director' => ['supply-room'],
        'concern-tutor' => ['supply-tutor'],
        'concern-parent' => ['demand', 'member'],
        // 해결후기 작성·댓글: 기존값 유지 · 별도 최종 정책 확인 대상. 이번 작업에서 확대·축소 금지.
        'concern-solved' => ['member', 'demand', 'supply-room', 'supply-tutor'],
        // 채널 단위. 공급자는 PaidProviderGate(유료) 를 InfoBoardService 가 다시 본다.
        'info-room' => self::PROVIDERS,
        'info-tutor' => self::PROVIDERS,
        // 학생은 그대로, 공급자는 PaidProviderGate(유료) 를 InfoBoardService 가 다시 본다.
        'info-student' => self::STUDENT_TIPS_READERS,
    ];

    /** @var array<string, list<string>> */
    private const DOWNLOAD_ROLES = [
        'submission' => ['supply-tutor', 'admin'],
    ];

    public static function normalizeBoardKey(string $boardKey): string
    {
        $key = trim($boardKey);
        if ($key === 'concern-family') {
            return 'concern-parent';
        }

        return $key;
    }

    /**
     * guestFilter 정본: allow | intro_only | block.
     * intro_only 는 글 카드를 막는 값이 아니라, 고민방이 걸린 칸에 값이 비었을 때 기본값으로 쓰이는 값이다.
     * summary_only 등 옛 저장값은 intro_only 로 정규화한다.
     */
    public static function normalizeGuestFilter(string $value): string
    {
        $v = trim($value);
        if (in_array($v, ['intro_only', 'intro', 'summary_only', 'summary-only', 'summary'], true)) {
            return 'intro_only';
        }
        if (in_array($v, ['block', 'blocked', 'deny'], true)) {
            return 'block';
        }
        if (in_array($v, ['allow', 'allowed', 'true', '1'], true)) {
            return 'allow';
        }
        if (in_array($v, ['false', '0'], true)) {
            return 'block';
        }

        return '';
    }

    /**
     * JS dumpBoardAclMatrix() 와 동일 스키마.
     *
     * @return list<array<string, mixed>>
     */
    public static function dumpMatrix(): array
    {
        $roles = ['guest', 'demand', 'supply-room', 'supply-tutor', 'admin'];
        $channels = [
            'concern-parent',
            'concern-family',
            'concern-director',
            'concern-tutor',
            'concern-solved',
            'notice',
            'faq',
            'safe-guide',
            'library',
            'library-template',
            'library-guide-pdf',
            'submission',
            'info-room',
            'info-tutor',
            'info-student',
        ];
        $rows = [];
        foreach ($roles as $role) {
            foreach ($channels as $alias) {
                $key = self::normalizeBoardKey($alias);
                $rows[] = [
                    'role' => $role,
                    'channel' => $key,
                    'alias' => $alias,
                    'discover' => self::canDiscover($alias, $role),
                    'list' => self::canList($alias, $role),
                    'detail' => self::canDetail($alias, $role),
                    'compose' => self::canCompose($alias, $role),
                    'comment' => self::canComment($alias, $role),
                    'react' => self::canReact($alias, $role),
                    'download' => self::canDownload($alias, $role),
                    'upload' => self::canUpload($alias, $role),
                    'delete' => self::canDelete($alias, $role),
                    'moderate' => self::canModerate($alias, $role),
                    'access' => self::accessKind($alias, $role),
                ];
            }
        }

        return $rows;
    }

    /**
     * @param array{role_type?: string}|null $auth
     */
    public static function boardRoleFromAuth(?array $auth): string
    {
        if ($auth === null) {
            return 'guest';
        }
        $roleType = (string) ($auth['role_type'] ?? '');
        if ($roleType === 'guardian_student' || $roleType === 'parent' || $roleType === 'student') {
            return 'demand';
        }
        // 세션 정본은 study_room_owner. 레거시 study_room 도 허용.
        if ($roleType === 'study_room_owner' || $roleType === 'study_room') {
            return 'supply-room';
        }
        if ($roleType === 'tutor') {
            return 'supply-tutor';
        }
        if ($roleType === 'admin') {
            return 'admin';
        }

        return 'member';
    }

    /**
     * @param list<string>|null $roles
     */
    private static function allows(?array $roles, string $boardRole): bool
    {
        if ($roles === null) {
            return false;
        }

        return in_array($boardRole, $roles, true);
    }

    public static function canDiscover(string $boardKey, string $boardRole): bool
    {
        $key = self::normalizeBoardKey($boardKey);
        $roles = self::DISCOVER_ROLES[$key] ?? null;

        return self::allows($roles, $boardRole);
    }

    public static function canList(string $boardKey, string $boardRole): bool
    {
        $key = self::normalizeBoardKey($boardKey);
        $roles = self::LIST_ROLES[$key] ?? null;

        return self::allows($roles, $boardRole);
    }

    public static function canDetail(string $boardKey, string $boardRole): bool
    {
        $key = self::normalizeBoardKey($boardKey);
        $roles = self::DETAIL_ROLES[$key] ?? null;

        return self::allows($roles, $boardRole);
    }

    public static function canCompose(string $boardKey, string $boardRole): bool
    {
        if ($boardRole === 'guest') {
            return false;
        }
        $key = self::normalizeBoardKey($boardKey);
        $roles = self::COMPOSE_ROLES[$key] ?? [];

        return self::allows($roles, $boardRole);
    }

    /** 댓글·반응 없는 채널 (BOARD_REGISTRY allowComment=false 와 동일) */
    private const COMMENT_DISABLED = [
        'notice',
        'faq',
        'safe-guide',
        'library',
        'library-template',
        'library-guide-pdf',
        'submission',
        'info-room',
        'info-tutor',
        'info-student',
    ];

    public static function canComment(string $boardKey, string $boardRole): bool
    {
        if ($boardRole === 'guest') {
            return false;
        }
        $key = self::normalizeBoardKey($boardKey);
        if (in_array($key, self::COMMENT_DISABLED, true)) {
            return false;
        }
        if ($key === 'concern-solved') {
            return self::canDetail($key, $boardRole) && self::canCompose($key, $boardRole);
        }
        if (isset(self::COMPOSE_ROLES[$key])) {
            return self::canCompose($key, $boardRole);
        }

        return self::canCompose($key, $boardRole);
    }

    /** 반응 — 댓글과 같은 축. 학생 꿀팁 가이드만 댓글 없이 「응원해요」 하나를 읽기 권한자에게 연다. */
    public static function canReact(string $boardKey, string $boardRole): bool
    {
        if (self::normalizeBoardKey($boardKey) === self::STUDENT_TIPS_BOARD_KEY) {
            return $boardRole !== 'guest'
                && self::canList($boardKey, $boardRole)
                && self::canDetail($boardKey, $boardRole);
        }

        return self::canComment($boardKey, $boardRole);
    }

    public static function canDownload(string $boardKey, string $boardRole): bool
    {
        if ($boardRole === 'guest') {
            return false;
        }
        $key = self::normalizeBoardKey($boardKey);
        if ($key === 'library' || $key === 'library-template' || $key === 'library-guide-pdf') {
            return self::LIBRARY_FILE_DOWNLOAD_IMPLEMENTED;
        }
        $roles = self::DOWNLOAD_ROLES[$key] ?? [];

        return self::allows($roles, $boardRole);
    }

    /** 첨부 업로드 — submission 만. 자료실 실파일은 미구현. */
    public static function canUpload(string $boardKey, string $boardRole): bool
    {
        $key = self::normalizeBoardKey($boardKey);
        if ($key !== 'submission') {
            return false;
        }

        return self::canCompose($key, $boardRole);
    }

    /**
     * 채널 단위 삭제 권한. 실제 삭제는 소유권·상태 재검사.
     */
    public static function canDelete(string $boardKey, string $boardRole): bool
    {
        if ($boardRole === 'guest') {
            return false;
        }
        $key = self::normalizeBoardKey($boardKey);
        if (in_array($key, ['notice', 'faq', 'safe-guide'], true)) {
            return $boardRole === 'admin';
        }
        if ($key === 'submission') {
            return self::canCompose($key, $boardRole);
        }
        if (self::isConcern($key)) {
            return self::canCompose($key, $boardRole) || $boardRole === 'admin';
        }
        if (self::isInfoBoard($key)) {
            return self::canCompose($key, $boardRole);
        }

        return false;
    }

    /** 운영 검수·큐. 일반 댓글과 분리. */
    public static function canModerate(string $boardKey, string $boardRole): bool
    {
        unset($boardKey);

        return $boardRole === 'admin';
    }

    /** 레거시 API 응답을 full 로 추정하면 안 되는 채널 */
    public static function isAccessFailClosed(string $boardKey): bool
    {
        $key = self::normalizeBoardKey($boardKey);

        return str_starts_with($key, 'concern-')
            || $key === 'submission'
            || $key === 'library'
            || $key === 'library-template'
            || self::isInfoBoard($key);
    }

    public static function accessKind(string $boardKey, string $boardRole): string
    {
        if (self::canList($boardKey, $boardRole) && self::canDetail($boardKey, $boardRole)) {
            return 'full';
        }
        if ((self::isConcern($boardKey) || self::isInfoBoard($boardKey)) && self::canDiscover($boardKey, $boardRole)) {
            return 'titles';
        }
        if (self::canDiscover($boardKey, $boardRole)) {
            return 'intro';
        }

        return 'blocked';
    }

    /** @return array{title: string, body: string, allowedRolesLabel: string, boardKey: string} */
    public static function channelIntro(string $boardKey): array
    {
        $key = self::normalizeBoardKey($boardKey);
        $map = [
            'concern-parent' => [
                'title' => '학생/학부모 고민방',
                'body' => '공부방·과외 선택, 학습 루틴, 안전에 대한 고민을 나누는 공간입니다.',
                'allowedRolesLabel' => '학생·학부모',
            ],
            'concern-director' => [
                'title' => '공부방 고민방',
                'body' => '공부방 운영·모집·학부모 응대에 대한 고민을 나누는 공간입니다.',
                'allowedRolesLabel' => '공부방',
            ],
            'concern-tutor' => [
                'title' => '과외쌤 고민방',
                'body' => '프로필·첫 상담·수업 전환에 대한 고민을 나누는 공간입니다.',
                'allowedRolesLabel' => '과외쌤',
            ],
            'concern-solved' => [
                'title' => '해결후기',
                'body' => '바꿔보니 효과 있었던 경험과 운영 노하우를 나누는 공간입니다.',
                'allowedRolesLabel' => '로그인한 회원',
            ],
            'notice' => [
                'title' => '공지사항',
                'body' => '우동공과 운영 공지를 안내하는 공간입니다.',
                'allowedRolesLabel' => '전체',
            ],
            'faq' => [
                'title' => '자주 묻는 질문',
                'body' => '이용 중 자주 묻는 질문을 모아 둔 공간입니다.',
                'allowedRolesLabel' => '전체',
            ],
            'safe-guide' => [
                'title' => '안전과외 가이드',
                'body' => '선입금 주의·분쟁 예방 등 이용 안내를 제공하는 공간입니다.',
                'allowedRolesLabel' => '전체',
            ],
            'library' => [
                'title' => '자료실',
                'body' => '학습·운영 참고 자료 목록을 안내하는 공간입니다. 실제 파일 다운로드는 아직 없습니다.',
                'allowedRolesLabel' => '로그인한 회원',
            ],
            'library-template' => [
                'title' => '양식·체크리스트',
                'body' => '양식·체크리스트 목록을 안내하는 공간입니다. 실제 파일 다운로드는 아직 없습니다.',
                'allowedRolesLabel' => '로그인한 회원',
            ],
            'library-guide-pdf' => [
                'title' => '가이드 PDF',
                'body' => '가이드 자료 목록을 안내하는 공간입니다. 실제 파일 다운로드는 아직 없습니다.',
                'allowedRolesLabel' => '전체 열람 · 다운로드 미구현',
            ],
            'submission' => [
                'title' => '신뢰·증빙자료 제출',
                'body' => '과외쌤이 학력·경력 등 신뢰 증빙자료를 제출하는 공간입니다. 공개 자료실과는 다릅니다.',
                'allowedRolesLabel' => '과외쌤',
            ],
            'info-room' => [
                'title' => '공부방 쏙쏙정보',
                'body' => '공부방 운영에 도움이 되는 정보를 나누는 게시판입니다.',
                'allowedRolesLabel' => '공부방·과외쌤',
            ],
            'info-tutor' => [
                'title' => '과외쌤 따끈 팁가이드',
                'body' => '과외 수업·상담에 도움이 되는 팁을 나누는 게시판입니다.',
                'allowedRolesLabel' => '공부방·과외쌤',
            ],
            'info-student' => [
                'title' => '학생 꿀팁 가이드',
                'body' => '공부·시험·진로에 도움이 되는 꿀팁을 나누는 게시판입니다.',
                'allowedRolesLabel' => '전체',
            ],
        ];

        $row = $map[$key] ?? [
            'title' => $key,
            'body' => '이 공간의 소개만 볼 수 있어요.',
            'allowedRolesLabel' => '',
        ];
        $row['boardKey'] = $key;

        return $row;
    }

    /** 비회원 고민방은 메뉴명만. 소개문·허용역할 문구도 주지 않는다. */
    public static function introLevel(string $boardKey, string $boardRole): string
    {
        return $boardRole === 'guest' && self::isConcern($boardKey) ? 'menu_only' : 'intro';
    }

    /**
     * access=intro 응답에 실을 소개 payload. menu_only 면 메뉴명 외 필드를 만들지 않는다.
     *
     * @return array<string, string>
     */
    public static function introPayload(string $boardKey, string $boardRole): array
    {
        $key = self::normalizeBoardKey($boardKey);
        $intro = self::channelIntro($key);
        $level = self::introLevel($key, $boardRole);
        if ($level === 'menu_only') {
            return [
                'boardKey' => $key,
                'level' => $level,
                'menuLabel' => $intro['title'],
            ];
        }

        return [
            'boardKey' => $key,
            'level' => $level,
            'menuLabel' => $intro['title'],
            'title' => $intro['title'],
            'body' => $intro['body'],
            'allowedRolesLabel' => $intro['allowedRolesLabel'],
        ];
    }

    public static function isConcern(string $boardKey): bool
    {
        return str_starts_with(self::normalizeBoardKey($boardKey), 'concern-');
    }

    public static function isInfoBoard(string $boardKey): bool
    {
        return in_array(self::normalizeBoardKey($boardKey), self::INFO_BOARD_KEYS, true);
    }

    /** @return list<string> */
    public static function knownBoardRoles(): array
    {
        return self::BOARD_ROLES;
    }
}
