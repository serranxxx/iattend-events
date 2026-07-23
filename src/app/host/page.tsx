import { getTextures } from "@/lib/textures/cache";
import HostClient from "./HostClient";

export default async function Page() {
  const textures = await getTextures({ includeInactive: true });
  return <HostClient textures={textures} />;
}
