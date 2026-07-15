<?php

declare(strict_types=1);

namespace Study114\Auth;

/** 9장 부록 §17-5 — 비밀번호 재설정 메일 (plain + HTML 버튼) */
final class PasswordResetMailTemplate
{
    public const SUBJECT = '[우동공과] 비밀번호 재설정 안내';

    /**
     * @param list<string> $providerLabels 연동된 소셜 표시명 (예: ['구글','네이버'])
     * @return array{subject: string, plain: string, html: string}
     */
    public static function build(string $resetUrl, int $ttlMinutes = 30, array $providerLabels = []): array
    {
        $ttlMinutes = max(1, $ttlMinutes);
        $plain = self::plainBody($resetUrl, $ttlMinutes, $providerLabels);
        $html = self::htmlBody($resetUrl, $ttlMinutes, $providerLabels);

        return [
            'subject' => self::SUBJECT,
            'plain'   => $plain,
            'html'    => $html,
        ];
    }

    /**
     * 소셜 전용 안내 (재설정 링크 없음) — 계정 열거 방지를 위해 발송은 서버에서만 결정.
     *
     * @param list<string> $providerLabels
     * @return array{subject: string, plain: string, html: string}
     */
    public static function buildSocialOnly(array $providerLabels): array
    {
        $names = $providerLabels !== []
            ? implode(', ', $providerLabels)
            : '소셜';
        $plain = "안녕하세요.\n"
            . "비밀번호 재설정 요청이 접수되었습니다.\n\n"
            . "이 계정은 {$names} 로그인으로 가입·연동되어 있습니다.\n"
            . "비밀번호 대신 해당 소셜로 로그인해 주세요.\n\n"
            . "직접 요청하지 않으셨다면 이 메일을 무시하셔도 됩니다.";

        $safeNames = htmlspecialchars($names, ENT_QUOTES, 'UTF-8');
        $html = <<<HTML
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>로그인 안내</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Noto Sans KR',sans-serif;color:#1f2937;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:24px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;">
          <tr>
            <td style="padding:28px 20px 24px;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">안녕하세요.</p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">비밀번호 재설정 요청이 접수되었습니다.</p>
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">이 계정은 <strong>{$safeNames}</strong> 로그인으로 가입·연동되어 있습니다.</p>
              <p style="margin:0 0 8px;font-size:15px;line-height:1.6;">비밀번호 대신 해당 소셜로 로그인해 주세요.</p>
              <p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:#6b7280;">직접 요청하지 않으셨다면 이 메일을 무시하셔도 됩니다.</p>
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;">우동공과 · study114</p>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;

        return [
            'subject' => '[우동공과] 소셜 로그인 안내',
            'plain'   => $plain,
            'html'    => $html,
        ];
    }

    /** @param list<string> $providerLabels */
    private static function plainBody(string $resetUrl, int $ttlMinutes, array $providerLabels): string
    {
        $socialNote = '';
        if ($providerLabels !== []) {
            $names = implode(', ', $providerLabels);
            $socialNote = "참고: 이 계정은 {$names} 로그인도 연결되어 있습니다. "
                . "소셜로도 로그인할 수 있습니다.\n\n";
        }

        return "안녕하세요.\n"
            . "비밀번호 재설정 요청이 접수되었습니다.\n\n"
            . $socialNote
            . "아래 링크를 눌러 새 비밀번호를 설정해 주세요.\n"
            . "비밀번호 다시 설정하기: {$resetUrl}\n\n"
            . "이 링크는 {$ttlMinutes}분 동안만 유효합니다.\n"
            . "직접 요청하지 않으셨다면 이 메일을 무시하셔도 됩니다.";
    }

    /** @param list<string> $providerLabels */
    private static function htmlBody(string $resetUrl, int $ttlMinutes, array $providerLabels): string
    {
        $url = htmlspecialchars($resetUrl, ENT_QUOTES, 'UTF-8');
        $ttl = htmlspecialchars((string) $ttlMinutes, ENT_QUOTES, 'UTF-8');
        $socialHtml = '';
        if ($providerLabels !== []) {
            $names = htmlspecialchars(implode(', ', $providerLabels), ENT_QUOTES, 'UTF-8');
            $socialHtml = "<p style=\"margin:0 0 20px;font-size:14px;line-height:1.6;color:#4b5563;\">참고: 이 계정은 <strong>{$names}</strong> 로그인도 연결되어 있습니다. 소셜로도 로그인할 수 있습니다.</p>";
        }

        return <<<HTML
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>비밀번호 재설정</title>
</head>
<body style="margin:0;padding:0;-webkit-text-size-adjust:100%;background:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Noto Sans KR',sans-serif;color:#1f2937;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:24px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;">
          <tr>
            <td style="padding:28px 20px 20px;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">안녕하세요.</p>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;">비밀번호 재설정 요청이 접수되었습니다.</p>
              {$socialHtml}
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;">아래 버튼을 눌러 새 비밀번호를 설정해 주세요.</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td align="center" style="border-radius:8px;background:#2b7fff;">
                    <a href="{$url}" style="display:block;padding:14px 20px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;text-align:center;">비밀번호 다시 설정하기</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#4b5563;">이 링크는 {$ttl}분 동안만 유효합니다.</p>
              <p style="margin:0;font-size:14px;line-height:1.6;color:#6b7280;">직접 요청하지 않으셨다면 이 메일을 무시하셔도 됩니다.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 28px 24px;border-top:1px solid #f3f4f6;">
              <p style="margin:0;font-size:12px;line-height:1.5;color:#9ca3af;">버튼이 동작하지 않으면 아래 주소를 복사해 브라우저에 붙여 넣어 주세요.</p>
              <p style="margin:8px 0 0;font-size:12px;line-height:1.5;word-break:break-all;"><a href="{$url}" style="color:#2b7fff;">{$url}</a></p>
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;">우동공과 · study114</p>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
    }
}
