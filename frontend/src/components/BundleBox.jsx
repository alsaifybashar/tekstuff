import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";

export default function BundleBox({ products = [], onAdd }) {
  if (!products.length) return null;
  return (
    <Card className="mb-3">
      <Card.Header className="fw-semibold">Köp till och få rabatt</Card.Header>
      <Card.Body className="p-0">
        <ul className="list-group list-group-flush">
          {products.slice(0, 2).map((p) => (
            <li key={p.id} className="list-group-item d-flex align-items-center gap-3">
              <img src={p.image} width="44" height="44" alt={p.title} className="object-fit-contain" />
              <div className="flex-grow-1 small">{p.title}</div>
              <div className="fw-semibold">{p.price}</div>
              <input type="checkbox" aria-label={`Lägg till ${p.title}`} />
            </li>
          ))}
        </ul>
      </Card.Body>
      <Card.Footer>
        <Button variant="dark" className="w-100" onClick={onAdd}>Lägg paket i varukorg</Button>
      </Card.Footer>
    </Card>
  );
}
