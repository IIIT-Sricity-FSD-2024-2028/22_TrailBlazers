/**
 * Standards-compliant PDF Report Generator for Wavevents Event Analytics
 * Pure Node.js implementation generating valid PDF-1.4 binary documents without external dependencies.
 */

export interface AnalyticsPdfData {
  eventName: string;
  eventId: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  venue?: string;
  organization?: string;
  expectedAttendance?: number | string;
  eventManager?: string;
  onsiteCoordinator?: string;
  ticketsSold: number;
  attendeeCheckIns: number;
  attendanceRate: string;
  generatedAt: string;
}

function escapePdfText(str: any): string {
  if (!str) return '';
  // Convert to string and sanitize non-ASCII to safe readable ASCII representations
  return String(str)
    .replace(/[^\x20-\x7E]/g, ' ') // Replace non-printable/unicode with spaces for standard Type 1 fonts
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

export function generateAnalyticsPdf(reportData: AnalyticsPdfData): Buffer {
  const {
    eventName = 'Untitled Event',
    eventId = 'N/A',
    startDate = 'N/A',
    endDate = '',
    location = 'N/A',
    venue = 'N/A',
    organization = 'Wavevents Client Services',
    eventManager = 'Pending Assignment',
    onsiteCoordinator = 'Pending Assignment',
    ticketsSold = 0,
    attendeeCheckIns = 0,
    attendanceRate = 'N/A',
    generatedAt = new Date().toUTCString(),
  } = reportData;

  const width = 595.28;
  const height = 841.89;

  const streamLines: string[] = [];

  // 1. Top Header Banner (Dark Indigo box)
  streamLines.push('q');
  streamLines.push('0.15 0.20 0.35 rg');
  streamLines.push(`0 ${height - 110} ${width} 110 re f`);
  streamLines.push('Q');

  // Vibrant Purple Accent Bar under header
  streamLines.push('q');
  streamLines.push('0.58 0.20 0.92 rg');
  streamLines.push(`0 ${height - 114} ${width} 4 re f`);
  streamLines.push('Q');

  // Header Title
  streamLines.push('BT');
  streamLines.push('/F2 20 Tf');
  streamLines.push('1 1 1 rg');
  streamLines.push(`40 ${height - 52} Td`);
  streamLines.push(`(${escapePdfText('WAVEVENTS')}) Tj`);
  streamLines.push('ET');

  // Header Subtitle
  streamLines.push('BT');
  streamLines.push('/F1 10 Tf');
  streamLines.push('0.85 0.88 0.95 rg');
  streamLines.push(`40 ${height - 72} Td`);
  streamLines.push(`(${escapePdfText('EXECUTIVE EVENT ANALYTICS & ATTENDANCE REPORT')}) Tj`);
  streamLines.push('ET');

  // Report Date in header right
  streamLines.push('BT');
  streamLines.push('/F1 9 Tf');
  streamLines.push('0.80 0.85 0.92 rg');
  streamLines.push(`350 ${height - 50} Td`);
  streamLines.push(`(${escapePdfText('Report Generated:')}) Tj`);
  streamLines.push('ET');

  streamLines.push('BT');
  streamLines.push('/F2 9 Tf');
  streamLines.push('1 1 1 rg');
  streamLines.push(`350 ${height - 65} Td`);
  streamLines.push(`(${escapePdfText(generatedAt)}) Tj`);
  streamLines.push('ET');

  // 2. Section 1: Event Identification & Details
  let y = height - 150;

  // Section Header Background
  streamLines.push('q');
  streamLines.push('0.95 0.96 0.98 rg');
  streamLines.push(`40 ${y - 8} ${width - 80} 24 re f`);
  streamLines.push('0.80 0.83 0.88 RG 1 w');
  streamLines.push(`40 ${y - 8} ${width - 80} 24 re S`);
  streamLines.push('Q');

  streamLines.push('BT');
  streamLines.push('/F2 11 Tf');
  streamLines.push('0.15 0.20 0.35 rg');
  streamLines.push(`52 ${y} Td`);
  streamLines.push(`(${escapePdfText('1. EVENT IDENTIFICATION & SCHEDULE')}) Tj`);
  streamLines.push('ET');

  y -= 35;

  const eventFields = [
    { label: 'Event Name:', value: eventName, isBold: true },
    { label: 'Event ID:', value: eventId, isBold: false },
    { label: 'Dates:', value: endDate && endDate !== startDate ? `${startDate} to ${endDate}` : startDate, isBold: false },
    { label: 'Location & Venue:', value: venue ? `${venue}, ${location}` : location, isBold: false },
    { label: 'Organization:', value: organization, isBold: false },
  ];

  for (const field of eventFields) {
    // Label
    streamLines.push('BT');
    streamLines.push('/F2 10 Tf');
    streamLines.push('0.30 0.35 0.45 rg');
    streamLines.push(`52 ${y} Td`);
    streamLines.push(`(${escapePdfText(field.label)}) Tj`);
    streamLines.push('ET');

    // Value
    streamLines.push('BT');
    streamLines.push(field.isBold ? '/F2 10 Tf' : '/F1 10 Tf');
    streamLines.push('0.12 0.15 0.22 rg');
    streamLines.push(`180 ${y} Td`);
    streamLines.push(`(${escapePdfText(field.value)}) Tj`);
    streamLines.push('ET');

    y -= 18;
  }

  y -= 15;

  // 3. Section 2: Assigned Operations Team
  streamLines.push('q');
  streamLines.push('0.95 0.96 0.98 rg');
  streamLines.push(`40 ${y - 8} ${width - 80} 24 re f`);
  streamLines.push('0.80 0.83 0.88 RG 1 w');
  streamLines.push(`40 ${y - 8} ${width - 80} 24 re S`);
  streamLines.push('Q');

  streamLines.push('BT');
  streamLines.push('/F2 11 Tf');
  streamLines.push('0.15 0.20 0.35 rg');
  streamLines.push(`52 ${y} Td`);
  streamLines.push(`(${escapePdfText('2. ASSIGNED OPERATIONS TEAM')}) Tj`);
  streamLines.push('ET');

  y -= 35;

  const staffFields = [
    { label: 'Event Manager:', value: eventManager },
    { label: 'Onsite Coordinator:', value: onsiteCoordinator },
  ];

  for (const staff of staffFields) {
    streamLines.push('BT');
    streamLines.push('/F2 10 Tf');
    streamLines.push('0.30 0.35 0.45 rg');
    streamLines.push(`52 ${y} Td`);
    streamLines.push(`(${escapePdfText(staff.label)}) Tj`);
    streamLines.push('ET');

    streamLines.push('BT');
    streamLines.push('/F1 10 Tf');
    streamLines.push('0.12 0.15 0.22 rg');
    streamLines.push(`180 ${y} Td`);
    streamLines.push(`(${escapePdfText(staff.value)}) Tj`);
    streamLines.push('ET');

    y -= 18;
  }

  y -= 20;

  // 4. Section 3: Ticketing & Attendance Statistics
  streamLines.push('q');
  streamLines.push('0.95 0.96 0.98 rg');
  streamLines.push(`40 ${y - 8} ${width - 80} 24 re f`);
  streamLines.push('0.80 0.83 0.88 RG 1 w');
  streamLines.push(`40 ${y - 8} ${width - 80} 24 re S`);
  streamLines.push('Q');

  streamLines.push('BT');
  streamLines.push('/F2 11 Tf');
  streamLines.push('0.15 0.20 0.35 rg');
  streamLines.push(`52 ${y} Td`);
  streamLines.push(`(${escapePdfText('3. EVENT TICKETING & ATTENDANCE PERFORMANCE')}) Tj`);
  streamLines.push('ET');

  y -= 25;

  // 3 Metric Cards
  const cardWidth = 160;
  const cardHeight = 85;
  const cards = [
    {
      title: 'TOTAL TICKETS SOLD',
      val: String(ticketsSold),
      sub: 'Confirmed Issued Passes',
      bg: [0.93, 0.94, 0.98],
      border: [0.75, 0.80, 0.95],
      textColor: [0.18, 0.22, 0.55],
    },
    {
      title: 'ATTENDEE CHECK-INS',
      val: String(attendeeCheckIns),
      sub: 'Verified Onsite Attendance',
      bg: [0.91, 0.97, 0.93],
      border: [0.65, 0.88, 0.72],
      textColor: [0.08, 0.45, 0.25],
    },
    {
      title: 'ATTENDANCE RATE',
      val: attendanceRate,
      sub: '(Check-ins / Tickets) * 100',
      bg: [0.98, 0.95, 0.90],
      border: [0.92, 0.82, 0.65],
      textColor: [0.65, 0.35, 0.05],
    },
  ];

  cards.forEach((card, idx) => {
    const cx = 40 + idx * (cardWidth + 17.5);
    const cy = y - cardHeight;

    // Card background
    streamLines.push('q');
    streamLines.push(`${card.bg[0]} ${card.bg[1]} ${card.bg[2]} rg`);
    streamLines.push(`${cx} ${cy} ${cardWidth} ${cardHeight} re f`);
    streamLines.push(`${card.border[0]} ${card.border[1]} ${card.border[2]} RG 1.5 w`);
    streamLines.push(`${cx} ${cy} ${cardWidth} ${cardHeight} re S`);
    streamLines.push('Q');

    // Title
    streamLines.push('BT');
    streamLines.push('/F2 8.5 Tf');
    streamLines.push(`${card.textColor[0]} ${card.textColor[1]} ${card.textColor[2]} rg`);
    streamLines.push(`${cx + 12} ${cy + 64} Td`);
    streamLines.push(`(${escapePdfText(card.title)}) Tj`);
    streamLines.push('ET');

    // Metric Value
    streamLines.push('BT');
    streamLines.push('/F2 22 Tf');
    streamLines.push(`${card.textColor[0]} ${card.textColor[1]} ${card.textColor[2]} rg`);
    streamLines.push(`${cx + 12} ${cy + 34} Td`);
    streamLines.push(`(${escapePdfText(card.val)}) Tj`);
    streamLines.push('ET');

    // Subtitle
    streamLines.push('BT');
    streamLines.push('/F1 7.5 Tf');
    streamLines.push('0.35 0.40 0.50 rg');
    streamLines.push(`${cx + 12} ${cy + 14} Td`);
    streamLines.push(`(${escapePdfText(card.sub)}) Tj`);
    streamLines.push('ET');
  });

  y -= (cardHeight + 35);

  // 5. Notes & Verification Section
  streamLines.push('q');
  streamLines.push('0.98 0.98 0.99 rg');
  streamLines.push(`40 ${y - 45} ${width - 80} 55 re f`);
  streamLines.push('0.85 0.87 0.90 RG 1 w');
  streamLines.push(`40 ${y - 45} ${width - 80} 55 re S`);
  streamLines.push('Q');

  streamLines.push('BT');
  streamLines.push('/F2 9 Tf');
  streamLines.push('0.20 0.25 0.35 rg');
  streamLines.push(`52 ${y - 5} Td`);
  streamLines.push(`(${escapePdfText('DATA INTEGRITY & AUDIT VERIFICATION')}) Tj`);
  streamLines.push('ET');

  streamLines.push('BT');
  streamLines.push('/F1 8 Tf');
  streamLines.push('0.40 0.45 0.52 rg');
  streamLines.push(`52 ${y - 20} Td`);
  streamLines.push(`(${escapePdfText('This report was generated directly from the Wavevents event ledger. Ticket counts represent confirmed')}) Tj`);
  streamLines.push('ET');

  streamLines.push('BT');
  streamLines.push('/F1 8 Tf');
  streamLines.push('0.40 0.45 0.52 rg');
  streamLines.push(`52 ${y - 32} Td`);
  streamLines.push(`(${escapePdfText('registrations and check-in numbers reflect authentic QR-scanned attendee access entries.')}) Tj`);
  streamLines.push('ET');

  // 6. Footer
  streamLines.push('q');
  streamLines.push('0.85 0.87 0.90 RG 0.5 w');
  streamLines.push(`40 45 ${width - 80} 0.5 re S`);
  streamLines.push('Q');

  streamLines.push('BT');
  streamLines.push('/F1 8 Tf');
  streamLines.push('0.50 0.55 0.62 rg');
  streamLines.push(`40 30 Td`);
  streamLines.push(`(${escapePdfText('Wavevents Platform • Event Management & Post-Event Analytics • Confidential Document')}) Tj`);
  streamLines.push('ET');

  streamLines.push('BT');
  streamLines.push('/F2 8 Tf');
  streamLines.push('0.30 0.35 0.45 rg');
  streamLines.push(`${width - 120} 30 Td`);
  streamLines.push(`(${escapePdfText('Page 1 of 1')}) Tj`);
  streamLines.push('ET');

  const contentStream = streamLines.join('\n');
  const streamLength = Buffer.byteLength(contentStream, 'utf-8');

  // Assemble PDF Objects
  const objects: string[] = [];
  objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
  objects[2] = '<< /Type /Pages /Kids [3 0 R] /Count 1 >>';
  objects[3] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`;
  objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
  objects[5] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';
  objects[6] = `<< /Length ${streamLength} >>\nstream\n${contentStream}\nendstream`;

  let pdfOutput = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  const xrefOffsets: number[] = [];

  for (let i = 1; i <= 6; i++) {
    xrefOffsets[i] = Buffer.byteLength(pdfOutput, 'utf-8');
    pdfOutput += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const startXref = Buffer.byteLength(pdfOutput, 'utf-8');
  pdfOutput += 'xref\n';
  pdfOutput += '0 7\n';
  pdfOutput += '0000000000 65535 f \n';
  for (let i = 1; i <= 6; i++) {
    const offsetStr = String(xrefOffsets[i]).padStart(10, '0');
    pdfOutput += `${offsetStr} 00000 n \n`;
  }

  pdfOutput += 'trailer\n';
  pdfOutput += '<< /Size 7 /Root 1 0 R >>\n';
  pdfOutput += 'startxref\n';
  pdfOutput += `${startXref}\n`;
  pdfOutput += '%%EOF\n';

  return Buffer.from(pdfOutput, 'utf-8');
}
