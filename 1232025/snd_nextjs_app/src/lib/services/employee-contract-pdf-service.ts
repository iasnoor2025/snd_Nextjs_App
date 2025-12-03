// Local dynamic loader to avoid build-time export coupling
let _jsPDF: any = null;
const loadJsPDF = async () => {
  if (!_jsPDF) {
    const { jsPDF } = await import('jspdf');
    _jsPDF = jsPDF;
  }
  return _jsPDF;
};

export interface EmployeeContractData {
  // Employee Information
  fileNumber: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  nationality?: string | null;
  dateOfBirth?: string | null;
  iqamaNumber?: string | null;
  passportNumber?: string | null;
  
  // Contact Information
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  
  // Employment Details
  designation?: { name: string } | null;
  department?: { name: string } | null;
  hireDate?: string | null;
  contractHoursPerDay?: number;
  contractDaysPerMonth?: number;
  
  // Salary Information
  basicSalary: string;
  foodAllowance: string;
  housingAllowance: string;
  transportAllowance: string;
  
  // Company Information
  companyName?: string;
  companyAddress?: string;
}

export class EmployeeContractPDFService {
  static async generateContractPDF(employeeData: EmployeeContractData): Promise<Blob> {
    try {
      const jsPDFModule = await loadJsPDF();
      const pdf = new jsPDFModule('p', 'mm', 'a4');
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;
      
      // Title
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('عقد عمل', pageWidth / 2, yPosition, { align: 'center' });
      pdf.text('Employment Contract', pageWidth / 2, yPosition + 8, { align: 'center' });
      yPosition += 20;
      
      // Date and Contract Number
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const today = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      pdf.text(`Date: ${today}`, margin, yPosition);
      pdf.text(`Contract No: ${employeeData.fileNumber || 'N/A'}`, pageWidth - margin, yPosition, { align: 'right' });
      yPosition += 15;
      
      // Line separator
      pdf.setLineWidth(0.5);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;
      
      // Parties Section
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Parties to the Contract', margin, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      // Employer (First Party)
      pdf.setFont('helvetica', 'bold');
      pdf.text('First Party (Employer):', margin, yPosition);
      yPosition += 7;
      pdf.setFont('helvetica', 'normal');
      const companyName = employeeData.companyName || 'Samhan Naser Al-Dosri Est.';
      const companyAddress = employeeData.companyAddress || 'For Gen. Contracting & Rent. Equipments';
      pdf.text(companyName, margin + 5, yPosition);
      yPosition += 5;
      if (companyAddress) {
        pdf.text(companyAddress, margin + 5, yPosition);
        yPosition += 5;
      }
      yPosition += 5;
      
      // Employee (Second Party)
      pdf.setFont('helvetica', 'bold');
      pdf.text('Second Party (Employee):', margin, yPosition);
      yPosition += 7;
      pdf.setFont('helvetica', 'normal');
      const fullName = [employeeData.firstName, employeeData.middleName, employeeData.lastName]
        .filter(Boolean)
        .join(' ');
      pdf.text(`Name: ${fullName}`, margin + 5, yPosition);
      yPosition += 5;
      if (employeeData.nationality) {
        pdf.text(`Nationality: ${employeeData.nationality}`, margin + 5, yPosition);
        yPosition += 5;
      }
      if (employeeData.iqamaNumber) {
        pdf.text(`Iqama No: ${employeeData.iqamaNumber}`, margin + 5, yPosition);
        yPosition += 5;
      }
      if (employeeData.passportNumber) {
        pdf.text(`Passport No: ${employeeData.passportNumber}`, margin + 5, yPosition);
        yPosition += 5;
      }
      if (employeeData.dateOfBirth) {
        const dob = new Date(employeeData.dateOfBirth).toLocaleDateString();
        pdf.text(`Date of Birth: ${dob}`, margin + 5, yPosition);
        yPosition += 5;
      }
      if (employeeData.address) {
        pdf.text(`Address: ${employeeData.address}${employeeData.city ? `, ${employeeData.city}` : ''}`, margin + 5, yPosition);
        yPosition += 5;
      }
      yPosition += 10;
      
      // Check if we need a new page
      if (yPosition > pageHeight - 100) {
        pdf.addPage();
        yPosition = margin;
      }
      
      // Contract Terms - Saudi Labor Law Compliance
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Contract Terms (Per Saudi Labor Law)', margin, yPosition);
      yPosition += 10;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      const terms = [
        {
          title: '1. Job Title and Description',
          content: `The employee shall work as ${employeeData.designation?.name || 'Employee'} in the ${employeeData.department?.name || 'Company'} department.`
        },
        {
          title: '2. Contract Duration',
          content: employeeData.hireDate 
            ? `This contract commences on ${new Date(employeeData.hireDate).toLocaleDateString()} and continues in effect until terminated according to Saudi Labor Law provisions.`
            : 'This contract continues in effect until terminated according to Saudi Labor Law provisions.'
        },
        {
          title: '3. Work Hours',
          content: `Regular working hours: ${employeeData.contractHoursPerDay || 8} hours per day, ${employeeData.contractDaysPerMonth || 30} days per month, in accordance with Saudi Labor Law.`
        },
        {
          title: '4. Remuneration',
          content: `The employee shall receive a total monthly salary of SAR ${this.formatSalary(employeeData)} as follows:
- Basic Salary: SAR ${parseFloat(employeeData.basicSalary || '0').toLocaleString()}
- Food Allowance: SAR ${parseFloat(employeeData.foodAllowance || '0').toLocaleString()}
- Housing Allowance: SAR ${parseFloat(employeeData.housingAllowance || '0').toLocaleString()}
- Transport Allowance: SAR ${parseFloat(employeeData.transportAllowance || '0').toLocaleString()}`
        },
        {
          title: '5. Payment',
          content: 'Salary shall be paid monthly within the first week of each month.'
        },
        {
          title: '6. Leave Entitlement',
          content: 'The employee is entitled to annual leave as per Saudi Labor Law: 21 days after one year of service, 30 days after five years of service.'
        },
        {
          title: '7. Probation Period',
          content: 'A probation period of up to 90 days may be applied in accordance with Article 53 of Saudi Labor Law.'
        },
        {
          title: '8. Termination',
          content: 'Termination shall be subject to Saudi Labor Law provisions, including notice periods and end of service benefits.'
        },
        {
          title: '9. Confidentiality',
          content: 'The employee shall maintain confidentiality of company information during and after employment.'
        },
        {
          title: '10. Governing Law',
          content: 'This contract is governed by the Saudi Labor Law and regulations.'
        }
      ];
      
      for (const term of terms) {
        // Check for new page
        if (yPosition > pageHeight - 60) {
          pdf.addPage();
          yPosition = margin;
        }
        
        pdf.setFont('helvetica', 'bold');
        pdf.text(term.title, margin, yPosition);
        yPosition += 6;
        pdf.setFont('helvetica', 'normal');
        const lines = pdf.splitTextToSize(term.content, pageWidth - 2 * margin - 5);
        pdf.text(lines, margin + 5, yPosition);
        yPosition += lines.length * 5 + 5;
      }
      
      // Signature Section
      if (yPosition > pageHeight - 80) {
        pdf.addPage();
        yPosition = margin;
      }
      
      yPosition += 10;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Signatures', margin, yPosition);
      yPosition += 15;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Employee Signature:', margin, yPosition + 20);
      pdf.text('_________________________', margin, yPosition + 25);
      pdf.text(fullName, margin, yPosition + 30);
      
      pdf.text('Employer Signature:', pageWidth / 2, yPosition + 20);
      pdf.text('_________________________', pageWidth / 2, yPosition + 25);
      pdf.text(companyName, pageWidth / 2, yPosition + 30);
      
      pdf.text('Date: _______________', pageWidth - margin, yPosition + 20, { align: 'right' });
      
      return pdf.output('blob');
    } catch (error) {
      console.error('Error generating contract PDF:', error);
      throw error;
    }
  }
  
  private static formatSalary(data: EmployeeContractData): string {
    const basic = parseFloat(data.basicSalary || '0');
    const food = parseFloat(data.foodAllowance || '0');
    const housing = parseFloat(data.housingAllowance || '0');
    const transport = parseFloat(data.transportAllowance || '0');
    const total = basic + food + housing + transport;
    return total.toLocaleString();
  }
}

