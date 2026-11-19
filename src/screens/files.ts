import { Share } from 'react-native';

export type TableKind = 'csv' | 'xls' | 'pdf';

function cell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function csv(headers: string[], rows: string[][]): string {
  return [headers, ...rows].map((line) => line.map(cell).join(',')).join('\r\n');
}

function excel(headers: string[], rows: string[][]): string {
  const head = headers.map((item) => `<Cell><Data ss:Type="String">${escapeXml(item)}</Data></Cell>`).join('');
  const body = rows
    .map((line) => `<Row>${line.map((item) => `<Cell><Data ss:Type="String">${escapeXml(item)}</Data></Cell>`).join('')}</Row>`)
    .join('');
  return `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Sheet1"><Table><Row>${head}</Row>${body}</Table></Worksheet></Workbook>`;
}

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function tableHtml(title: string, headers: string[], rows: string[][]): string {
  const head = headers.map((item) => `<th>${escapeXml(item)}</th>`).join('');
  const body = rows
    .map((line) => `<tr>${line.map((item) => `<td>${escapeXml(item || '—')}</td>`).join('')}</tr>`)
    .join('');
  return `<html><head><meta charset="utf-8" /></head><body>
<h1>${escapeXml(title)}</h1>
<table border="1" cellspacing="0" cellpadding="6"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
</body></html>`;
}

export async function shareTable(kind: TableKind, title: string, headers: string[], rows: string[][]): Promise<void> {
  const safe = title.replace(/[^\w.-]+/g, '-').toLowerCase() || 'export';
  try {
    if (kind === 'pdf') {
      const Print = await import('expo-print');
      const Sharing = await import('expo-sharing');
      const printed = await Print.printToFileAsync({ html: tableHtml(title, headers, rows) });
      await Sharing.shareAsync(printed.uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: title });
      return;
    }
    const { File, Paths } = await import('expo-file-system');
    const Sharing = await import('expo-sharing');
    const name = `${safe}.${kind === 'xls' ? 'xls' : 'csv'}`;
    const file = new File(Paths.cache, name);
    if (file.exists) file.delete();
    await file.write(kind === 'xls' ? excel(headers, rows) : `\uFEFF${csv(headers, rows)}`);
    await Sharing.shareAsync(file.uri, {
      mimeType: kind === 'xls' ? 'application/vnd.ms-excel' : 'text/csv',
      dialogTitle: title,
    });
  } catch {
    await Share.share({ title, message: csv(headers, rows) });
  }
}

export async function shareBytes(name: string, bytes: ArrayBuffer, mimeType: string): Promise<void> {
  const { File, Paths } = await import('expo-file-system');
  const Sharing = await import('expo-sharing');
  const file = new File(Paths.cache, name);
  if (file.exists) file.delete();
  await file.write(new Uint8Array(bytes));
  await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: name });
}

export async function pickSheet(): Promise<{ uri: string; name: string; mimeType: string } | null> {
  const DocumentPicker = await import('expo-document-picker');
  const result = await DocumentPicker.getDocumentAsync({
    copyToCacheDirectory: true,
    multiple: false,
    type: [
      'text/csv',
      'text/comma-separated-values',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/octet-stream',
    ],
  });
  if (result.canceled || !result.assets?.[0]) return null;
  const asset = result.assets[0];
  return { uri: asset.uri, name: asset.name, mimeType: asset.mimeType || 'application/octet-stream' };
}
