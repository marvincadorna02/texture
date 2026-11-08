import '../footer.css'
export default function Footer({ full = false }) {
  return (
    <footer className={'sitefoot' + (full ? '' : ' linksonly')}>
      {full && (
        <div className="fbrand">
          <img src="/texture.png" alt="" />
          <span className="fname">Texture</span>
          <span className="fcopy">© 2026 Marvin Cadornas. All rights reserved.</span>
        </div>
      )}
      <nav className="flinks">
        <button>Privacy</button>
        <button>Support</button>
        <button>About</button>
      </nav>
    </footer>
  )
}