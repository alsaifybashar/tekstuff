export default function PriceBlock({ price, oldPrice }) {
  const p = Number(price);
  const op = oldPrice != null ? Number(oldPrice) : null;
  const discount = op && op > p ? Math.round(((op - p) / op) * 100) : null;

  return (
    <div className="d-flex align-items-center gap-3 mb-2">
      <div className="display-6 lh-1 fw-bold">{p.toFixed(0)} kr</div>
      {op && (
        <div className="text-muted text-decoration-line-through">{op.toFixed(0)} kr</div>
      )}
      {discount && (
        <span className="badge rounded-pill bg-danger-subtle text-danger fw-semibold">
          −{discount}%
        </span>
      )}
    </div>
  );
}
