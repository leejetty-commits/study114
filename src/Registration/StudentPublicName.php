<?php

declare(strict_types=1);

namespace Study114\Registration;

/**
 * 다른 사람에게 보이는 학생 이름. 가림은 이 함수만 한다.
 * 화면은 여기서 가린 값을 그대로 보여 주고, 원문을 다시 만들지 않는다.
 */
final class StudentPublicName
{
    /**
     * 1자 *, 2자 홍*, 3자 홍*동, 4자 이상은 첫 글자와 끝 글자만 남기고 가운데는 글자 수만큼 *.
     * 빈 값은 빈 문자열. 「학생」은 붙이지 않는다.
     */
    public static function mask(string $name): string
    {
        $name = trim($name);
        if ($name === '') {
            return '';
        }
        $chars = preg_split('//u', $name, -1, PREG_SPLIT_NO_EMPTY) ?: [];
        $n = count($chars);
        if ($n <= 1) {
            return '*';
        }
        if ($n === 2) {
            return $chars[0] . '*';
        }

        return $chars[0] . str_repeat('*', $n - 2) . $chars[$n - 1];
    }
}
