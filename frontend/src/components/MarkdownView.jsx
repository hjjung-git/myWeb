import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkSpacing from '../lib/remarkSpacing.js'
import remarkSidenotes from '../lib/remarkSidenotes.js'
import Sidenote from './Sidenote.jsx'
import SidenoteLayout from './SidenoteLayout.jsx'
import { resolveImageSrc } from '../lib/api.js'
import CodeBlock from './CodeBlock.jsx'
import { rehypePlugins } from '../lib/markdownConfig.js'

// 마크다운 본문 보기 — Archive 글과 같은 규칙(표, 이미지, ```mermaid 다이어그램, 줄바꿈 그대로)을 쓴다.
function MarkdownView({ children }) {
  return (
    <SidenoteLayout enabled={/^\[\^[^\]]+\]:/m.test(children || '')}>
    <div className="portfolio-body markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkSidenotes, remarkSpacing]}
        rehypePlugins={rehypePlugins}
        components={{
          sidenote: Sidenote, // 각주 문법 → 우측 여백 메모(용어 설명)
          // 서버에 올린 이미지(/api/images/..)는 배포 환경에서도 열리도록 절대 주소로 바꿔서 보여준다.
          img: ({ src = '', alt = '' }) => <img src={resolveImageSrc(src)} alt={alt} loading="lazy" />,
          // ```mermaid는 그림으로, 나머지 코드 블록은 문법 강조 + 복사 버튼
          pre: CodeBlock,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
    </SidenoteLayout>
  )
}

export default MarkdownView
