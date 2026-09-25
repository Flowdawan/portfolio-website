// The deliberately terrible 2001 homepage that gets burned down on arrival.
// Purely decorative: hidden from assistive tech and never focusable.

export function OldSite() {
  return (
    <div className="old-site" aria-hidden="true">
      <div className="old-stars" />
      <header className="old-header">
        <div className="old-logo">★ FLORIAN&apos;S HOMEPAGE ★</div>
        <div className="old-marquee">
          <span>WELCOME TO MY AWESOME PORTFOLIO!!! &nbsp; BEST VIEWED IN NETSCAPE NAVIGATOR 4.0 AT 800×600 &nbsp; ★★★</span>
        </div>
      </header>
      <main className="old-layout">
        <aside className="old-sidebar">
          <p className="old-menu-title">~ MENU ~</p>
          <span className="old-link">HOME</span>
          <span className="old-link">ABOUT ME</span>
          <span className="old-link">MY PROJECTZ</span>
          <span className="old-link">GUESTBOOK</span>
          <span className="old-link">WEBRING &gt;&gt;</span>
          <div className="old-counter">
            VISITOR
            <br />
            <strong>000042</strong>
          </div>
        </aside>
        <div className="old-content">
          <p className="old-blink">UNDER CONSTRUCTION!</p>
          <div className="old-construction">🚧 &nbsp; 🚧 &nbsp; 🚧</div>
          <h2 className="old-title">Hi!!! I&apos;m Florian!!!</h2>
          <p className="old-rainbow">Web Developer • Programmer • AI Engineer</p>
          <div className="old-rule" />
          <p className="old-copy">
            I make <b>SUPER COOL</b> Android apps and websites!! Click around and don&apos;t forget to sign my guestbook :)
          </p>
          <table className="old-table">
            <tbody>
              <tr>
                <td>My Skills</td>
                <td>HTML, React, Java, Python</td>
              </tr>
              <tr>
                <td>Status</td>
                <td className="old-online">● ONLINE</td>
              </tr>
              <tr>
                <td>E-Mail</td>
                <td>vc@deflow.at</td>
              </tr>
            </tbody>
          </table>
          <span className="old-button" data-ignite>
            CLICK HERE!!!
          </span>
          <p className="old-midi">♫ now playing: sandstorm.mid</p>
        </div>
      </main>
      <footer className="old-footer">© 2001 FLORIAN • MADE WITH MICROSOFT FRONTPAGE • NO COOKIES!!!</footer>
    </div>
  );
}
