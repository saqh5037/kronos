import AtletaPageSkeleton from "@/components/kronos/skeletons/AtletaPageSkeleton";

export default function Loading() {
  return (
    <AtletaPageSkeleton
      titleWidth={220}
      subtitleWidth={140}
      cardCount={0}
      showList={false}
    />
  );
}
