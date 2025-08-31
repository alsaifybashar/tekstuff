export default function TrustBadges() {
  const items = [
    ["✔", "Över 1 000 000 nöjda kunder"],
    ["🚚", "Snabba leveranser"],
    ["📦", "Fast frakt: 29 kr"],
  ];
  return (
    <ul className="list-unstyled mb-3">
      {items.map(([icon, text]) => (
        <li key={text} className="d-flex align-items-center gap-2 mb-2">
          <span aria-hidden="true">{icon}</span>
          <span className="small">{text}</span>
        </li>
      ))}
    </ul>
  );
}
