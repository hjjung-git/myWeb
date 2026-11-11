function Contact() {
  return (
    <section id="contact" className="portfolio-section">
      <p className="eyebrow">Contact</p>
      <h2 className="section-title">연락처</h2>
      <div className="contact-grid">
        <div className="contact-item solid">
          <div className="label">Email</div>
          <div className="value mono">jaeroj9@gmail.com</div>
        </div>
        <div className="contact-item solid">
          <div className="label">Phone</div>
          <div className="value mono">010-9285-1019</div>
        </div>
        <div className="contact-item span-2 solid">
          <div className="label">GitHub</div>
          <div className="value mono">
            <a href="https://github.com/hjjung-git" target="_blank" rel="noreferrer">
              github.com/hjjung-git
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Contact
