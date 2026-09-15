import { supabase } from '../lib/supabase';

export const authService = {
  async signUp(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;
    
    // Supabase triggers can handle inserting into `profiles` table, or we can do it here manually
    // Since we didn't add a Postgres trigger in the schema, we'll manually create the profile here:
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            user_id: data.user.id,
            email: data.user.email,
            full_name: fullName,
          },
        ]);
        
      if (profileError) {
        console.error('Error creating profile:', profileError);
      }
    }

    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
  
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },
  
  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }
};
