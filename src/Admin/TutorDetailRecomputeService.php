<?php

declare(strict_types=1);

namespace Study114\Admin;

use Study114\Database\Connection;
use Study114\Tutor\TutorDetailCompletionEvaluator;

/**
 * tutors.detail_completion_status 전수 재계산.
 * 상태를 임의로 expanded_complete 로 올리지 않고, 필드 SSOT 로만 반영한다.
 */
final class TutorDetailRecomputeService
{
    /**
     * @return array{
     *   ok: bool,
     *   action: string,
     *   result: array<string, mixed>
     * }
     */
    public function apply(): array
    {
        $pdo = Connection::get();
        $evaluator = new TutorDetailCompletionEvaluator();
        $result = $evaluator->recomputeAll($pdo);

        return [
            'ok' => true,
            'action' => 'recompute_tutor_detail_completion',
            'result' => $result,
        ];
    }

    /** @return array{tutors_total: int, by_status: array<string, int>} */
    public function status(): array
    {
        $pdo = Connection::get();
        $total = (int) $pdo->query('SELECT COUNT(*) FROM tutors')->fetchColumn();
        $rows = $pdo->query(
            'SELECT detail_completion_status AS s, COUNT(*) AS n FROM tutors GROUP BY detail_completion_status'
        )->fetchAll();
        $by = [
            'basic_only' => 0,
            'expanded_in_progress' => 0,
            'expanded_complete' => 0,
        ];
        foreach ($rows as $row) {
            $by[(string) $row['s']] = (int) $row['n'];
        }

        return ['tutors_total' => $total, 'by_status' => $by];
    }
}
