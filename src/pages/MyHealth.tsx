import React, { useState, useEffect } from 'react';
import { HeartPulse, Activity, AlertCircle, RefreshCw, CheckCircle2, ShieldAlert, BrainCircuit } from 'lucide-react';
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

      const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
      const records = await recordService.getRecords();
      const analysis = await aiService.analyzeHealth(profile || {}, records, forceRefresh);
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
    const radius = 90;
    const circumference = radius * Math.PI;
    const strokeDashoffset = circumference - (score / 100) * circumference;
    
    let color = 'text-green-500';
    if (score < 50) color = 'text-red-500';
    else if (score < 75) color = 'text-yellow-500';

    return (
      <div className="relative flex flex-col items-center justify-center py-8">
        <svg className="w-80 h-40" viewBox="0 0 220 110">
          {/* Neumorphic Track */}
          <path
            d="M 20 110 A 90 90 0 0 1 200 110"
            fill="none"
            stroke="currentColor"
            strokeWidth="24"
            className="text-slate-200 drop-shadow-sm"
            strokeLinecap="round"
          />
          <path
            d="M 20 110 A 90 90 0 0 1 200 110"
            fill="none"
            stroke="currentColor"
            strokeWidth="24"
            className={`${color} transition-all duration-1000 ease-out drop-shadow-md`}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute bottom-6 flex flex-col items-center">
          <span className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-slate-700 to-slate-900 drop-shadow-sm">{score}</span>
          <span className="text-sm font-semibold tracking-wider text-slate-400 uppercase mt-1">Health Score</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50/80 backdrop-blur-sm">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50 p-6 rounded-3xl shadow-[var(--shadow-neu-flat)]">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <HeartPulse className="h-8 w-8 text-brand-600" />
            My Health Dashboard
          </h1>
          <p className="text-slate-500 mt-2 font-medium">AI-powered comprehensive analysis based on your unified medical records.</p>
        </div>
        <Button 
          onClick={() => fetchHealthAnalysis(true)} 
          disabled={analyzing}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full"
        >
          <RefreshCw className={`h-4 w-4 ${analyzing ? 'animate-spin' : ''}`} />
          {analyzing ? 'Analyzing...' : 'Refresh AI Analysis'}
        </Button>
      </div>

      {error ? (
        <div className="p-6 rounded-3xl bg-slate-50 shadow-[var(--shadow-neu-pressed)] flex items-center gap-3 text-red-600 border border-red-100/50">
          <AlertCircle className="h-6 w-6" />
          <p className="font-semibold">{error}</p>
        </div>
      ) : healthData ? (
        <div className="space-y-6">
          {/* Top Section: Health Score Dial */}
          <div className="flex justify-center w-full animate-fade-in stagger-1">
            <div className="w-full max-w-2xl bg-slate-50 rounded-3xl shadow-[var(--shadow-neu-flat)] p-6">
              <h2 className="text-center text-lg font-bold text-slate-700 tracking-wide uppercase mb-2">Overall Wellness</h2>
              {renderHealthDial(healthData.healthScore)}
            </div>
          </div>

          {/* Middle Section: Key Metrics Grid */}
          <div className="animate-fade-in stagger-2">
            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2 pl-2">
              <Activity className="h-5 w-5 text-brand-600" />
              Vital Metrics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {healthData.keyMetrics?.map((metric: any, index: number) => (
                <div key={index} className="p-5 rounded-3xl bg-slate-50 shadow-[var(--shadow-neu-flat)] flex flex-col justify-between hover:shadow-[var(--shadow-neu-pressed)] transition-shadow cursor-default group">
                  <span className="text-sm font-semibold text-slate-500 group-hover:text-brand-600 transition-colors">{metric.name}</span>
                  <div className="mt-3 flex items-end justify-between">
                    <span className="text-2xl font-bold text-slate-800">{metric.value}</span>
                    <div className={`h-3 w-3 rounded-full shadow-sm ${
                      metric.status === 'normal' ? 'bg-green-500 shadow-green-200' :
                      metric.status === 'warning' ? 'bg-yellow-500 shadow-yellow-200' : 'bg-red-500 shadow-red-200'
                    }`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Section: Insights Classification */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in stagger-3">
            {/* Active Conditions */}
            <div className="bg-slate-50 rounded-3xl shadow-[var(--shadow-neu-flat)] p-6">
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 mb-4">
                <ShieldAlert className="h-5 w-5 text-red-500" />
                Active Conditions
              </h3>
              <div className="p-5 rounded-2xl shadow-[var(--shadow-neu-pressed)] bg-slate-50/50 h-64 overflow-y-auto custom-scrollbar">
                {healthData.activeConditions?.length > 0 ? (
                  <ul className="space-y-4">
                    {healthData.activeConditions.map((condition: string, i: number) => (
                      <li key={i} className="flex items-start gap-3 text-slate-700 font-medium">
                        <span className="mt-1.5 flex-shrink-0 h-2 w-2 rounded-full bg-red-500 shadow-sm" />
                        {condition}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-slate-500 font-medium text-center py-4">No active conditions detected.</p>
                )}
              </div>
            </div>

            {/* AI Insights */}
            <div className="bg-slate-50 rounded-3xl shadow-[var(--shadow-neu-flat)] p-6">
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-800 mb-4">
                <BrainCircuit className="h-5 w-5 text-brand-600" />
                Actionable Insights
              </h3>
              <div className="p-5 rounded-2xl shadow-[var(--shadow-neu-pressed)] bg-slate-50/50 h-64 overflow-y-auto custom-scrollbar">
                <ul className="space-y-4">
                  {healthData.insights?.map((insight: string, i: number) => (
                    <li key={i} className="flex items-start gap-3 text-slate-700 font-medium">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-500 drop-shadow-sm" />
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
