"use client";

import { useI18n } from "@/hooks/use-i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function TestSidebarRTLPage() {
  const { isRTL, currentLanguage, changeLanguage } = useI18n();

  const toggleLanguage = () => {
    changeLanguage(isRTL ? "en" : "ar");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sidebar RTL Test Page</h1>
          <p className="text-muted-foreground">
            Test the sidebar behavior in RTL mode
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="rtl-mode"
              checked={isRTL}
              onCheckedChange={toggleLanguage}
            />
            <Label htmlFor="rtl-mode">RTL Mode</Label>
          </div>
          <Badge variant={isRTL ? "default" : "secondary"}>
            {isRTL ? "RTL" : "LTR"}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Current Language</CardTitle>
            <CardDescription>
              The current language and direction settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Language:</span>
              <Badge variant="outline">{currentLanguage?.name || "Unknown"}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Direction:</span>
              <Badge variant="outline">{isRTL ? "RTL" : "LTR"}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Sidebar Position:</span>
              <Badge variant="outline">{isRTL ? "Right" : "Left"}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Layout Information</CardTitle>
            <CardDescription>
              Information about the current layout structure
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm space-y-2">
              <p><strong>Document Direction:</strong> {document.documentElement.dir || "Not set"}</p>
              <p><strong>Document Language:</strong> {document.documentElement.lang || "Not set"}</p>
              <p><strong>Body Classes:</strong> {document.body.className || "None"}</p>
              <p><strong>HTML Classes:</strong> {document.documentElement.className || "None"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Controls</CardTitle>
            <CardDescription>
              Test different language and direction settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Button 
                onClick={() => changeLanguage("en")} 
                variant="outline" 
                className="w-full"
              >
                Switch to English (LTR)
              </Button>
              <Button 
                onClick={() => changeLanguage("ar")} 
                variant="outline" 
                className="w-full"
              >
                Switch to Arabic (RTL)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Visual Test</CardTitle>
          <CardDescription>
            This content should be properly positioned relative to the sidebar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>
              This is a test page to verify that the sidebar is working correctly in RTL mode. 
              The sidebar should appear on the right side when in RTL mode and on the left side 
              when in LTR mode.
            </p>
            <div className="flex items-center space-x-4">
              <Button variant="default">Primary Button</Button>
              <Button variant="secondary">Secondary Button</Button>
              <Button variant="outline">Outline Button</Button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold">Column 1</h3>
                <p className="text-sm text-muted-foreground">This is the first column</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold">Column 2</h3>
                <p className="text-sm text-muted-foreground">This is the second column</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold">Column 3</h3>
                <p className="text-sm text-muted-foreground">This is the third column</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 