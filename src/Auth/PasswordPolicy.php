<?php

declare(strict_types=1);

namespace Study114\Auth;

use InvalidArgumentException;

/** 9장 부록 §16-4 — 비밀번호 정책 (서버 SSOT) */
final class PasswordPolicy
{
    private const MIN_LEN = 8;
    private const MAX_LEN = 14;

    /** @var list<string> */
    private const WEAK_EXACT = [
        '12345678',
        '1234abcd!',
        'qwer1234!',
        'asdf1234!',
        'password1!',
    ];

    /** @var list<string> */
    private const KEYBOARD_FRAGMENTS = [
        'qwerty', 'asdfgh', 'zxcvbn', 'qwer', 'asdf', '123456', 'abcdef',
    ];

    /**
     * @param array{email?: string, name?: string, phone?: string} $context
     */
    public function validate(string $password, string $confirm, array $context = []): void
    {
        if ($password !== $confirm) {
            throw new InvalidArgumentException('비밀번호 확인이 일치하지 않습니다.');
        }

        $len = strlen($password);
        if ($len < self::MIN_LEN || $len > self::MAX_LEN) {
            throw new InvalidArgumentException('비밀번호는 8~14자로 입력해 주세요.');
        }

        if (preg_match('/\s/', $password) === 1) {
            throw new InvalidArgumentException('비밀번호에 공백은 사용할 수 없습니다.');
        }

        if (!preg_match('/[A-Za-z]/', $password)) {
            throw new InvalidArgumentException('비밀번호에 영문을 포함해 주세요.');
        }
        if (!preg_match('/\d/', $password)) {
            throw new InvalidArgumentException('비밀번호에 숫자를 포함해 주세요.');
        }
        if (!preg_match('/[^A-Za-z0-9]/', $password)) {
            throw new InvalidArgumentException('비밀번호에 특수문자를 포함해 주세요.');
        }

        $lower = strtolower($password);
        foreach (self::WEAK_EXACT as $weak) {
            if ($lower === strtolower($weak)) {
                throw new InvalidArgumentException('쉬운 비밀번호는 사용할 수 없습니다.');
            }
        }

        if (preg_match('/(.)\1{3,}/', $password) === 1) {
            throw new InvalidArgumentException('같은 문자를 과도하게 반복한 비밀번호는 사용할 수 없습니다.');
        }

        foreach (self::KEYBOARD_FRAGMENTS as $frag) {
            if (str_contains($lower, $frag)) {
                throw new InvalidArgumentException('쉬운 비밀번호 패턴은 사용할 수 없습니다.');
            }
        }

        if (preg_match('/0123|1234|2345|3456|4567|5678|6789/', $password) === 1) {
            throw new InvalidArgumentException('쉬운 비밀번호 패턴은 사용할 수 없습니다.');
        }

        $email = EmailNormalizer::normalize((string) ($context['email'] ?? ''));
        if ($email !== '' && str_contains($email, '@')) {
            $local = strtolower((string) explode('@', $email)[0]);
            if ($local !== '' && strlen($local) >= 3 && str_contains($lower, $local)) {
                throw new InvalidArgumentException('이메일 아이디를 포함한 비밀번호는 사용할 수 없습니다.');
            }
        }

        $name = trim((string) ($context['name'] ?? ''));
        if ($name !== '' && mb_strlen($name) >= 2) {
            if (mb_stripos($password, $name) !== false) {
                throw new InvalidArgumentException('이름을 포함한 비밀번호는 사용할 수 없습니다.');
            }
        }

        $digits = preg_replace('/\D/', '', (string) ($context['phone'] ?? ''));
        if (is_string($digits) && strlen($digits) >= 4) {
            $tail = substr($digits, -4);
            if ($tail !== '' && str_contains($password, $tail)) {
                throw new InvalidArgumentException('휴대폰 뒤 4자리를 포함한 비밀번호는 사용할 수 없습니다.');
            }
        }
    }
}
