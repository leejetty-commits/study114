<?php

declare(strict_types=1);

use Study114\Site\SiteFooterCopy;

$company = SiteFooterCopy::company();
$links = SiteFooterCopy::policyLinks();

/**
 * @param list<array{label?: string, valueHtml: string}> $items
 */
$renderRow = static function (array $items): string {
    $parts = array_values(array_filter(
        $items,
        static fn (array $item): bool => trim(strip_tags($item['valueHtml'] ?? '')) !== '',
    ));
    if ($parts === []) {
        return '';
    }
    $html = '<p class="auth-shell__footer-company-row">';
    foreach ($parts as $i => $item) {
        if ($i > 0) {
            $html .= '<span class="auth-shell__footer-company-sep" aria-hidden="true">|</span>';
        }
        $label = isset($item['label']) && $item['label'] !== ''
            ? '<span class="auth-shell__footer-company-label">' . study114_e($item['label']) . '</span> '
            : '';
        $html .= '<span class="auth-shell__footer-company-item">' . $label
            . '<span class="auth-shell__footer-company-value">' . $item['valueHtml'] . '</span></span>';
    }
    $html .= '</p>';
    return $html;
};

$line1 = [];
$line2 = [];

if (trim($company['name']) !== '') {
    $line1[] = ['label' => '상호', 'valueHtml' => study114_e($company['name'])];
}
if (trim($company['ceo']) !== '') {
    $line1[] = ['label' => '대표', 'valueHtml' => study114_e($company['ceo'])];
}
if (trim($company['address']) !== '') {
    $line1[] = ['label' => '주소', 'valueHtml' => study114_e($company['address'])];
}

if (trim($company['bizNo']) !== '') {
    $line2[] = [
        'label' => '사업자등록번호',
        'valueHtml' => study114_e($company['bizNo']),
    ];
}
if (trim($company['mailOrder']) !== '') {
    $line2[] = ['label' => '통신판매업신고', 'valueHtml' => study114_e($company['mailOrder'])];
}
if (trim($company['email']) !== '') {
    $mail = $company['email'];
    $line2[] = [
        'label' => '이메일',
        'valueHtml' => '<a class="auth-shell__footer-mail" href="mailto:' . study114_e($mail) . '">' . study114_e($mail) . '</a>',
    ];
}
if (trim($company['phone']) !== '') {
    $line2[] = ['label' => '전화', 'valueHtml' => study114_e($company['phone'])];
}

$row1 = $renderRow($line1);
$row2 = $renderRow($line2);
?>
<nav class="auth-shell__footer-links" aria-label="정책 및 고객센터">
  <?php foreach ($links as $i => $link): ?>
    <?php if ($i > 0): ?><span class="auth-shell__footer-sep" aria-hidden="true">·</span><?php endif; ?>
    <a href="<?= study114_e($link['href']) ?>"><?= !empty($link['strong']) ? '<strong>' . study114_e($link['label']) . '</strong>' : study114_e($link['label']) ?></a>
  <?php endforeach; ?>
</nav>
<p class="auth-shell__footer-notice"><?= study114_e(SiteFooterCopy::NOTICE) ?></p>
<?php if ($row1 !== '' || $row2 !== ''): ?>
<div class="auth-shell__footer-company">
  <?= $row1 ?>
  <?= $row2 ?>
</div>
<?php endif; ?>
<p class="auth-shell__footer-legal"><?= study114_e(SiteFooterCopy::COPYRIGHT) ?></p>
