<?php

declare(strict_types=1);

namespace Study114\Mail;

/**
 * 「우동공과 편지」 공통 틀 — 회원에게 가는 정보성 메일(text + HTML 한 쌍).
 * 계정 메일(이메일 확인·비밀번호 재설정)과 이후 생활 메일(게시 환영·구매 감사·탈퇴)이 같이 쓴다.
 *
 * 규칙: 실명 대신 역할 호칭 · 광고·할인 문구 금지 · 바닥글에 보내기 전용 고지 · 외부 CSS/JS·추적 픽셀 없음.
 * 동적 값은 모두 htmlspecialchars. 이메일 앱이 불러올 수 있도록 로고는 운영 절대 주소.
 */
final class MemberMailTemplate
{
    public const SITE_URL = 'https://study114.net';
    public const LOGO_URL = self::SITE_URL . '/assets/brand/logo-wordmark.png';
    public const SUPPORT_PATH = '/support/contact';
    public const SIGNATURE = '— 우동공과 드림';
    public const FOOTER_NOTICE = '이 메일은 우동공과(study114.net)에서 입력하신 주소로 보내드렸어요. '
        . '보내기 전용 메일이라 답장을 받을 수 없어요. '
        . '궁금한 점은 고객센터 1:1 문의로 남겨 주시면 빠르게 답해 드릴게요.';
    public const SUPPORT_LINK_LABEL = '고객센터 1:1 문의하기';
    public const LINK_HINT = '버튼이 눌리지 않으면 아래 주소를 복사해 브라우저 주소창에 붙여 넣어 주세요.';

    private const BRAND_BLUE = '#266bc4';
    private const INK = '#1c1917';
    private const MUTED = '#6b7280';
    private const LINE = '#e5e7eb';
    private const PAGE_BG = '#f7f8fa';
    private const FONT = "-apple-system,BlinkMacSystemFont,'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR','Segoe UI',Roboto,sans-serif";

    /**
     * @param array{
     *   subject: string,
     *   support_url: string,
     *   heading: string,
     *   paragraphs: list<string>,
     *   badge?: ?string,
     *   role?: string,
     *   preheader?: string,
     *   button?: ?array{label: string, url: string},
     *   notes?: list<string>,
     * } $mail
     * @return array{subject: string, plain: string, html: string}
     */
    public static function render(array $mail): array
    {
        return [
            'subject' => $mail['subject'],
            'plain'   => self::plain($mail),
            'html'    => self::html($mail),
        ];
    }

    /** 분 → 「30분」 · 「24시간」 · 「1시간 30분」 */
    public static function ttlLabel(int $minutes): string
    {
        $minutes = max(1, $minutes);
        if ($minutes < 60) {
            return $minutes . '분';
        }
        $hours = intdiv($minutes, 60);
        $rest = $minutes % 60;

        return $rest === 0 ? $hours . '시간' : $hours . '시간 ' . $rest . '분';
    }

    /** 고객센터 1:1 문의 주소 (home_ui 기준, pathname 딥링크) */
    public static function supportUrl(string $homeUi): string
    {
        $base = rtrim(trim($homeUi), '/');
        if ($base === '') {
            $base = self::SITE_URL;
        }

        return $base . self::SUPPORT_PATH;
    }

    /** @param array<string, mixed> $mail */
    private static function plain(array $mail): string
    {
        $lines = [];
        $badge = trim((string) ($mail['badge'] ?? ''));
        if ($badge !== '') {
            $lines[] = '[' . $badge . ']';
            $lines[] = '';
        }
        $lines[] = (string) $mail['heading'];
        $lines[] = '';
        foreach ($mail['paragraphs'] as $p) {
            $lines[] = (string) $p;
            $lines[] = '';
        }
        $button = $mail['button'] ?? null;
        if (is_array($button)) {
            $lines[] = '▶ ' . $button['label'];
            $lines[] = $button['url'];
            $lines[] = '';
        }
        $notes = $mail['notes'] ?? [];
        foreach ($notes as $note) {
            $lines[] = '· ' . $note;
        }
        if ($notes !== []) {
            $lines[] = '';
        }
        $lines[] = self::SIGNATURE;
        $lines[] = '';
        $lines[] = '────────────';
        $lines[] = self::FOOTER_NOTICE;
        $lines[] = self::SUPPORT_LINK_LABEL . ': ' . $mail['support_url'];

        return implode("\n", $lines);
    }

    /** @param array<string, mixed> $mail */
    private static function html(array $mail): string
    {
        $e = static fn (string $s): string => htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        $font = self::FONT;
        $ink = self::INK;
        $muted = self::MUTED;
        $line = self::LINE;
        $blue = self::BRAND_BLUE;
        $pageBg = self::PAGE_BG;

        $title = $e((string) $mail['subject']);
        $preheader = $e((string) ($mail['preheader'] ?? ''));
        $logo = $e(self::LOGO_URL);
        $site = $e(self::SITE_URL);

        $badgeHtml = '';
        $badge = trim((string) ($mail['badge'] ?? ''));
        if ($badge !== '') {
            $accent = MemberMailRole::accent((string) ($mail['role'] ?? ''));
            $fg = $accent['fg'];
            $bg = $accent['bg'];
            $badgeText = $e($badge);
            $badgeHtml = <<<HTML
          <tr>
            <td style="padding:8px 28px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:{$bg};border-left:6px solid {$fg};border-radius:8px;padding:14px 18px;font-family:{$font};font-size:20px;line-height:1.4;font-weight:700;color:{$fg};">{$badgeText}</td>
                </tr>
              </table>
            </td>
          </tr>
HTML;
        }

        $paragraphs = '';
        foreach ($mail['paragraphs'] as $p) {
            $paragraphs .= '<p style="margin:0 0 14px;font-size:16px;line-height:1.7;color:' . $ink . ';">'
                . $e((string) $p) . "</p>\n";
        }

        $buttonHtml = '';
        $button = $mail['button'] ?? null;
        if (is_array($button)) {
            $url = $e((string) $button['url']);
            $label = $e((string) $button['label']);
            $hint = $e(self::LINK_HINT);
            $buttonHtml = <<<HTML
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:10px 0 12px;">
                <tr>
                  <td align="center" style="border-radius:8px;background:{$blue};">
                    <a href="{$url}" target="_blank" rel="noopener" style="display:block;padding:16px 20px;font-family:{$font};font-size:17px;font-weight:700;color:#ffffff;text-decoration:none;text-align:center;border-radius:8px;">{$label}</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 4px;font-size:13px;line-height:1.6;color:{$muted};">{$hint}</p>
              <p style="margin:0 0 20px;font-size:13px;line-height:1.6;word-break:break-all;"><a href="{$url}" target="_blank" rel="noopener" style="color:{$blue};">{$url}</a></p>
HTML;
        }

        $notesHtml = '';
        $notes = $mail['notes'] ?? [];
        if ($notes !== []) {
            $items = '';
            foreach ($notes as $note) {
                $items .= '<tr><td valign="top" style="padding:0 8px 10px 0;font-size:14px;line-height:1.7;color:' . $muted . ';">·</td>'
                    . '<td style="padding:0 0 10px;font-size:14px;line-height:1.7;color:#4b5563;">' . $e((string) $note) . "</td></tr>\n";
            }
            $notesHtml = <<<HTML
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:4px 0 8px;background:{$pageBg};border-radius:8px;">
                <tr>
                  <td style="padding:16px 16px 6px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
{$items}                    </table>
                  </td>
                </tr>
              </table>
HTML;
        }

        $heading = $e((string) $mail['heading']);
        $signature = $e(self::SIGNATURE);
        $footer = $e(self::FOOTER_NOTICE);
        $supportUrl = $e((string) $mail['support_url']);
        $supportLabel = $e(self::SUPPORT_LINK_LABEL);

        return <<<HTML
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <title>{$title}</title>
</head>
<body style="margin:0;padding:0;-webkit-text-size-adjust:100%;background:{$pageBg};font-family:{$font};color:{$ink};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">{$preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:{$pageBg};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid {$line};border-radius:12px;">
          <tr>
            <td style="padding:24px 28px 8px;">
              <a href="{$site}" target="_blank" rel="noopener" style="text-decoration:none;"><img src="{$logo}" alt="우동공과" height="32" style="display:block;height:32px;width:auto;border:0;" /></a>
            </td>
          </tr>
{$badgeHtml}
          <tr>
            <td style="padding:20px 28px 8px;font-family:{$font};">
              <h1 style="margin:0 0 16px;font-size:22px;line-height:1.4;font-weight:700;color:{$ink};">{$heading}</h1>
              {$paragraphs}
{$buttonHtml}
{$notesHtml}
              <p style="margin:20px 0 8px;font-size:16px;line-height:1.6;font-weight:600;color:{$ink};">{$signature}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 28px 24px;border-top:1px solid {$line};font-family:{$font};">
              <p style="margin:0 0 8px;font-size:12px;line-height:1.7;color:{$muted};">{$footer}</p>
              <p style="margin:0;font-size:12px;line-height:1.7;"><a href="{$supportUrl}" target="_blank" rel="noopener" style="color:{$blue};font-weight:600;">{$supportLabel}</a></p>
            </td>
          </tr>
        </table>
        <p style="margin:14px 0 0;font-size:12px;color:#9ca3af;font-family:{$font};">우동공과 · study114.net</p>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
    }
}
