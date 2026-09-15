import React, { useState, useEffect } from 'react';
import { HeartPulse, Activity, AlertCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { aiService } from '../services/ai';
import { recordService } from '../services/records';

export default function MyHealth() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [healthData, setHealthData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchHealthAnalysis = async (forceRefresh = false) => {
    if (!user) return;
    try {
      if (forceRefresh) setAnalyzing(true);
      else setLoading(true);
      setError(null);

      // 1. Fetch Profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      // 2. Fetch Records
      const records = await recordService.getRecords();

      // 3. Request Analysis
      const analysis = await aiService.analyzeHealth(profile || {}, records);
      setHealthData(analysis);
    } catch (err: any) {
      console.error('Failed to load health analysis:', err);
      setError(err.message || 'Unable to generate health analysis.');
    } finally {
      setLoading(false);
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    fetchHealthAnalysis();
  }, [user]);

  const renderHealthDial = (score: number) => {
    const radius = 80;
    const circumference = radius * Math.PI;
    const strokeDashoffset = circumference - (score / 100) * circumference;
    
    let color = 'text-green-500';
    if (score < 50) color = 'text-red-500';
    else if (score < 75) color = 'text-yellow-500';

    return (
      <div className="relative flex flex-col items-center justify-center py-6">
        <svg className="w-64 h-32" viewBox="0 0 200 100">
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="20"
            className="text-slate-100"
            strokeLinecap="round"
          />
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            fill="none"
            stroke="currentColor"
            strokeWidth="20"
            className={`${color} transition-all duration-1000 ease-out`}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute bottom-6 flex flex-col items-center">
          <span className="text-4xl font-extrabold text-slate-900">{score}</span>
          <span className="text-sm font-medium text-slate-500">Overall Score</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Health</h1>
          <p className="text-slate-500 mt-1">AI-powered analysis based on your records and profile.</p>
        </div>
        <Button 
          onClick={() => fetchHealthAnalysis(true)} 
          disabled={analyzing}
          className="flex items-center gap-2 w-full sm:w-auto"
        >
          <RefreshCw className={`h-4 w-4 ${analyzing ? 'animate-spin' : ''}`} />
          {analyzing ? 'Analyzing...' : 'Refresh Analysis'}
        </Button>
      </div>

      {error ? (
        <Card className="border-red-100 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-800">
              <AlertCircle className="h-5 w-5" />
              <p className="font-medium">{error}</p>
            </div>
          </CardContent>
        </Card>
      ) : healthData ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 shadow-sm border-slate-200 bg-gradient-to-br from-white to-slate-50">
            <CardHeader className="text-center pb-2">
              <CardTitle>Health Condition</CardTitle>
            </CardHeader>
            <CardContent>
              {renderHealthDial(healthData.healthScore)}
            </CardContent>
          </Card>

          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-sm border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-brand-500" />
                  Key Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {healthData.keyMetrics?.map((metric: any, index: number) => (
                    <div key={index} className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex justify-between items-center">
                      <span className="text-sm font-medium text-slate-600">{metric.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{metric.value}</span>
                        <div className={`h-2 w-2 rounded-full ${
                          metric.status === 'normal' ? 'bg-green-500' :
                          metric.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Card className="shadow-sm border-slate-200 bg-red-50/50">
                <CardHeader>
                  <CardTitle className="text-red-900 text-lg">Active Conditions</CardTitle>
                </CardHeader>
                <CardContent>
                  {healthData.activeConditions?.length > 0 ? (
                    <ul className="space-y-3">
                      {healthData.activeConditions.map((condition: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-red-800 font-medium">
                          <span className="mt-1 flex-shrink-0 h-1.5 w-1.5 rounded-full bg-red-500" />
                          {condition}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500">No active conditions detected.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-sm border-slate-200 bg-brand-50/50">
                <CardHeader>
                  <CardTitle className="text-brand-900 text-lg">Actionable Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {healthData.insights?.map((insight: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-brand-800">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-600" />
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
