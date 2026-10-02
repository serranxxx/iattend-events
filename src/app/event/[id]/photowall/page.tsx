import { notFound } from "next/navigation";
import { PhotoWall } from "@/components/PhotoWall/PhotoWall";
import { getPublicServerClient } from "@/lib/supabase/public-server";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ title?: string }>;
};

export default async function PhotoWallPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { title } = await searchParams;

  // El Photo Wall es exclusivo del plan Pro, igual que dentro de la invitación.
  const { data: invitation, error } = await getPublicServerClient()
    .from("invitations")
    .select("plan")
    .eq("id", id)
    .maybeSingle();

  if (error || invitation?.plan !== "pro") notFound();

  return <PhotoWall eventId={id} eventTitle={title} />;
}
