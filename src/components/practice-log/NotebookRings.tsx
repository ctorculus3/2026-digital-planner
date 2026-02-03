export function NotebookRings() {
  return (
    <div className="flex flex-col gap-8 py-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="w-4 h-4 rounded-full bg-ring-color shadow-inner border-2 border-ring-color/80"
          style={{
            boxShadow: "inset 2px 2px 4px rgba(0,0,0,0.3), 1px 1px 2px rgba(0,0,0,0.2)"
          }}
        />
      ))}
    </div>
  );
}
