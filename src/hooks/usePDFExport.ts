import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface PDFExportOptions {
  filename: string;
  elementId: string;
}

export const usePDFExport = () => {
  const exportToPDF = async ({ filename, elementId }: PDFExportOptions): Promise<void> => {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`Element with id ${elementId} not found`);
      return;
    }

    try {
      // 1. Capture the element as a canvas
      // scale: 2 for high DPI output (better quality for Korean text)
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      // 2. Convert canvas to image data
      const imgData = canvas.toDataURL('image/png');

      // 3. Create PDF
      // A4 dimensions in mm: 210 x 297
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      
      const finalImgWidth = imgWidth * ratio;
      const finalImgHeight = imgHeight * ratio;
      
      const marginX = (pdfWidth - finalImgWidth) / 2;
      const marginY = 10; // Top margin

      pdf.addImage(imgData, 'PNG', marginX, marginY, finalImgWidth, finalImgHeight);

      // 4. Download
      pdf.save(`${filename}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  return { exportToPDF };
};
