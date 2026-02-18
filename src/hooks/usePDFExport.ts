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
      console.error(`[PDF Export] Element with id ${elementId} not found`);
      return false;
    }

    try {
      console.log(`[PDF Export] Starting capture for ${elementId}...`);
      const canvas = await html2canvas(element, {
        scale: 1.5, // Reduced scale for better performance/memory
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true,
        imageTimeout: 15000,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.85); // Use JPEG for better performance
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const canvasAspectRatio = canvas.width / canvas.height;
      let imgWidth = pdfWidth - 20;
      let imgHeight = imgWidth / canvasAspectRatio;

      if (imgHeight > pdfHeight - 20) {
        imgHeight = pdfHeight - 20;
        imgWidth = imgHeight * canvasAspectRatio;
      }
      
      const xOffset = (pdfWidth - imgWidth) / 2;
      const yOffset = 10;

      pdf.addImage(imgData, 'JPEG', xOffset, yOffset, imgWidth, imgHeight);
      pdf.save(`${filename}.pdf`);
      console.log(`[PDF Export] Successfully generated: ${filename}.pdf`);
      return true;
    } catch (error) {
      console.error('[PDF Export] Capture failed:', error);
      return false;
    }
  };

  const exportBatchToPDF = async ({ elementIds, filename }: { elementIds: string[]; filename: string }): Promise<boolean> => {
     try {
      console.log(`[PDF Export] Starting batch export for ${elementIds.length} elements...`);
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
          console.warn(`[PDF Export] Element ${id} not found, skipping...`);
          continue;
        }

        const canvas = await html2canvas(element, {
          scale: 1.5,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
          imageTimeout: 15000,
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.85);
        const imgHeight = (canvas.height * contentWidth) / canvas.width;

        // Check if we need a new page
        if (i > 0 && (currentY + imgHeight > pageHeight - margin)) {
          pdf.addPage();
          currentY = margin;
        }

        pdf.addImage(imgData, 'JPEG', margin, currentY, contentWidth, imgHeight);
        currentY += imgHeight + 10;
        
        // Minor delay to prevent browser freezing during large batches
        if (i % 3 === 0) await new Promise(r => setTimeout(r, 50));
      }

      pdf.save(`${filename}.pdf`);
      console.log(`[PDF Export] Successfully generated batch: ${filename}.pdf`);
      return true;
    } catch (error) {
      console.error('[PDF Export] Batch export failed:', error);
      return false;
    }
  };

  return { exportToPDF, exportBatchToPDF };
};
