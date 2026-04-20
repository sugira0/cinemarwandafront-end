import './Skeleton.css';

export function SkeletonCard() {
  return (
    <div className="sk-card">
      <div className="sk-poster sk-shine" />
      <div className="sk-info">
        <div className="sk-line sk-shine" style={{ width: '80%' }} />
        <div className="sk-line sk-shine" style={{ width: '50%' }} />
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="sk-row">
      <div className="sk-row-title sk-shine" />
      <div className="sk-row-track">
        {Array.from({ length: 7 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    </div>
  );
}

export function SkeletonHero() {
  return <div className="sk-hero sk-shine" />;
}
