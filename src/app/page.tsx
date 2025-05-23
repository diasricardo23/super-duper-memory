'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { Player, TeamOutput } from '@/types';
import { useMutation } from '@tanstack/react-query';
import { balanceTeamsWithCSV, balanceTeamsWithJSON } from '@/lib/api';
import axios from 'axios';

const positionOrder = {
  'DEF': 0,
  'MID': 1,
  'ATT': 2,
} as const;

export default function Home() {
  const [inputMethod, setInputMethod] = useState<'file' | 'manual'>('file');
  const [players, setPlayers] = useState<Player[]>([]);
  const [numTeams, setNumTeams] = useState(4);
  const [showMetadata, setShowMetadata] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<{
    file: FileList;
  }>();

  const { mutate: balanceWithCSV, isPending: isCSVPending, data: csvTeams, error: csvError } = useMutation({
    mutationFn: (file: File) => balanceTeamsWithCSV(file, numTeams),
    onError: (error) => {
      console.error('Erro ao balancear times (CSV):', {
        mensagem: error.message,
        numTeams,
        isAxiosError: axios.isAxiosError(error),
        response: axios.isAxiosError(error) ? error.response?.data : undefined
      });
      
      let errorMessage = 'Erro ao sortear os times. ';
      if (axios.isAxiosError(error) && error.response?.data) {
        errorMessage += typeof error.response.data === 'string' 
          ? error.response.data
          : 'Verifique o console para mais detalhes.';
      } else {
        errorMessage += 'Por favor, tente novamente com menos times ou ajuste os níveis dos jogadores.';
      }
      
      alert(errorMessage);
    }
  });

  const { mutate: balanceWithJSON, isPending: isJSONPending, data: jsonTeams, error: jsonError } = useMutation({
    mutationFn: (players: Player[]) => balanceTeamsWithJSON(players, numTeams),
    onError: (error) => {
      console.error('Erro ao balancear times (JSON):', {
        mensagem: error.message,
        numTeams,
        numJogadores: players.length,
        isAxiosError: axios.isAxiosError(error),
        response: axios.isAxiosError(error) ? error.response?.data : undefined,
        distribuicaoPosicoes: players.reduce((acc, player) => {
          acc[player.position] = (acc[player.position] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      });

      let errorMessage = 'Erro ao sortear os times. ';
      if (axios.isAxiosError(error) && error.response?.data) {
        errorMessage += typeof error.response.data === 'string' 
          ? error.response.data
          : 'Verifique o console para mais detalhes.';
      } else {
        errorMessage += 'Por favor, tente novamente com menos times ou ajuste os níveis dos jogadores.';
      }
      
      alert(errorMessage);
    }
  });

  const teams = csvTeams || jsonTeams;
  const isLoading = isCSVPending || isJSONPending;
  const error = csvError || jsonError;

  const handleFileUpload = async (data: { file: FileList }) => {
    balanceWithCSV(data.file[0]);
  };

  const handleManualSubmit = async () => {
    if (players.length < 4) {
      alert('Por favor, adicione pelo menos 4 jogadores para o sorteio');
      return;
    }

    balanceWithJSON(players);
  };

  const handleAddPlayer = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const newPlayer: Player = {
      name: formData.get('name') as string,
      overall: parseFloat(formData.get('overall') as string),
      position: formData.get('position') as 'DEF' | 'MID' | 'ATT',
    };

    setPlayers([...players, newPlayer]);
    form.reset();
  };

  const sortPlayersByPosition = (players: Player[]) => {
    return [...players].sort((a, b) => {
      const posA = positionOrder[a.position];
      const posB = positionOrder[b.position];
      if (posA !== posB) {
        return posA - posB;
      }
      // If positions are the same, sort by rating (highest first)
      return b.overall - a.overall;
    });
  };

  return (
    <main className="min-h-screen p-8 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-center">Sorteio de Times</h1>
      
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8 max-w-4xl mx-auto">
        <div className="flex gap-4 mb-6">
          <button
            className={`flex-1 py-2 px-4 rounded ${
              inputMethod === 'file' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
            onClick={() => setInputMethod('file')}
          >
            Enviar Lista CSV
          </button>
          <button
            className={`flex-1 py-2 px-4 rounded ${
              inputMethod === 'manual' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
            onClick={() => setInputMethod('manual')}
          >
            Adicionar Jogadores na Lista
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Quantidade de Times
          </label>
          <input
            type="number"
            min="2"
            max="10"
            value={numTeams}
            onChange={(e) => setNumTeams(parseInt(e.target.value))}
            className="w-full border rounded p-2"
          />
          <p className="text-sm text-gray-500 mt-1">
            Mínimo: 2 times, Máximo: 10 times
          </p>
        </div>

        {inputMethod === 'file' ? (
          <form onSubmit={handleSubmit(handleFileUpload)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Enviar Lista de Jogadores (CSV)
              </label>
              <input
                type="file"
                accept=".csv"
                {...register('file', { required: true })}
                className="w-full border rounded p-2"
              />
              {errors.file && (
                <span className="text-red-500">Por favor, selecione um arquivo</span>
              )}
            </div>
            <div className="flex gap-4 items-center">
              <button
                type="submit"
                disabled={isLoading}
                className={`flex-1 py-2 px-4 rounded ${
                  isLoading
                    ? 'bg-gray-400'
                    : 'bg-blue-500 hover:bg-blue-600'
                } text-white`}
              >
                {isLoading ? 'Sorteando Times...' : 'Sortear Times'}
              </button>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showMetadata"
                  checked={showMetadata}
                  onChange={(e) => setShowMetadata(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300"
                />
                <label htmlFor="showMetadata" className="text-sm text-gray-700">
                  Mostrar estatísticas avançadas
                </label>
              </div>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            <form onSubmit={handleAddPlayer} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  name="name"
                  required
                  placeholder="Nome do Jogador"
                  className="w-full border rounded p-2"
                />
                <input
                  name="overall"
                  type="number"
                  required
                  step="0.1"
                  min="0"
                  max="5"
                  placeholder="Nível (0-5)"
                  className="w-full border rounded p-2"
                />
                <select
                  name="position"
                  required
                  className="w-full border rounded p-2"
                >
                  <option value="">Selecione a Posição</option>
                  <option value="DEF">Defesa</option>
                  <option value="MID">Meio</option>
                  <option value="ATT">Ataque</option>
                </select>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-green-500 hover:bg-green-600 text-white rounded py-2 px-6"
                >
                  Adicionar à Lista
                </button>
              </div>
            </form>

            {players.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Lista de Jogadores:</h3>
                <div className="max-h-40 overflow-y-auto mb-4 bg-gray-50 rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-100 sticky top-0">
                      <tr>
                        <th className="text-left p-2">Nome</th>
                        <th className="text-left p-2">Nível</th>
                        <th className="text-left p-2">Posição</th>
                      </tr>
                    </thead>
                    <tbody>
                      {players.map((player, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="p-2">{player.name}</td>
                          <td className="p-2">{player.overall}</td>
                          <td className="p-2">
                            <span className={`text-sm px-2 py-1 rounded ${
                              player.position === 'DEF' ? 'bg-blue-100 text-blue-800' :
                              player.position === 'MID' ? 'bg-green-100 text-green-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {player.position === 'DEF' ? 'Defesa' : player.position === 'MID' ? 'Meio' : 'Ataque'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex gap-4 items-center">
                  <button
                    onClick={handleManualSubmit}
                    disabled={isLoading}
                    className={`flex-1 py-2 px-4 rounded ${
                      isLoading
                        ? 'bg-gray-400'
                        : 'bg-blue-500 hover:bg-blue-600'
                    } text-white`}
                  >
                    {isLoading ? 'Sorteando Times...' : 'Sortear Times'}
                  </button>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="showMetadataManual"
                      checked={showMetadata}
                      onChange={(e) => setShowMetadata(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300"
                    />
                    <label htmlFor="showMetadataManual" className="text-sm text-gray-700">
                      Mostrar estatísticas avançadas
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-8">
          <p>Erro ao balancear os times. Por favor, tente novamente.</p>
        </div>
      )}

      {teams && (
        <div className="space-y-6">
          {showMetadata && (
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-4">Estatísticas do Sorteio</h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-800 font-semibold">Média dos Times</p>
                  <p className="text-2xl font-bold text-blue-900">{teams.overall_mean.toFixed(2)}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-800 font-semibold">Diferença entre Times</p>
                  <p className="text-2xl font-bold text-green-900">{teams.max_rating_difference.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}

          <div className={`grid gap-6 ${
            teams.teams.length <= 2 ? 'grid-cols-2' :
            teams.teams.length <= 3 ? 'grid-cols-3' :
            teams.teams.length <= 4 ? 'grid-cols-4' :
            'grid-cols-5'
          }`}>
            {teams.teams.map((team: TeamOutput) => {
              const sortedPlayers = sortPlayersByPosition(team.players);
              
              return (
                <div
                  key={team.team_number}
                  className="bg-white rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold">Time {team.team_number}</h3>
                    {showMetadata && (
                      <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">
                        Nível Médio: {team.average_rating.toFixed(2)}
                      </span>
                    )}
                  </div>
                  
                  {showMetadata && (
                    <div className="grid grid-cols-3 gap-1 mb-4 bg-gray-50 rounded-lg p-2 text-sm">
                      <div className="text-center">
                        <p className="text-xs text-gray-600">Defesa</p>
                        <p className="font-bold">{team.position_distribution.DEF}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-600">Meio</p>
                        <p className="font-bold">{team.position_distribution.MID}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-600">Ataque</p>
                        <p className="font-bold">{team.position_distribution.ATT}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold mb-2 text-gray-700 text-sm">Lista de Jogadores</h4>
                    <div className="space-y-1">
                      {sortedPlayers.map((player: Player, index: number) => (
                        <div
                          key={index}
                          className="flex justify-between items-center border-b border-gray-100 py-1 hover:bg-gray-50 rounded px-2 text-sm"
                        >
                          <span className="font-medium">{player.name}</span>
                          <div className="flex items-center gap-1">
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              player.position === 'DEF' ? 'bg-blue-100 text-blue-800' :
                              player.position === 'MID' ? 'bg-green-100 text-green-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {player.position === 'DEF' ? 'Defesa' : player.position === 'MID' ? 'Meio' : 'Ataque'}
                            </span>
                            {showMetadata && (
                              <span className="text-gray-600 font-mono bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                                {player.overall.toFixed(1)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
} 