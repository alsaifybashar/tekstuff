import Button from "react-bootstrap/Button";
import { useCart } from "../context/CartContext";

export default function AddToCartButton({ id, qty = 1, size = "sm", className = "" }) {
  const { add } = useCart();
  return (
    <Button
      size={size}
      className={className}
      onClick={() => add(id, qty)}
      aria-label="Lägg i kundvagnen"
    >
      Lägg i kundvagn
    </Button>
  );
}
