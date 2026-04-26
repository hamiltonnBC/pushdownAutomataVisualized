import './HomePage.css';

export function HomePage() {
  return (
    <div className="home-page">
      <header className="home-page__hero">
        <h1 className="home-page__title">Theory of Computation Interactive Guide</h1>
        <p className="home-page__subtitle">
          An interactive tool to help students visualize and understand core concepts
          from Theory of Computation.
        </p>
      </header>

      <section className="home-page__about">
        <p>
          This project is a work in progress, built to help myself and my peers with our
          Theory of Computation course. The information is derived from:
        </p>
        <blockquote className="home-page__citation">
          Maheshwari, A., &amp; Smid, M. (2012). <em>Introduction to Theory of Computation</em>. Carleton University.
        </blockquote>
        <p>
          It is important to note that there are multiple ways of approaching the information
          provided here. For example, the 5-tuple PDA demonstrated in this application is
          particular to this textbook; you may have learned a 6 or 7-tuple PDA.
        </p>
      </section>

      <section className="home-page__status">
        <h2 className="home-page__section-title">Current Status</h2>
        <ul className="home-page__status-list">
          <li className="home-page__status-item home-page__status-item--ready">
            <span className="home-page__status-badge home-page__status-badge--ready">Live</span>
            <strong>5-Tuple PDA Simulator</strong>Interactive pushdown automaton visualization
          </li>
          <li className="home-page__status-item home-page__status-item--wip">
            <span className="home-page__status-badge home-page__status-badge--wip">WIP</span>
            <strong>CNF Conversion</strong>Step-through Chomsky Normal Form conversion (work in progress)
          </li>
        </ul>
      </section>

      <footer className="home-page__footer">
        <p className="home-page__footer-name">Nicholas Hamilton</p>
        <div className="home-page__footer-links">
          <a
            href="https://github.com/hamiltonnBC"
            target="_blank"
            rel="noopener noreferrer"
            className="home-page__footer-badge"
          >
            <img
              src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white"
              alt="GitHub"
            />
          </a>
          <a
            href="https://www.linkedin.com/in/nicholas-trey-hamilton/"
            target="_blank"
            rel="noopener noreferrer"
            className="home-page__footer-badge"
          >
            <img
              src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white"
              alt="LinkedIn"
            />
          </a>
        </div>
      </footer>
    </div>
  );
}
