<?php

declare(strict_types=1);

namespace Study114\Board;

use InvalidArgumentException;
use PDO;
use Study114\Database\Connection;
use Study114\Paid\PaidProviderGate;

/**
 * 서버 저장 정보 게시판. 서버 저장만 담당한다.
 * - 「공부방 쏙쏙정보」(info-room) · 「과외쌤 따끈 팁가이드」(info-tutor)
 *   읽기: 공부방·과외쌤·관리자 전체, 게스트 제목만, 학생·member 거절.
 *   쓰기: 관리자 + 유료 공급자(PaidProviderGate). 댓글·반응·신고·첨부 없음.
 * - 「학생 꿀팁 가이드」(info-student)
 *   읽기: 학생·공부방·과외쌤·관리자 전체, 게스트·member 제목만.
 *   쓰기: 학생 + 관리자 + 유료 공급자. 반응은 「응원해요」 하나(계정당 글마다 1회 토글). 댓글·첨부 없음.
 *   연락처·외부 링크 차단, 학생 작성자 이름은 응답 직전에 서버에서 가린다.
 * 수정: 작성자 본인이면서 지금 쓸 수 있는 계정, 관리자. 삭제: 작성자 본인, 관리자.
 */
final class InfoBoardService
{
    /** board_posts.category_id 허용값 */
    public const CATEGORIES = [
        'info-room' => ['know-how', 'recruit', 'admin-tax', 'edu-news'],
        'info-tutor' => ['lesson', 'consult-match', 'contract-tax', 'edu-news'],
        'info-student' => ['study-howto', 'exam-school', 'admission-career', 'habit-mind', 'choose-provider', 'senior-story'],
    ];

    public const TITLE_MAX_LENGTH = 100;
    public const BODY_MAX_LENGTH = 5000;
    public const LIST_LIMIT = 20;

    /** board_post_reactions.kind — 학생 꿀팁 가이드 「응원해요」 */
    public const CHEER_KIND = 'cheer';

    public const BLOCKED_CONTACT_MESSAGE = '연락처·카톡·외부 링크는 올릴 수 없어요. 빼고 다시 올려 주세요.';

    public const STUDENT_AUTHOR_FALLBACK = '학생';

    private const AUTHOR_LABELS = [
        'study_room' => '공부방',
        'tutor' => '과외쌤',
        'admin' => '운영자',
    ];

    private PDO $pdo;
    private BoardPostRepository $repo;
    private ?PaidProviderGate $paidGate;

    /** @var array<int, string> 요청 안에서만 쓰는 작성자 user_id → 가린 표시(원문은 담지 않는다) */
    private array $maskedAuthorCache = [];

    public function __construct(?PDO $pdo = null, ?PaidProviderGate $paidGate = null)
    {
        $this->pdo = $pdo ?? Connection::get();
        $this->repo = new BoardPostRepository($this->pdo);
        $this->paidGate = $paidGate;
    }

    public static function isStudentTipsBoard(string $boardKey): bool
    {
        return BoardChannelAcl::normalizeBoardKey($boardKey) === BoardChannelAcl::STUDENT_TIPS_BOARD_KEY;
    }

    /**
     * 작성자 이름 가리기. 3자 이상 「최진○」(앞 두 글자 + ○), 2자 「최○」, 1자 「○」, 빈 값 ''.
     * 작성자 표시는 authorLabel() 한 곳에서 정하고, 이름이 들어가는 경우는 이 함수만 지난다.
     */
    public static function maskAuthorName(string $name): string
    {
        $name = trim((string) preg_replace('/\s+/u', '', $name));
        if ($name === '') {
            return '';
        }
        $chars = preg_split('//u', $name, -1, PREG_SPLIT_NO_EMPTY) ?: [];
        $n = count($chars);
        if ($n <= 1) {
            return '○';
        }
        if ($n === 2) {
            return $chars[0] . '○';
        }

        return $chars[0] . $chars[1] . '○';
    }

    /**
     * 연락처·외부 링크 판정. 걸리면 사유 키, 아니면 null.
     * NeighborhoodGreetingService::validate 의 연락처 패턴 + 이메일·텔레그램.
     */
    public static function findBlockedContact(string $text): ?string
    {
        if ($text === '') {
            return null;
        }
        if (preg_match('/카카오|카톡|오픈채팅|오픈톡|kakao|텔레그램|telegram/iu', $text)) {
            return 'messenger';
        }
        if (preg_match('/https?:\/\/|www\./iu', $text)) {
            return 'url';
        }
        if (preg_match('/\b[\w-]+\.(com|kr|net|me|io|co|org|ly|link|site)\b/iu', $text)) {
            return 'domain';
        }
        if (preg_match('/[\w.+-]+@[\w-]+(\.[\w-]+)+/u', $text)) {
            return 'email';
        }
        $compact = (string) preg_replace('/[\s().\-]/u', '', $text);
        if (preg_match('/01[016789]\d{7,8}/', $compact) || preg_match('/0(?:2|[3-6]\d)\d{7,8}/', $compact)) {
            return 'phone';
        }

        return null;
    }

    public static function isInfoBoard(string $boardKey): bool
    {
        return BoardChannelAcl::isInfoBoard($boardKey);
    }

    /**
     * GET 쿼리 → 목록 조건. 분류가 그 게시판 허용값 밖이면 422.
     *
     * @return array{category: string|null, limit: int, offset: int}
     */
    public static function parseListQuery(string $boardKey, ?string $category, ?string $limit, ?string $offset): array
    {
        $boardKey = self::assertInfoBoard($boardKey);
        $category = ($category === null || $category === '' || $category === 'all')
            ? null
            : self::assertCategory($boardKey, $category);
        $limitN = ($limit === null || $limit === '') ? self::LIST_LIMIT : (int) $limit;

        return [
            'category' => $category,
            'limit' => max(1, min($limitN, self::LIST_LIMIT)),
            'offset' => ($offset === null || $offset === '') ? 0 : max(0, (int) $offset),
        ];
    }

    /**
     * 목록 한 페이지(최신순) 또는 글 하나($postKey).
     *
     * @param array{category: string|null, limit: int, offset: int}|null $query
     * @return array<string, mixed>
     */
    public function list(string $boardKey, ?array $auth, ?string $postKey = null, ?array $query = null): array
    {
        $boardKey = self::assertInfoBoard($boardKey);
        $boardRole = self::boardRole($auth);
        $access = BoardChannelAcl::accessKind($boardKey, $boardRole);
        if ($access === 'blocked') {
            throw new BoardAccessException(
                $auth === null ? 401 : 403,
                $auth === null ? 'unauthorized' : 'forbidden',
                $auth === null ? '로그인이 필요합니다.' : '볼 수 없는 게시판이에요.',
            );
        }
        $titlesOnly = $access !== 'full';

        if ($postKey !== null && $postKey !== '') {
            $row = $this->repo->findByKey($boardKey, $postKey);
            if ($row === null || (string) ($row['status'] ?? '') !== 'published') {
                throw new BoardAccessException(404, 'not_found', '글을 찾을 수 없습니다.');
            }

            $cheers = $titlesOnly ? [] : $this->cheerStateFor($boardKey, [$row], $auth);

            return [
                'access' => $access,
                'boardKey' => $boardKey,
                'post' => $titlesOnly ? $this->mapTitle($row) : $this->mapFull($row, $auth, $cheers),
            ];
        }

        $query ??= self::parseListQuery($boardKey, null, null, null);
        $category = $query['category'];
        $limit = max(1, min((int) $query['limit'], self::LIST_LIMIT));
        $offset = max(0, (int) $query['offset']);

        $where = "board_key = ? AND status = 'published'";
        $params = [$boardKey];
        if ($category !== null) {
            $where .= ' AND category_id = ?';
            $params[] = self::assertCategory($boardKey, $category);
        }

        $count = $this->pdo->prepare("SELECT COUNT(*) FROM board_posts WHERE {$where}");
        $count->execute($params);
        $total = (int) $count->fetchColumn();

        $stmt = $this->pdo->prepare(
            "SELECT id, board_key, post_key, author_user_id, author_role, status,
                    title, description, category_id, meta_json, created_at, updated_at
             FROM board_posts
             WHERE {$where}
             ORDER BY created_at DESC, id DESC
             LIMIT {$limit} OFFSET {$offset}"
        );
        $stmt->execute($params);
        $rows = $stmt->fetchAll();
        $cheers = $titlesOnly ? [] : $this->cheerStateFor($boardKey, $rows, $auth);

        $posts = array_map(
            fn (array $row): array => $titlesOnly ? $this->mapTitle($row) : $this->mapFull($row, $auth, $cheers),
            $rows,
        );

        return [
            'access' => $access,
            'boardKey' => $boardKey,
            'posts' => $posts,
            'total' => $total,
            'limit' => $limit,
            'offset' => $offset,
            'category' => $category,
            'hasMore' => $offset + count($posts) < $total,
            'canCompose' => !$titlesOnly && $this->canWrite($boardKey, $auth),
        ];
    }

    /**
     * 새 글(post_key 없음) 또는 본인 글 수정. 작성자·역할은 세션에서만 정한다.
     *
     * @param array<string, mixed> $input
     * @return array<string, mixed>
     */
    public function save(array $input, ?array $auth): array
    {
        $boardKey = self::assertInfoBoard(trim((string) ($input['board_key'] ?? $input['boardKey'] ?? '')));
        $userId = self::sessionUserId($auth);
        if ($auth === null || $userId <= 0) {
            throw new BoardAccessException(401, 'unauthorized', '로그인이 필요합니다.');
        }
        if (!$this->canWrite($boardKey, $auth)) {
            throw new BoardAccessException(
                403,
                'forbidden',
                BoardChannelAcl::canCompose($boardKey, self::boardRole($auth))
                    ? (self::isStudentTipsBoard($boardKey)
                        ? '공부방·과외쌤 글쓰기는 픽·프라임 이용 중에 할 수 있어요. 학생 계정은 바로 쓸 수 있어요.'
                        : '글쓰기는 픽·프라임을 이용 중인 공부방·과외쌤이 할 수 있어요.')
                    : '이 게시판에 글을 쓸 권한이 없습니다.',
            );
        }

        $title = self::sanitize(trim((string) ($input['title'] ?? '')));
        if ($title === '') {
            throw new InvalidArgumentException('제목이 필요합니다.');
        }
        if (mb_strlen($title) > self::TITLE_MAX_LENGTH) {
            throw new InvalidArgumentException('제목은 ' . self::TITLE_MAX_LENGTH . '자 이내로 입력해 주세요.');
        }
        $body = self::sanitize(str_replace(["\r\n", "\r"], "\n", trim((string) ($input['body'] ?? $input['description'] ?? ''))));
        if ($body === '') {
            throw new InvalidArgumentException('본문이 필요합니다.');
        }
        if (mb_strlen($body) > self::BODY_MAX_LENGTH) {
            throw new InvalidArgumentException('본문은 ' . self::BODY_MAX_LENGTH . '자 이내로 입력해 주세요.');
        }
        $category = self::assertCategory(
            $boardKey,
            trim((string) ($input['category'] ?? $input['category_id'] ?? $input['categoryId'] ?? '')),
        );
        if (self::isStudentTipsBoard($boardKey)
            && (self::findBlockedContact($title) !== null || self::findBlockedContact($body) !== null)) {
            throw new InvalidArgumentException(self::BLOCKED_CONTACT_MESSAGE);
        }

        $postKey = trim((string) ($input['post_key'] ?? $input['id'] ?? ''));
        $meta = null;
        if ($postKey !== '') {
            $existing = $this->resolveExisting($boardKey, $postKey);
            if (!self::isAdmin($auth) && (int) ($existing['author_user_id'] ?? 0) !== $userId) {
                throw new BoardAccessException(403, 'forbidden', '작성자만 수정할 수 있습니다.');
            }
            $meta = self::decodeMeta($existing);
            $meta['editedAt'] = date('Y-m-d H:i:s');
            $authorRole = (string) $existing['author_role'];
            $authorUserId = (int) ($existing['author_user_id'] ?? 0);
        } else {
            $postKey = $boardKey . '-' . time() . '-' . bin2hex(random_bytes(3));
            $authorRole = self::authorRole($auth);
            $authorUserId = $userId;
        }

        $saved = $this->repo->save(
            $boardKey,
            $postKey,
            $authorRole,
            'published',
            $title,
            $body,
            '',
            $category,
            '',
            $meta,
            $authorUserId,
        );

        return $this->mapFull($saved, $auth, $this->cheerStateFor($boardKey, [$saved], $auth));
    }

    /**
     * 학생 꿀팁 가이드 「응원해요」 토글. 계정당 글마다 1회, board_post_reactions(kind='cheer', comment_id=0).
     * 고민방 반응 API(ConcernService::toggleReaction)는 고민방 글만 받으므로 이 경로와 섞이지 않는다.
     *
     * @return array{postKey: string, cheered: bool, cheerCount: int}
     */
    public function toggleCheer(string $boardKey, string $postKey, ?array $auth): array
    {
        $boardKey = self::assertInfoBoard($boardKey);
        $userId = self::sessionUserId($auth);
        if ($auth === null || $userId <= 0) {
            throw new BoardAccessException(401, 'unauthorized', '로그인하면 응원할 수 있어요.');
        }
        if (!self::isStudentTipsBoard($boardKey) || !BoardChannelAcl::canReact($boardKey, self::boardRole($auth))) {
            throw new BoardAccessException(403, 'forbidden', '이 게시판에서는 응원할 수 없어요.');
        }
        $postKey = trim($postKey);
        if ($postKey === '') {
            throw new InvalidArgumentException('post_key가 필요합니다.');
        }
        $row = $this->resolveExisting($boardKey, $postKey);
        $postId = (int) ($row['id'] ?? 0);
        if ($postId <= 0) {
            throw new BoardAccessException(404, 'not_found', '글을 찾을 수 없습니다.');
        }

        $reactions = new ConcernReactionRepository($this->pdo);
        $existing = $reactions->findExisting($postId, null, $userId);
        if ($existing !== null && (string) ($existing['kind'] ?? '') === self::CHEER_KIND) {
            $reactions->delete((int) $existing['id']);
        } elseif ($existing !== null) {
            $reactions->updateKind((int) $existing['id'], self::CHEER_KIND);
        } else {
            $reactions->insert($postId, null, $userId, self::CHEER_KIND);
        }

        $state = $this->cheerStateFor($boardKey, [$row], $auth);

        return [
            'postKey' => (string) $row['post_key'],
            'cheered' => (bool) ($state['mine'][$postId] ?? false),
            'cheerCount' => (int) ($state['counts'][$postId] ?? 0),
        ];
    }

    /** 작성자 본인(유료가 끝났어도)·관리자. 논리 삭제(status='deleted'). */
    public function delete(string $boardKey, string $postKey, ?array $auth): void
    {
        $boardKey = self::assertInfoBoard($boardKey);
        $userId = self::sessionUserId($auth);
        if ($auth === null || $userId <= 0) {
            throw new BoardAccessException(401, 'unauthorized', '로그인이 필요합니다.');
        }
        if (!BoardChannelAcl::canDelete($boardKey, self::boardRole($auth))) {
            throw new BoardAccessException(403, 'forbidden', '이 게시판에서 삭제할 권한이 없습니다.');
        }
        $existing = $this->resolveExisting($boardKey, $postKey);
        if (!self::isAdmin($auth) && (int) ($existing['author_user_id'] ?? 0) !== $userId) {
            throw new BoardAccessException(403, 'forbidden', '작성자만 삭제할 수 있습니다.');
        }

        $this->repo->updateAdminReview($boardKey, (string) $existing['post_key'], 'deleted', null);
    }

    /** 관리자는 게이트 없이, 학생은 학생 꿀팁 가이드에서 그대로, 공부방·과외쌤은 PaidProviderGate 가 참일 때만. */
    public function canWrite(string $boardKey, ?array $auth): bool
    {
        if ($auth === null || !BoardChannelAcl::canCompose($boardKey, self::boardRole($auth))) {
            return false;
        }
        if (self::isAdmin($auth)) {
            return true;
        }
        if (self::boardRole($auth) === 'demand') {
            return self::isStudentTipsBoard($boardKey) && self::sessionUserId($auth) > 0;
        }
        $userId = self::sessionUserId($auth);

        return $userId > 0 && $this->gate()->isPaidProvider($userId);
    }

    private function gate(): PaidProviderGate
    {
        return $this->paidGate ??= new PaidProviderGate($this->pdo);
    }

    /**
     * post_key 로 기존 글을 찾고, 요청 게시판과 실제 게시판이 다르면 거절한다.
     *
     * @return array<string, mixed>
     */
    private function resolveExisting(string $boardKey, string $postKey): array
    {
        $rows = $this->repo->findAllByPostKey($postKey);
        if ($rows === []) {
            throw new BoardAccessException(404, 'not_found', '글을 찾을 수 없습니다.');
        }
        if (count($rows) > 1) {
            throw new BoardAccessException(409, 'conflict', '동일한 post_key가 여러 채널에 있습니다.');
        }
        $row = $rows[0];
        if (BoardChannelAcl::normalizeBoardKey((string) $row['board_key']) !== $boardKey) {
            throw new BoardAccessException(403, 'forbidden', '요청 게시판과 실제 게시글 채널이 다릅니다.');
        }
        if ((string) ($row['status'] ?? '') !== 'published') {
            throw new BoardAccessException(404, 'not_found', '글을 찾을 수 없습니다.');
        }

        return $row;
    }

    /**
     * 게스트용. 제목·분류·작성일·id 만.
     *
     * @param array<string, mixed> $row
     * @return array<string, string>
     */
    private function mapTitle(array $row): array
    {
        return [
            'id' => (string) $row['post_key'],
            'title' => (string) $row['title'],
            'categoryId' => (string) ($row['category_id'] ?? ''),
            'createdAt' => self::isoTime((string) $row['created_at']),
        ];
    }

    /**
     * 읽기 권한자용. 작성자는 authorLabel() 표시만(이름 원문·계정 id 없음).
     *
     * @param array<string, mixed> $row
     * @param array{counts?: array<int, int>, mine?: array<int, bool>} $cheers
     * @return array<string, mixed>
     */
    private function mapFull(array $row, ?array $auth, array $cheers = []): array
    {
        $meta = self::decodeMeta($row);
        $editedAt = isset($meta['editedAt']) ? (string) $meta['editedAt'] : '';
        $userId = self::sessionUserId($auth);
        $isMine = $userId > 0 && (int) ($row['author_user_id'] ?? 0) === $userId;
        $isAdmin = self::isAdmin($auth);
        $boardKey = (string) $row['board_key'];

        $item = $this->mapTitle($row) + [
            'body' => (string) ($row['description'] ?? ''),
            'authorLabel' => $this->authorLabel($row),
            'updatedAt' => $editedAt !== '' ? self::isoTime($editedAt) : self::isoTime((string) $row['created_at']),
            'edited' => $editedAt !== '',
            'canEdit' => $isAdmin || ($isMine && $this->canWrite($boardKey, $auth)),
            'canDelete' => $isAdmin || $isMine,
        ];
        if (self::isStudentTipsBoard($boardKey)) {
            $postId = (int) ($row['id'] ?? 0);
            $item['cheerCount'] = (int) ($cheers['counts'][$postId] ?? 0);
            $item['cheered'] = (bool) ($cheers['mine'][$postId] ?? false);
            $item['canCheer'] = $auth !== null && BoardChannelAcl::canReact($boardKey, self::boardRole($auth));
        }

        return $item;
    }

    /**
     * 작성자 표시 한 곳. 공부방·과외쌤·운영자는 정보 게시판 공통 역할 라벨(이름 없음),
     * 학생(author_role=parent)은 students.student_name 을 응답 직전에 maskAuthorName() 으로 가린다.
     *
     * @param array<string, mixed> $row
     */
    private function authorLabel(array $row): string
    {
        $role = (string) ($row['author_role'] ?? '');
        if ($role !== 'parent') {
            return self::AUTHOR_LABELS[$role] ?? '';
        }
        $authorId = (int) ($row['author_user_id'] ?? 0);
        if ($authorId <= 0) {
            return self::STUDENT_AUTHOR_FALLBACK;
        }
        if (!array_key_exists($authorId, $this->maskedAuthorCache)) {
            $masked = self::maskAuthorName($this->studentNameOf($authorId));
            $this->maskedAuthorCache[$authorId] = $masked !== '' ? $masked : self::STUDENT_AUTHOR_FALLBACK;
        }

        return $this->maskedAuthorCache[$authorId];
    }

    /** 학생 계정(1계정 = 학생 1명)의 이름 원문. 이 값은 응답에 싣지 않고 maskAuthorName() 에만 넘긴다. */
    private function studentNameOf(int $userId): string
    {
        $stmt = $this->pdo->prepare(
            'SELECT student_name FROM students WHERE guardian_user_id = ? ORDER BY id ASC LIMIT 1'
        );
        $stmt->execute([$userId]);
        $val = $stmt->fetchColumn();

        return is_string($val) ? trim($val) : '';
    }

    /**
     * 학생 꿀팁 가이드 글들의 「응원해요」 수와 내 응원 여부. 다른 게시판은 빈 배열.
     *
     * @param list<array<string, mixed>> $rows
     * @return array{counts: array<int, int>, mine: array<int, bool>}
     */
    private function cheerStateFor(string $boardKey, array $rows, ?array $auth): array
    {
        $state = ['counts' => [], 'mine' => []];
        if (!self::isStudentTipsBoard($boardKey)) {
            return $state;
        }
        $ids = array_values(array_filter(array_map(static fn (array $r): int => (int) ($r['id'] ?? 0), $rows)));
        if ($ids === []) {
            return $state;
        }
        $ph = implode(',', array_fill(0, count($ids), '?'));
        $stmt = $this->pdo->prepare(
            "SELECT post_id, COUNT(*) AS cnt FROM board_post_reactions
             WHERE post_id IN ({$ph}) AND comment_id = 0 AND kind = 'cheer'
             GROUP BY post_id"
        );
        $stmt->execute($ids);
        foreach ($stmt->fetchAll() as $r) {
            $state['counts'][(int) $r['post_id']] = (int) $r['cnt'];
        }
        $userId = self::sessionUserId($auth);
        if ($userId > 0) {
            $mine = $this->pdo->prepare(
                "SELECT post_id FROM board_post_reactions
                 WHERE post_id IN ({$ph}) AND comment_id = 0 AND kind = 'cheer' AND user_id = ?"
            );
            $mine->execute([...$ids, $userId]);
            foreach ($mine->fetchAll() as $r) {
                $state['mine'][(int) $r['post_id']] = true;
            }
        }

        return $state;
    }

    private static function assertInfoBoard(string $boardKey): string
    {
        $key = BoardChannelAcl::normalizeBoardKey($boardKey);
        if (!BoardChannelAcl::isInfoBoard($key)) {
            throw new InvalidArgumentException('정보 게시판이 아닙니다.');
        }

        return $key;
    }

    private static function assertCategory(string $boardKey, string $category): string
    {
        $category = trim($category);
        if (!in_array($category, self::CATEGORIES[$boardKey] ?? [], true)) {
            throw new InvalidArgumentException('글 분류를 골라 주세요.');
        }

        return $category;
    }

    private static function isAdmin(?array $auth): bool
    {
        return $auth !== null && (($auth['role_type'] ?? '') === 'admin' || !empty($auth['admin_level']));
    }

    private static function boardRole(?array $auth): string
    {
        return self::isAdmin($auth) ? 'admin' : BoardChannelAcl::boardRoleFromAuth($auth);
    }

    private static function sessionUserId(?array $auth): int
    {
        return $auth === null ? 0 : (int) ($auth['user_id'] ?? 0);
    }

    /** board_posts.author_role — 세션 역할. canWrite 를 통과한 세션만 온다. */
    private static function authorRole(array $auth): string
    {
        return match ((string) ($auth['role_type'] ?? '')) {
            'study_room_owner', 'study_room' => 'study_room',
            'tutor' => 'tutor',
            'guardian_student', 'parent', 'student' => 'parent',
            default => 'admin',
        };
    }

    /** @return array<string, mixed> */
    private static function decodeMeta(array $row): array
    {
        $meta = json_decode((string) ($row['meta_json'] ?? ''), true);

        return is_array($meta) ? $meta : [];
    }

    private static function isoTime(string $value): string
    {
        $value = substr(trim($value), 0, 19);

        return $value === '' ? '' : str_replace(' ', 'T', $value);
    }

    /**
     * ConcernService::sanitize 와 같다 — 제어문자·널바이트 제거, 줄바꿈·탭 유지.
     * HTML 은 저장 그대로 두고 화면 출력에서 이스케이프한다.
     */
    private static function sanitize(string $value): string
    {
        return (string) preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value);
    }
}
