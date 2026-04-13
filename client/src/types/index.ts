export type EventType = 'LEAGUE' | 'TOURNAMENT';
export type EventStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID';
export type PaymentMethod = 'CASH' | 'E_TRANSFER' | 'OTHER';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Player {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  instagram_handle: string | null;
  notes: string | null;
  created_at: string;
  event_players?: EventPlayer[];
}

export interface Event {
  id: string;
  user_id: string;
  name: string;
  type: EventType;
  organization: string;
  location: string | null;
  total_cost: number;
  start_date: string;
  end_date: string | null;
  days_of_week: string | null;
  status: EventStatus;
  is_captain: boolean;
  captain_share: number;
  personal_amount_owed: number | null;
  personal_amount_paid: number;
  personal_payment_status: PaymentStatus;
  created_at: string;
  event_players?: EventPlayer[];
}

export interface EventPlayer {
  id: string;
  event_id: string;
  player_id: string;
  amount_owed: number;
  amount_paid: number;
  payment_status: PaymentStatus;
  is_amount_custom: boolean;
  created_at: string;
  player?: Player;
  event?: Event;
  payments?: Payment[];
}

export interface Payment {
  id: string;
  event_player_id: string;
  amount: number;
  date: string;
  method: PaymentMethod;
  notes: string | null;
  created_at: string;
}

export interface DashboardActiveEvent {
  id: string;
  name: string;
  organization: string;
  days_of_week: string | null;
  total_cost: number;
  is_captain: boolean;
  total_collected: number;
  total_outstanding: number;
  player_count: number;
  personal_amount_owed?: number;
  personal_amount_paid?: number;
  personal_payment_status?: PaymentStatus;
}

export interface DashboardSummary {
  total_owed: number;
  active_events_count: number;
  collected_this_month: number;
  spent_this_year: number;
  active_events: DashboardActiveEvent[];
  upcoming_schedule: {
    id: string;
    name: string;
    days_of_week: string | null;
    organization: string;
    is_captain: boolean;
  }[];
}
