<?php

declare(strict_types=1);

namespace Study114\Site;

/**
 * PHP MVC 푸터 문구 — preview/shared/site-footer.js SITE_FOOTER_* 와 동일 값 유지.
 */
final class SiteFooterCopy
{
    public const NOTICE = '';

    public const COMPLAINT =
        '해당 사이트에서 판매되는 모든 상품에 환불 및 모든 민원의 책임은 제이에이치커머스에 있습니다. 민원담당자: 이종현 연락처: 070-4001-1422';

    public const COPYRIGHT = '© 2026 우동공과 · study114 | 상표출원 제40-2026-0229906호';

    /** 공정거래위원회 사업자정보 확인. 사업자번호 471-29-01819. */
    public const BIZ_CHECK_URL = 'https://www.ftc.go.kr/bizCommPop.do?wrkr_no=4712901819';

    /**
     * @return array{
     *   name: string,
     *   ceo: string,
     *   address: string,
     *   bizNo: string,
     *   mailOrder: string,
     *   email: string,
     *   phone: string
     * }
     */
    public static function company(): array
    {
        return [
            'name' => '제이에이치커머스(서비스명 우동공과)',
            'ceo' => '이종현',
            'address' => '경기도 의정부시 능곡로26번길 40, 101동 1101호',
            'bizNo' => '471-29-01819(간이과세자)',
            'mailOrder' => '제2025-의정부송산-0680호',
            'email' => 'help@study114.net',
            'phone' => '070-4001-1422',
        ];
    }

    /**
     * @return list<array{href: string, label: string, strong?: bool}>
     */
    public static function policyLinks(): array
    {
        return [
            ['href' => '/info/', 'label' => '서비스 소개'],
            ['href' => '/#/support/policies/terms', 'label' => '이용약관'],
            ['href' => '/#/support/policies/privacy', 'label' => '개인정보 처리방침', 'strong' => true],
            ['href' => '/#/support/policies/platform', 'label' => '플랫폼 고지'],
            ['href' => '/#/plans/positions', 'label' => '유료상품'],
            ['href' => '/#/plans', 'label' => '환불정책'],
            ['href' => '/#/support', 'label' => '고객센터'],
        ];
    }
}
