import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface OfferteData {
  titel: string;
  klant_naam: string;
  klant_adres?: string;
  klant_email?: string;
  klant_telefoon?: string;
  items: Array<{
    omschrijving: string;
    aantal: number;
    prijs_per_stuk: number;
    btw_percentage: number;
  }>;
  totaal_bedrag: number;
  valuta?: string;
  geldigheidsduur?: string;
  opmerkingen?: string;
  betalingsvoorwaarden?: string;
  datum?: string;
  offerte_nummer?: string;
}

export interface FactuurData {
  factuurnummer: string;
  titel: string;
  klant_naam: string;
  klant_adres?: string;
  klant_email?: string;
  factuurdatum: string;
  vervaldatum: string;
  items: Array<{
    omschrijving: string;
    aantal: number;
    prijs_per_stuk: number;
    btw_percentage: number;
    totaal: number;
  }>;
  subtotaal: number;
  btw_bedrag: number;
  totaal_bedrag: number;
  valuta?: string;
  opmerkingen?: string;
  betalingsvoorwaarden?: string;
}

export type TemplateType = 'modern' | 'classic' | 'minimal' | 'professional';

class PDFGenerator {
  private companyInfo = {
    name: 'Archon.ai',
    address: 'Bedrijfsstraat 123',
    city: '1000 AA Amsterdam',
    email: 'info@archon.ai',
    phone: '+31 20 123 4567',
    kvk: '12345678',
    btw: 'NL123456789B01'
  };

  async generateOfferte(data: OfferteData, template: TemplateType = 'modern'): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const { width, height } = page.getSize();

    switch (template) {
      case 'modern':
        return this.generateModernOfferte(pdfDoc, page, data, width, height);
      case 'classic':
        return this.generateClassicOfferte(pdfDoc, page, data, width, height);
      case 'minimal':
        return this.generateMinimalOfferte(pdfDoc, page, data, width, height);
      case 'professional':
        return this.generateProfessionalOfferte(pdfDoc, page, data, width, height);
      default:
        return this.generateModernOfferte(pdfDoc, page, data, width, height);
    }
  }

  async generateFactuur(data: FactuurData, template: TemplateType = 'modern'): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]);
    const { width, height } = page.getSize();

    switch (template) {
      case 'modern':
        return this.generateModernFactuur(pdfDoc, page, data, width, height);
      case 'classic':
        return this.generateClassicFactuur(pdfDoc, page, data, width, height);
      case 'minimal':
        return this.generateMinimalFactuur(pdfDoc, page, data, width, height);
      case 'professional':
        return this.generateProfessionalFactuur(pdfDoc, page, data, width, height);
      default:
        return this.generateModernFactuur(pdfDoc, page, data, width, height);
    }
  }

  // TEMPLATE 1: MODERN - Clean with accent color
  private async generateModernOfferte(
    pdfDoc: PDFDocument,
    page: any,
    data: OfferteData,
    width: number,
    height: number
  ): Promise<Uint8Array> {
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const accentColor = rgb(0.2, 0.4, 0.8); // Blue accent

    // Header bar
    page.drawRectangle({
      x: 0,
      y: height - 120,
      width: width,
      height: 120,
      color: accentColor
    });

    // Company name
    page.drawText(this.companyInfo.name, {
      x: 50,
      y: height - 60,
      size: 28,
      font: fontBold,
      color: rgb(1, 1, 1)
    });

    // Document type
    page.drawText('OFFERTE', {
      x: width - 150,
      y: height - 60,
      size: 24,
      font: fontBold,
      color: rgb(1, 1, 1)
    });

    // Document info box
    const infoY = height - 180;
    page.drawRectangle({
      x: width - 200,
      y: infoY - 80,
      width: 150,
      height: 100,
      color: rgb(0.95, 0.95, 0.95),
      borderColor: accentColor,
      borderWidth: 2
    });

    page.drawText(`Offerte #: ${data.offerte_nummer || '2025-001'}`, {
      x: width - 190,
      y: infoY - 20,
      size: 10,
      font: font
    });

    page.drawText(`Datum: ${data.datum || new Date().toLocaleDateString('nl-NL')}`, {
      x: width - 190,
      y: infoY - 40,
      size: 10,
      font: font
    });

    page.drawText(`Geldig t/m: ${data.geldigheidsduur || '30 dagen'}`, {
      x: width - 190,
      y: infoY - 60,
      size: 10,
      font: font
    });

    // Customer info
    page.drawText('Offerte voor:', {
      x: 50,
      y: height - 180,
      size: 12,
      font: fontBold,
      color: accentColor
    });

    page.drawText(data.klant_naam, {
      x: 50,
      y: height - 200,
      size: 14,
      font: fontBold
    });

    if (data.klant_adres) {
      page.drawText(data.klant_adres, {
        x: 50,
        y: height - 220,
        size: 10,
        font: font
      });
    }

    // Title
    page.drawText(data.titel, {
      x: 50,
      y: height - 280,
      size: 16,
      font: fontBold,
      color: accentColor
    });

    // Items table header
    const tableY = height - 320;
    page.drawRectangle({
      x: 50,
      y: tableY - 20,
      width: width - 100,
      height: 25,
      color: accentColor
    });

    page.drawText('Omschrijving', { x: 60, y: tableY - 12, size: 11, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText('Aantal', { x: 300, y: tableY - 12, size: 11, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText('Prijs', { x: 370, y: tableY - 12, size: 11, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText('BTW', { x: 430, y: tableY - 12, size: 11, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText('Totaal', { x: 490, y: tableY - 12, size: 11, font: fontBold, color: rgb(1, 1, 1) });

    // Items
    let currentY = tableY - 40;
    data.items.forEach((item, index) => {
      const bgColor = index % 2 === 0 ? rgb(0.97, 0.97, 0.97) : rgb(1, 1, 1);
      page.drawRectangle({
        x: 50,
        y: currentY - 5,
        width: width - 100,
        height: 25,
        color: bgColor
      });

      page.drawText(item.omschrijving.substring(0, 35), { x: 60, y: currentY + 5, size: 10, font: font });
      page.drawText(item.aantal.toString(), { x: 310, y: currentY + 5, size: 10, font: font });
      page.drawText(`€${item.prijs_per_stuk.toFixed(2)}`, { x: 370, y: currentY + 5, size: 10, font: font });
      page.drawText(`${item.btw_percentage}%`, { x: 435, y: currentY + 5, size: 10, font: font });
      const itemTotaal = item.aantal * item.prijs_per_stuk * (1 + item.btw_percentage / 100);
      page.drawText(`€${itemTotaal.toFixed(2)}`, { x: 490, y: currentY + 5, size: 10, font: font });

      currentY -= 30;
    });

    // Total box
    const totalY = currentY - 30;
    page.drawRectangle({
      x: width - 200,
      y: totalY - 60,
      width: 150,
      height: 80,
      color: rgb(0.95, 0.95, 0.95),
      borderColor: accentColor,
      borderWidth: 2
    });

    page.drawText('Totaal excl. BTW:', { x: width - 190, y: totalY - 15, size: 10, font: font });
    page.drawText(`€${(data.totaal_bedrag / 1.21).toFixed(2)}`, { x: width - 100, y: totalY - 15, size: 10, font: font });
    
    page.drawText('BTW (21%):', { x: width - 190, y: totalY - 35, size: 10, font: font });
    page.drawText(`€${(data.totaal_bedrag - data.totaal_bedrag / 1.21).toFixed(2)}`, { x: width - 100, y: totalY - 35, size: 10, font: font });

    page.drawText('Totaal incl. BTW:', { x: width - 190, y: totalY - 55, size: 12, font: fontBold, color: accentColor });
    page.drawText(`€${data.totaal_bedrag.toFixed(2)}`, { x: width - 100, y: totalY - 55, size: 12, font: fontBold, color: accentColor });

    // Footer
    page.drawText(`${this.companyInfo.name} | ${this.companyInfo.address} | ${this.companyInfo.email}`, {
      x: 50,
      y: 50,
      size: 8,
      font: font,
      color: rgb(0.5, 0.5, 0.5)
    });

    return pdfDoc.save();
  }

  // TEMPLATE 2: CLASSIC - Traditional with borders
  private async generateClassicOfferte(
    pdfDoc: PDFDocument,
    page: any,
    data: OfferteData,
    width: number,
    height: number
  ): Promise<Uint8Array> {
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const borderColor = rgb(0.2, 0.2, 0.2);

    // Double border header
    page.drawRectangle({
      x: 30,
      y: height - 130,
      width: width - 60,
      height: 100,
      borderColor: borderColor,
      borderWidth: 2
    });

    page.drawRectangle({
      x: 35,
      y: height - 125,
      width: width - 70,
      height: 90,
      borderColor: borderColor,
      borderWidth: 1
    });

    // Company info
    page.drawText(this.companyInfo.name, {
      x: 50,
      y: height - 80,
      size: 22,
      font: fontBold
    });

    page.drawText('OFFERTE', {
      x: width - 150,
      y: height - 85,
      size: 20,
      font: fontBold
    });

    // Customer box
    page.drawRectangle({
      x: 50,
      y: height - 250,
      width: 250,
      height: 80,
      borderColor: borderColor,
      borderWidth: 1
    });

    page.drawText('AAN:', { x: 60, y: height - 210, size: 10, font: fontBold });
    page.drawText(data.klant_naam, { x: 60, y: height - 230, size: 12, font: font });

    // Info box
    page.drawRectangle({
      x: width - 250,
      y: height - 250,
      width: 200,
      height: 80,
      borderColor: borderColor,
      borderWidth: 1
    });

    page.drawText(`Offerte #: ${data.offerte_nummer || '2025-001'}`, { x: width - 240, y: height - 210, size: 10, font: font });
    page.drawText(`Datum: ${data.datum || new Date().toLocaleDateString('nl-NL')}`, { x: width - 240, y: height - 230, size: 10, font: font });

    // Title
    page.drawText(data.titel, {
      x: 50,
      y: height - 300,
      size: 14,
      font: fontBold
    });

    // Table with borders
    const tableY = height - 340;
    
    // Table header
    page.drawRectangle({
      x: 50,
      y: tableY - 25,
      width: width - 100,
      height: 25,
      borderColor: borderColor,
      borderWidth: 1,
      color: rgb(0.9, 0.9, 0.9)
    });

    page.drawText('Omschrijving', { x: 60, y: tableY - 12, size: 10, font: fontBold });
    page.drawText('Aantal', { x: 300, y: tableY - 12, size: 10, font: fontBold });
    page.drawText('Prijs', { x: 370, y: tableY - 12, size: 10, font: fontBold });
    page.drawText('Totaal', { x: 480, y: tableY - 12, size: 10, font: fontBold });

    // Items with borders
    let currentY = tableY - 50;
    data.items.forEach((item) => {
      page.drawRectangle({
        x: 50,
        y: currentY - 5,
        width: width - 100,
        height: 25,
        borderColor: borderColor,
        borderWidth: 0.5
      });

      page.drawText(item.omschrijving.substring(0, 35), { x: 60, y: currentY + 5, size: 9, font: font });
      page.drawText(item.aantal.toString(), { x: 310, y: currentY + 5, size: 9, font: font });
      page.drawText(`€${item.prijs_per_stuk.toFixed(2)}`, { x: 370, y: currentY + 5, size: 9, font: font });
      const itemTotaal = item.aantal * item.prijs_per_stuk;
      page.drawText(`€${itemTotaal.toFixed(2)}`, { x: 480, y: currentY + 5, size: 9, font: font });

      currentY -= 30;
    });

    // Totals
    const totalY = currentY - 30;
    page.drawRectangle({
      x: width - 200,
      y: totalY - 50,
      width: 150,
      height: 60,
      borderColor: borderColor,
      borderWidth: 1
    });

    page.drawText('Totaal:', { x: width - 190, y: totalY - 25, size: 12, font: fontBold });
    page.drawText(`€${data.totaal_bedrag.toFixed(2)}`, { x: width - 100, y: totalY - 25, size: 12, font: fontBold });

    return pdfDoc.save();
  }

  // TEMPLATE 3: MINIMAL - Clean, lots of whitespace
  private async generateMinimalOfferte(
    pdfDoc: PDFDocument,
    page: any,
    data: OfferteData,
    width: number,
    height: number
  ): Promise<Uint8Array> {
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const lightGray = rgb(0.4, 0.4, 0.4);

    // Simple header
    page.drawText(this.companyInfo.name, {
      x: 50,
      y: height - 60,
      size: 16,
      font: fontBold,
      color: lightGray
    });

    page.drawText('Offerte', {
      x: width - 100,
      y: height - 60,
      size: 16,
      font: font,
      color: lightGray
    });

    // Thin line
    page.drawLine({
      start: { x: 50, y: height - 80 },
      end: { x: width - 50, y: height - 80 },
      thickness: 0.5,
      color: lightGray
    });

    // Client
    page.drawText(data.klant_naam, {
      x: 50,
      y: height - 120,
      size: 18,
      font: fontBold
    });

    // Date and number
    page.drawText(`${data.datum || new Date().toLocaleDateString('nl-NL')}`, {
      x: width - 150,
      y: height - 120,
      size: 10,
      font: font,
      color: lightGray
    });

    // Title
    page.drawText(data.titel, {
      x: 50,
      y: height - 180,
      size: 14,
      font: font
    });

    // Simple item list
    let currentY = height - 230;
    data.items.forEach((item, index) => {
      page.drawLine({
        start: { x: 50, y: currentY + 15 },
        end: { x: width - 50, y: currentY + 15 },
        thickness: 0.3,
        color: rgb(0.9, 0.9, 0.9)
      });

      page.drawText(item.omschrijving, { x: 50, y: currentY, size: 10, font: font });
      page.drawText(`${item.aantal} x €${item.prijs_per_stuk.toFixed(2)}`, { x: 350, y: currentY, size: 10, font: font, color: lightGray });
      
      const itemTotaal = item.aantal * item.prijs_per_stuk;
      page.drawText(`€${itemTotaal.toFixed(2)}`, { x: width - 100, y: currentY, size: 10, font: font });

      currentY -= 35;
    });

    // Total line
    const totalY = currentY - 20;
    page.drawLine({
      start: { x: width - 200, y: totalY },
      end: { x: width - 50, y: totalY },
      thickness: 1,
      color: lightGray
    });

    page.drawText('Totaal', { x: width - 190, y: totalY - 20, size: 12, font: fontBold });
    page.drawText(`€${data.totaal_bedrag.toFixed(2)}`, { x: width - 100, y: totalY - 20, size: 12, font: fontBold });

    return pdfDoc.save();
  }

  // TEMPLATE 4: PROFESSIONAL - Corporate style
  private async generateProfessionalOfferte(
    pdfDoc: PDFDocument,
    page: any,
    data: OfferteData,
    width: number,
    height: number
  ): Promise<Uint8Array> {
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const darkBlue = rgb(0.1, 0.2, 0.4);

    // Header with logo space
    page.drawRectangle({
      x: 0,
      y: height - 100,
      width: width,
      height: 100,
      color: darkBlue
    });

    page.drawText(this.companyInfo.name.toUpperCase(), {
      x: 50,
      y: height - 60,
      size: 20,
      font: fontBold,
      color: rgb(1, 1, 1)
    });

    page.drawText('COMMERCIEEL OFFERTE DOCUMENT', {
      x: 50,
      y: height - 85,
      size: 10,
      font: font,
      color: rgb(0.8, 0.8, 0.8)
    });

    // Document details right side
    page.drawText(`Document #: ${data.offerte_nummer || '2025-001'}`, {
      x: width - 200,
      y: height - 60,
      size: 9,
      font: font,
      color: rgb(0.8, 0.8, 0.8)
    });

    page.drawText(`Datum: ${data.datum || new Date().toLocaleDateString('nl-NL')}`, {
      x: width - 200,
      y: height - 75,
      size: 9,
      font: font,
      color: rgb(0.8, 0.8, 0.8)
    });

    // Client info section
    page.drawRectangle({
      x: 50,
      y: height - 220,
      width: 300,
      height: 100,
      color: rgb(0.97, 0.97, 0.97),
      borderColor: darkBlue,
      borderWidth: 1
    });

    page.drawText('KLANTGEGEVENS', {
      x: 60,
      y: height - 195,
      size: 9,
      font: fontBold,
      color: darkBlue
    });

    page.drawText(data.klant_naam, {
      x: 60,
      y: height - 215,
      size: 11,
      font: fontBold
    });

    if (data.klant_adres) {
      page.drawText(data.klant_adres, {
        x: 60,
        y: height - 235,
        size: 9,
        font: font
      });
    }

    // Title
    page.drawText(data.titel.toUpperCase(), {
      x: 50,
      y: height - 280,
      size: 14,
      font: fontBold,
      color: darkBlue
    });

    // Professional table
    const tableY = height - 320;
    
    // Header
    page.drawRectangle({
      x: 50,
      y: tableY - 25,
      width: width - 100,
      height: 25,
      color: darkBlue
    });

    page.drawText('ITEM', { x: 60, y: tableY - 12, size: 10, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText('QTY', { x: 320, y: tableY - 12, size: 10, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText('PRIJS', { x: 380, y: tableY - 12, size: 10, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText('TOTAAL', { x: 480, y: tableY - 12, size: 10, font: fontBold, color: rgb(1, 1, 1) });

    // Items
    let currentY = tableY - 50;
    data.items.forEach((item, index) => {
      // Number
      page.drawText(`${index + 1}.`, { x: 60, y: currentY, size: 9, font: fontBold, color: darkBlue });
      
      // Description
      page.drawText(item.omschrijving.substring(0, 40), { x: 80, y: currentY, size: 9, font: font });
      
      // Qty
      page.drawText(item.aantal.toString(), { x: 325, y: currentY, size: 9, font: font });
      
      // Price
      page.drawText(`€${item.prijs_per_stuk.toFixed(2)}`, { x: 380, y: currentY, size: 9, font: font });
      
      // Total
      const itemTotaal = item.aantal * item.prijs_per_stuk;
      page.drawText(`€${itemTotaal.toFixed(2)}`, { x: 480, y: currentY, size: 9, font: font });

      currentY -= 25;
    });

    // Total section
    const totalY = currentY - 30;
    
    page.drawRectangle({
      x: width - 250,
      y: totalY - 80,
      width: 200,
      height: 100,
      color: darkBlue
    });

    page.drawText('SUBTOTAAL:', { x: width - 240, y: totalY - 25, size: 9, font: font, color: rgb(0.8, 0.8, 0.8) });
    page.drawText(`€${(data.totaal_bedrag / 1.21).toFixed(2)}`, { x: width - 130, y: totalY - 25, size: 9, font: font, color: rgb(0.8, 0.8, 0.8) });

    page.drawText('BTW 21%:', { x: width - 240, y: totalY - 45, size: 9, font: font, color: rgb(0.8, 0.8, 0.8) });
    page.drawText(`€${(data.totaal_bedrag - data.totaal_bedrag / 1.21).toFixed(2)}`, { x: width - 130, y: totalY - 45, size: 9, font: font, color: rgb(0.8, 0.8, 0.8) });

    page.drawText('TOTAAL:', { x: width - 240, y: totalY - 70, size: 11, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText(`€${data.totaal_bedrag.toFixed(2)}`, { x: width - 130, y: totalY - 70, size: 11, font: fontBold, color: rgb(1, 1, 1) });

    // Footer
    const lightGray = rgb(0.4, 0.4, 0.4);

    page.drawText('Bedankt voor uw interesse in onze diensten.', {
      x: 50,
      y: 80,
      size: 9,
      font: font,
      color: lightGray
    });

    page.drawText(`${this.companyInfo.name} | KvK: ${this.companyInfo.kvk} | BTW: ${this.companyInfo.btw}`, {
      x: 50,
      y: 50,
      size: 8,
      font: font,
      color: lightGray
    });

    return pdfDoc.save();
  }

  // Invoice template variants - simplified implementations
  private async generateModernFactuur(
    pdfDoc: PDFDocument,
    page: any,
    data: FactuurData,
    width: number,
    height: number
  ): Promise<Uint8Array> {
    // Similar to modern offerte but with invoice-specific fields
    return this.generateModernOfferte(pdfDoc, page, {
      ...data,
      titel: data.titel,
      klant_naam: data.klant_naam,
      items: data.items,
      totaal_bedrag: data.totaal_bedrag,
      offerte_nummer: data.factuurnummer
    }, width, height);
  }

  private async generateClassicFactuur(
    pdfDoc: PDFDocument,
    page: any,
    data: FactuurData,
    width: number,
    height: number
  ): Promise<Uint8Array> {
    return this.generateClassicOfferte(pdfDoc, page, {
      ...data,
      titel: data.titel,
      klant_naam: data.klant_naam,
      items: data.items,
      totaal_bedrag: data.totaal_bedrag,
      offerte_nummer: data.factuurnummer
    }, width, height);
  }

  private async generateMinimalFactuur(
    pdfDoc: PDFDocument,
    page: any,
    data: FactuurData,
    width: number,
    height: number
  ): Promise<Uint8Array> {
    return this.generateMinimalOfferte(pdfDoc, page, {
      ...data,
      titel: data.titel,
      klant_naam: data.klant_naam,
      items: data.items,
      totaal_bedrag: data.totaal_bedrag,
      offerte_nummer: data.factuurnummer
    }, width, height);
  }

  private async generateProfessionalFactuur(
    pdfDoc: PDFDocument,
    page: any,
    data: FactuurData,
    width: number,
    height: number
  ): Promise<Uint8Array> {
    return this.generateProfessionalOfferte(pdfDoc, page, {
      ...data,
      titel: data.titel,
      klant_naam: data.klant_naam,
      items: data.items,
      totaal_bedrag: data.totaal_bedrag,
      offerte_nummer: data.factuurnummer
    }, width, height);
  }
}

export const pdfGenerator = new PDFGenerator();
export default PDFGenerator;
