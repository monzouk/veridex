export default function AppLoading() {
  return (
    <div className="subpage-container loading-container" aria-busy="true" aria-label="Loading workspace">
      <div className="skeleton-header">
        <div className="skeleton skeleton-eyebrow" />
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-desc" />
      </div>

      <div className="skeleton-grid">
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
      </div>

      <div className="skeleton skeleton-hero" />
    </div>
  );
}
