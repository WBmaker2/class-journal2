import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface PDFExportOptions {
  filename: string;
  elementId: string;
}

export const usePDFExport = () => {
  const exportToPDF = async ({ filename, elementId }: PDFExportOptions): Promise<boolean> => {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`Element with id ${elementId} not found`);
      return false;
    }

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const canvasAspectRatio = canvas.width / canvas.height;
      let imgWidth = pdfWidth - 20; // 10mm margin each side
      let imgHeight = imgWidth / canvasAspectRatio;

      if (imgHeight > pdfHeight - 20) {
        imgHeight = pdfHeight - 20;
        imgWidth = imgHeight * canvasAspectRatio;
      }
      
      const xOffset = (pdfWidth - imgWidth) / 2;
      const yOffset = 10;

      pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight);
      pdf.save(`${filename}.pdf`);
      return true;
    } catch (error) {
      console.error('Error generating PDF:', error);
      return false;
    }
  };

  const exportBatchToPDF = async ({ elementIds, filename }: { elementIds: string[]; filename: string }): Promise<boolean> => {
     try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pageWidth - margin * 2;
      let currentY = margin;

      for (let i = 0; i < elementIds.length; i++) {
        const id = elementIds[i];
        const element = document.getElementById(id);
        if (!element) {
          console.warn(`Element ${id} not found, skipping...`);
          continue;
        }

        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false
        });

        const imgData = canvas.toDataURL('image/png');
        const imgHeight = (canvas.height * contentWidth) / canvas.width;

        if (currentY + imgHeight > pageHeight - margin && i > 0) {
          pdf.addPage();
          currentY = margin;
        }

        pdf.addImage(imgData, 'PNG', margin, currentY, contentWidth, imgHeight);
        currentY += imgHeight + 10;
      }

      pdf.save(`${filename}.pdf`);
      return true;
    } catch (error) {
      console.error('Error generating batch PDF:', error);
      return false;
    }
  };

  return { exportToPDF, exportBatchToPDF };
};
