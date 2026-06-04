-- todo 데이터베이스 스키마
-- 앱이 최초 실행 시 자동 생성/마이그레이션하지만, 수동 실행도 가능합니다.
--   mysql -u root -p todo < db/schema.sql

CREATE DATABASE IF NOT EXISTS todo DEFAULT CHARSET=utf8mb4;
USE todo;

-- 할 일
CREATE TABLE IF NOT EXISTS tasks (
  id          VARCHAR(32)  NOT NULL PRIMARY KEY,  -- 클라이언트 생성 uid
  title       TEXT         NOT NULL,
  body        MEDIUMTEXT,                          -- 마크다운 본문
  start_date  VARCHAR(10),                         -- 'YYYY-MM-DD' 시작일
  end_date    VARCHAR(10),                         -- 'YYYY-MM-DD' 마감일
  start_time  VARCHAR(5),                          -- 'HH:MM' 시작 시간 (기본 09:00)
  end_time    VARCHAR(5),                          -- 'HH:MM' 마감 시간 (기본 18:00)
  pri         VARCHAR(8)   NOT NULL DEFAULT 'mid', -- high | mid | low
  done        TINYINT(1)   NOT NULL DEFAULT 0,
  inc_hol     TINYINT(1)   NOT NULL DEFAULT 0,     -- 공휴일·주말 포함 여부
  notify      TINYINT(1)   NOT NULL DEFAULT 1,     -- 알림 사용(항상 ON)
  notify_lead INT          NOT NULL DEFAULT 10,    -- (구) 마감 N분 전 — 미사용
  notify_time VARCHAR(5)   NOT NULL DEFAULT '09:00', -- 마감일 당일 알림 시각
  created     BIGINT       NOT NULL,               -- epoch ms
  history     JSON,                                -- 수정 이력 배열
  sort_order  INT          NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 휴지통 (삭제한 할 일, 여기서 영구 삭제하거나 복원)
CREATE TABLE IF NOT EXISTS trash (
  id          VARCHAR(32)  NOT NULL PRIMARY KEY,
  title       TEXT         NOT NULL,
  body        MEDIUMTEXT,
  start_date  VARCHAR(10),
  end_date    VARCHAR(10),
  start_time  VARCHAR(5),
  end_time    VARCHAR(5),
  pri         VARCHAR(8)   NOT NULL DEFAULT 'mid',
  done        TINYINT(1)   NOT NULL DEFAULT 0,
  created     BIGINT       NOT NULL,
  history     JSON,
  sort_order  INT          NOT NULL DEFAULT 0,
  deleted_at  BIGINT       NOT NULL DEFAULT 0      -- 삭제 시각 epoch ms
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
