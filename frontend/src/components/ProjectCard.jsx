import { Link } from 'react-router-dom'
import LanguageBar from './LanguageBar.jsx'
import { resolveImageSrc } from '../lib/api.js'
import { splitTech } from '../lib/portfolioApi.js'

// 홈·목록의 프로젝트 카드 — 썸네일, 이름, 언어 비율만. (설명은 상세 페이지에서)
function ProjectCard({ item, showTech = false }) {
  const thumb = item.thumbnailPath ? resolveImageSrc(item.thumbnailPath) : null
  return (
    <li className="project-card pc">
      <Link to={`/portfolio/${item.id}`}>
        <div className="pc-thumb">
          {thumb ? (
            <img src={thumb} alt="" loading="lazy" />
          ) : (
            <span className="pc-thumb-empty" aria-hidden="true">{item.title.slice(0, 2)}</span>
          )}
        </div>
        <h3>{item.title}</h3>
        <LanguageBar url={item.linkUrl} legend={3} />
        {showTech && splitTech(item.techStack).length > 0 && (
          <span className="project-tech">
            {splitTech(item.techStack).map((t) => <span key={t} className="tag">{t}</span>)}
          </span>
        )}
      </Link>
    </li>
  )
}

export default ProjectCard
