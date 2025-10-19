import React from 'react';

interface NuvraLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

const NuvraLogo: React.FC<NuvraLogoProps> = ({ className = '', size = 32, showText = true }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Logo da pasta public */}
      <img
        src="/logo.png"
        alt="Logo"
        width={size}
        height={size}
        className="shrink-0 object-contain"
      />
      
      {/* Text opcional */}
      {showText && (
        <span className="font-bold text-xl text-gray-900 dark:text-white">
          CRM
        </span>
      )}
    </div>
  );
};

export default NuvraLogo;
