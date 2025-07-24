import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

export default function AvatarCropModal({ 
  isOpen, 
  onClose, 
  onSave, 
  imageFile 
}) {
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, size: 128 });
  const [imageScale, setImageScale] = useState(1);
  const [minScale, setMinScale] = useState(0.5);
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isImageDragging, setIsImageDragging] = useState(false);
  const [resizeDirection, setResizeDirection] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ scale: 1, x: 0, y: 0 });
  const [imageDragStart, setImageDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const imageRef = useRef(null);

  // Рассчитываем минимальный масштаб для полного вписывания изображения в cropArea
  useEffect(() => {
    if (isOpen && imageFile && containerRef.current) {
      // Сбрасываем состояние при открытии модального окна
      setImageScale(1);
      setImageOffset({ x: 0, y: 0 });
      setIsDragging(false);
      setIsResizing(false);
      setIsImageDragging(false);
      setResizeDirection(null);
      
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      // Центрируем crop area
      const centerX = (containerRect.width - cropArea.size) / 2;
      const centerY = (containerRect.height - cropArea.size) / 2;
      setCropArea(prev => ({ ...prev, x: centerX, y: centerY }));

      // Загружаем изображение для вычисления масштаба и размеров
      const img = new window.Image();
      img.onload = () => {
        const naturalWidth = img.width;
        const naturalHeight = img.height;
        const containerW = containerRect.width;
        const containerH = containerRect.height;
        const imgAspect = naturalWidth / naturalHeight;
        const containerAspect = containerW / containerH;
        let fitScale = 1;
        if (imgAspect > containerAspect) {
          // Вписываем по ширине
          fitScale = containerW / naturalWidth;
        } else {
          // Вписываем по высоте
          fitScale = containerH / naturalHeight;
        }
        // Минимальный масштаб: позволяем уменьшать изображение до любого размера
        // Убираем ограничение, которое не позволяло уменьшать меньше crop area
        setMinScale(0.1); // Минимальный масштаб 10%
        // Начальный масштаб — fit-to-container
        setImageScale(fitScale);
        setImageOffset({ x: 0, y: 0 });
        container._naturalWidth = naturalWidth;
        container._naturalHeight = naturalHeight;
      };
      img.src = URL.createObjectURL(imageFile);
    }
  }, [isOpen, imageFile]);

  useEffect(() => {
    const handleGlobalMouseMove = (e) => {
      if (isDragging) {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        const container = containerRef.current;
        if (container) {
          const containerRect = container.getBoundingClientRect();
          const maxX = containerRect.width - cropArea.size;
          const maxY = containerRect.height - cropArea.size;
          setCropArea(prev => ({ ...prev, x: Math.max(0, Math.min(newX, maxX)), y: Math.max(0, Math.min(newY, maxY)) }));
        }
      }
      if (isImageDragging) {
        const deltaX = e.clientX - imageDragStart.x;
        const deltaY = e.clientY - imageDragStart.y;
        setImageOffset(prev => ({
          x: prev.x + deltaX,
          y: prev.y + deltaY
        }));
        setImageDragStart({ x: e.clientX, y: e.clientY });
      }
      if (isResizing && resizeDirection) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        const delta = Math.max(Math.abs(deltaX), Math.abs(deltaY));
        let newScale = resizeStart.scale + (deltaX > 0 ? delta * 0.005 : -delta * 0.005);
        newScale = Math.max(minScale, Math.min(3, newScale));
        setImageScale(newScale);
      }
    };
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setIsImageDragging(false);
      setResizeDirection(null);
    };
    if (isDragging || isResizing || isImageDragging) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging, isResizing, isImageDragging, dragStart, resizeStart, imageDragStart, cropArea.size, resizeDirection, minScale]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - cropArea.x,
      y: e.clientY - cropArea.y
    });
  };

  const handleImageMouseDown = (e) => {
    // Проверяем, что клик не на crop area
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Если клик вне crop area, начинаем перетаскивание изображения
    if (x < cropArea.x || x > cropArea.x + cropArea.size || 
        y < cropArea.y || y > cropArea.y + cropArea.size) {
      setIsImageDragging(true);
      setImageDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleResizeStart = (direction, e) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    setResizeStart({
      scale: imageScale,
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleSave = async () => {
    if (onSave) {
      const container = containerRef.current;
      const image = imageRef.current;
      if (container && image) {
        const containerRect = container.getBoundingClientRect();
        const naturalWidth = container._naturalWidth || image.naturalWidth;
        const naturalHeight = container._naturalHeight || image.naturalHeight;
        
        // Вычисляем реальные размеры отображаемого изображения
        const containerW = containerRect.width;
        const containerH = containerRect.height;
        const imgAspect = naturalWidth / naturalHeight;
        const containerAspect = containerW / containerH;
        
        let renderedW, renderedH, offsetX, offsetY;
        
        if (imgAspect > containerAspect) {
          // Изображение шире контейнера - вписываем по ширине
          renderedW = containerW;
          renderedH = containerW / imgAspect;
          offsetX = 0;
          offsetY = (containerH - renderedH) / 2;
        } else {
          // Изображение выше контейнера - вписываем по высоте
          renderedH = containerH;
          renderedW = containerH * imgAspect;
          offsetY = 0;
          offsetX = (containerW - renderedW) / 2;
        }
        
        // Применяем масштаб к размерам отображения
        const scaledRenderedW = renderedW * imageScale;
        const scaledRenderedH = renderedH * imageScale;
        const scaledOffsetX = offsetX + (renderedW - scaledRenderedW) / 2 + imageOffset.x;
        const scaledOffsetY = offsetY + (renderedH - scaledRenderedH) / 2 + imageOffset.y;
        
        // Вычисляем координаты crop area относительно изображения
        const cropX = cropArea.x - scaledOffsetX;
        const cropY = cropArea.y - scaledOffsetY;
        
        // Проверяем, что crop area находится в пределах изображения
        // Если crop area больше изображения, ограничиваем её размерами изображения
        let adjustedCropX = cropX;
        let adjustedCropY = cropY;
        
        if (cropX < 0) {
          adjustedCropX = 0;
        }
        if (cropY < 0) {
          adjustedCropY = 0;
        }
        if (cropX + cropArea.size > scaledRenderedW) {
          adjustedCropX = scaledRenderedW - cropArea.size;
        }
        if (cropY + cropArea.size > scaledRenderedH) {
          adjustedCropY = scaledRenderedH - cropArea.size;
        }
        
        // Если crop area полностью выходит за пределы изображения, используем центр изображения
        if (adjustedCropX < 0 || adjustedCropY < 0 || adjustedCropX + cropArea.size > scaledRenderedW || adjustedCropY + cropArea.size > scaledRenderedH) {
          adjustedCropX = Math.max(0, (scaledRenderedW - cropArea.size) / 2);
          adjustedCropY = Math.max(0, (scaledRenderedH - cropArea.size) / 2);
        }
        
        // Переводим координаты в масштаб исходного изображения
        const scaleX = naturalWidth / scaledRenderedW;
        const scaleY = naturalHeight / scaledRenderedH;
        
        const finalCropX = adjustedCropX * scaleX;
        const finalCropY = adjustedCropY * scaleY;
        const finalCropSize = cropArea.size * scaleX;
        
        try {
          await onSave({
            x: finalCropX,
            y: finalCropY,
            size: finalCropSize,
            imageFile,
            naturalWidth,
            naturalHeight
          });
        } catch (error) {
          // Обработка ошибки
        }
      }
    }
    
    // Сбрасываем состояние при закрытии
    setImageScale(1);
    setImageOffset({ x: 0, y: 0 });
    setIsDragging(false);
    setIsResizing(false);
    setIsImageDragging(false);
    setResizeDirection(null);
    
    onClose();
  };

  // Сброс состояния при закрытии модального окна
  useEffect(() => {
    if (!isOpen) {
      setImageScale(1);
      setImageOffset({ x: 0, y: 0 });
      setIsDragging(false);
      setIsResizing(false);
      setIsImageDragging(false);
      setResizeDirection(null);
    }
  }, [isOpen]);

  if (!isOpen || !imageFile) return null;

  return (
    <div className="fixed top-[70px] left-0 right-0 bottom-0 bg-black/50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-[15px] w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-gray/20">
          <h3 className="text-lg font-semibold text-dark">
            Обрезка аватара
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Содержимое */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4 text-sm text-gray-600">
            <p>• Перетащите изображение для позиционирования</p>
            <p>• Перетащите рамку для изменения области обрезки</p>
            <p>• Используйте углы рамки для изменения размера изображения</p>
            <p>• Можете уменьшить изображение меньше рамки для получения частичного заполнения</p>
          </div>
        
        <div 
          ref={containerRef}
          className="relative w-full h-80 bg-gray-100 rounded-lg overflow-hidden mb-4 cursor-move"
          onMouseDown={handleImageMouseDown}
        >
          <img
            ref={imageRef}
            src={URL.createObjectURL(imageFile)}
            alt="Crop preview"
            className="w-full h-full object-contain"
            style={{
              transform: `scale(${imageScale}) translate(${imageOffset.x}px, ${imageOffset.y}px)`,
              transformOrigin: 'center'
            }}
          />
          
          {/* Dark overlay for area outside crop selection */}
          <div className="absolute inset-0 bg-black/50 z-10">
            {/* Clear area for crop selection */}
            <div
              className="absolute bg-transparent"
              style={{
                left: cropArea.x,
                top: cropArea.y,
                width: cropArea.size,
                height: cropArea.size,
              }}
            />
          </div>
          
          {/* Crop selection area */}
          <div
            className="absolute border-2 border-white rounded-full cursor-move z-20"
            style={{
              left: cropArea.x,
              top: cropArea.y,
              width: cropArea.size,
              height: cropArea.size,
            }}
            onMouseDown={handleMouseDown}
          >
            {/* Border highlight */}
            <div className="absolute inset-0 border-2 border-primary rounded-full"></div>
            
            {/* Resize handles */}
            <div 
              className="absolute -top-1 -left-1 w-3 h-3 bg-primary rounded-full cursor-nw-resize z-30"
              onMouseDown={(e) => handleResizeStart('nw', e)}
            ></div>
            <div 
              className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full cursor-ne-resize z-30"
              onMouseDown={(e) => handleResizeStart('ne', e)}
            ></div>
            <div 
              className="absolute -bottom-1 -left-1 w-3 h-3 bg-primary rounded-full cursor-sw-resize z-30"
              onMouseDown={(e) => handleResizeStart('sw', e)}
            ></div>
            <div 
              className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-full cursor-se-resize z-30"
              onMouseDown={(e) => handleResizeStart('se', e)}
            ></div>
          </div>
        </div>

        </div>

        {/* Фиксированные кнопки внизу */}
        <div className="p-6 border-t border-gray/20 bg-white">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray/20 rounded-[8px] text-gray-700 hover:bg-gray/10 transition-colors"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-[8px] hover:bg-primary/90 transition-colors"
            >
              Сохранить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 