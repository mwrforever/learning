export function applyBold(text: string, selectionStart: number, selectionEnd: number): { text: string; start: number; end: number } {
  const before = text.slice(0, selectionStart);
  const selected = text.slice(selectionStart, selectionEnd);
  const after = text.slice(selectionEnd);

  if (selected.startsWith('**') && selected.endsWith('**')) {
    const unwrapped = selected.slice(2, -2);
    return { text: before + unwrapped + after, start: selectionStart, end: selectionStart + unwrapped.length };
  }

  const wrapped = '**' + selected + '**';
  return { text: before + wrapped + after, start: selectionStart, end: selectionStart + wrapped.length };
}

export function applyItalic(text: string, selectionStart: number, selectionEnd: number): { text: string; start: number; end: number } {
  const before = text.slice(0, selectionStart);
  const selected = text.slice(selectionStart, selectionEnd);
  const after = text.slice(selectionEnd);

  if (selected.startsWith('*') && selected.endsWith('*') && !selected.startsWith('**')) {
    const unwrapped = selected.slice(1, -1);
    return { text: before + unwrapped + after, start: selectionStart, end: selectionStart + unwrapped.length };
  }

  const wrapped = '*' + selected + '*';
  return { text: before + wrapped + after, start: selectionStart, end: selectionStart + wrapped.length };
}

export function insertLink(text: string, selectionStart: number, selectionEnd: number): { text: string; start: number; end: number } {
  const before = text.slice(0, selectionStart);
  const selected = text.slice(selectionStart, selectionEnd);
  const after = text.slice(selectionEnd);

  const linkText = selected || '链接文本';
  const wrapped = '[' + linkText + '](url)';
  return { text: before + wrapped + after, start: selectionStart, end: selectionStart + wrapped.length };
}

export function applyUnderline(text: string, selectionStart: number, selectionEnd: number): { text: string; start: number; end: number } {
  const before = text.slice(0, selectionStart);
  const selected = text.slice(selectionStart, selectionEnd);
  const after = text.slice(selectionEnd);

  if (selected.startsWith('<u>') && selected.endsWith('</u>')) {
    const unwrapped = selected.slice(3, -4);
    return { text: before + unwrapped + after, start: selectionStart, end: selectionStart + unwrapped.length };
  }

  const wrapped = '<u>' + selected + '</u>';
  return { text: before + wrapped + after, start: selectionStart, end: selectionStart + wrapped.length };
}

export function applyStrikethrough(text: string, selectionStart: number, selectionEnd: number): { text: string; start: number; end: number } {
  const before = text.slice(0, selectionStart);
  const selected = text.slice(selectionStart, selectionEnd);
  const after = text.slice(selectionEnd);

  if (selected.startsWith('~~') && selected.endsWith('~~')) {
    const unwrapped = selected.slice(2, -2);
    return { text: before + unwrapped + after, start: selectionStart, end: selectionStart + unwrapped.length };
  }

  const wrapped = '~~' + selected + '~~';
  return { text: before + wrapped + after, start: selectionStart, end: selectionStart + wrapped.length };
}

export function applyHeading(text: string, selectionStart: number, selectionEnd: number, level: number): { text: string; start: number; end: number } {
  const before = text.slice(0, selectionStart);
  const selected = text.slice(selectionStart, selectionEnd);
  const after = text.slice(selectionEnd);

  const prefix = '#'.repeat(level) + ' ';
  const lineStart = selected.lastIndexOf('\n') + 1;
  const modifiedSelected = selected.slice(0, lineStart) + prefix + selected.slice(lineStart);

  return { text: before + modifiedSelected + after, start: selectionStart, end: selectionStart + modifiedSelected.length };
}

export function applyQuote(text: string, selectionStart: number, selectionEnd: number): { text: string; start: number; end: number } {
  const before = text.slice(0, selectionStart);
  const selected = text.slice(selectionStart, selectionEnd);
  const after = text.slice(selectionEnd);

  const lines = selected.split('\n');
  const quoted = lines.map(line => '> ' + line).join('\n');

  return { text: before + quoted + after, start: selectionStart, end: selectionStart + quoted.length };
}

export function applyBulletList(text: string, selectionStart: number, selectionEnd: number): { text: string; start: number; end: number } {
  const before = text.slice(0, selectionStart);
  const selected = text.slice(selectionStart, selectionEnd);
  const after = text.slice(selectionEnd);

  const lines = selected.split('\n');
  const bulleted = lines.map(line => '- ' + line).join('\n');

  return { text: before + bulleted + after, start: selectionStart, end: selectionStart + bulleted.length };
}

export function applyNumberedList(text: string, selectionStart: number, selectionEnd: number): { text: string; start: number; end: number } {
  const before = text.slice(0, selectionStart);
  const selected = text.slice(selectionStart, selectionEnd);
  const after = text.slice(selectionEnd);

  const lines = selected.split('\n');
  const numbered = lines.map((line, i) => (i + 1) + '. ' + line).join('\n');

  return { text: before + numbered + after, start: selectionStart, end: selectionStart + numbered.length };
}

export function applyCodeBlock(text: string, selectionStart: number, selectionEnd: number): { text: string; start: number; end: number } {
  const before = text.slice(0, selectionStart);
  const selected = text.slice(selectionStart, selectionEnd);
  const after = text.slice(selectionEnd);

  const wrapped = '\n```\n' + selected + '\n```\n';
  return { text: before + wrapped + after, start: selectionStart, end: selectionStart + wrapped.length };
}

export function applyHorizontalLine(text: string, selectionStart: number, selectionEnd: number): { text: string; start: number; end: number } {
  const before = text.slice(0, selectionStart);
  const after = text.slice(selectionEnd);

  const inserted = '\n---\n';
  return { text: before + inserted + after, start: selectionStart + inserted.length, end: selectionStart + inserted.length };
}

export function applyImage(text: string, selectionStart: number, selectionEnd: number): { text: string; start: number; end: number } {
  const before = text.slice(0, selectionStart);
  const selected = text.slice(selectionStart, selectionEnd);
  const after = text.slice(selectionEnd);

  const altText = selected || 'alt text';
  const inserted = '![' + altText + '](image-url)';
  return { text: before + inserted + after, start: selectionStart, end: selectionStart + inserted.length };
}

export function applyLink(text: string, selectionStart: number, selectionEnd: number): { text: string; start: number; end: number } {
  const before = text.slice(0, selectionStart);
  const selected = text.slice(selectionStart, selectionEnd);
  const after = text.slice(selectionEnd);

  const linkText = selected || '链接文本';
  const inserted = '[' + linkText + '](url)';
  return { text: before + inserted + after, start: selectionStart, end: selectionStart + inserted.length };
}