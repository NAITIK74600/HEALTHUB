import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { googleAuth } from '../api/auth';
import { useAuth } from '../context/AuthContext';

export default function GoogleCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const code = params.get('code');
    const error = params.get('error');

    if (error) {
      toast.error('Google sign-in was cancelled.');
      navigate('/login', { replace: true });
      return;
    }

    if (!code) {
      toast.error('No authorization code received.');
      navigate('/login', { replace: true });
      return;
    }

    const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI || `${window.location.origin}/google-callback`;

    (async () => {
      try {
        const res = await googleAuth({ code, redirectUri });
        setUser(res.data.user);
        toast.success('Welcome!');
        const redirectTo = params.get('state') || '/';
        navigate(redirectTo, { replace: true });
      } catch (err) {
        const msg = err.response?.data?.message || 'Google sign-in failed.';
        toast.error(msg);
        navigate('/login', { replace: true });
      }
    })();
  }, [params, navigate, setUser]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <p style={{ fontSize: '1.1rem', color: '#666' }}>Signing in with Google...</p>
    </div>
  );
}
