export function placeholder(name: string, size: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext('2d');

  context.fillStyle = '#F8F9F8';

  context.fillRect(0, 0, size, size);
  context.stroke();

  context.fillStyle = '#32323C';
  context.font = `${size * 0.4}px sans-serif`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';

  let text = '';
  const names = name.split(' ').filter((item) => item.length !== 0);

  if (names.length > 0) {
    text = names[0][0];
    if (names.length > 1) {
      text += names[names.length - 1][0];
    }
  } else {
    text = '?';
  }

  context.fillText(text.toUpperCase(), size / 2, size / 2);

  return canvas.toDataURL('image/png');
}
