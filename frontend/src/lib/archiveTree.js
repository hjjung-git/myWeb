// Archive 글 목록(요약)을 사이드바용 "대분류 > 중분류 > 소분류 > 글" 트리로 묶는다.
// 대분류가 비어 있는 글은 "미분류"로 모으고, 항상 맨 아래에 둔다.
// 글은 어느 단계에든 붙을 수 있다 (예: 중분류까지만 정한 글은 중분류 바로 아래에 보인다).
export const UNCATEGORIZED = '미분류'

// URL 쿼리 이름 — 단계 순서대로 (대분류, 중분류, 소분류)
export const LEVEL_PARAMS = ['category', 'sub', 'minor']
export const LEVEL_LABELS = ['대분류', '중분류', '소분류']

// 글의 분류 경로. 상위가 비어 있으면 하위는 무시한다(백엔드도 같은 규칙으로 저장).
export function pathOf(post) {
  if (!post.category) return [UNCATEGORIZED]
  const path = [post.category]
  if (post.subcategory) {
    path.push(post.subcategory)
    if (post.minorCategory) path.push(post.minorCategory)
  }
  return path
}

export function categoryOf(post) {
  return pathOf(post)[0]
}

function compareName(a, b) {
  if (a === UNCATEGORIZED) return 1
  if (b === UNCATEGORIZED) return -1
  return a.localeCompare(b, 'ko')
}

// 같은 분류 안에서는 문서처럼 먼저 쓴 글이 위에 오도록 오래된 순(id 오름차순)으로 둔다.
const byId = (a, b) => a.id - b.id

function newNode(name, path) {
  return { name, path, posts: [], children: new Map() }
}

function finalize(node) {
  return {
    name: node.name,
    path: node.path,
    posts: node.posts.sort(byId),
    children: [...node.children.values()].sort((a, b) => compareName(a.name, b.name)).map(finalize),
  }
}

// 반환값: 대분류 노드 배열. 노드 = { name, path(이름 배열), posts, children(하위 노드 배열) }
export function buildTree(posts) {
  const root = newNode(null, [])
  for (const post of posts) {
    let node = root
    for (const name of pathOf(post)) {
      if (!node.children.has(name)) node.children.set(name, newNode(name, [...node.path, name]))
      node = node.children.get(name)
    }
    node.posts.push(post)
  }
  return finalize(root).children
}

// 사이드바에 보이는 순서 그대로 펼친 글 목록 — 상세 화면의 이전/다음 글 계산에 쓴다.
export function flattenTree(nodes) {
  return nodes.flatMap((node) => [...node.posts, ...flattenTree(node.children)])
}

export function countPosts(node) {
  return node.posts.length + node.children.reduce((sum, child) => sum + countPosts(child), 0)
}

// categoryLink('AI'), categoryLink('AI', '개념'), categoryLink('CS', '운영체제', '프로세스')
export function categoryLink(...names) {
  const params = new URLSearchParams()
  // 중간 단계가 비면 거기서 끊는다 (하위 단계가 상위 자리로 밀려 올라가지 않게).
  for (let i = 0; i < LEVEL_PARAMS.length && names[i]; i++) params.set(LEVEL_PARAMS[i], names[i])
  const qs = params.toString()
  return qs ? `/archive?${qs}` : '/archive'
}

// 현재 URL의 ?category=&sub=&minor= 를 경로 배열로 (빈 단계에서 끊는다)
export function filterPathFrom(searchParams) {
  const path = []
  for (const key of LEVEL_PARAMS) {
    const value = searchParams.get(key)
    if (!value) break
    path.push(value)
  }
  return path
}

export function startsWith(path, prefix) {
  return prefix.every((name, i) => path[i] === name)
}
