import axios from 'axios';
import type { BalanceResponse, Player } from '@/types';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

export const balanceTeamsWithCSV = async (file: File, numTeams: number): Promise<BalanceResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const { data } = await api.post<BalanceResponse>('/balance/csv', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    params: {
      num_teams: numTeams,
      time_limit: 30,
      num_attempts: 5,
    },
  });

  return data;
};

export const balanceTeamsWithJSON = async (players: Player[], numTeams: number): Promise<BalanceResponse> => {
  const { data } = await api.post<BalanceResponse>('/balance/json', {
    players,
    num_teams: numTeams,
    time_limit: 30,
    num_attempts: 5,
  });

  return data;
}; 