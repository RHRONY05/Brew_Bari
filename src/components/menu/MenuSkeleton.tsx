// Shown before the restaurant (and its theme) is known, so it uses neutral
// colours instead of theme tokens to avoid flashing another restaurant's palette.
export function MenuSkeleton({ withGrid = true }: { withGrid?: boolean }) {
  return (
    <div className="min-h-screen bg-white p-6 max-w-4xl mx-auto flex flex-col gap-6 animate-pulse">
      <div className="h-12 w-48 bg-black/5 rounded-2xl" />
      <div className="h-[50px] w-full bg-black/5 rounded-full" />
      <div className="h-40 w-full bg-black/5 rounded-3xl" />
      {withGrid && (
        <div className="grid grid-cols-2 gap-4">
          <div className="aspect-square bg-black/5 rounded-3xl" />
          <div className="aspect-square bg-black/5 rounded-3xl" />
        </div>
      )}
    </div>
  );
}
