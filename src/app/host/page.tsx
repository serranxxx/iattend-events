import { getTextures } from "@/lib/textures/cache";
import { getGiftBrands } from "@/lib/giftBrands/cache";
import HostClient from "./HostClient";

export default async function Page() {
  const textures = await getTextures({ includeInactive: true });
  const giftBrands = await getGiftBrands();
  return <HostClient textures={textures} giftBrands={giftBrands} />;
}
