'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { Player, TeamOutput } from '@/types';
import { useMutation } from '@tanstack/react-query';
import { balanceTeamsWithCSV, balanceTeamsWithJSON } from '@/lib/api';

export default function Home() {
  const [inputMethod, setInputMethod] = useState<'file' | 'manual'>('file');
  const [players, setPlayers] = useState<Player[]>([]);

  const { register, handleSubmit, formState: { errors } } = useForm<{
    file: FileList;
  }>();

  const { mutate: balanceWithCSV, isPending: isCSVPending } = useMutation({
    mutationFn: (file: File) => balanceTeamsWithCSV(file),
  });

  const { mutate: balanceWithJSON, isPending: isJSONPending, data: teams } = useMutation({
    mutationFn: (players: Player[]) => balanceTeamsWithJSON(players),
  });

  const handleFileUpload = async (data: { file: FileList }) => {
    balanceWithCSV(data.file[0]);
  };

  const handleManualSubmit = async () => {
    if (players.length < 4) {
      alert('Please add at least 4 players');
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

  const isLoading = isCSVPending || isJSONPending;

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8 text-center">Team Balancer</h1>
      
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <div className="flex gap-4 mb-6">
          <button
            className={`flex-1 py-2 px-4 rounded ${
              inputMethod === 'file' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
            onClick={() => setInputMethod('file')}
          >
            Upload CSV
          </button>
          <button
            className={`flex-1 py-2 px-4 rounded ${
              inputMethod === 'manual' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}
            onClick={() => setInputMethod('manual')}
          >
            Add Players Manually
          </button>
        </div>

        {inputMethod === 'file' ? (
          <form onSubmit={handleSubmit(handleFileUpload)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Upload Players CSV
              </label>
              <input
                type="file"
                accept=".csv"
                {...register('file', { required: true })}
                className="w-full border rounded p-2"
              />
              {errors.file && (
                <span className="text-red-500">Please select a file</span>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2 px-4 rounded ${
                isLoading
                  ? 'bg-gray-400'
                  : 'bg-blue-500 hover:bg-blue-600'
              } text-white`}
            >
              {isLoading ? 'Balancing Teams...' : 'Balance Teams'}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <form onSubmit={handleAddPlayer} className="grid grid-cols-2 gap-4">
              <input
                name="name"
                required
                placeholder="Player Name"
                className="border rounded p-2"
              />
              <input
                name="overall"
                type="number"
                required
                step="0.1"
                min="0"
                max="5"
                placeholder="Rating (0-5)"
                className="border rounded p-2"
              />
              <select
                name="position"
                required
                className="border rounded p-2"
              >
                <option value="">Select Position</option>
                <option value="DEF">DEF</option>
                <option value="MID">MID</option>
                <option value="ATT">ATT</option>
              </select>
              <button
                type="submit"
                className="bg-green-500 text-white rounded py-2"
              >
                Add Player
              </button>
            </form>

            {players.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Added Players:</h3>
                <div className="max-h-40 overflow-y-auto mb-4">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-left">Name</th>
                        <th className="text-left">Rating</th>
                        <th className="text-left">Position</th>
                      </tr>
                    </thead>
                    <tbody>
                      {players.map((player, index) => (
                        <tr key={index}>
                          <td>{player.name}</td>
                          <td>{player.overall}</td>
                          <td>{player.position}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  onClick={handleManualSubmit}
                  disabled={isLoading}
                  className={`w-full py-2 px-4 rounded ${
                    isLoading
                      ? 'bg-gray-400'
                      : 'bg-blue-500 hover:bg-blue-600'
                  } text-white`}
                >
                  {isLoading ? 'Balancing Teams...' : 'Balance Teams'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {teams && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Results</h2>
            <div className="mb-4">
              <p>Overall Mean Rating: {teams.overall_mean.toFixed(2)}</p>
              <p>Maximum Rating Difference: {teams.max_rating_difference.toFixed(2)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {teams.teams.map((team: TeamOutput) => (
              <div
                key={team.team_number}
                className="bg-white rounded-lg shadow-lg p-6"
              >
                <h3 className="text-xl font-bold mb-4">
                  Team {team.team_number}
                </h3>
                <p className="mb-2">Average Rating: {team.average_rating.toFixed(2)}</p>
                <div className="mb-4">
                  <h4 className="font-semibold">Position Distribution:</h4>
                  <p>DEF: {team.position_distribution.DEF}</p>
                  <p>MID: {team.position_distribution.MID}</p>
                  <p>ATT: {team.position_distribution.ATT}</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Players:</h4>
                  <div className="space-y-2">
                    {team.players.map((player: Player, index: number) => (
                      <div
                        key={index}
                        className="flex justify-between items-center border-b py-1"
                      >
                        <span>{player.name}</span>
                        <span className="text-gray-600">
                          {player.position} ({player.overall})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
} 