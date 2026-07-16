// components/VoteBadge.tsx
export default function VoteBadge({ sentiment }: { sentiment: "good" | "bad" }) {
  const isGood = sentiment === "good";
  return (
    <span
      className={
        "text-xs px-2 py-0.5 rounded " +
        (isGood ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800")
      }
    >
      {isGood ? "良い" : "悪い"}
    </span>
  );
}
