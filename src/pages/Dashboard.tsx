
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { AdherenceSummary } from '@/types/supabase';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { format, parseISO, subDays, startOfWeek } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();
  const [adherence, setAdherence] = useState<AdherenceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAdherenceData() {
      try {
        if (!user) return;

        const startDate = format(startOfWeek(subDays(new Date(), 7)), 'yyyy-MM-dd');
        const endDate = format(new Date(), 'yyyy-MM-dd');
        
        const { data, error } = await supabase.rpc('get_adherence_summary', {
          start_date: startDate,
          end_date: endDate
        });

        if (error) {
          console.error('Error fetching adherence data:', error);
          return;
        }

        if (data && data.length > 0) {
          // Type casting to ensure the data matches our AdherenceSummary type
          const typedData: AdherenceSummary = {
            adherence_percentage: data[0].adherence_percentage,
            missed_medications: data[0].missed_medications as any as { id: string; name: string; missed_count: number }[],
            day_data: data[0].day_data as any as { day: string; adherence_percentage: number }[]
          };
          
          setAdherence(typedData);
        }
      } catch (error) {
        console.error('Error in fetchAdherenceData:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAdherenceData();
  }, [user]);

  const getAdherenceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : adherence ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Weekly Adherence Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Adherence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold text-center mb-4 flex justify-center">
                <span className={getAdherenceColor(adherence.adherence_percentage)}>
                  {adherence.adherence_percentage}%
                </span>
              </div>
              <div className="text-sm text-gray-500 text-center">
                Taking medications as prescribed
              </div>
            </CardContent>
          </Card>

          {/* Missed Medications */}
          <Card className="col-span-1 md:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle>Missed Medications</CardTitle>
            </CardHeader>
            <CardContent>
              {adherence.missed_medications && adherence.missed_medications.length > 0 ? (
                <ul className="space-y-3">
                  {adherence.missed_medications.map((med) => (
                    <li key={med.id} className="flex justify-between items-center">
                      <span className="text-gray-800">{med.name}</span>
                      <span className="text-red-500 font-medium">
                        Missed {med.missed_count} {med.missed_count === 1 ? 'dose' : 'doses'}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-gray-500">No missed medications this week</p>
              )}
            </CardContent>
          </Card>

          {/* Weekly Adherence Chart */}
          <Card className="col-span-1 md:col-span-2">
            <CardHeader>
              <CardTitle>Weekly Adherence Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-80">
              {adherence.day_data && adherence.day_data.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={adherence.day_data.map(day => ({
                      date: day.day,
                      adherence: day.adherence_percentage,
                      formattedDate: format(parseISO(day.day), 'MMM d')
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="formattedDate" 
                      padding={{ left: 20, right: 20 }} 
                    />
                    <YAxis domain={[0, 100]} />
                    <Tooltip
                      formatter={(value) => [`${value}%`, 'Adherence']}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="adherence"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Adherence %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">No data available for this period</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center p-10">
          <h3 className="text-lg font-medium text-gray-700 mb-2">No data available</h3>
          <p className="text-gray-500">Start by adding medications to your regimen</p>
        </div>
      )}
    </Layout>
  );
}
