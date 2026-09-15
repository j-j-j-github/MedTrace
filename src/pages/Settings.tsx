import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

export default function Settings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [preferredUnit, setPreferredUnit] = useState('metric');

  useEffect(() => {
    async function loadSettings() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('preferred_unit')
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (data && data.preferred_unit) {
          setPreferredUnit(data.preferred_unit);
        }
      } catch (err) {
        console.error('Error loading settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSaving(true);
    setSuccess(false);
    try {
      const updates = {
        user_id: user.id,
        email: user.email,
        preferred_unit: preferredUnit,
      };

      const { error } = await supabase.from('profiles').upsert(updates, { onConflict: 'user_id' });
      if (error) throw error;
      setSuccess(true);
    } catch (err) {
      console.error('Error updating settings:', err);
      alert('Failed to update settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading settings...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your application preferences.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-slate-500" />
            <CardTitle>Preferences</CardTitle>
          </div>
          <CardDescription>Customize how information is displayed to you.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-900">Preferred Measurement Unit</label>
              <div className="grid grid-cols-2 gap-4">
                <label className={`cursor-pointer rounded-lg border-2 p-4 flex flex-col gap-1 transition-colors ${preferredUnit === 'metric' ? 'border-brand-600 bg-brand-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <div className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="unit" 
                      value="metric" 
                      checked={preferredUnit === 'metric'}
                      onChange={() => { setPreferredUnit('metric'); setSuccess(false); }}
                      className="text-brand-600 focus:ring-brand-500"
                    />
                    <span className="font-medium text-slate-900">Metric</span>
                  </div>
                  <span className="text-sm text-slate-500 ml-6">Centimeters (cm), Kilograms (kg)</span>
                </label>

                <label className={`cursor-pointer rounded-lg border-2 p-4 flex flex-col gap-1 transition-colors ${preferredUnit === 'imperial' ? 'border-brand-600 bg-brand-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                  <div className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="unit" 
                      value="imperial" 
                      checked={preferredUnit === 'imperial'}
                      onChange={() => { setPreferredUnit('imperial'); setSuccess(false); }}
                      className="text-brand-600 focus:ring-brand-500"
                    />
                    <span className="font-medium text-slate-900">Imperial</span>
                  </div>
                  <span className="text-sm text-slate-500 ml-6">Inches (in), Pounds (lbs)</span>
                </label>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-slate-100">
              <div className="text-sm text-green-600 font-medium flex items-center gap-1 opacity-100 transition-opacity">
                {success && <><CheckCircle2 className="h-4 w-4" /> Settings saved successfully</>}
              </div>
              <Button type="submit" disabled={saving} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
