<?php

declare(strict_types=1);

function study114_e(mixed $value): string
{
    return htmlspecialchars((string) ($value ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/** @return array<string, string> */
function study114_role_labels(): array
{
    return [
        'student'    => '학생(학부모)',
        'study_room' => '공부방',
        'tutor'      => '과외쌤',
    ];
}

/** @return array<string, string> */
function study114_role_descriptions(): array
{
    return [
        'student'    => '자녀의 학습 정보를 관리하고, 동네 공부방·과외를 찾아보세요.',
        'study_room' => '우리 동네 공부방을 등록하고 학부모에게 알려보세요.',
        'tutor'      => '과외 선생님으로 프로필을 등록하고 학생을 만나보세요.',
    ];
}

/** @return array<string, string> */
function study114_role_icons(): array
{
    return [
        'student'    => '🎓',
        'study_room' => '📚',
        'tutor'      => '✏️',
    ];
}

function study114_redirect(string $path, int $code = 302): never
{
    header('Location: ' . $path, true, $code);
    exit;
}

/**
 * @param list<array{value: string, label: string}> $options
 * @param string|list<string>|null $selected
 */
function study114_chip_group(string $name, array $options, string|array|null $selected = null, bool $multiple = false): string
{
    $selectedList = is_array($selected) ? $selected : ($selected !== null && $selected !== '' ? [$selected] : []);
    $type = $multiple ? 'checkbox' : 'radio';
    $html = '<div class="chip-group">';
    foreach ($options as $i => $opt) {
        $isOn = in_array($opt['value'], $selectedList, true);
        $req = !$multiple && $i === 0 ? ' required' : '';
        $html .= sprintf(
            '<label class="chip"><input type="%s" name="%s%s" value="%s" class="chip__input"%s%s><span class="chip__label">%s</span></label>',
            $type,
            study114_e($name),
            $multiple ? '[]' : '',
            study114_e($opt['value']),
            $isOn ? ' checked' : '',
            $req,
            study114_e($opt['label'])
        );
    }
    $html .= '</div>';
    return $html;
}

/**
 * @param list<array{id: int|string, label: string}> $options
 */
function study114_select_options(array $options, ?string $selected = null, string $emptyLabel = '선택'): string
{
    $html = '<option value="">' . study114_e($emptyLabel) . '</option>';
    foreach ($options as $opt) {
        $val = (string) $opt['id'];
        $html .= sprintf(
            '<option value="%s"%s>%s</option>',
            study114_e($val),
            $val === (string) $selected ? ' selected' : '',
            study114_e($opt['label'])
        );
    }
    return $html;
}

/** @param array<string, mixed>|null $old */
function study114_old(array|null $old, string $key, mixed $default = ''): mixed
{
    if (!is_array($old) || !array_key_exists($key, $old)) {
        return $default;
    }
    return $old[$key];
}
