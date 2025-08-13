/**
 * Logo loader utility for PDF generation
 * This file handles loading the company logo from the public directory
 */

export class LogoLoader {
  /**
   * Loads the logo image from the public directory and converts it to base64
   * @returns Promise<string | null> - Base64 encoded logo or null if failed
   */
  static async loadLogoAsBase64(): Promise<string | null> {
    try {
      // For client-side usage in Next.js, we need to use the public URL
      const logoUrl = '/snd-logo.png';
      
      // Fetch the logo from the public directory
      const response = await fetch(logoUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch logo: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      
      // Convert blob to base64
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          resolve(base64);
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Failed to load logo image:', error);
      return null;
    }
  }

  /**
   * Alternative method to load logo from a URL
   * @param logoUrl - URL to the logo image
   * @returns Promise<string | null> - Base64 encoded logo or null if failed
   */
  static async loadLogoFromUrl(logoUrl: string): Promise<string | null> {
    try {
      // This would work in a browser environment
      // For server-side PDF generation, you'd need a different approach
      
      const response = await fetch(logoUrl);
      const blob = await response.blob();
      
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          resolve(base64);
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Failed to load logo from URL:', error);
      return null;
    }
  }

  /**
   * Creates a professional fallback logo design
   * @returns string - SVG-like logo design description
   */
  static getFallbackLogoDesign(): string {
    return 'Professional SND logo with blue gradient background and white text';
  }
}
