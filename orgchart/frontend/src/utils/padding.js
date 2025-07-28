/**
 * Функция для расчета пропорционального padding в зависимости от размера элемента
 * @param {number} size - размер элемента в пикселях
 * @param {number} baseSize - базовый размер (по умолчанию 300px)
 * @param {number} basePadding - базовый padding (по умолчанию 16px)
 * @returns {number} - рассчитанный padding в пикселях
 */
export const getProportionalPadding = (size, baseSize = 300, basePadding = 16) => {
  // Если размер меньше или равен базовому, рассчитываем пропорционально
  if (size <= baseSize) {
    return Math.round((size / baseSize) * basePadding);
  }
  
  // Если размер больше базового, возвращаем базовый padding
  return basePadding;
};

/**
 * Функция для получения CSS стилей с пропорциональным padding
 * @param {number} size - размер элемента в пикселях
 * @param {number} baseSize - базовый размер (по умолчанию 40px)
 * @param {number} basePadding - базовый padding (по умолчанию 16px)
 * @returns {object} - объект со стилями
 */
export const getProportionalPaddingStyles = (size, baseSize = 40, basePadding = 16) => {
  return {
    padding: `${getProportionalPadding(size, baseSize, basePadding)}px`
  };
}; 