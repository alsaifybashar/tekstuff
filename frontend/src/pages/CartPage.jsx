import { useMemo } from "react";
import { Link } from "react-router-dom";
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Alert from "react-bootstrap/Alert";
import { useCart } from "../context/CartContext";
import { getProductById } from "../services/catalog";

export default function CartPage() {
  const { items, setQty, remove, clear } = useCart();

  const rows = useMemo(() => {
    return Object.entries(items).map(([id, qty]) => {
      const p = getProductById(id);
      return p ? { ...p, qty } : null;
    }).filter(Boolean);
  }, [items]);

  const totals = useMemo(() => {
    const subtotal = rows.reduce((sum, r) => sum + r.price * r.qty, 0);
    return { subtotal };
  }, [rows]);

  if (!rows.length) {
    return (
      <div className="container py-5">
        <Alert variant="info" className="d-flex align-items-center justify-content-between">
          <span>Din kundvagn är tom.</span>
          <Button as={Link} to="/" variant="primary">Fortsätt handla</Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h4 m-0">Kundvagn</h1>
        <Button variant="outline-danger" onClick={() => clear()}>Töm kundvagnen</Button>
      </div>

      <Table responsive bordered hover className="align-middle">
        <thead>
          <tr>
            <th>Produkt</th>
            <th style={{width:120}}>Pris</th>
            <th style={{width:140}}>Antal</th>
            <th style={{width:140}}>Summa</th>
            <th style={{width:70}} aria-label="Ta bort" />
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.id}>
              <td className="d-flex gap-3 align-items-center">
                <img src={row.image} alt="" width="64" height="64" style={{objectFit:"cover"}} />
                <div>
                  <div className="fw-semibold">{row.title}</div>
                  <div className="text-muted small">{row.brand}</div>
                </div>
              </td>
              <td>{row.price} kr</td>
              <td>
                <Form.Control
                  type="number"
                  min={0}
                  value={row.qty}
                  onChange={(e) => {
                    const v = Math.max(0, Math.floor(+e.target.value || 0));
                    setQty(row.id, v);
                  }}
                />
              </td>
              <td>{row.price * row.qty} kr</td>
              <td>
                <Button variant="outline-secondary" size="sm" onClick={() => remove(row.id)}>
                  Ta bort
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <div className="d-flex justify-content-end">
        <div className="border rounded p-3" style={{minWidth: 320}}>
          <div className="d-flex justify-content-between">
            <span className="fw-semibold">Delsumma</span>
            <span>{totals.subtotal} kr</span>
          </div>
          <div className="text-muted small mt-1">Frakt och moms tillkommer i nästa steg.</div>
          <Button variant="primary" className="w-100 mt-3">Till kassan</Button>
        </div>
      </div>
    </div>
  );
}
