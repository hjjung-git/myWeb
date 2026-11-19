// highlight.js용 Cypher(Neo4j) 문법 정의 — 기본 언어 묶음에 없어서 직접 만든다.
// 키워드·함수·라벨(:Label)·파라미터($name)·문자열·숫자·주석만 가볍게 색을 입힌다.
export default function cypher(hljs) {
  return {
    name: 'Cypher',
    case_insensitive: true,
    keywords: {
      keyword:
        'match optional where return create merge set delete detach remove with unwind order by limit skip as distinct ' +
        'and or not xor in is starts ends contains call yield union all case when then else end asc desc on foreach ' +
        'load csv from headers constraint index drop exists assert unique',
      literal: 'true false null',
      built_in:
        'count sum avg min max collect size length id labels type properties keys coalesce tostring tointeger tofloat ' +
        'head last tail range reverse nodes relationships startnode endnode',
    },
    contains: [
      hljs.C_LINE_COMMENT_MODE,
      hljs.C_BLOCK_COMMENT_MODE,
      hljs.APOS_STRING_MODE,
      hljs.QUOTE_STRING_MODE,
      hljs.C_NUMBER_MODE,
      { className: 'symbol', begin: /:[A-Za-z_][A-Za-z0-9_]*/ },
      { className: 'variable', begin: /\$[A-Za-z_][A-Za-z0-9_]*/ },
    ],
  }
}
