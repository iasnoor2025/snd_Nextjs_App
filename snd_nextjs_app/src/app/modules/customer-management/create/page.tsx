"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, UserPlus, Upload } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  company_name: string;
  contact_person: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  website: string;
  tax_number: string;
  credit_limit: string;
  payment_terms: string;
  is_active: boolean;
}

export default function CreateCustomerPage() {
  const [formData, setFormData] = useState<CustomerFormData>({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
    company_name: "",
    contact_person: "",
    city: "",
    state: "",
    postal_code: "",
    country: "",
    website: "",
    tax_number: "",
    credit_limit: "",
    payment_terms: "",
    is_active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [document, setDocument] = useState<File | null>(null);

  const handleInputChange = (field: keyof CustomerFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocument(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();

      // Append all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'is_active') {
          formDataToSend.append(key, value ? '1' : '0');
        } else {
          formDataToSend.append(key, value.toString());
        }
      });

      // Append document if selected
      if (document) {
        formDataToSend.append('document', document);
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success("Customer created successfully");
      // Redirect to customers list
      window.location.href = "/modules/customer-management";
    } catch {
      toast.error("Failed to create customer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl font-bold">
              <UserPlus className="h-6 w-6" />
              Create Customer
            </CardTitle>
            <CardDescription>Add a new customer to the system</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" asChild>
              <Link href="/modules/customer-management">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Customers
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter customer name"
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Enter email address"
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company_name">Company Name</Label>
                  <Input
                    id="company_name"
                    value={formData.company_name}
                    onChange={(e) => handleInputChange("company_name", e.target.value)}
                    placeholder="Enter company name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_person">Contact Person</Label>
                  <Input
                    id="contact_person"
                    value={formData.contact_person}
                    onChange={(e) => handleInputChange("contact_person", e.target.value)}
                    placeholder="Enter contact person name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleInputChange("website", e.target.value)}
                    placeholder="Enter website URL"
                  />
                </div>
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Address Information</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    placeholder="Enter full address"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      placeholder="Enter city"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => handleInputChange("state", e.target.value)}
                      placeholder="Enter state"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postal_code">Postal Code</Label>
                    <Input
                      id="postal_code"
                      value={formData.postal_code}
                      onChange={(e) => handleInputChange("postal_code", e.target.value)}
                      placeholder="Enter postal code"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => handleInputChange("country", e.target.value)}
                      placeholder="Enter country"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Business Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tax_number">Tax Number</Label>
                  <Input
                    id="tax_number"
                    value={formData.tax_number}
                    onChange={(e) => handleInputChange("tax_number", e.target.value)}
                    placeholder="Enter tax number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="credit_limit">Credit Limit</Label>
                  <Input
                    id="credit_limit"
                    type="number"
                    value={formData.credit_limit}
                    onChange={(e) => handleInputChange("credit_limit", e.target.value)}
                    placeholder="Enter credit limit"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_terms">Payment Terms</Label>
                  <Input
                    id="payment_terms"
                    value={formData.payment_terms}
                    onChange={(e) => handleInputChange("payment_terms", e.target.value)}
                    placeholder="e.g., Net 30"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Additional Information</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Enter any additional notes"
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="document">Document</Label>
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Choose File
                    </Button>
                    {document && (
                      <span className="text-sm text-gray-600">{document.name}</span>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => handleInputChange("is_active", checked)}
                  />
                  <Label htmlFor="is_active">Active Customer</Label>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" asChild>
                <Link href="/modules/customer-management">Cancel</Link>
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Customer"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
