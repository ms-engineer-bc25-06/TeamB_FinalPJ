export type UserResponse = {
  id: string;
  uid: string;
  email: string;
  nickname: string | null;
  email_verified: boolean;
  role: string;
  created_at: string; // ISO 8601形式の日時文字列
  updated_at: string; // ISO 8601形式の日時文字列
};
