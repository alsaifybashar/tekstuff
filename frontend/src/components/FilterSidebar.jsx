import Accordion from "react-bootstrap/Accordion";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";

export default function FilterSidebar({ facets, value, onChange, onClear }) {
  const { price, brands = [], attrs = {}, rating, inStock, deals } = value;

  return (
    <div className="d-flex flex-column gap-3">
      <Accordion defaultActiveKey={["price","brand","type","connector"]} alwaysOpen>
        <Accordion.Item eventKey="price">
          <Accordion.Header>Pris</Accordion.Header>
          <Accordion.Body>
            <PriceInputs
              min={facets.price.min}
              max={facets.price.max}
              value={price || [facets.price.min, facets.price.max]}
              onChange={(v) => onChange({ price: v })}
            />
          </Accordion.Body>
        </Accordion.Item>

        <Accordion.Item eventKey="brand">
          <Accordion.Header>Märke</Accordion.Header>
          <Accordion.Body className="pt-2">
            {facets.brands.map(b => (
              <Form.Check
                key={b.value}
                type="checkbox"
                id={`brand-${b.value}`}
                label={`${b.value} (${b.count})`}
                checked={brands.includes(b.value)}
                onChange={(e) => {
                  const next = e.target.checked
                    ? [...brands, b.value]
                    : brands.filter(x => x !== b.value);
                  onChange({ brands: next });
                }}
              />
            ))}
          </Accordion.Body>
        </Accordion.Item>

        {Object.entries(facets.attrs).map(([k, values]) => (
          <Accordion.Item eventKey={k} key={k}>
            <Accordion.Header>{labelFor(k)}</Accordion.Header>
            <Accordion.Body>
              {values.map(v => (
                <Form.Check
                  key={v.value}
                  type="checkbox"
                  id={`${k}-${v.value}`}
                  label={`${v.value} (${v.count})`}
                  checked={!!(attrs[k]?.includes(v.value))}
                  onChange={(e) => {
                    const set = new Set(attrs[k] || []);
                    e.target.checked ? set.add(v.value) : set.delete(v.value);
                    onChange({ attrs: { ...attrs, [k]: [...set] } });
                  }}
                />
              ))}
            </Accordion.Body>
          </Accordion.Item>
        ))}

        <Accordion.Item eventKey="more">
          <Accordion.Header>Fler filter</Accordion.Header>
          <Accordion.Body>
            {[4,3,2,1].map(stars => (
              <Form.Check
                key={stars}
                name="rating"
                type="radio"
                id={`rating-${stars}`}
                label={`${stars}+ stjärnor`}
                checked={rating === stars}
                onChange={() => onChange({ rating: stars })}
              />
            ))}
            <div className="mt-2">
              <Form.Check
                type="switch"
                id="in-stock"
                label="Endast i lager"
                checked={!!inStock}
                onChange={(e) => onChange({ inStock: e.target.checked || undefined })}
              />
              <Form.Check
                type="switch"
                id="deals"
                label="Endast kampanj"
                checked={!!deals}
                onChange={(e) => onChange({ deals: e.target.checked || undefined })}
              />
            </div>
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>

      <div className="d-grid gap-2">
        <Button variant="outline-secondary" size="sm" onClick={onClear}>Rensa filter</Button>
      </div>
    </div>
  );
}

function PriceInputs({ min, max, value, onChange }) {
  const [lo, hi] = value;
  const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
  return (
    <div className="d-flex gap-2">
      <Form.Control
        type="number" min={min} max={hi} value={lo}
        onChange={(e) => onChange([clamp(+e.target.value, min, hi), hi])}
      />
      <span className="align-self-center">–</span>
      <Form.Control
        type="number" min={lo} max={max} value={hi}
        onChange={(e) => onChange([lo, clamp(+e.target.value, lo, max)])}
      />
    </div>
  );
}

const labelFor = (k) => ({
  type: "Produkttyp",
  connector: "Kontakt",
  cableLength: "Kabellängd"
}[k] || k);
