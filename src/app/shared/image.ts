// Reduce una imagen elegida por el usuario a un JPEG cuadrado pequeño en data URL, para
// guardarla directamente en Firestore sin depender de Firebase Storage.
export async function resizeImageToDataUrl(file: File, size = 128, quality = 0.8): Promise<string> {
  const bitmap = await createImageBitmap(file);
  try {
    const side = Math.min(bitmap.width, bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas 2D no disponible');
    }
    // Recorte centrado al cuadrado mayor posible.
    context.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size);

    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    bitmap.close();
  }
}
