export interface Player {
  name: string;
  overall: number;
  position: 'DEF' | 'MID' | 'ATT';
}

export interface TeamRequest {
  players: Player[];
  num_teams: number;
  time_limit: number;
  num_attempts: number;
}

export interface TeamOutput {
  team_number: number;
  players: Player[];
  average_rating: number;
  position_distribution: {
    DEF: number;
    MID: number;
    ATT: number;
  };
  total_rating: number;
}

export interface BalanceResponse {
  teams: TeamOutput[];
  overall_mean: number;
  max_rating_difference: number;
} 