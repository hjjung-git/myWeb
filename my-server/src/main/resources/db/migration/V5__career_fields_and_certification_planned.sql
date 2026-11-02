-- 경력(EXPERIENCE) 항목용 필드 추가: 고용형태 / 부서 / 직급 / 퇴직 사유.
-- 회사명(title), 근무 기간(period_text), 담당 업무(detail_content)는 기존 컬럼을 그대로 쓴다.
ALTER TABLE portfolio_item
    ADD COLUMN employment_type VARCHAR(50),
    ADD COLUMN department VARCHAR(100),
    ADD COLUMN job_rank VARCHAR(50),
    ADD COLUMN resignation_reason VARCHAR(500);

-- 어학/자격증: 아직 취득 전인 항목(예: 응시 예정 시험)을 표시하기 위한 플래그.
ALTER TABLE certification
    ADD COLUMN planned BOOLEAN NOT NULL DEFAULT FALSE;
