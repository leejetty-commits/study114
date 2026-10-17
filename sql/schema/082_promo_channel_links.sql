-- study114 schema 082 — 홍보 채널 (유튜브 2~4 · 블로그 주소·제목 1~2 · 틱톡 · 네이버 클립)
-- youtube_url / instagram_url 은 기존 열 재사용, facebook_url 은 값 유지(화면만 숨김)
SET NAMES utf8mb4;

ALTER TABLE study_rooms
  ADD COLUMN youtube_url_2 VARCHAR(500) NULL COMMENT '홍보 채널 YouTube URL 2번째' AFTER youtube_url,
  ADD COLUMN youtube_url_3 VARCHAR(500) NULL COMMENT '홍보 채널 YouTube URL 3번째' AFTER youtube_url_2,
  ADD COLUMN youtube_url_4 VARCHAR(500) NULL COMMENT '홍보 채널 YouTube URL 4번째' AFTER youtube_url_3,
  ADD COLUMN blog_url_1 VARCHAR(500) NULL COMMENT '홍보 채널 네이버 블로그 URL 1번째' AFTER youtube_url_4,
  ADD COLUMN blog_title_1 VARCHAR(255) NULL COMMENT '홍보 채널 블로그 제목 1번째(직접 입력)' AFTER blog_url_1,
  ADD COLUMN blog_url_2 VARCHAR(500) NULL COMMENT '홍보 채널 네이버 블로그 URL 2번째' AFTER blog_title_1,
  ADD COLUMN blog_title_2 VARCHAR(255) NULL COMMENT '홍보 채널 블로그 제목 2번째(직접 입력)' AFTER blog_url_2,
  ADD COLUMN tiktok_url VARCHAR(500) NULL COMMENT '홍보 채널 TikTok URL' AFTER blog_title_2,
  ADD COLUMN naver_clip_url VARCHAR(500) NULL COMMENT '홍보 채널 네이버 클립 URL' AFTER tiktok_url;

ALTER TABLE tutors
  ADD COLUMN youtube_url_2 VARCHAR(500) NULL COMMENT '홍보 채널 YouTube URL 2번째' AFTER youtube_url,
  ADD COLUMN youtube_url_3 VARCHAR(500) NULL COMMENT '홍보 채널 YouTube URL 3번째' AFTER youtube_url_2,
  ADD COLUMN youtube_url_4 VARCHAR(500) NULL COMMENT '홍보 채널 YouTube URL 4번째' AFTER youtube_url_3,
  ADD COLUMN blog_url_1 VARCHAR(500) NULL COMMENT '홍보 채널 네이버 블로그 URL 1번째' AFTER youtube_url_4,
  ADD COLUMN blog_title_1 VARCHAR(255) NULL COMMENT '홍보 채널 블로그 제목 1번째(직접 입력)' AFTER blog_url_1,
  ADD COLUMN blog_url_2 VARCHAR(500) NULL COMMENT '홍보 채널 네이버 블로그 URL 2번째' AFTER blog_title_1,
  ADD COLUMN blog_title_2 VARCHAR(255) NULL COMMENT '홍보 채널 블로그 제목 2번째(직접 입력)' AFTER blog_url_2,
  ADD COLUMN tiktok_url VARCHAR(500) NULL COMMENT '홍보 채널 TikTok URL' AFTER blog_title_2,
  ADD COLUMN naver_clip_url VARCHAR(500) NULL COMMENT '홍보 채널 네이버 클립 URL' AFTER tiktok_url;
