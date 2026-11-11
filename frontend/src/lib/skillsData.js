// Skills 화면의 기술 목록. 기술을 쓴 "프로젝트"는 프로젝트의 기술 스택 태그와 이름이 같으면 자동으로 연결된다.
// evidence에는 프로젝트로 남기기 어려운 경험을 직접 적는다 (기술 이름 → 한두 문장). 없으면 생략해도 된다.
export const SKILL_GROUPS = [
  {
    name: 'RDBMS & Cloud',
    tags: ['AWS RDS MySQL', 'MySQL', 'CI/CD', '백업/복구', '보안 설정'],
  },
  {
    name: 'Graph DB & Ontology',
    tags: ['Neo4j', 'Cypher', 'APOC', '온톨로지 설계', 'RDF/OWL (학습중)'],
  },
  {
    name: 'FDE Focus',
    tags: ['낯선 도메인 빠른 학습', '민감 데이터 취급', '요구사항 → 데이터 모델링'],
  },
  {
    name: 'AI 활용',
    tags: ['오케스트레이션 자동화', '에이전트 가드레일', 'Human-in-the-loop 설계', '병렬 개발 (git worktree)'],
  },
  {
    name: 'Language',
    tags: ['Python', 'Java', 'JavaScript', 'SQL', 'Cypher', 'RDF/OWL', 'C/C++'],
  },
  {
    name: 'OS',
    tags: ['macOS', 'Windows', 'Linux'],
  },
]

export const EVIDENCE = {
  'AWS RDS MySQL': 'AWS RDS MySQL 환경에서 배포, 보안 설정, 백업/복구, CI/CD 파이프라인 구성까지 데이터베이스 운영 흐름 전반을 다뤘습니다.',
  'CI/CD': 'AWS RDS MySQL 운영 과정에서 CI/CD 파이프라인을 구성했습니다.',
  '백업/복구': 'AWS RDS MySQL 환경에서 백업과 복구 절차를 다뤘습니다.',
  '보안 설정': 'AWS RDS MySQL 환경에서 접근·보안 설정을 직접 구성했습니다.',
  Neo4j: '관계형 DB 기반 위에서 Neo4j와 온톨로지 기반 지식그래프로 확장하며 Cypher로 실습하고 있습니다.',
  '온톨로지 설계': '사내 폐쇄망에서 처음 접한 도메인의 내부 데이터를 다루며 온톨로지를 설계했습니다.',
  '민감 데이터 취급': '사내 폐쇄망에서 외부 유출이 금지된 내부 데이터를 다뤘습니다.',
  '낯선 도메인 빠른 학습': '처음 접하는 현장 도메인의 업무와 제약을 파악해 데이터 모델과 구현으로 옮긴 경험이 있습니다.',
}
