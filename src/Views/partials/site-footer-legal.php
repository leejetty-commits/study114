<?php

declare(strict_types=1);

use Study114\Site\SiteFooterCopy;

$company = SiteFooterCopy::company();
$links = SiteFooterCopy::policyLinks();
$items = [];

$push = static function (string $label, string $valueHtml) use (&$items): void {
    if (trim(strip_tags($valueHtml)) === '') {
        return;
    }
    $items[] = ['label' => $label, 'valueHtml' => $valueHtml];
};

$push('상호', study114_e($company['name']));
$push('대표', study114_e($company['ceo']));
$push('주소', study114_e($company['address']));
$bizCheck = $company['bizCheckUrl'] !== ''
    ? ' <a class="auth-shell__footer-biz" href="' . study114_e($company['bizCheckUrl']) . '" target="_blank" rel="noopener noreferrer">사업자정보 확인</a>'
    : '';
$push('사업자등록번호', study114_e($company['bizNo']) . $bizCheck);
$push('통신판매업신고', study114_e($company['mailOrder']));
if (trim($company['email']) !== '') {
    $mail = $company['email'];
    $push(
        '이메일',
        '<a class="auth-shell__footer-mail" href="mailto:' . study114_e($mail) . '">' . study114_e($mail) . '</a>',
    );
}
if (trim($company['phone']) !== '') {
    $push('전화', study114_e($company['phone']));
}
$push('호스팅 제공자', study114_e($company['hosting']));
?>
<nav class="auth-shell__footer-links" aria-label="정책 및 고객센터">
  <?php foreach ($links as $i => $link): ?>
    <?php if ($i > 0): ?><span class="auth-shell__footer-sep" aria-hidden="true">·</span><?php endif; ?>
    <a href="<?= study114_e($link['href']) ?>"><?= !empty($link['strong']) ? '<strong>' . study114_e($link['label']) . '</strong>' : study114_e($link['label']) ?></a>
  <?php endforeach; ?>
</nav>
<p class="auth-shell__footer-notice"><?= study114_e(SiteFooterCopy::NOTICE) ?></p>
<?php if ($items): ?>
<p class="auth-shell__footer-company">
  <?php foreach ($items as $i => $item): ?>
    <?php if ($i > 0): ?><span class="auth-shell__footer-company-sep" aria-hidden="true">|</span><?php endif; ?>
    <span class="auth-shell__footer-company-item"><span class="auth-shell__footer-company-label"><?= study114_e($item['label']) ?></span> <span class="auth-shell__footer-company-value"><?= $item['valueHtml'] ?></span></span>
  <?php endforeach; ?>
</p>
<?php endif; ?>
<p class="auth-shell__footer-legal"><?= study114_e(SiteFooterCopy::COPYRIGHT) ?></p>
