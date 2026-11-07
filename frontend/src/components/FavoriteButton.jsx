import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { useFavorites } from '../context/FavoritesContext';

// Heart toggle. variant="overlay" sits on top of a photo; "button" is a full-width action.
const FavoriteButton = ({ propertyId, variant = 'overlay', className = '' }) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const saved = isFavorite(propertyId);
  const label = saved ? 'Remove from wishlist' : 'Save to wishlist';

  const onClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(propertyId);
  };

  const Icon = saved ? HeartSolidIcon : HeartIcon;

  if (variant === 'button') {
    return (
      <button type="button" onClick={onClick} aria-pressed={saved} className={`btn-secondary w-full ${className}`}>
        <Icon className={`h-5 w-5 ${saved ? 'text-rose-500' : ''}`} aria-hidden="true" />
        {saved ? 'Saved' : 'Save'}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={label}
      title={label}
      className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition hover:scale-105 hover:bg-white ${className}`}
    >
      <Icon className={`h-5 w-5 ${saved ? 'text-rose-500' : 'text-gray-700'}`} aria-hidden="true" />
    </button>
  );
};

export default FavoriteButton;
