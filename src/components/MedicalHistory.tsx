import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { History, Clock, MessageCircle, FileText, ChevronDown, ChevronUp } from 'lucide-react';

interface MedicalRecord {
  id: string;
  date: Date;
  type: 'consultation' | 'prescription' | 'symptom';
  title: string;
  description: string;
  status: 'resolved' | 'ongoing' | 'follow-up';
}

interface MedicalHistoryProps {
  user: any;
}

const MedicalHistory: React.FC<MedicalHistoryProps> = ({ user }) => {
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadMedicalHistory();
    }
  }, [user?.id]);

  const loadMedicalHistory = async () => {
    try {
      const { data: records, error } = await supabase
        .from('medical_records')
        .select('*')
        .eq('patient_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading medical history:', error);
        return;
      }

      const formattedRecords: MedicalRecord[] = records?.map(record => ({
        id: record.id,
        date: new Date(record.created_at),
        type: record.record_type === 'chat_summary' ? 'consultation' : record.record_type as any,
        title: record.title,
        description: record.description || 'No additional details available.',
        status: 'resolved' as any
      })) || [];

      setMedicalRecords(formattedRecords);
    } catch (error) {
      console.error('Error loading medical history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'consultation':
        return <MessageCircle className="h-4 w-4" />;
      case 'prescription':
        return <FileText className="h-4 w-4" />;
      case 'symptom':
        return <Clock className="h-4 w-4" />;
      default:
        return <History className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-medical-green text-white';
      case 'ongoing':
        return 'bg-medical-warning text-black';
      case 'follow-up':
        return 'bg-medical-blue text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const toggleExpanded = (recordId: string) => {
    setExpandedRecord(expandedRecord === recordId ? null : recordId);
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card-custom">
        <CardHeader className="bg-primary-light">
          <CardTitle className="flex items-center gap-3">
            <History className="h-6 w-6 text-primary" />
            Medical History
          </CardTitle>
          <CardDescription>
            Your AI consultation history and health tracking records
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="space-y-4">
        {medicalRecords.map((record) => (
          <Card key={record.id} className="shadow-card-custom hover:shadow-medical transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary-light text-primary">
                    {getTypeIcon(record.type)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{record.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      {record.date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(record.status)}>
                    {record.status}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(record.id)}
                  >
                    {expandedRecord === record.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            {expandedRecord === record.id && (
              <CardContent className="pt-0">
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm leading-relaxed">{record.description}</p>
                  <div className="mt-4 flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      {record.type}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      AI Generated
                    </Badge>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
        
        {loading && (
          <Card className="shadow-card-custom">
            <CardContent className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading medical history...</p>
            </CardContent>
          </Card>
        )}

        {!loading && medicalRecords.length === 0 && (
          <Card className="shadow-card-custom">
            <CardContent className="text-center py-12">
              <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Medical History Yet</h3>
              <p className="text-muted-foreground">
                Start chatting with your AI health companion to build your medical history.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MedicalHistory;