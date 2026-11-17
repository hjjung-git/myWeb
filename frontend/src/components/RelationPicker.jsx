// 여러 개를 눌러서 고르는 칩 선택기 — Archive 글 작성 화면의 '관련 기술/프로젝트'에 쓴다.
// options: [{ value, label, group? }], selected: 선택된 value 배열, onChange(새 배열)
function RelationPicker({ label, options, selected, onChange, empty = '선택할 항목이 없습니다.' }) {
  const toggle = (value) =>
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value])
  return (
    <div className="form-field relation-picker">
      {label}
      {options.length === 0 && <p className="status">{empty}</p>}
      <div className="tag-row">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            className={`tag tag-button${selected.includes(o.value) ? ' is-selected' : ''}`}
            aria-pressed={selected.includes(o.value)}
            onClick={() => toggle(o.value)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default RelationPicker
