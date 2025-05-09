
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckIcon, Calendar, AlertCircle } from 'lucide-react';
import { Medication, DoseLog } from '@/types/supabase';
import { format, parseISO, isWithinInterval, subHours, addHours } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

type ScheduledDose = {
  medication: Medication;
  doseNumber: number;
  scheduledTime: Date;
  status: 'pending' | 'taken' | 'late' | 'missed';
}

export default function DoseLogging() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [scheduledDoses, setScheduledDoses] = useState<ScheduledDose[]>([]);
  const [todaysLogs, setTodaysLogs] = useState<DoseLog[]>([]);

  useEffect(() => {
    if (user) {
      fetchMedications();
      fetchTodaysLogs();
    }
  }, [user]);

  useEffect(() => {
    if (medications.length > 0) {
      generateScheduledDoses();
    }
  }, [medications, todaysLogs]);

  async function fetchMedications() {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .lte('start_date', today)
        .or(`end_date.is.null,end_date.gte.${today}`)
        .order('name');

      if (error) {
        throw error;
      }

      if (data) {
        setMedications(data);
      }
    } catch (error: any) {
      console.error('Error fetching medications:', error.message);
      toast({
        title: 'Error',
        description: 'Could not fetch medications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function fetchTodaysLogs() {
    try {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      
      const { data, error } = await supabase
        .from('dose_logs')
        .select('*, medication_id')
        .gte('timestamp_taken', startOfDay.toISOString())
        .lte('timestamp_taken', endOfDay.toISOString());

      if (error) {
        throw error;
      }

      if (data) {
        setTodaysLogs(data);
      }
    } catch (error: any) {
      console.error('Error fetching dose logs:', error.message);
      toast({
        title: 'Error',
        description: 'Could not fetch dose logs',
        variant: 'destructive',
      });
    }
  }

  function generateScheduledDoses() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const now = new Date();
    
    const doses: ScheduledDose[] = [];
    
    medications.forEach(medication => {
      const frequency = medication.frequency_per_day;
      
      // Simple scheduling: divide the day into equal parts based on frequency
      for (let i = 0; i < frequency; i++) {
        const hour = 8 + (i * (16 / frequency)); // Start at 8 AM, end by 8 PM
        const scheduledTime = new Date(today);
        scheduledTime.setHours(Math.floor(hour), (hour % 1) * 60, 0, 0);
        
        // Check if this dose has been logged already
        const doseLog = todaysLogs.find(log => 
          log.medication_id === medication.id && 
          isWithinInterval(parseISO(log.timestamp_taken), {
            start: subHours(scheduledTime, 2),
            end: addHours(scheduledTime, 4)
          })
        );
        
        let status: 'pending' | 'taken' | 'late' | 'missed';
        
        if (doseLog) {
          status = 'taken';
        } else if (now > addHours(scheduledTime, 4)) {
          status = 'missed';
        } else if (now > scheduledTime) {
          status = 'late';
        } else {
          status = 'pending';
        }
        
        doses.push({
          medication,
          doseNumber: i + 1,
          scheduledTime,
          status
        });
      }
    });
    
    // Sort by scheduled time
    doses.sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
    
    setScheduledDoses(doses);
  }

  async function handleLogDose(dose: ScheduledDose) {
    try {
      const now = new Date();
      
      const { data, error } = await supabase.rpc('log_dose', {
        medication_id: dose.medication.id,
        scheduled_time: dose.scheduledTime.toISOString(),
        actual_time: now.toISOString()
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Success',
        description: 'Dose logged successfully',
      });

      // Refresh logs
      fetchTodaysLogs();
      
    } catch (error: any) {
      console.error('Error logging dose:', error);
      toast({
        title: 'Error',
        description: 'Could not log dose: ' + error.message,
        variant: 'destructive',
      });
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'taken':
        return <Badge className="bg-green-500">Taken</Badge>;
      case 'late':
        return <Badge className="bg-yellow-500">Due Now</Badge>;
      case 'missed':
        return <Badge className="bg-red-500">Missed</Badge>;
      default:
        return <Badge className="bg-blue-500">Upcoming</Badge>;
    }
  }

  function isLate(scheduledTime: Date) {
    const now = new Date();
    const fourHoursLater = addHours(scheduledTime, 4);
    return now > scheduledTime && now < fourHoursLater;
  }

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Log Doses</h1>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : scheduledDoses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scheduledDoses.map((dose, index) => (
            <Card 
              key={`${dose.medication.id}-${dose.doseNumber}`}
              className={`
                ${dose.status === 'taken' ? 'border-green-300 bg-green-50' : ''}
                ${dose.status === 'late' ? 'border-yellow-300 bg-yellow-50' : ''}
                ${dose.status === 'missed' ? 'border-red-300 bg-red-50' : ''}
              `}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">{dose.medication.name}</CardTitle>
                  {getStatusBadge(dose.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-1" />
                    <span>Scheduled: {format(dose.scheduledTime, 'h:mm a')}</span>
                  </div>
                  
                  <p className="text-sm">{dose.medication.dose}</p>
                  
                  {dose.status === 'late' && (
                    <div className="flex items-center text-sm text-yellow-700 bg-yellow-100 p-2 rounded">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      <span>Taking this dose late - still counts for adherence</span>
                    </div>
                  )}
                  
                  {dose.status !== 'taken' && dose.status !== 'missed' && (
                    <Button 
                      className="w-full mt-2"
                      onClick={() => handleLogDose(dose)}
                    >
                      <CheckIcon className="mr-2 h-4 w-4" />
                      Mark as Taken
                    </Button>
                  )}
                  
                  {dose.status === 'taken' && (
                    <div className="flex items-center justify-center text-green-700 font-medium mt-2">
                      <CheckIcon className="mr-2 h-5 w-5" />
                      Dose taken
                      {isLate(dose.scheduledTime) ? " (Late)" : " (On time)"}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500">No medications scheduled for today</p>
          <Button
            className="mt-4"
            onClick={() => window.location.pathname = '/regimen'}
          >
            Add Medications
          </Button>
        </div>
      )}
    </Layout>
  );
}
