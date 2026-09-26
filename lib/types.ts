export type Feed = {
  id: string;
  occurred_at: string;
  amount_ml: number;
  milk_type: "breast_milk" | "formula";
  note?: string | null;
  logged_by?: string | null;
};

export type Diaper = {
  id: string;
  occurred_at: string;
  kind: "wet" | "dirty" | "both";
  note?: string | null;
  logged_by?: string | null;
};

export type Sleep = {
  id: string;
  started_at: string;
  ended_at?: string | null;
  note?: string | null;
  logged_by?: string | null;
};

export type Pump = {
  id: string;
  occurred_at: string;
  left_ml: number;
  right_ml: number;
  note?: string | null;
  logged_by?: string | null;
};
