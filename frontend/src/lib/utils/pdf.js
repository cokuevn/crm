// Lightweight PDF export of rendered UI (preserves current design)
// Uses dynamic imports in callers to avoid loading heavy libs upfront.

export async function exportElementToPdf(element, { filename = 'analytics.pdf' } = {}) {
  if (!element) throw new Error('No element to export');

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  // Force solid background (otherwise may become transparent/black in some browsers)
  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    scale: Math.min(2, window.devicePixelRatio || 1),
    useCORS: true,
    logging: false,
  });

  const imgData = canvas.toDataURL('image/png');

  // A4 portrait in mm
  const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgProps = pdf.getImageProperties(imgData);
  const imgWidth = pageWidth;
  const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    pdf.addPage();
    position = heightLeft - imgHeight; // negative y to shift image up
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;
  }

  pdf.save(filename);
}


