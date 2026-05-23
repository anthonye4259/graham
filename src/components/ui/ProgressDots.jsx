export default function ProgressDots({ current, total }) {
  return (
    <div className="ob-progress">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className={`ob-dot ${i < current ? 'done' : ''} ${i === current ? 'active' : ''}`} />
      ))}
    </div>
  );
}
