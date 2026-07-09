<?php



declare(strict_types=1);



namespace Study114\Paid;



/** 18b — P18-02 ROI + 운영 상태 통합 */

final class ProviderUsageService

{

    private ProviderRoiService $roi;

    private ProviderStatusService $status;



    public function __construct(

        ?ProviderRoiService $roi = null,

        ?ProviderStatusService $status = null,

    ) {

        $this->roi = $roi ?? new ProviderRoiService();

        $this->status = $status ?? new ProviderStatusService();

    }



    /** @return array<string, mixed> */

    public function getFullSummary(int $providerUserId, int $days = 7): array

    {

        $roi = $this->roi->getSummary($providerUserId, $days);

        $core = $this->status->build($providerUserId, true);

        $ticketBlocks = $this->status->ticketBlocksFromStatus($core);



        return array_merge($roi, $core, $ticketBlocks, [

            'tier' => $core['subscription_tier'],

        ]);

    }

}


