import bwipjs from 'bwip-js';

export async function code128SvgDataUrl(text: string): Promise<string> {
  try {
    const svg = await bwipjs.toSVG({
      bcid: 'code128',
      text: text,
      scale: 2,
      height: 8,
      includetext: false,
      textxalign: 'center',
    });
    // Browsers require the SVG to be URL-encoded to be used in a data URI
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  } catch (err) {
    console.error('Failed to generate barcode', err);
    return '';
  }
}
