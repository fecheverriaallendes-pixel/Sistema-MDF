import React, { useState } from 'react';
import { BLACK_FRIDAY_LOGO_SRC } from '../utils/blackFridayOffers';

interface BlackFridayLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<BlackFridayLogoProps['size']>, string> = {
  xs: 'w-7 h-7 rounded-lg',
  sm: 'w-9 h-9 rounded-xl',
  md: 'w-12 h-12 rounded-2xl',
  lg: 'w-16 h-16 sm:w-20 sm:h-20 rounded-2xl',
};

export const BlackFridayLogo: React.FC<BlackFridayLogoProps> = ({
  size = 'md',
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return (
      <div
        className={`${SIZE_CLASSES[size]} bg-zinc-950 border border-amber-400/70 flex flex-col items-center justify-center leading-none select-none shrink-0 shadow-sm ${className}`}
        aria-label="Black Friday"
      >
        <span className="text-[7px] font-black tracking-widest text-white uppercase">BLACK</span>
        <span className="text-[7px] font-black tracking-widest text-amber-400 uppercase mt-0.5">FRIDAY</span>
      </div>
    );
  }

  return (
    <div
      className={`${SIZE_CLASSES[size]} overflow-hidden bg-zinc-950 border border-amber-400/50 shrink-0 shadow-sm ${className}`}
    >
      <img
        src={BLACK_FRIDAY_LOGO_SRC}
        alt="Logo Black Friday El Mundo del Fardo"
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className="w-full h-full object-cover scale-105"
      />
    </div>
  );
};

export default BlackFridayLogo;
