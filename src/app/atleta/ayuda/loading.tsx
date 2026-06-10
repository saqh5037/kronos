export default function AyudaLoading() {
  return (
    <div className="px-4 py-6 flex flex-col gap-4">
      <div className="k-skeleton h-7 w-40 rounded-lg" />
      <div className="k-skeleton h-4 w-full rounded-md" />
      <div className="k-skeleton h-4 w-3/4 rounded-md" />
      <div className="k-skeleton h-32 w-full rounded-xl mt-2" />
      <div className="k-skeleton h-32 w-full rounded-xl" />
    </div>
  );
}
