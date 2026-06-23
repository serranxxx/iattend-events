import { PhotoWall } from "@/components/PhotoWall/PhotoWall";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ title?: string }>;
};

export default async function PhotoWallPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { title } = await searchParams;
  return <PhotoWall eventId={id} eventTitle={title} />;
}
