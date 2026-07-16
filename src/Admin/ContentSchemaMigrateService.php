<?php

declare(strict_types=1);

namespace Study114\Admin;

use PDO;
use Study114\Database\Connection;
use Throwable;

/**
 * 034/035 멱등 적용 — notice/faq/safe-guide seed · channel/slot 정의 테이블
 * 닷홈은 원격 MySQL이 없어 서버 PDO로 적용한다.
 */
final class ContentSchemaMigrateService
{
    private PDO $pdo;

    public function __construct(?PDO $pdo = null)
    {
        $this->pdo = $pdo ?? Connection::get();
    }

    /** @return array<string, mixed> */
    public function status(): array
    {
        return [
            'notice' => $this->countBoard('notice'),
            'faq' => $this->countBoard('faq'),
            'safe_guide' => $this->countBoard('safe-guide'),
            'channel_table' => $this->tableExists('board_channel_definitions'),
            'rail_table' => $this->tableExists('right_rail_slot_definitions'),
            'channels' => $this->tableExists('board_channel_definitions') ? $this->countTable('board_channel_definitions') : 0,
            'slots' => $this->tableExists('right_rail_slot_definitions') ? $this->countTable('right_rail_slot_definitions') : 0,
        ];
    }

    /** @return array<string, mixed> */
    public function apply(): array
    {
        $before = $this->status();
        $steps = [];

        $this->pdo->exec("SET NAMES utf8mb4");

        $steps[] = $this->step('create_channel_table', fn () => $this->createChannelTable());
        $steps[] = $this->step('create_rail_table', fn () => $this->createRailTable());
        $steps[] = $this->step('seed_operational_posts', fn () => $this->seedOperationalPosts());
        $steps[] = $this->step('seed_channels', fn () => $this->seedChannels());
        $steps[] = $this->step('seed_rails', fn () => $this->seedRails());

        return [
            'before' => $before,
            'after' => $this->status(),
            'steps' => $steps,
        ];
    }

    /** @param callable(): string $fn @return array{name: string, result: string} */
    private function step(string $name, callable $fn): array
    {
        try {
            return ['name' => $name, 'result' => $fn()];
        } catch (Throwable $e) {
            return ['name' => $name, 'result' => 'error: ' . $e->getMessage()];
        }
    }

    private function tableExists(string $table): bool
    {
        $stmt = $this->pdo->prepare(
            'SELECT COUNT(*) FROM information_schema.tables
             WHERE table_schema = DATABASE() AND table_name = ?'
        );
        $stmt->execute([$table]);

        return (int) $stmt->fetchColumn() > 0;
    }

    private function countTable(string $table): int
    {
        return (int) $this->pdo->query('SELECT COUNT(*) FROM `' . str_replace('`', '', $table) . '`')->fetchColumn();
    }

    private function countBoard(string $boardKey): int
    {
        $stmt = $this->pdo->prepare('SELECT COUNT(*) FROM board_posts WHERE board_key = ?');
        $stmt->execute([$boardKey]);

        return (int) $stmt->fetchColumn();
    }

    private function createChannelTable(): string
    {
        if ($this->tableExists('board_channel_definitions')) {
            return 'exists';
        }
        $this->pdo->exec(
            "CREATE TABLE board_channel_definitions (
              id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
              board_key           VARCHAR(50) NOT NULL,
              menu_label          VARCHAR(100) NOT NULL,
              board_type          VARCHAR(30) NOT NULL,
              preset_id           VARCHAR(30) NOT NULL,
              section_owner       VARCHAR(50) NOT NULL,
              route_slug          VARCHAR(120) NOT NULL DEFAULT '',
              visibility          VARCHAR(20) NOT NULL DEFAULT 'public',
              download_policy     VARCHAR(20) NOT NULL DEFAULT 'none',
              allowed_roles_json  JSON NULL,
              allow_write         TINYINT(1) NOT NULL DEFAULT 0,
              allow_comment       TINYINT(1) NOT NULL DEFAULT 0,
              allow_upload        TINYINT(1) NOT NULL DEFAULT 0,
              require_review      TINYINT(1) NOT NULL DEFAULT 0,
              is_gnu_separated    TINYINT(1) NOT NULL DEFAULT 1,
              enabled             TINYINT(1) NOT NULL DEFAULT 1,
              archived            TINYINT(1) NOT NULL DEFAULT 0,
              sort_order          INT NOT NULL DEFAULT 0,
              created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              created_by          VARCHAR(100) NULL,
              updated_by          VARCHAR(100) NULL,
              PRIMARY KEY (id),
              UNIQUE KEY uq_board_channel_key (board_key),
              KEY idx_board_channel_enabled (enabled, archived, sort_order)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
              COMMENT='게시판 채널 정의 (A28-05)'"
        );

        return 'created';
    }

    private function createRailTable(): string
    {
        if ($this->tableExists('right_rail_slot_definitions')) {
            return 'exists';
        }
        $this->pdo->exec(
            "CREATE TABLE right_rail_slot_definitions (
              id                      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
              slot_key                VARCHAR(50) NOT NULL,
              page_type               VARCHAR(30) NOT NULL,
              source_type             VARCHAR(20) NOT NULL DEFAULT 'mixed',
              source_board_key        VARCHAR(50) NOT NULL DEFAULT '',
              source_board_keys_json  JSON NULL,
              selection_mode          VARCHAR(20) NOT NULL DEFAULT 'curated',
              item_limit              TINYINT UNSIGNED NOT NULL DEFAULT 3,
              section_title           VARCHAR(120) NOT NULL,
              cta_label               VARCHAR(80) NOT NULL DEFAULT '바로가기',
              cta_target              VARCHAR(120) NOT NULL DEFAULT '#/support',
              mobile_behavior         VARCHAR(20) NOT NULL DEFAULT 'stack',
              visibility_rule         VARCHAR(20) NOT NULL DEFAULT 'public',
              role_target             VARCHAR(30) NOT NULL DEFAULT 'all',
              enabled                 TINYINT(1) NOT NULL DEFAULT 1,
              status                  VARCHAR(20) NOT NULL DEFAULT 'active',
              priority                INT NOT NULL DEFAULT 50,
              sort_order              INT NOT NULL DEFAULT 0,
              created_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updated_at              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
              created_by              VARCHAR(100) NULL,
              updated_by              VARCHAR(100) NULL,
              PRIMARY KEY (id),
              UNIQUE KEY uq_right_rail_slot_key (slot_key),
              KEY idx_right_rail_enabled (enabled, status, priority)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
              COMMENT='우측 레일 슬롯 정의 (A28-05)'"
        );

        return 'created';
    }

    private function seedOperationalPosts(): string
    {
        $inserted = 0;
        foreach ($this->operationalPostRows() as $row) {
            $check = $this->pdo->prepare('SELECT id FROM board_posts WHERE board_key = ? AND post_key = ?');
            $check->execute([$row['board_key'], $row['post_key']]);
            if ($check->fetchColumn()) {
                continue;
            }
            $stmt = $this->pdo->prepare(
                'INSERT INTO board_posts
                 (board_key, post_key, author_role, status, title, description, category_id, meta_json, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())'
            );
            $stmt->execute([
                $row['board_key'],
                $row['post_key'],
                $row['author_role'],
                $row['status'],
                $row['title'],
                $row['description'],
                $row['category_id'],
                $row['meta_json'],
                $row['created_at'],
            ]);
            $inserted++;
        }

        return "inserted={$inserted}";
    }

    private function seedChannels(): string
    {
        $inserted = 0;
        foreach ($this->channelRows() as $row) {
            $check = $this->pdo->prepare('SELECT id FROM board_channel_definitions WHERE board_key = ?');
            $check->execute([$row['board_key']]);
            if ($check->fetchColumn()) {
                continue;
            }
            $stmt = $this->pdo->prepare(
                'INSERT INTO board_channel_definitions
                 (board_key, menu_label, board_type, preset_id, section_owner, route_slug, visibility, download_policy,
                  allowed_roles_json, allow_write, allow_comment, allow_upload, require_review, is_gnu_separated,
                  enabled, archived, sort_order)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                $row['board_key'],
                $row['menu_label'],
                $row['board_type'],
                $row['preset_id'],
                $row['section_owner'],
                $row['route_slug'],
                $row['visibility'],
                $row['download_policy'],
                $row['allowed_roles_json'],
                $row['allow_write'],
                $row['allow_comment'],
                $row['allow_upload'],
                $row['require_review'],
                $row['is_gnu_separated'],
                $row['enabled'],
                $row['archived'],
                $row['sort_order'],
            ]);
            $inserted++;
        }

        return "inserted={$inserted}";
    }

    private function seedRails(): string
    {
        $inserted = 0;
        foreach ($this->railRows() as $row) {
            $check = $this->pdo->prepare('SELECT id FROM right_rail_slot_definitions WHERE slot_key = ?');
            $check->execute([$row['slot_key']]);
            if ($check->fetchColumn()) {
                continue;
            }
            $stmt = $this->pdo->prepare(
                'INSERT INTO right_rail_slot_definitions
                 (slot_key, page_type, source_type, source_board_key, source_board_keys_json, selection_mode, item_limit,
                  section_title, cta_label, cta_target, mobile_behavior, visibility_rule, role_target, enabled, status, priority, sort_order)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                $row['slot_key'],
                $row['page_type'],
                $row['source_type'],
                $row['source_board_key'],
                $row['source_board_keys_json'],
                $row['selection_mode'],
                $row['item_limit'],
                $row['section_title'],
                $row['cta_label'],
                $row['cta_target'],
                $row['mobile_behavior'],
                $row['visibility_rule'],
                $row['role_target'],
                $row['enabled'],
                $row['status'],
                $row['priority'],
                $row['sort_order'],
            ]);
            $inserted++;
        }

        return "inserted={$inserted}";
    }

    /** @return list<array<string, mixed>> */
    private function operationalPostRows(): array
    {
        return [
            [
                'board_key' => 'notice',
                'post_key' => 'notice-001',
                'author_role' => 'system',
                'status' => 'published',
                'title' => '고객센터·안전과외 가이드 1차 오픈 (프리뷰)',
                'description' => '',
                'category_id' => 'general',
                'meta_json' => json_encode([
                    'body' => [
                        '고객센터 좌측 메뉴·게시판형 FAQ/공지·안전과외 아코디언 UI를 프리뷰에 반영했습니다.',
                        '1차는 정적 콘텐츠이며, 후순위에 관리자 게시판 연동 예정입니다.',
                    ],
                    'displayDate' => '2026-07-01',
                    'pinned' => true,
                ], JSON_UNESCAPED_UNICODE),
                'created_at' => '2026-07-01 00:00:00',
            ],
            [
                'board_key' => 'notice',
                'post_key' => 'notice-002',
                'author_role' => 'system',
                'status' => 'published',
                'title' => '쪽지함 프리뷰(16a) 안내',
                'description' => '',
                'category_id' => 'general',
                'meta_json' => json_encode([
                    'body' => [
                        '회원 간 공식 접촉은 쪽지함(16장)을 이용합니다.',
                        '운영 문의는 고객센터 운영 문의 채널과 별도입니다.',
                    ],
                    'displayDate' => '2026-06-15',
                ], JSON_UNESCAPED_UNICODE),
                'created_at' => '2026-06-15 00:00:00',
            ],
            [
                'board_key' => 'faq',
                'post_key' => 'faq-1',
                'author_role' => 'system',
                'status' => 'published',
                'title' => '회원끼리 연락은 어떻게 하나요?',
                'description' => '회원 간 공식 접촉은 **쪽지(16장)** 입니다. 플랫폼 전화·이메일 중계는 없습니다.',
                'category_id' => 'contact',
                'meta_json' => json_encode(['answer' => '회원 간 공식 접촉은 **쪽지(16장)** 입니다. 플랫폼 전화·이메일 중계는 없습니다.', 'sortOrder' => 10], JSON_UNESCAPED_UNICODE),
                'created_at' => date('Y-m-d H:i:s'),
            ],
            [
                'board_key' => 'faq',
                'post_key' => 'faq-2',
                'author_role' => 'system',
                'status' => 'published',
                'title' => '운영·서비스 문의는 어디로 하나요?',
                'description' => '**고객센터 운영 문의(P17-07)** — 이메일/문의 폼을 이용합니다. 쪽지함과는 별개입니다.',
                'category_id' => 'support',
                'meta_json' => json_encode(['answer' => '**고객센터 운영 문의(P17-07)** — 이메일/문의 폼을 이용합니다. 쪽지함과는 별개입니다.', 'sortOrder' => 20], JSON_UNESCAPED_UNICODE),
                'created_at' => date('Y-m-d H:i:s'),
            ],
            [
                'board_key' => 'faq',
                'post_key' => 'faq-3',
                'author_role' => 'system',
                'status' => 'published',
                'title' => '안전번호나 에스크로가 있나요?',
                'description' => '**없습니다.** 대금·연락 중개·보증은 1차 제공 범위가 아닙니다.',
                'category_id' => 'safety',
                'meta_json' => json_encode(['answer' => '**없습니다.** 대금·연락 중개·보증은 1차 제공 범위가 아닙니다.', 'sortOrder' => 30], JSON_UNESCAPED_UNICODE),
                'created_at' => date('Y-m-d H:i:s'),
            ],
            [
                'board_key' => 'faq',
                'post_key' => 'faq-4',
                'author_role' => 'system',
                'status' => 'published',
                'title' => '유료 서비스는 학부모가 구매하나요?',
                'description' => '아닙니다. 공급자(공부방·과외)용 Prime/Pick·쪽지권·열람권이며, 학부모 과외비 결제와 무관합니다(15·18장).',
                'category_id' => 'billing',
                'meta_json' => json_encode(['answer' => '아닙니다. 공급자(공부방·과외)용 Prime/Pick·쪽지권·열람권이며, 학부모 과외비 결제와 무관합니다(15·18장).', 'sortOrder' => 40], JSON_UNESCAPED_UNICODE),
                'created_at' => date('Y-m-d H:i:s'),
            ],
            [
                'board_key' => 'faq',
                'post_key' => 'faq-5',
                'author_role' => 'system',
                'status' => 'published',
                'title' => 'Prime/Pick은 무엇인가요?',
                'description' => '동네 노출 **기간형 포지션 상품**입니다. Hot·추천 등 광고배지는 포지션에 종속됩니다(11·18장).',
                'category_id' => 'billing',
                'meta_json' => json_encode(['answer' => '동네 노출 **기간형 포지션 상품**입니다. Hot·추천 등 광고배지는 포지션에 종속됩니다(11·18장).', 'sortOrder' => 50], JSON_UNESCAPED_UNICODE),
                'created_at' => date('Y-m-d H:i:s'),
            ],
            [
                'board_key' => 'faq',
                'post_key' => 'faq-6',
                'author_role' => 'system',
                'status' => 'published',
                'title' => '환불·과외비 분쟁은?',
                'description' => '당사자 간 협의가 우선이며, 플랫폼은 대리 조정하지 않습니다.',
                'category_id' => 'dispute',
                'meta_json' => json_encode(['answer' => '당사자 간 협의가 우선이며, 플랫폼은 대리 조정하지 않습니다.', 'sortOrder' => 60], JSON_UNESCAPED_UNICODE),
                'created_at' => date('Y-m-d H:i:s'),
            ],
            ...$this->guidePostRows(),
        ];
    }

    /** @return list<array<string, mixed>> */
    private function guidePostRows(): array
    {
        $guides = [
            ['safe-what', '안전과외란? — 우동공과에서의 의미', 'primary', '전체', [
                '안전과외는 결제 보장 상품이 아니라, **선입금 주의·분쟁 예방·당사자 책임**을 설명하는 교육형 가이드입니다.',
                '우동공과는 과외·공부방 **매칭을 대신하지 않으며**, 탐색·비교·연락은 회원 주도로 이루어집니다.',
                '플랫폼은 에스크로·안전번호·전화 중계를 제공하지 않습니다.',
            ], null],
            ['prepay', '선입금·전액선불 주의', 'primary', '학부모', [
                '장기·고액 선입금은 신중히 결정하세요.',
                '영수증·환불 조건은 **당사자 간 문서화**를 권장합니다.',
                '우동공과는 대금을 보관하거나 지급하지 않습니다.',
            ], null],
            ['first-meeting', '첫 연락·시범 수업 · 쪽지 활용', 'primary', '전체', [
                '회원 간 **공식 접촉**은 쪽지(16장)를 사용합니다.',
                '시범 수업·일정·조건은 쪽지로 먼저 확인한 뒤, 연락처 교환 여부는 당사자가 판단합니다.',
                '플랫폼이 전화·이메일을 대신 전달하지 않습니다.',
            ], null],
            ['dispute', '분쟁이 생기면 — 플랫폼 역할과 한계', 'primary', '전체', [
                '과외비·환불 등 분쟁은 **당사자 간 협의**가 우선입니다.',
                '우동공과는 법률 자문·분쟁 대리 조정을 하지 않습니다.',
                '필요 시 소비자원·관할 기관 등 외부 절차를 안내합니다.',
            ], null],
            ['provider-check', '공급자(공부방·과외) 체크리스트', 'secondary', '공급자', [
                '등록·노출·접촉 권한은 **13·16·20·21장** 정책을 따릅니다. 아래 항목을 주기적으로 점검하세요.',
                '플랫폼은 제출자료의 사실을 검증·보증하지 않습니다 — **공개 상태를 스스로 관리**합니다(22장).',
            ], [
                ['label' => '프로필·등록 정보 최신 여부', 'hint' => '공부방명·과목·지역·소개글이 실제와 일치하는지'],
                ['label' => '제출자료·공개 상태 확인', 'hint' => '마이페이지 P15-10 · 상세에서 학부모가 볼 수 있는 범위'],
                ['label' => '상담 수용 표지판(inquiry_status)', 'hint' => '공부방은 20장 — 수용/일시중지 등 표지판 유지'],
                ['label' => '쪽지·접촉 권한 이해', 'hint' => '학부모 선연락·답장 free · 학생 콜드 메모만 유료(16§1-2)'],
                ['label' => 'Prime/Pick 의미', 'hint' => '노출·슬롯 상품 — 매칭·성과 보장 아님(11·18장 FAQ)'],
                ['label' => '대금·선입금', 'hint' => '과외비는 당사자 합의 · 에스크로·지급 중개 없음(G2)'],
            ]],
            ['parent-check', '학부모·학생 의뢰 체크리스트', 'secondary', '학부모', [
                '탐색·비교·접촉은 **회원 주도**입니다. 플랫폼이 후보를 추천하거나 대금을 보관하지 않습니다.',
                '학생 정보는 **필요한 범위만** 공개하세요(19장 · 블라인드 원칙).',
            ], [
                ['label' => '학생 공개 범위·블라인드', 'hint' => '등록·수정 시 공개 필드 · 표시명 확인'],
                ['label' => '찜·비교 후 접촉', 'hint' => '후보를 좁힌 뒤 쪽지로 공식 접촉 시작(16장)'],
                ['label' => '공급자 제출자료 직접 비교', 'hint' => '제출자료·공개 상태는 본인이 확인 — 플랫폼 비보증(22장)'],
                ['label' => '선입금·고액 선불', 'hint' => '결정 전 G2 가이드 · 환불 조건은 쪽지·문서로'],
                ['label' => '시범·일정·조건', 'hint' => '첫 연락은 쪽지(G3) · 연락처 교환은 당사자 판단'],
                ['label' => '분쟁 발생 시', 'hint' => '당사자 협의 우선 · 플랫폼 법률·분쟁 대리 없음(G4)'],
            ]],
            ['privacy', '연락처·개인정보 — 쪽지 밖 자율 교환', 'secondary', '전체', [
                '우동공과는 **안전번호·대리 통화·이메일 중계**를 제공하지 않습니다(6·14장).',
                '쪽지 밖 연락처 교환은 **회원 간 자율**이며, 플랫폼은 내용·분쟁에 관여하지 않습니다.',
            ], [
                ['label' => '공식 접촉 = 쪽지', 'hint' => '회원 ↔ 회원 · 플랫폼 전화·메일 노출 없음(16장)'],
                ['label' => '안전번호 없음', 'hint' => '번호 중계·녹취·대리 통화 미제공'],
                ['label' => '연락처·카톡 교환', 'hint' => '충분히 조건 확인 후 당사자가 판단 · 플랫폼 비관여'],
                ['label' => '개인정보 최소 공유', 'hint' => '필요한 범위만 · 학생 민감정보 보수적 공개'],
                ['label' => '운영 문의와 구분', 'hint' => '버그·정책·계정 = P17-07 티켓 · 회원 간 분쟁 ≠ 운영 CS'],
                ['label' => '신고·차단', 'hint' => '쪽지함·상세에서 사후 조치(16·22장) — 사전 심사 없음'],
            ]],
        ];

        $rows = [];
        foreach ($guides as [$slug, $title, $priority, $audience, $body, $checklist]) {
            $meta = [
                'slug' => $slug,
                'priority' => $priority,
                'audience' => $audience,
                'body' => $body,
            ];
            if ($checklist !== null) {
                $meta['checklist'] = $checklist;
            }
            $rows[] = [
                'board_key' => 'safe-guide',
                'post_key' => $slug,
                'author_role' => 'system',
                'status' => 'published',
                'title' => $title,
                'description' => $audience,
                'category_id' => $priority,
                'meta_json' => json_encode($meta, JSON_UNESCAPED_UNICODE),
                'created_at' => date('Y-m-d H:i:s'),
            ];
        }

        return $rows;
    }

    /** @return list<array<string, mixed>> */
    private function channelRows(): array
    {
        $roles = static fn (array $r): string => json_encode($r, JSON_UNESCAPED_UNICODE);

        return [
            ['board_key' => 'notice', 'menu_label' => '공지사항', 'board_type' => 'operational', 'preset_id' => 'notice', 'section_owner' => 'support', 'route_slug' => '#/support/notice', 'visibility' => 'public', 'download_policy' => 'none', 'allowed_roles_json' => $roles(['admin']), 'allow_write' => 1, 'allow_comment' => 0, 'allow_upload' => 0, 'require_review' => 0, 'is_gnu_separated' => 1, 'enabled' => 1, 'archived' => 0, 'sort_order' => 10],
            ['board_key' => 'faq', 'menu_label' => 'FAQ', 'board_type' => 'operational', 'preset_id' => 'faq', 'section_owner' => 'support', 'route_slug' => '#/support/faq', 'visibility' => 'public', 'download_policy' => 'none', 'allowed_roles_json' => $roles(['admin']), 'allow_write' => 1, 'allow_comment' => 0, 'allow_upload' => 0, 'require_review' => 0, 'is_gnu_separated' => 1, 'enabled' => 1, 'archived' => 0, 'sort_order' => 20],
            ['board_key' => 'safe-guide', 'menu_label' => '안전과외 가이드', 'board_type' => 'operational', 'preset_id' => 'guide', 'section_owner' => 'support', 'route_slug' => '#/support/safe', 'visibility' => 'public', 'download_policy' => 'none', 'allowed_roles_json' => $roles(['admin']), 'allow_write' => 1, 'allow_comment' => 0, 'allow_upload' => 0, 'require_review' => 0, 'is_gnu_separated' => 1, 'enabled' => 1, 'archived' => 0, 'sort_order' => 30],
            ['board_key' => 'policy-log', 'menu_label' => '정책 변경 이력', 'board_type' => 'operational', 'preset_id' => 'guide', 'section_owner' => 'policy', 'route_slug' => '#/policy/changelog', 'visibility' => 'public', 'download_policy' => 'none', 'allowed_roles_json' => $roles(['admin']), 'allow_write' => 1, 'allow_comment' => 0, 'allow_upload' => 0, 'require_review' => 0, 'is_gnu_separated' => 1, 'enabled' => 1, 'archived' => 0, 'sort_order' => 40],
            ['board_key' => 'library', 'menu_label' => '자료실', 'board_type' => 'download', 'preset_id' => 'library', 'section_owner' => 'library', 'route_slug' => '#/library', 'visibility' => 'login', 'download_policy' => 'login', 'allowed_roles_json' => $roles(['admin']), 'allow_write' => 1, 'allow_comment' => 0, 'allow_upload' => 0, 'require_review' => 0, 'is_gnu_separated' => 1, 'enabled' => 1, 'archived' => 0, 'sort_order' => 50],
            ['board_key' => 'library-template', 'menu_label' => '양식·체크리스트', 'board_type' => 'download', 'preset_id' => 'library', 'section_owner' => 'library', 'route_slug' => '#/library/templates', 'visibility' => 'login', 'download_policy' => 'login', 'allowed_roles_json' => $roles(['admin']), 'allow_write' => 1, 'allow_comment' => 0, 'allow_upload' => 0, 'require_review' => 0, 'is_gnu_separated' => 1, 'enabled' => 1, 'archived' => 0, 'sort_order' => 60],
            ['board_key' => 'library-guide-pdf', 'menu_label' => '가이드 PDF', 'board_type' => 'download', 'preset_id' => 'library', 'section_owner' => 'library', 'route_slug' => '#/library/guides', 'visibility' => 'public', 'download_policy' => 'login', 'allowed_roles_json' => $roles(['admin']), 'allow_write' => 1, 'allow_comment' => 0, 'allow_upload' => 0, 'require_review' => 0, 'is_gnu_separated' => 1, 'enabled' => 1, 'archived' => 0, 'sort_order' => 70],
            ['board_key' => 'submission', 'menu_label' => '제출자료', 'board_type' => 'upload', 'preset_id' => 'submission', 'section_owner' => 'mypage', 'route_slug' => '#/mypage/submission-board', 'visibility' => 'role', 'download_policy' => 'none', 'allowed_roles_json' => $roles(['study_room', 'tutor', 'admin']), 'allow_write' => 1, 'allow_comment' => 0, 'allow_upload' => 1, 'require_review' => 0, 'is_gnu_separated' => 1, 'enabled' => 1, 'archived' => 0, 'sort_order' => 80],
            ['board_key' => 'showcase', 'menu_label' => '사례 공유', 'board_type' => 'curation', 'preset_id' => 'curation', 'section_owner' => 'community', 'route_slug' => '', 'visibility' => 'role', 'download_policy' => 'none', 'allowed_roles_json' => $roles(['admin']), 'allow_write' => 0, 'allow_comment' => 0, 'allow_upload' => 0, 'require_review' => 1, 'is_gnu_separated' => 1, 'enabled' => 0, 'archived' => 0, 'sort_order' => 90],
        ];
    }

    /** @return list<array<string, mixed>> */
    private function railRows(): array
    {
        $keys = static fn (array $k): string => json_encode($k, JSON_UNESCAPED_UNICODE);

        return [
            ['slot_key' => 'home_right_rail', 'page_type' => 'home', 'source_type' => 'mixed', 'source_board_key' => 'notice', 'source_board_keys_json' => $keys(['notice', 'library', 'safe-guide']), 'selection_mode' => 'curated', 'item_limit' => 3, 'section_title' => '오늘의 안내', 'cta_label' => '고객센터 보기', 'cta_target' => '#/support', 'mobile_behavior' => 'stack', 'visibility_rule' => 'public', 'role_target' => 'all', 'enabled' => 1, 'status' => 'active', 'priority' => 10, 'sort_order' => 10],
            ['slot_key' => 'search_right_rail', 'page_type' => 'search', 'source_type' => 'mixed', 'source_board_key' => 'faq', 'source_board_keys_json' => $keys(['faq', 'library-template', 'safe-guide']), 'selection_mode' => 'curated', 'item_limit' => 3, 'section_title' => '탐색 도움말', 'cta_label' => 'FAQ 보기', 'cta_target' => '#/support/faq', 'mobile_behavior' => 'stack', 'visibility_rule' => 'public', 'role_target' => 'all', 'enabled' => 1, 'status' => 'active', 'priority' => 20, 'sort_order' => 20],
            ['slot_key' => 'detail_right_rail', 'page_type' => 'detail', 'source_type' => 'mixed', 'source_board_key' => 'safe-guide', 'source_board_keys_json' => $keys(['safe-guide', 'submission', 'notice']), 'selection_mode' => 'curated', 'item_limit' => 3, 'section_title' => '상세 확인 전 안내', 'cta_label' => '안전과외 가이드', 'cta_target' => '#/support/safe', 'mobile_behavior' => 'collapse', 'visibility_rule' => 'public', 'role_target' => 'all', 'enabled' => 1, 'status' => 'active', 'priority' => 30, 'sort_order' => 30],
            ['slot_key' => 'register_right_rail', 'page_type' => 'register', 'source_type' => 'mixed', 'source_board_key' => 'library-template', 'source_board_keys_json' => $keys(['library-template', 'faq', 'safe-guide']), 'selection_mode' => 'curated', 'item_limit' => 3, 'section_title' => '작성 전 체크', 'cta_label' => '서식함 보기', 'cta_target' => '#/library/templates', 'mobile_behavior' => 'stack', 'visibility_rule' => 'login', 'role_target' => 'provider', 'enabled' => 1, 'status' => 'active', 'priority' => 40, 'sort_order' => 40],
            ['slot_key' => 'plans_right_rail', 'page_type' => 'plans', 'source_type' => 'mixed', 'source_board_key' => 'notice', 'source_board_keys_json' => $keys(['notice', 'faq', 'safe-guide']), 'selection_mode' => 'curated', 'item_limit' => 3, 'section_title' => '상품 이용 안내', 'cta_label' => '상품 FAQ', 'cta_target' => '#/support/faq', 'mobile_behavior' => 'collapse', 'visibility_rule' => 'public', 'role_target' => 'provider', 'enabled' => 1, 'status' => 'active', 'priority' => 50, 'sort_order' => 50],
            ['slot_key' => 'support_right_rail', 'page_type' => 'support', 'source_type' => 'mixed', 'source_board_key' => 'notice', 'source_board_keys_json' => $keys(['notice', 'faq', 'library-guide-pdf']), 'selection_mode' => 'latest', 'item_limit' => 3, 'section_title' => '빠른 도움말', 'cta_label' => '자료실 보기', 'cta_target' => '#/library/guides', 'mobile_behavior' => 'stack', 'visibility_rule' => 'public', 'role_target' => 'all', 'enabled' => 1, 'status' => 'active', 'priority' => 60, 'sort_order' => 60],
        ];
    }
}
