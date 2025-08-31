import Stack from "react-bootstrap/Stack";

export default function RatingStars({ value = 0, count }) {
  const full = Math.round(value);
  return (
    <Stack direction="horizontal" gap={2} className="text-warning">
      <span aria-label={`${value} of 5`}>
        {"★".repeat(full)}{"☆".repeat(5 - full)}
      </span>
      {typeof count === "number" && (
        <small className="text-muted">{count} omdömen</small>
      )}
    </Stack>
  );
}
