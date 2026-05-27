import AtletaPageSkeleton from "@/components/kronos/skeletons/AtletaPageSkeleton";

export default function Loading() {
  return (
    <AtletaPageSkeleton
      titleWidth={160}
      subtitleWidth={100}
      cardCount={2}
      listCount={4}
    />
  );
}
