<?php

declare(strict_types=1);

namespace Study114\Board;

use PDO;
use PDOException;
use Study114\Database\Connection;

final class ConcernReactionRepository
{
    /** 반응 종류별 점수 */
    public const SCORE_MAP = [
        'helpful' => 3,
        'empathy' => 2,
        'cheer'   => 1,
    ];

    /** 글 반응 허용 종류 */
    public const POST_KINDS = ['empathy', 'helpful', 'cheer'];

    /** 댓글 반응 허용 종류 */
    public const COMMENT_KINDS = ['helpful'];

    private PDO $pdo;

    public function __construct(?PDO $pdo = null)
    {
        $this->pdo = $pdo ?? Connection::get();
    }

    /** @return array<string, mixed>|null */
    public function findExisting(int $postId, ?int $commentId, int $userId): ?array
    {
        $cid = $commentId ?? 0;
        $stmt = $this->pdo->prepare(
            'SELECT * FROM board_post_reactions
             WHERE post_id = ? AND comment_id = ? AND user_id = ?
             LIMIT 1'
        );
        $stmt->execute([$postId, $cid, $userId]);
        $row = $stmt->fetch();

        return $row !== false ? $row : null;
    }

    public function delete(int $id): void
    {
        $stmt = $this->pdo->prepare('DELETE FROM board_post_reactions WHERE id = ?');
        $stmt->execute([$id]);
    }

    public function updateKind(int $id, string $kind): void
    {
        $stmt = $this->pdo->prepare('UPDATE board_post_reactions SET kind = ?, created_at = NOW() WHERE id = ?');
        $stmt->execute([$kind, $id]);
    }

    /** @return array<string, mixed> */
    public function insert(int $postId, ?int $commentId, int $userId, string $kind): array
    {
        $cid = $commentId ?? 0;
        try {
            $stmt = $this->pdo->prepare(
                'INSERT INTO board_post_reactions (post_id, comment_id, user_id, kind)
                 VALUES (?, ?, ?, ?)'
            );
            $stmt->execute([$postId, $cid, $userId, $kind]);
        } catch (PDOException $e) {
            if (str_contains($e->getMessage(), 'Duplicate entry') || (int) $e->getCode() === 23000) {
                throw new \InvalidArgumentException('이미 반응이 등록되어 있습니다. 새로고침 후 다시 시도해 주세요.');
            }
            throw $e;
        }

        $id = (int) $this->pdo->lastInsertId();
        $stmt2 = $this->pdo->prepare('SELECT * FROM board_post_reactions WHERE id = ? LIMIT 1');
        $stmt2->execute([$id]);

        return $stmt2->fetch();
    }

    /**
     * 글별 반응 집계.
     *
     * @return array{empathy: int, helpful: int, cheer: int, score: int}
     */
    public function aggregateForPost(int $postId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT kind, COUNT(*) AS cnt FROM board_post_reactions
             WHERE post_id = ? AND comment_id = 0
             GROUP BY kind'
        );
        $stmt->execute([$postId]);
        $counts = ['empathy' => 0, 'helpful' => 0, 'cheer' => 0];
        while ($row = $stmt->fetch()) {
            $counts[(string) $row['kind']] = (int) $row['cnt'];
        }
        $score = 0;
        foreach ($counts as $kind => $cnt) {
            $score += $cnt * (self::SCORE_MAP[$kind] ?? 0);
        }
        $counts['score'] = $score;

        return $counts;
    }

    /** @return string|null 사용자가 누른 반응 종류 */
    public function myReactionForPost(int $postId, int $userId): ?string
    {
        $stmt = $this->pdo->prepare(
            'SELECT kind FROM board_post_reactions
             WHERE post_id = ? AND comment_id = 0 AND user_id = ?
             LIMIT 1'
        );
        $stmt->execute([$postId, $userId]);
        $val = $stmt->fetchColumn();

        return is_string($val) ? $val : null;
    }

    /**
     * 댓글별 반응 집계.
     *
     * @return array{helpful: int}
     */
    public function aggregateForComment(int $commentId): array
    {
        $stmt = $this->pdo->prepare(
            'SELECT COUNT(*) FROM board_post_reactions WHERE comment_id = ?'
        );
        $stmt->execute([$commentId]);

        return ['helpful' => (int) $stmt->fetchColumn()];
    }

    /** @return string|null */
    public function myReactionForComment(int $commentId, int $userId): ?string
    {
        $stmt = $this->pdo->prepare(
            'SELECT kind FROM board_post_reactions WHERE comment_id = ? AND user_id = ? LIMIT 1'
        );
        $stmt->execute([$commentId, $userId]);
        $val = $stmt->fetchColumn();

        return is_string($val) ? $val : null;
    }

    /**
     * 여러 글에 대한 반응 집계 (bulk). HOT/BEST 조회용.
     *
     * @param list<int> $postIds
     * @return array<int, array{empathy: int, helpful: int, cheer: int, score: int}>
     */
    public function aggregateForPosts(array $postIds): array
    {
        if ($postIds === []) {
            return [];
        }
        $placeholders = implode(',', array_fill(0, count($postIds), '?'));
        $stmt = $this->pdo->prepare(
            "SELECT post_id, kind, COUNT(*) AS cnt FROM board_post_reactions
             WHERE post_id IN ({$placeholders}) AND comment_id = 0
             GROUP BY post_id, kind"
        );
        $stmt->execute($postIds);
        $result = [];
        foreach ($postIds as $pid) {
            $result[$pid] = ['empathy' => 0, 'helpful' => 0, 'cheer' => 0, 'score' => 0];
        }
        while ($row = $stmt->fetch()) {
            $pid = (int) $row['post_id'];
            $kind = (string) $row['kind'];
            $cnt = (int) $row['cnt'];
            if (isset($result[$pid])) {
                $result[$pid][$kind] = $cnt;
            }
        }
        foreach ($result as $pid => &$agg) {
            $score = 0;
            foreach (['empathy', 'helpful', 'cheer'] as $k) {
                $score += ($agg[$k] ?? 0) * (self::SCORE_MAP[$k] ?? 0);
            }
            $agg['score'] = $score;
        }
        unset($agg);

        return $result;
    }
}
