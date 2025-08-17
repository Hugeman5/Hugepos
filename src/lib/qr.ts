import QRCode from 'qrcode';

export async function qrDataUrl(text: string, size = 220): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: size,
      color: {
          dark: '#000000',
          light: '#FFFFFF'
      }
    });
  } catch (err) {
    console.error('Failed to generate QR code', err);
    return '';
  }
}
