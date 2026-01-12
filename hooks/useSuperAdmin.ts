import { useState, useEffect } from 'react';
import { supabase } from '../src/supabaseClient';

export const useSuperAdmin = () => {
  const [isSuperUser, setIsSuperUser] = useState(false);

  useEffect(() => {
    const checkSuperAdmin = async () => {
      try {
        const { data, error } = await supabase.rpc('is_super_admin');
        if (!error && data === true) {
          setIsSuperUser(true);
        }
      } catch (err) {
        console.error('Error checking super admin:', err);
      }
    };

    checkSuperAdmin();
  }, []);

  return isSuperUser;
};
