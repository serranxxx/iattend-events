import type { IconType } from "react-icons";

import {
  BiParty, BiChurch, BiDrink, BiSolidDrink,
} from "react-icons/bi";
import { AiOutlineCarryOut, AiOutlineCoffee, AiOutlineGift, AiOutlineMail } from "react-icons/ai";
import {
  BsAlarm, BsArrowThroughHeart, BsBagHeartFill, BsBell, BsBookmarkHeart, BsBookmarkStar,
  BsBox2Heart, BsCake, BsCake2, BsCalendar2Check, BsCalendar2Heart, BsCalendarHeart,
  BsChatDots, BsChatRightDots, BsChatRightHeart, BsChatSquareDots, BsChatSquareHeart,
  BsClipboard2Heart, BsClipboardCheck, BsClock, BsCloudMoon, BsDice5, BsEmojiLaughing,
  BsEnvelope, BsEnvelopePaperHeart, BsFillBalloonHeartFill, BsFillBalloonFill, BsFillBagHeartFill,
  BsFillBrightnessHighFill, BsGift, BsHeart, BsHearts, BsHouse, BsMegaphone, BsPalette,
  BsPatchExclamation, BsPostcardHeart, BsPostcard, BsSignpost, BsSignpost2, BsSuitHeart,
  BsTrainFront, BsTrash3, BsTree, BsTrophy, BsUmbrella,
} from "react-icons/bs";
import { FaFeather, FaBeer } from "react-icons/fa";
import { LuChurch } from "react-icons/lu";
import { MdDinnerDining, MdOutlineFoodBank } from "react-icons/md";
import { IoFastFoodOutline } from "react-icons/io5";

export type ItineraryIcon = {
  index: number;
  value: IconType;
};

export const iconsItinerary = [
  { index: 1, value: BiParty },
  { index: 2, value: AiOutlineCarryOut },
  { index: 3, value: AiOutlineCoffee },
  { index: 4, value: AiOutlineGift },
  { index: 5, value: AiOutlineMail },
  { index: 6, value: BsAlarm },
  { index: 7, value: BsArrowThroughHeart },
  { index: 8, value: BsBagHeartFill },
  { index: 9, value: BsBell },
  { index: 10, value: BsBookmarkHeart },
  { index: 11, value: BsBookmarkStar },
  { index: 12, value: BsBox2Heart },
  { index: 13, value: BsCake },
  { index: 14, value: BsCake2 },
  { index: 15, value: BsCalendar2Check },
  { index: 16, value: BsCalendar2Heart },
  { index: 17, value: BsCalendarHeart },
  { index: 18, value: BsChatDots },
  { index: 19, value: BsChatRightDots },
  { index: 20, value: BsChatRightHeart },
  { index: 21, value: BsChatSquareDots },
  { index: 22, value: BsChatSquareHeart },
  { index: 23, value: BsClipboard2Heart },
  { index: 24, value: BsClipboardCheck },
  { index: 25, value: BsClock },
  { index: 26, value: BsCloudMoon },
  { index: 27, value: BsDice5 },
  { index: 28, value: BsEmojiLaughing },
  { index: 29, value: BsEnvelope },
  { index: 30, value: BsEnvelopePaperHeart },
  { index: 31, value: BsFillBalloonHeartFill },
  { index: 32, value: BsFillBalloonFill },
  { index: 33, value: BsFillBagHeartFill },
  { index: 34, value: BsFillBrightnessHighFill },
  { index: 35, value: BsGift },
  { index: 36, value: BsHeart },
  { index: 37, value: BsHearts },
  { index: 38, value: BsHouse },
  { index: 39, value: BsMegaphone },
  { index: 40, value: BsPalette },
  { index: 41, value: BsPatchExclamation },
  { index: 42, value: BsPostcardHeart },
  { index: 43, value: BsPostcard },
  { index: 44, value: BsSignpost },
  { index: 45, value: BsSignpost2 },
  { index: 46, value: BsSuitHeart },
  { index: 47, value: BsTrainFront },
  { index: 48, value: BsTrash3 },
  { index: 49, value: BsTree },
  { index: 50, value: BsTrophy },
  { index: 51, value: BsUmbrella },
  { index: 52, value: FaFeather },
  { index: 53, value: FaBeer },
  { index: 54, value: BiChurch },
  { index: 55, value: LuChurch },
  { index: 56, value: MdDinnerDining },
  { index: 57, value: MdOutlineFoodBank },
  { index: 58, value: IoFastFoodOutline },
  { index: 59, value: BiDrink },
  { index: 60, value: BiSolidDrink },
] satisfies ReadonlyArray<ItineraryIcon>;

// (Opcional) helper seguro por índice:
export type ItineraryIconId = typeof iconsItinerary[number]["index"];
export const getItineraryIcon = (id: ItineraryIconId): IconType | undefined =>
  iconsItinerary.find(x => x.index === id)?.value;