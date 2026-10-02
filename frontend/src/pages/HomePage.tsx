import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import Particles from '../components/Particles';
import SpecularButton from '../components/SpecularButton';
import { featuredProducts } from '../data/products';

const logo = '/assets/calmflex-logo.jpg';

export default function HomePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const keepPlaying = () => {
      if (!document.hidden && video.paused) {
        void video.play().catch(() => {});
      }
    };
    void video.play().catch(() => {});
    video.addEventListener('loadeddata', keepPlaying);
    video.addEventListener('pause', keepPlaying);
    document.addEventListener('visibilitychange', keepPlaying);
    return () => {
      video.removeEventListener('loadeddata', keepPlaying);
      video.removeEventListener('pause', keepPlaying);
      document.removeEventListener('visibilitychange', keepPlaying);
    };
  }, []);

  const toggleVideoSound = () => {
    const video = videoRef.current;
    if (!video) return;
    const nextMuted = !muted;
    video.muted = nextMuted;
    setMuted(nextMuted);
  };

  return (
    <main>
      <section className="hero">
        <Particles count={200} speed={1} interactive />
        <div className="hero-copy">
          <p className="eyebrow">Relax · Revive · Renew</p>
          <h1>
            Soften the day.
            <br />
            <em>Stretch into calm.</em>
          </h1>
          <p className="hero-text">
            Five everyday essentials to start with — then explore the full CalmFlex collection when
            you are ready.
          </p>
          <div className="hero-actions">
            <SpecularButton type="button" onClick={() => { window.location.href = '/products'; }}>
              Explore products
            </SpecularButton>
            <Link className="text-link" to="/why-calmflex">
              Why CalmFlex <span>→</span>
            </Link>
          </div>
        </div>
        <div className="hero-art" aria-label="CalmFlex lotus logo">
          <div className="orb orb-a" />
          <div className="orb orb-b" />
          <div className="swoosh" />
          <span className="sparkle" aria-hidden="true">✦</span>
          <img className="hero-logo" src={logo} alt="CalmFlex lotus mark" />
        </div>
      </section>

      <section className="trust-bar">
        <div><span className="trust-icon">✦</span>Premium quality</div>
        <div><span className="trust-icon">◌</span>Everyday wellness</div>
        <div><span className="trust-icon">⌁</span>Pan-India delivery</div>
        <div><span className="trust-icon">♡</span>Here to help</div>
      </section>

      <section className="section product-section" id="hero-products">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Start here</p>
            <h2>Hero essentials.</h2>
          </div>
          <Link className="text-link" to="/products">
            Explore all products <span>→</span>
          </Link>
        </div>
        <div className="product-grid hero-five">
          {featuredProducts.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
        <div className="explore-row">
          <Link className="button button-dark" to="/products">
            Explore the full collection <span>↗</span>
          </Link>
        </div>
      </section>

      <section className="scalp-feature" aria-labelledby="scalp-feature-title">
        <div className="scalp-feature-inner">
          <div className="scalp-feature-copy">
            <p className="eyebrow">Meet your new ritual</p>
            <h2 id="scalp-feature-title">A calmer way to care for your scalp.</h2>
            <p>
              The 3-in-1 Scalp Comb brings a soothing pause to your everyday routine. See the
              details up close, then make it part of your ritual.
            </p>
            <Link className="button scalp-feature-button" to="/products/scalp-massager">
              Discover the scalp comb <span>↗</span>
            </Link>
          </div>
          <div className="scalp-feature-media">
            <video
              ref={videoRef}
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              poster="/assets/red-scalp-massager.png"
              aria-label="CalmFlex 3-in-1 Scalp Comb product video"
            >
              <source src="/assets/scalp-comb-feature.mp4" type="video/mp4" />
              Your browser does not support embedded video.
            </video>
            <button
              className="scalp-video-sound"
              type="button"
              aria-label={muted ? 'Unmute scalp comb video' : 'Mute scalp comb video'}
              aria-pressed={!muted}
              onClick={toggleVideoSound}
            >
              {muted ? (
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z" /><path d="m16 9 5 6m0-6-5 6" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z" /><path d="M15.5 8.5a5 5 0 0 1 0 7m3-10a9 9 0 0 1 0 13" /></svg>
              )}
              <span>{muted ? 'Sound off' : 'Sound on'}</span>
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
