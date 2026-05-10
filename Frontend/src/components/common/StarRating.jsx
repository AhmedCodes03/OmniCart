import { Star } from 'lucide-react';

export default function StarRating({ rating, size = 16, showNumber = true, count = 0 }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[...Array(full)].map((_, i) => (
          <Star key={`f-${i}`} size={size} className="text-amber-400 fill-amber-400" />
        ))}
        {half && (
          <div className="relative" style={{ width: size, height: size }}>
            <Star size={size} className="text-surface-600 absolute" />
            <div className="absolute overflow-hidden" style={{ width: size / 2 }}>
              <Star size={size} className="text-amber-400 fill-amber-400" />
            </div>
          </div>
        )}
        {[...Array(empty)].map((_, i) => (
          <Star key={`e-${i}`} size={size} className="text-surface-600" />
        ))}
      </div>
      {showNumber && (
        <span className="text-sm text-surface-400 font-medium">
          {rating > 0 ? rating.toFixed(1) : '0.0'}
          {count > 0 && <span className="text-surface-500 ml-1">({count})</span>}
        </span>
      )}
    </div>
  );
}
