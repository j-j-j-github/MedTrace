import React, { useEffect, useState } from 'react';
import { FileText, Building2, Calendar } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { StatCard } from '../components/dashboard/StatCard';
import { RecentRecords } from '../components/dashboard/RecentRecords';
import { GroupedRecords } from '../components/dashboard/GroupedRecords';
import { recordService } from '../services/records';
import { useCountUp } from '../hooks/useCountUp';

export default function Dashboard() {
  const { user } = useAuth();
  const userName = user?.user_metadata?.full_name || 'Patient';
  const [stats, setStats] = useState({ total: 0, hospitals: 0, thisMonth: 0 });
  const [loading, setLoading] = useState(true);

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
      } catch (error) {
        console.error("Failed to load stats", error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  const animatedTotal = useCountUp(stats.total);
  const animatedHospitals = useCountUp(stats.hospitals);

  return (
    <div className="space-y-8 pb-8">
      <div className="animate-fade-in stagger-1">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-2 text-lg">Welcome back, {userName}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 animate-fade-in stagger-2">
        <StatCard 
          title="Total Documents" 
          value={loading ? "-" : animatedTotal} 
          icon={<FileText className="w-5 h-5" />} 
          description={loading ? "Loading..." : `${stats.thisMonth} added this month`} 
        />
        <StatCard 
          title="Healthcare Providers" 
          value={loading ? "-" : animatedHospitals} 
          icon={<Building2 className="w-5 h-5" />} 
          description={loading ? "Loading..." : "Unique hospitals visited"} 
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
