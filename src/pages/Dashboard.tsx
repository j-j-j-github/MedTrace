import React, { useEffect, useState } from 'react';
import { FileText, Building2, Calendar, HeartPulse } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { StatCard } from '../components/dashboard/StatCard';
import { RecentRecords } from '../components/dashboard/RecentRecords';
import { GroupedRecords } from '../components/dashboard/GroupedRecords';
import { recordService } from '../services/records';
import { useCountUp } from '../hooks/useCountUp';

import { supabase } from '../lib/supabase';
import { aiService } from '../services/ai';

export default function Dashboard() {
  const { user } = useAuth();
  const userName = user?.user_metadata?.full_name || 'Patient';
  const [stats, setStats] = useState({ total: 0, hospitals: 0, thisMonth: 0 });
  const [healthScore, setHealthScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    async function loadStats() {
      try {
        const records = await recordService.getRecords();
        const hospitals = new Set(records.map(r => r.hospital).filter(Boolean));
        
        const now = new Date();
        const thisMonthRecords = records.filter(r => {
          if (!r.created_at) return false;
          const d = new Date(r.created_at);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });

        setStats({
          total: records.length,
          hospitals: hospitals.size,
          thisMonth: thisMonthRecords.length
        });

        // Fetch health score in background without blocking
        if (user?.id) {
          supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle()
            .then(async ({ data: profile }) => {
              try {
                const analysis = await aiService.analyzeHealth(profile || {}, records, false);
                if (analysis && typeof analysis.score === 'number') {
                  setHealthScore(analysis.score);
                }
              } catch (e) {
                console.error("Failed to load health score", e);
              }
            });
        }
      } catch (error) {
        console.error("Failed to load stats", error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [user]);

  const animatedTotal = useCountUp(stats.total);
  const animatedHospitals = useCountUp(stats.hospitals);

  const getHealthScoreColor = (score: number | null) => {
    if (score === null) return undefined;
    if (score < 50) return 'text-red-500';
    if (score < 75) return 'text-orange-500';
    return 'text-green-500';
  };

  return (
    <div className="space-y-8 pb-8">
      <div className="animate-fade-in stagger-1 mb-2">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-brand-700 via-slate-700 to-brand-500 bg-[length:200%_auto] animate-gradient-x pb-1 inline-block">
          {getGreeting()}, {userName}
        </h1>
        <p className="text-slate-500 mt-1 text-base font-medium">Here's an overview of your medical records</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 animate-fade-in stagger-2">
        <StatCard 
          title="Total Documents" 
          value={loading ? "-" : animatedTotal} 
          icon={<FileText className="w-5 h-5" />} 
          description={loading ? "Loading..." : `${stats.thisMonth} added this month`} 
        />
        <StatCard 
          title="Providers" 
          value={loading ? "-" : animatedHospitals} 
          icon={<Building2 className="w-5 h-5" />} 
          description={loading ? "Loading..." : "Unique hospitals visited"} 
        />
        <StatCard 
          title="Health Score" 
          value={healthScore !== null ? healthScore : "View"} 
          valueColor={getHealthScoreColor(healthScore)}
          icon={<HeartPulse className="w-5 h-5" />} 
          description={healthScore !== null ? "Out of 100" : "Click to analyze"}
          onClick={() => window.location.href = '/my-health'}
        />
        <StatCard 
          title="Recent Activity" 
          value="Up to date" 
          icon={<Calendar className="w-5 h-5" />} 
          description="All records synced" 
        />
      </div>

      <div className="grid gap-6 animate-fade-in stagger-3">
        <div className="w-full">
          <RecentRecords />
        </div>
      </div>

      <div className="animate-fade-in stagger-4">
        <GroupedRecords />
      </div>
    </div>
  );
}
