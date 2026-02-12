import { homeCards, navItems } from "@/types/app";
import { BsClipboard, BsClipboardFill } from "react-icons/bs";
import { HiEnvelopeOpen, HiOutlineEnvelope } from "react-icons/hi2";
import { IoPricetags, IoPricetagsOutline } from "react-icons/io5";
import { MdAdminPanelSettings, MdBubbleChart, MdDevices, MdOutlineAdminPanelSettings, MdOutlineTimeline } from "react-icons/md";
import { RiUserStarFill, RiUserStarLine } from "react-icons/ri";

export const NavItems: navItems[] = [
  {
    name: "Explora",
    icon: HiOutlineEnvelope,
    selected: HiEnvelopeOpen,
    path: "/home",
    position: "home",
  },
  {
    name: "Conoce",
    icon: IoPricetagsOutline,
    selected: IoPricetags,
    path: "/pricing",
    position: "pricing",
  },
  {
    name: "Tablero",
    icon: BsClipboard,
    selected: BsClipboardFill,
    path: "/invitations",
    position: "invitations",
  },
  {
    name: "Empresa",
    icon: RiUserStarLine,
    selected: RiUserStarFill,
    path: "",
    position: "distributor",
  },
  {
    name: "Admin",
    icon: MdOutlineAdminPanelSettings,
    selected: MdAdminPanelSettings,
    path: "/admin",
    position: "admin",
  },
];


export const HomeCards: homeCards[] = [
  {
      icon: MdBubbleChart,
      title: "Personalización Total",
      text: "Elige entre una amplia variedad de paletas de colores y tipografías, y ajusta cada elemento de la invitación para reflejar perfectamente el tema de tu evento.",
      // image: images.itinerary,
  },
  {
      icon: MdDevices,
      title: "Flexibilidad en el Diseño",
      text: "Reorganiza los elementos a tu gusto, cambia imágenes, colores, y más. La libertad creativa está en tus manos para hacer que cada invitación sea única.",
      // image: images.gallery,
  },
  {
      icon: MdOutlineTimeline,
      title: "Previsualización en Tiempo Real",
      text: "	Diseña y visualiza tu invitación en tiempo real. Haz ajustes al instante y asegúrate de que todo luzca perfecto antes de enviarla.",
      // image: images.settings,
  }
]