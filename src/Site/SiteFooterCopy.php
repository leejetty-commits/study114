<?php

declare(strict_types=1);

namespace Study114\Site;

/**
 * PHP MVC 푸터 문구 — preview/shared/site-footer.js SITE_FOOTER_* 와 동일 값 유지.
 */
final class SiteFooterCopy
{
    public const NOTICE =
        '우동공과는 통신판매중개자이며 통신판매의 당사자가 아닙니다. 회원 간 거래에 대한 의무와 책임은 각 회원에게 있습니다.';

    public const COPYRIGHT = '© 2026 우동공과 · study114';

    /**
     * @return array{
     *   name: string,
     *   ceo: string,
     *   address: string,
     *   bizNo: string,
     *   bizCheckUrl: string,
     *   mailOrder: string,
     *   email: string,
     *   phone: string,
     *   hosting: string
     * }
     */
    public static function company(): array
    {
        return [
            'name' => '제이에이치커머스(서비스명 우동공과)',
            'ceo' => '이종현',
            'address' => '경기도 의정부시 능곡로26번길 40, 101동 1101호',
            'bizNo' => '471-29-01819',
            'bizCheckUrl' => 'https://www.ftc.go.kr/bizCommPop.do?wrkr_no=4712901819',
            'mailOrder' => '제2025-의정부송산-0680호',
            'email' => 'help@study114.net',
            'phone' => '',
            'hosting' => '닷홈',
        ];
    }

    /**
     * @return list<array{href: string, label: string, strong?: bool}>
     */
    public static function policyLinks(): array
    {
        return [
            ['href' => '/#/support/policies/terms', 'label' => '이용약관'],
            ['href' => '/#/support/policies/privacy', 'label' => '개인정보 처리방침', 'strong' => true],
            ['href' => '/#/support/policies/platform', 'label' => '플랫폼 고지'],
            ['href' => '/#/support', 'label' => '고객센터'],
        ];
    }
}
