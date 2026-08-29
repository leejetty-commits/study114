# 닷홈 ACL 배포 런북 (rollback 준비)

대상 브랜치: `ci/board-acl-verify-gate` · 배포 방식: 기존 `deploy.yml` FTP · 새 인프라 없음

## 0. 배포 자체는 DB를 건드리지 않는다

`deploy.yml`은 `public/` 과 `src/` 를 FTP 업로드만 한다. mysql·migrate·seed 스텝이 없다.
따라서 **코드 배포와 DB seed 는 완전히 분리되어 있고**, seed 는 최고관리자가
`POST /api/admin/content/migrate.php` 에 `confirm=apply-034-035` 를 보낼 때만 실행된다.
seed 가 꼭 필요하지 않으면 배포 후에도 그냥 실행하지 않으면 된다.

## 1. 코드 rollback

현재 운영에 올라가 있는 커밋: **`6c82db4`**
(Deploy to dothome 마지막 성공, 2026-08-28T21:02:34Z)

되돌리는 방법 두 가지.

- 병합 전이면 그냥 병합하지 않는다. 운영은 그대로 `6c82db4` 다.
- 병합·배포 후 문제가 생기면 main 에서 병합 커밋을 revert 하고 push 한다.
  `deploy.yml` 이 다시 돌면서 `6c82db4` 시점 내용이 FTP 로 덮어써진다.

```
git revert -m 1 <merge-commit>
git push origin main
```

FTP 배포는 삭제 동기화가 아니라 덮어쓰기이므로, 이번에 새로 추가된 파일
(`src/Board/BoardChannelAcl.php` 등)은 revert 후에도 서버에 남는다.
남아 있어도 아무 데서도 require 하지 않으면 동작에 영향이 없지만,
깨끗이 지우려면 FTP 로 직접 삭제해야 한다.

## 2. DB rollback

이번 배포는 DB를 쓰지 않으므로 기본적으로 되돌릴 것이 없다.
seed 를 실행한 경우에만 아래가 필요하다.

1. 실행 **전에** `sql/inspect/acl-dothome-readonly.sql` 의 Q1~Q7 결과를 통째로 저장한다.
   이 저장본이 before 값의 정본이다. `060_acl_seed_rollback.example.sql` 은 템플릿일 뿐
   운영자 임의 설정을 복원하지 못한다.
2. 되돌릴 때는 저장해 둔 Q3·Q4 의 `allowed_roles_json` · `source_board_keys_json` ·
   `guest_filter` 값을 그대로 UPDATE 한다.
3. `ContentAclSeedGuard` 는 목표값·replaceable 목록에 없는 값을 만나면
   `abort_unexpected` 로 쓰기 전에 전체를 중단한다. 운영자 임의 설정은 덮어쓰지 않는다.

## 3. 배포 전 반드시 확인할 것

`board_posts.author_user_id` 는 `021_board_engine.sql` 부터 있는 컬럼이지만,
**현재 배포된 코드의 INSERT 문은 이 컬럼을 채우지 않는다.**
즉 운영 DB의 기존 게시글은 전부 `author_user_id IS NULL` 일 가능성이 높다.

이번 배포의 소유권 fail-closed 규칙 때문에 그 글들은 admin 외에는
수정·삭제할 수 없게 되고, 과외쌤은 자기 기존 submission 첨부에도 접근하지 못한다.
이는 의도한 동작이지만 영향 범위를 먼저 알아야 하므로
`sql/inspect/acl-dothome-readonly.sql` 의 Q7 을 배포 전에 실행해
`owner_unknown` 건수를 확인한다.

추측 backfill 은 하지 않는다. 소유자를 신뢰할 수 있는 근거가 따로 있을 때만
그 근거로 채운다.
