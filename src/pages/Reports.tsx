import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AdherenceSummary, Medication, DoseLog } from '@/types/supabase';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO, subDays, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { Input } from '@/components/ui/input';
import { FileIcon, FileTextIcon } from 'lucide-react';

export default function Reports() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [adherence, setAdherence] = useState<AdherenceSummary | null>(null);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [logs, setLogs] = useState<DoseLog[]>([]);
  const [currentStartDate, setCurrentStartDate] = useState<Date>(startOfWeek(subWeeks(new Date(), 1)));
  const [currentEndDate, setCurrentEndDate] = useState<Date>(new Date());

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, currentStartDate, currentEndDate]);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch adherence summary
      const { data: adherenceData, error: adherenceError } = await supabase.rpc('get_adherence_summary', {
        start_date: format(currentStartDate, 'yyyy-MM-dd'),
        end_date: format(currentEndDate, 'yyyy-MM-dd')
      });

      if (adherenceError) {
        throw adherenceError;
      }
      
      if (adherenceData && adherenceData.length > 0) {
        // Type casting to ensure the data matches our AdherenceSummary type
        const typedAdherenceData: AdherenceSummary = {
          adherence_percentage: adherenceData[0].adherence_percentage,
          missed_medications: adherenceData[0].missed_medications as any as { id: string; name: string; missed_count: number }[],
          day_data: adherenceData[0].day_data as any as { day: string; adherence_percentage: number }[]
        };
        
        setAdherence(typedAdherenceData);
      }
      
      // Fetch medications
      const { data: medsData, error: medsError } = await supabase
        .from('medications')
        .select('*')
        .order('name');
        
      if (medsError) {
        throw medsError;
      }
      
      if (medsData) {
        setMedications(medsData);
      }
      
      // Fetch logs in date range
      const { data: logsData, error: logsError } = await supabase
        .from('dose_logs')
        .select('*')
        .gte('scheduled_time', currentStartDate.toISOString())
        .lte('scheduled_time', currentEndDate.toISOString())
        .order('scheduled_time', { ascending: true });
        
      if (logsError) {
        throw logsError;
      }
      
      if (logsData) {
        setLogs(logsData);
      }
      
    } catch (error: any) {
      console.error('Error fetching data:', error.message);
      toast({
        title: 'Error',
        description: 'Could not fetch report data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  const handlePreviousWeek = () => {
    setCurrentStartDate(subWeeks(currentStartDate, 1));
    setCurrentEndDate(subWeeks(currentEndDate, 1));
  };

  const handleNextWeek = () => {
    const nextEndDate = addWeeks(currentEndDate, 1);
    if (nextEndDate <= new Date()) {
      setCurrentStartDate(addWeeks(currentStartDate, 1));
      setCurrentEndDate(nextEndDate);
    }
  };

  const handleExportCSV = () => {
    // Format logs into CSV data
    if (logs.length === 0 || medications.length === 0) {
      toast({
        title: 'No data',
        description: 'There is no data to export',
        variant: 'destructive',
      });
      return;
    }
    
    // Create a map of medication IDs to names
    const medicationMap = medications.reduce((map, med) => {
      map[med.id] = med.name;
      return map;
    }, {} as Record<string, string>);
    
    // CSV header
    let csv = 'Medication,Scheduled Time,Taken Time,On Time,Reward Earned\n';
    
    // Add rows
    logs.forEach(log => {
      const medicationName = medicationMap[log.medication_id] || 'Unknown';
      const row = [
        `"${medicationName}"`,
        `"${format(parseISO(log.scheduled_time), 'yyyy-MM-dd HH:mm:ss')}"`,
        `"${format(parseISO(log.timestamp_taken), 'yyyy-MM-dd HH:mm:ss')}"`,
        log.taken_on_time ? 'Yes' : 'No',
        log.reward_earned ? 'Yes' : 'No'
      ];
      csv += row.join(',') + '\n';
    });
    
    // Create a blob and download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', `medication-logs-${format(currentStartDate, 'yyyy-MM-dd')}-to-${format(currentEndDate, 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    toast({
      title: 'Success',
      description: 'CSV file downloaded successfully',
    });
  };

  const handleExportPDF = () => {
    toast({
      title: 'Feature coming soon',
      description: 'PDF export functionality will be available soon',
    });
  };

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Reports</h1>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <CardTitle>Medication Adherence Report</CardTitle>
            <div className="flex space-x-2 mt-2 md:mt-0">
              <Button variant="outline" onClick={handleExportCSV}>
                <FileTextIcon className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button variant="outline" onClick={handleExportPDF}>
                <FileIcon className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <Input
                type="date"
                value={format(currentStartDate, 'yyyy-MM-dd')}
                onChange={(e) => setCurrentStartDate(new Date(e.target.value))}
                className="w-40"
              />
              <span>to</span>
              <Input
                type="date"
                value={format(currentEndDate, 'yyyy-MM-dd')}
                onChange={(e) => setCurrentEndDate(new Date(e.target.value))}
                className="w-40"
                max={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handlePreviousWeek}>Previous Week</Button>
              <Button variant="outline" onClick={handleNextWeek} disabled={addWeeks(currentEndDate, 1) > new Date()}>
                Next Week
              </Button>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : adherence ? (
            <div className="space-y-8">
              {/* Weekly Adherence Chart */}
              <div className="h-80">
                {adherence.day_data && adherence.day_data.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={adherence.day_data.map(day => ({
                        date: day.day,
                        adherence: day.adherence_percentage,
                        formattedDate: format(parseISO(day.day), 'MMM d')
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="formattedDate" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip
                        formatter={(value) => [`${value}%`, 'Adherence']}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Legend />
                      <Bar
                        dataKey="adherence"
                        name="Daily Adherence %"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No data available for this period</p>
                  </div>
                )}
              </div>

              {/* Overall Adherence & Missed Medications */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Overall Adherence</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-5xl font-bold text-center">
                      <span className={
                        adherence.adherence_percentage >= 90
                          ? 'text-green-600'
                          : adherence.adherence_percentage >= 75
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }>
                        {adherence.adherence_percentage}%
                      </span>
                    </div>
                    <p className="text-center text-gray-500 mt-2">
                      For period {format(currentStartDate, 'MMM d, yyyy')} - {format(currentEndDate, 'MMM d, yyyy')}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Missed Medications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {adherence.missed_medications && adherence.missed_medications.length > 0 ? (
                      <div className="space-y-4">
                        {adherence.missed_medications.map((med) => (
                          <div key={med.id} className="flex justify-between items-center border-b pb-2">
                            <span className="font-medium">{med.name}</span>
                            <span className="text-red-500">
                              Missed {med.missed_count} {med.missed_count === 1 ? 'dose' : 'doses'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-4">No missed medications in this period</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No data available for the selected period</p>
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}
