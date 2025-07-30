// TimesheetList.tsx
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function TimesheetList({
  employeeId,
  onAddNew,
}: {
  employeeId: number;
  onAddNew?: () => void;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Timesheets</CardTitle>
        {onAddNew && (
          <Button onClick={onAddNew}>Add Timesheet</Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-muted-foreground italic">No timesheets found.</div>
      </CardContent>
    </Card>
  );
}