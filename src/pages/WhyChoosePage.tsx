import { Link } from 'react-router-dom';

const reasons = [
  {
    title: 'Thoughtful, not noisy',
    copy: 'We keep the catalog small on purpose — practical tools you will actually use, not a shelf of unused gadgets.'
  },
  {
    title: 'Rituals that fit real days',
    copy: 'From a two-minute face roll to a back stretch after work, every piece is chosen for everyday India life.'
  },
  {
    title: 'Quality you can feel',
    copy: 'Materials, finish and comfort come first. If it does not earn a place in a calm routine, it does not ship.'
  },
  {
    title: 'Pan-India, with care',
    copy: 'Free shipping above ₹499, simple support, and packing that treats your order like a gift to yourself.'
  }
];

export default function WhyChoosePage() {
  return (
    <main>
      <section className="why-hero">
        <p className="eyebrow">Why choose CalmFlex</p>
        <h1>
          Wellness should feel
          <br />
          <em>simple, kind, repeatable.</em>
        </h1>
        <p className="hero-text">
          CalmFlex exists for people who want to relax, revive and renew without turning self-care into a second job.
        </p>
        <Link className="button button-dark" to="/products">
          Explore products <span>↗</span>
        </Link>
      </section>

      <section className="page-shell why-reasons">
        <div className="reason-grid">
          {reasons.map((reason, index) => (
            <article className="reason-card" key={reason.title}>
              <span>0{index + 1}</span>
              <h2>{reason.title}</h2>
              <p>{reason.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="pillars">
        <p className="eyebrow">The CalmFlex way</p>
        <h2>Three words. One ritual.</h2>
        <div className="pillar-grid">
          <article className="pillar pillar-relax">
            <div className="pillar-mark">Relax</div>
            <h3>Let the day loosen.</h3>
            <p>Massage, stretch and slower evenings that help your body remember how to rest.</p>
          </article>
          <article className="pillar pillar-revive">
            <div className="pillar-mark">Revive</div>
            <h3>Come back to yourself.</h3>
            <p>Glow tools and gentle movement for that first stretch of a clearer morning.</p>
          </article>
          <article className="pillar pillar-renew">
            <div className="pillar-mark">Renew</div>
            <h3>Keep showing up.</h3>
            <p>Everyday pieces that make wellness feel simple enough to repeat.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
