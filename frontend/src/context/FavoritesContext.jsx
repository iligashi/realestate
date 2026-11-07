import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

const FavoritesContext = createContext(null);

// Keeps the signed-in user's saved property ids in one place so every heart
// button across the app stays in sync.
export const FavoritesProvider = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [ids, setIds] = useState(() => new Set());
  const [pending, setPending] = useState(() => new Set());

  useEffect(() => {
    if (!isAuthenticated) {
      setIds(new Set());
      return;
    }
    api
      .get('/favorites/ids')
      .then(({ data }) => setIds(new Set(data.ids)))
      .catch(() => setIds(new Set()));
  }, [isAuthenticated]);

  const isFavorite = useCallback((id) => ids.has(String(id)), [ids]);

  const toggleFavorite = useCallback(
    async (rawId) => {
      const id = String(rawId);
      if (!isAuthenticated) {
        toast('Sign in to save properties');
        navigate('/login');
        return;
      }
      if (pending.has(id)) return;

      const wasSaved = ids.has(id);
      const update = (fn) => setIds((prev) => { const next = new Set(prev); fn(next); return next; });

      // Update the heart immediately, roll back if the request fails
      update((s) => (wasSaved ? s.delete(id) : s.add(id)));
      setPending((p) => new Set(p).add(id));
      try {
        if (wasSaved) await api.delete(`/favorites/${id}`);
        else await api.post(`/favorites/${id}`);
        toast.success(wasSaved ? 'Removed from wishlist' : 'Saved to wishlist');
      } catch (error) {
        update((s) => (wasSaved ? s.add(id) : s.delete(id)));
        toast.error(error.response?.data?.error || 'Could not update your wishlist');
      } finally {
        setPending((p) => { const next = new Set(p); next.delete(id); return next; });
      }
    },
    [ids, isAuthenticated, navigate, pending]
  );

  const value = useMemo(() => ({ isFavorite, toggleFavorite, count: ids.size }), [isFavorite, toggleFavorite, ids.size]);

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};

export const useFavorites = () => {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used inside FavoritesProvider');
  return ctx;
};
