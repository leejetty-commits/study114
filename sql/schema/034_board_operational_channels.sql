-- =============================================================================
-- study114 schema 034 — P23 운영형 채널 (notice · faq · safe-guide) board_posts 통합
-- Apply AFTER 021_board_engine.sql
-- =============================================================================

SET NAMES utf8mb4;

INSERT INTO board_posts (board_key, post_key, author_role, status, title, description, category_id, meta_json, created_at, updated_at) VALUES
  (
    'notice',
    'notice-001',
    'system',
    'published',
    '고객센터·안전과외 가이드 1차 오픈 (프리뷰)',
    '',
    'general',
    JSON_OBJECT(
      'body', JSON_ARRAY(
        '고객센터 좌측 메뉴·게시판형 FAQ/공지·안전과외 아코디언 UI를 프리뷰에 반영했습니다.',
        '1차는 정적 콘텐츠이며, 후순위에 관리자 게시판 연동 예정입니다.'
      ),
      'displayDate', '2026-07-01',
      'pinned', true
    ),
    '2026-07-01 00:00:00',
    NOW()
  ),
  (
    'notice',
    'notice-002',
    'system',
    'published',
    '쪽지함 프리뷰(16a) 안내',
    '',
    'general',
    JSON_OBJECT(
      'body', JSON_ARRAY(
        '회원 간 공식 접촉은 쪽지함(16장)을 이용합니다.',
        '운영 문의는 고객센터 운영 문의 채널과 별도입니다.'
      ),
      'displayDate', '2026-06-15'
    ),
    '2026-06-15 00:00:00',
    NOW()
  ),
  (
    'faq',
    'faq-1',
    'system',
    'published',
    '회원끼리 연락은 어떻게 하나요?',
    '회원 간 공식 접촉은 **쪽지(16장)** 입니다. 플랫폼 전화·이메일 중계는 없습니다.',
    'contact',
    JSON_OBJECT('answer', '회원 간 공식 접촉은 **쪽지(16장)** 입니다. 플랫폼 전화·이메일 중계는 없습니다.', 'sortOrder', 10),
    NOW(),
    NOW()
  ),
  (
    'faq',
    'faq-2',
    'system',
    'published',
    '운영·서비스 문의는 어디로 하나요?',
    '**고객센터 운영 문의(P17-07)** — 이메일/문의 폼을 이용합니다. 쪽지함과는 별개입니다.',
    'support',
    JSON_OBJECT('answer', '**고객센터 운영 문의(P17-07)** — 이메일/문의 폼을 이용합니다. 쪽지함과는 별개입니다.', 'sortOrder', 20),
    NOW(),
    NOW()
  ),
  (
    'faq',
    'faq-3',
    'system',
    'published',
    '안전번호나 에스크로가 있나요?',
    '**없습니다.** 대금·연락 중개·보증은 1차 제공 범위가 아닙니다.',
    'safety',
    JSON_OBJECT('answer', '**없습니다.** 대금·연락 중개·보증은 1차 제공 범위가 아닙니다.', 'sortOrder', 30),
    NOW(),
    NOW()
  ),
  (
    'faq',
    'faq-4',
    'system',
    'published',
    '유료 서비스는 학부모가 구매하나요?',
    '아닙니다. 공급자(공부방·과외)용 Prime/Pick·쪽지권·열람권이며, 학부모 과외비 결제와 무관합니다(15·18장).',
    'billing',
    JSON_OBJECT('answer', '아닙니다. 공급자(공부방·과외)용 Prime/Pick·쪽지권·열람권이며, 학부모 과외비 결제와 무관합니다(15·18장).', 'sortOrder', 40),
    NOW(),
    NOW()
  ),
  (
    'faq',
    'faq-5',
    'system',
    'published',
    'Prime/Pick은 무엇인가요?',
    '동네 노출 **기간형 포지션 상품**입니다. Hot·추천 등 광고배지는 포지션에 종속됩니다(11·18장).',
    'billing',
    JSON_OBJECT('answer', '동네 노출 **기간형 포지션 상품**입니다. Hot·추천 등 광고배지는 포지션에 종속됩니다(11·18장).', 'sortOrder', 50),
    NOW(),
    NOW()
  ),
  (
    'faq',
    'faq-6',
    'system',
    'published',
    '환불·과외비 분쟁은?',
    '당사자 간 협의가 우선이며, 플랫폼은 대리 조정하지 않습니다.',
    'dispute',
    JSON_OBJECT('answer', '당사자 간 협의가 우선이며, 플랫폼은 대리 조정하지 않습니다.', 'sortOrder', 60),
    NOW(),
    NOW()
  ),
  (
    'safe-guide',
    'safe-what',
    'system',
    'published',
    '안전과외란? — 우동공과에서의 의미',
    '전체',
    'primary',
    JSON_OBJECT(
      'slug', 'safe-what',
      'priority', 'primary',
      'audience', '전체',
      'body', JSON_ARRAY(
        '안전과외는 결제 보장 상품이 아니라, **선입금 주의·분쟁 예방·당사자 책임**을 설명하는 교육형 가이드입니다.',
        '우동공과는 과외·공부방 **매칭을 대신하지 않으며**, 탐색·비교·연락은 회원 주도로 이루어집니다.',
        '플랫폼은 에스크로·안전번호·전화 중계를 제공하지 않습니다.'
      )
    ),
    NOW(),
    NOW()
  ),
  (
    'safe-guide',
    'prepay',
    'system',
    'published',
    '선입금·전액선불 주의',
    '학부모',
    'primary',
    JSON_OBJECT(
      'slug', 'prepay',
      'priority', 'primary',
      'audience', '학부모',
      'body', JSON_ARRAY(
        '장기·고액 선입금은 신중히 결정하세요.',
        '영수증·환불 조건은 **당사자 간 문서화**를 권장합니다.',
        '우동공과는 대금을 보관하거나 지급하지 않습니다.'
      )
    ),
    NOW(),
    NOW()
  ),
  (
    'safe-guide',
    'first-meeting',
    'system',
    'published',
    '첫 연락·시범 수업 · 쪽지 활용',
    '전체',
    'primary',
    JSON_OBJECT(
      'slug', 'first-meeting',
      'priority', 'primary',
      'audience', '전체',
      'body', JSON_ARRAY(
        '회원 간 **공식 접촉**은 쪽지(16장)를 사용합니다.',
        '시범 수업·일정·조건은 쪽지로 먼저 확인한 뒤, 연락처 교환 여부는 당사자가 판단합니다.',
        '플랫폼이 전화·이메일을 대신 전달하지 않습니다.'
      )
    ),
    NOW(),
    NOW()
  ),
  (
    'safe-guide',
    'dispute',
    'system',
    'published',
    '분쟁이 생기면 — 플랫폼 역할과 한계',
    '전체',
    'primary',
    JSON_OBJECT(
      'slug', 'dispute',
      'priority', 'primary',
      'audience', '전체',
      'body', JSON_ARRAY(
        '과외비·환불 등 분쟁은 **당사자 간 협의**가 우선입니다.',
        '우동공과는 법률 자문·분쟁 대리 조정을 하지 않습니다.',
        '필요 시 소비자원·관할 기관 등 외부 절차를 안내합니다.'
      )
    ),
    NOW(),
    NOW()
  ),
  (
    'safe-guide',
    'provider-check',
    'system',
    'published',
    '공급자(공부방·과외) 체크리스트',
    '공급자',
    'secondary',
    JSON_OBJECT(
      'slug', 'provider-check',
      'priority', 'secondary',
      'audience', '공급자',
      'body', JSON_ARRAY(
        '등록·노출·접촉 권한은 **13·16·20·21장** 정책을 따릅니다. 아래 항목을 주기적으로 점검하세요.',
        '플랫폼은 제출자료의 사실을 검증·보증하지 않습니다 — **공개 상태를 스스로 관리**합니다(22장).'
      ),
      'checklist', JSON_ARRAY(
        JSON_OBJECT('label', '프로필·등록 정보 최신 여부', 'hint', '공부방명·과목·지역·소개글이 실제와 일치하는지'),
        JSON_OBJECT('label', '제출자료·공개 상태 확인', 'hint', '마이페이지 P15-10 · 상세에서 학부모가 볼 수 있는 범위'),
        JSON_OBJECT('label', '상담 수용 표지판(inquiry_status)', 'hint', '공부방은 20장 — 수용/일시중지 등 표지판 유지'),
        JSON_OBJECT('label', '쪽지·접촉 권한 이해', 'hint', '학부모 선연락·답장 free · 학생 콜드 메모만 유료(16§1-2)'),
        JSON_OBJECT('label', 'Prime/Pick 의미', 'hint', '노출·슬롯 상품 — 매칭·성과 보장 아님(11·18장 FAQ)'),
        JSON_OBJECT('label', '대금·선입금', 'hint', '과외비는 당사자 합의 · 에스크로·지급 중개 없음(G2)')
      )
    ),
    NOW(),
    NOW()
  ),
  (
    'safe-guide',
    'parent-check',
    'system',
    'published',
    '학부모·학생 의뢰 체크리스트',
    '학부모',
    'secondary',
    JSON_OBJECT(
      'slug', 'parent-check',
      'priority', 'secondary',
      'audience', '학부모',
      'body', JSON_ARRAY(
        '탐색·비교·접촉은 **회원 주도**입니다. 플랫폼이 후보를 추천하거나 대금을 보관하지 않습니다.',
        '학생 정보는 **필요한 범위만** 공개하세요(19장 · 블라인드 원칙).'
      ),
      'checklist', JSON_ARRAY(
        JSON_OBJECT('label', '학생 공개 범위·블라인드', 'hint', '등록·수정 시 공개 필드 · 표시명 확인'),
        JSON_OBJECT('label', '찜·비교 후 접촉', 'hint', '후보를 좁힌 뒤 쪽지로 공식 접촉 시작(16장)'),
        JSON_OBJECT('label', '공급자 제출자료 직접 비교', 'hint', '제출자료·공개 상태는 본인이 확인 — 플랫폼 비보증(22장)'),
        JSON_OBJECT('label', '선입금·고액 선불', 'hint', '결정 전 G2 가이드 · 환불 조건은 쪽지·문서로'),
        JSON_OBJECT('label', '시범·일정·조건', 'hint', '첫 연락은 쪽지(G3) · 연락처 교환은 당사자 판단'),
        JSON_OBJECT('label', '분쟁 발생 시', 'hint', '당사자 협의 우선 · 플랫폼 법률·분쟁 대리 없음(G4)')
      )
    ),
    NOW(),
    NOW()
  ),
  (
    'safe-guide',
    'privacy',
    'system',
    'published',
    '연락처·개인정보 — 쪽지 밖 자율 교환',
    '전체',
    'secondary',
    JSON_OBJECT(
      'slug', 'privacy',
      'priority', 'secondary',
      'audience', '전체',
      'body', JSON_ARRAY(
        '우동공과는 **안전번호·대리 통화·이메일 중계**를 제공하지 않습니다(6·14장).',
        '쪽지 밖 연락처 교환은 **회원 간 자율**이며, 플랫폼은 내용·분쟁에 관여하지 않습니다.'
      ),
      'checklist', JSON_ARRAY(
        JSON_OBJECT('label', '공식 접촉 = 쪽지', 'hint', '회원 ↔ 회원 · 플랫폼 전화·메일 노출 없음(16장)'),
        JSON_OBJECT('label', '안전번호 없음', 'hint', '번호 중계·녹취·대리 통화 미제공'),
        JSON_OBJECT('label', '연락처·카톡 교환', 'hint', '충분히 조건 확인 후 당사자가 판단 · 플랫폼 비관여'),
        JSON_OBJECT('label', '개인정보 최소 공유', 'hint', '필요한 범위만 · 학생 민감정보 보수적 공개'),
        JSON_OBJECT('label', '운영 문의와 구분', 'hint', '버그·정책·계정 = P17-07 티켓 · 회원 간 분쟁 ≠ 운영 CS'),
        JSON_OBJECT('label', '신고·차단', 'hint', '쪽지함·상세에서 사후 조치(16·22장) — 사전 심사 없음')
      )
    ),
    NOW(),
    NOW()
  );
