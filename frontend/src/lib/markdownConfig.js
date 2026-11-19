import rehypeHighlight from 'rehype-highlight'
import { common } from 'lowlight'
import cypher from './hljsCypher.js'

// 마크다운 코드 블록의 문법 강조 설정 — Archive 글·Codebase·포트폴리오 상세가 같이 쓴다.
// 언어 이름이 적힌 ```python 같은 블록만 색을 입히고(detect: false), 모르는 언어(mermaid, text 등)는 그대로 둔다.
export const rehypePlugins = [
  [rehypeHighlight, { detect: false, languages: { ...common, cypher } }],
]
