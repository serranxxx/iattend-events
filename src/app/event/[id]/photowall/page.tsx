import { PhotoWall } from "@/components/PhotoWall/PhotoWall";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PhotoWallPage({ params }: PageProps) {
  const { id } = await params;
  return <PhotoWall eventId={id} />;
}
