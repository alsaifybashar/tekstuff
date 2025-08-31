import Button from "react-bootstrap/Button";

export default function StickyBuyBar({ name, price, canBuy, onAdd }) {
  return (
    <div className="d-lg-none position-fixed bottom-0 start-0 end-0 bg-white border-top p-2" style={{ zIndex: 1030 }}>
      <div className="d-flex align-items-center gap-3">
        <div className="flex-grow-1">
          <div className="small text-truncate">{name}</div>
          <div className="fw-bold">{Number(price).toFixed(0)} kr</div>
        </div>
        <Button variant="dark" size="lg" disabled={!canBuy} onClick={onAdd}>
          Lägg i varukorg
        </Button>
      </div>
    </div>
  );
}
