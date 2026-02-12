// types/db.ts

import { NewInvitation } from "./new_invitation";

export interface InvitationRow {
  id: string; // uuid (PK)
  user_id: string; // uuid → auth.users.id
  active: boolean;
  started: boolean;
  type: string | null; // puedes refinarlo con InvitationType si ya usas enums
  plan: string | null; // idem con InvitationPlan
  payment_type: string | null;
  created_at: string; // ISO string (timestampz)
  updated_at: string; // ISO string (timestampz)
  data: NewInvitation; // tu JSON de invitación completa
}
