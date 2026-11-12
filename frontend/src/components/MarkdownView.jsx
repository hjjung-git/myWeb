import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkSpacing from '../lib/remarkSpacing.js'
import remarkSidenotes from '../lib/remarkSidenotes.js'
import Sidenote from './Sidenote.jsx'
import SidenoteLayout from './SidenoteLayout.jsx'
import { resolveImageSrc } from '../lib/api.js'
import MermaidBlock from './MermaidBlock.jsx'

// 마크다운 본문 보기 — Archive 글과 같은 규칙(표, 이미지, ```mermaid 다이어그램, 줄바꿈 그대로)을 쓴다.
function MarkdownView({ children }) {
  return (
    <SidenoteLayout enabled={/^\[\^[^\]]+\]:/m.test(children || '')}>
    <div className="portfolio-body markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkSidenotes, remarkSpacing]}
        components={{
          sidenote: Sidenote, // 각주 문법 → 우측 여백 메모(용어 설명)
          // 서버에 올린 이미지(/api/images/..)는 배포 환경에서도 열리도록 절대 주소로 바꿔서 보여준다.
          img: ({ src = '', alt = '' }) => <img src={resolveImageSrc(src)} alt={alt} loading="lazy" />,
          // ```mermaid 코드 블록은 코드 대신 그림으로 그린다. 나머지 코드 블록은 그대로.
          pre: ({ node, children: preChildren, ...rest }) => {
            const codeEl = node?.children?.[0]
            const classes = codeEl?.properties?.className || []
            if (codeEl?.tagName === 'code' && classes.includes('language-mermaid')) {
              const text = (codeEl.children || []).map((child) => child.value || '').join('')
              return <MermaidBlock code={text.trim()} />
            }
            return <pre {...rest}>{preChildren}</pre>
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
    </SidenoteLayout>
  )
}

export default MarkdownView
