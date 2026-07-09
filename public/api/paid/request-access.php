<?php







declare(strict_types=1);







require_once dirname(__DIR__, 3) . '/src/bootstrap.php';







use Study114\Paid\PaidApi;



use Study114\Paid\ProviderTicketService;







PaidApi::bootstrap();







PaidApi::run(static function (): void {



    $auth = PaidApi::requireProvider();



    $userId = (int) $auth['user_id'];



    $service = new ProviderTicketService();



    $method = PaidApi::method();







    if ($method === 'GET') {



        $studentId = PaidApi::queryInt('student_id');



        if ($studentId > 0) {



            PaidApi::ok($service->getRequestAccessStatus($userId, $studentId));



        }







        PaidApi::ok($service->getRequestAccessList($userId));



    }







    if ($method === 'POST') {



        $input = PaidApi::readJson();



        $studentId = (int) ($input['student_id'] ?? 0);



        PaidApi::ok($service->unlockPaidRequest($userId, $studentId));



    }







    PaidApi::fail(405, 'method_not_allowed', 'GET · POST만 허용됩니다.');



});


