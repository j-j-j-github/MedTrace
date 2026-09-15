import React, { useState, useEffect } from 'react';
import { User, Save, Scale, Ruler, Calendar, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

export default function Profile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    dob: '',
    gender: '',
    height: '',
    weight: '',
  });

  useEffect(() => {
    async function loadProfile() {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, dob, gender, height, weight')
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (data) {
          setFormData({
            full_name: data.full_name || '',
            dob: data.dob || '',
            gender: data.gender || '',
            height: data.height ? String(data.height) : '',
            weight: data.weight ? String(data.weight) : '',
          });
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setSaving(true);
    setSuccess(false);
    try {
      const updates = {
        user_id: user.id,
        email: user.email,
        full_name: formData.full_name,
        dob: formData.dob || null,
        gender: formData.gender || null,
        height: formData.height ? parseFloat(formData.height) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
      };

      const { error } = await supabase.from('profiles').upsert(updates, { onConflict: 'user_id' });
      if (error) throw error;
      setSuccess(true);
    } catch (err) {
      console.error('Error updating profile:', err);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading profile...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Profile</h1>
        <p className="text-slate-500 mt-1">Manage your personal information and health metrics.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>This information is used to personalize your health analysis.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="pl-10 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Date of Birth</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    className="pl-10 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Height (cm)</label>
                <div className="relative">
                  <Ruler className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  <input
                    type="number"
                    name="height"
                    value={formData.height}
                    onChange={handleChange}
                    className="pl-10 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    placeholder="175"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Weight (kg)</label>
                <div className="relative">
                  <Scale className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
                  <input
                    type="number"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    className="pl-10 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    placeholder="70"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-slate-100">
              <div className="text-sm text-green-600 font-medium flex items-center gap-1 opacity-100 transition-opacity">
                {success && <><CheckCircle2 className="h-4 w-4" /> Profile saved successfully</>}
              </div>
              <Button type="submit" disabled={saving} className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
