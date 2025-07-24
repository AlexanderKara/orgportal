import React, { useState, useRef } from 'react';
import { Camera, X, Upload } from 'lucide-react';

const AvatarUpload = ({ 
  currentAvatar, 
  onAvatarChange, 
  onFileSelect,
  size = 'lg',
  className = '',
  clickable = true,
  disabled = false
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const sizes = {
    sm: 'w-16 h-16',
    md: 'w-20 h-20',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (onFileSelect) {
        // Если есть обработчик для передачи файла в модальное окно обрезки
        onFileSelect(file);
      } else {
        // Старый способ - прямая обработка
        setIsUploading(true);
        
        // Имитация загрузки файла
        setTimeout(() => {
          const reader = new FileReader();
          reader.onload = (e) => {
            onAvatarChange(e.target.result);
            setIsUploading(false);
          };
          reader.readAsDataURL(file);
        }, 1000);
      }
    }
  };

  const handleClick = () => {
    if (clickable && !disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div 
        className={`${sizes[size]} relative rounded-full overflow-hidden border-2 border-gray-200 ${
          clickable && !disabled ? 'cursor-pointer hover:border-gray-300' : ''
        }`}
        onClick={handleClick}
      >
        {currentAvatar ? (
          <img 
            src={currentAvatar} 
            alt="Avatar" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <Camera className="w-8 h-8 text-gray-400" />
          </div>
        )}
        
        {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          </div>
        )}
        
        {clickable && !disabled && (
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
            <Upload className="w-6 h-6 text-white opacity-0 hover:opacity-100 transition-opacity duration-200" />
          </div>
        )}
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default AvatarUpload; 