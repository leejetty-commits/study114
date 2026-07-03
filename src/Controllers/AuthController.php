<?php

declare(strict_types=1);

namespace Study114\Controllers;

use InvalidArgumentException;
use Study114\Auth\AuthSession;
use Study114\Auth\BasicRegisterService;
use Study114\Auth\LoginService;
use Study114\Auth\ProfileGenderSync;
use Study114\Auth\SignupService;
use Study114\Core\Flash;
use Study114\Core\View;

final class AuthController
{
    public function loginForm(): void
    {
        if (AuthSession::check()) {
            study114_redirect('/auth/signup/complete');
        }

        View::render('auth/login', [
            'errors' => Flash::pullErrors(),
            'old'    => Flash::get('old', []),
        ]);
    }

    public function loginSubmit(): void
    {
        $email = (string) ($_POST['email'] ?? '');
        $password = (string) ($_POST['password'] ?? '');

        try {
            $user = (new LoginService())->attempt($email, $password);
            AuthSession::login($user['user_id'], $user['email'], $user['role_type'], $user['name']);
            study114_redirect('/auth/signup/complete');
        } catch (InvalidArgumentException $e) {
            Flash::set('errors', [$e->getMessage()]);
            Flash::set('old', ['email' => $email]);
            study114_redirect('/auth/login');
        }
    }

    public function logout(): void
    {
        AuthSession::logout();
        study114_redirect('/auth/login');
    }

    public function signupTermsForm(): void
    {
        View::render('auth/signup-terms', [
            'errors' => Flash::pullErrors(),
        ]);
    }

    public function signupTermsSubmit(): void
    {
        $required = ['service', 'privacy', 'location'];
        foreach ($required as $key) {
            if (empty($_POST[$key])) {
                Flash::set('errors', ['필수 약관에 모두 동의해 주세요.']);
                study114_redirect('/auth/signup/terms');
            }
        }

        AuthSession::markTermsAgreed();
        study114_redirect('/auth/signup/role');
    }

    public function signupRoleForm(): void
    {
        if (!AuthSession::termsAgreed()) {
            study114_redirect('/auth/signup/terms');
        }

        View::render('auth/signup-role', [
            'selected' => AuthSession::signupRole(),
            'errors'   => Flash::pullErrors(),
        ]);
    }

    public function signupRoleSubmit(): void
    {
        if (!AuthSession::termsAgreed()) {
            study114_redirect('/auth/signup/terms');
        }

        $role = (string) ($_POST['role'] ?? '');
        if (!in_array($role, ['student', 'study_room', 'tutor'], true)) {
            Flash::set('errors', ['회원 구분을 선택해 주세요.']);
            study114_redirect('/auth/signup/role');
        }

        AuthSession::setSignupRole($role);
        study114_redirect('/auth/signup/form');
    }

    public function signupForm(): void
    {
        if (!AuthSession::termsAgreed()) {
            study114_redirect('/auth/signup/terms');
        }

        $role = AuthSession::signupRole();
        if ($role === null) {
            study114_redirect('/auth/signup/role');
        }

        View::render('auth/signup-form', [
            'role'   => $role,
            'errors' => Flash::pullErrors(),
            'old'    => Flash::get('old', []),
            'wide'   => true,
            'title'  => '회원가입 — 우동공과',
        ]);
    }

    public function signupFormSubmit(): void
    {
        if (!AuthSession::termsAgreed()) {
            study114_redirect('/auth/signup/terms');
        }

        $role = AuthSession::signupRole();
        if ($role === null) {
            study114_redirect('/auth/signup/role');
        }

        /** @var array<string, mixed> $input */
        $input = $_POST;
        $input['role'] = $role;
        $input['sms_consent'] = !empty($_POST['sms_consent']);
        $input['email_consent'] = !empty($_POST['email_consent']);

        try {
            $result = (new SignupService())->register($input);
            AuthSession::login(
                $result['user_id'],
                $result['email'],
                $result['role_type'],
                (string) ($input['name'] ?? '')
            );
            Flash::set('signup_success', $result);
            study114_redirect('/auth/signup/basic');
        } catch (InvalidArgumentException $e) {
            Flash::set('errors', [$e->getMessage()]);
            Flash::set('old', $_POST);
            study114_redirect('/auth/signup/form');
        } catch (\Throwable $e) {
            error_log('[signup] ' . $e->getMessage());
            Flash::set('errors', ['가입 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.']);
            Flash::set('old', $_POST);
            study114_redirect('/auth/signup/form');
        }
    }

    public function signupBasicForm(): void
    {
        if (!AuthSession::check()) {
            study114_redirect('/auth/signup/form');
        }

        $role = $this->resolveRoleUi();
        $user = AuthSession::user();
        $service = new BasicRegisterService();
        View::render('auth/signup-basic', [
            'role'          => $role,
            'user'          => $user,
            'profileGender' => $user ? ProfileGenderSync::get((int) $user['user_id']) : null,
            'regions'       => $service->listRegions(),
            'errors'  => Flash::pullErrors(),
            'old'     => Flash::get('old', []),
            'wide'    => true,
            'title'   => '기본등록 — 우동공과',
        ]);
    }

    public function signupBasicSubmit(): void
    {
        if (!AuthSession::check()) {
            study114_redirect('/auth/signup/form');
        }

        $user = AuthSession::user();
        if ($user === null) {
            study114_redirect('/auth/login');
        }

        $role = $this->resolveRoleUi();

        try {
            $result = (new BasicRegisterService())->register($user['user_id'], $role, $_POST);
            Flash::set('basic_register', $result);
            study114_redirect('/auth/signup/complete');
        } catch (InvalidArgumentException $e) {
            Flash::set('errors', [$e->getMessage()]);
            Flash::set('old', $_POST);
            study114_redirect('/auth/signup/basic');
        } catch (\Throwable $e) {
            error_log('[basic-register] ' . $e->getMessage());
            Flash::set('errors', ['기본등록 저장 중 오류가 발생했습니다.']);
            Flash::set('old', $_POST);
            study114_redirect('/auth/signup/basic');
        }
    }

    public function signupComplete(): void
    {
        if (!AuthSession::check()) {
            study114_redirect('/auth/login');
        }

        AuthSession::resetSignup();

        View::render('auth/signup-complete', [
            'user'           => AuthSession::user(),
            'role'           => $this->resolveRoleUi(),
            'basic_register' => Flash::get('basic_register'),
        ]);
    }

    public function findIdForm(): void
    {
        View::render('auth/find-id');
    }

    public function findPasswordForm(): void
    {
        View::render('auth/find-password');
    }

    private function resolveRoleUi(): string
    {
        $map = [
            'guardian_student'  => 'student',
            'study_room_owner'  => 'study_room',
            'tutor'             => 'tutor',
        ];
        $user = AuthSession::user();
        if ($user === null) {
            return AuthSession::signupRole() ?? 'student';
        }

        return $map[$user['role_type']] ?? 'student';
    }
}
