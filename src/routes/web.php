<?php

declare(strict_types=1);

use Study114\Controllers\AuthController;
use Study114\Core\Router;

$auth = new AuthController();

return (new Router())
    ->get('/', static function (): void {
        study114_redirect('/auth/login');
    })
    ->get('/auth/login', [$auth, 'loginForm'])
    ->post('/auth/login', [$auth, 'loginSubmit'])
    ->post('/auth/logout', [$auth, 'logout'])
    ->get('/auth/logout', [$auth, 'logout'])
    ->get('/auth/signup/terms', [$auth, 'signupTermsForm'])
    ->post('/auth/signup/terms', [$auth, 'signupTermsSubmit'])
    ->get('/auth/signup/role', [$auth, 'signupRoleForm'])
    ->post('/auth/signup/role', [$auth, 'signupRoleSubmit'])
    ->get('/auth/signup/form', [$auth, 'signupForm'])
    ->post('/auth/signup/form', [$auth, 'signupFormSubmit'])
    ->get('/auth/signup/basic', [$auth, 'signupBasicForm'])
    ->post('/auth/signup/basic', [$auth, 'signupBasicSubmit'])
    ->get('/auth/signup/complete', [$auth, 'signupComplete'])
    ->get('/auth/find-id', [$auth, 'findIdForm'])
    ->get('/auth/find-password', [$auth, 'findPasswordForm']);
