# Employee Statistics Explanation

## Current Statistics (from your screenshot)

| Statistic | Count | Description |
|-----------|-------|-------------|
| **Total Employees** | 398 | All employees in the system (regardless of status) |
| **Active Employees** | 352 | Employees with status = 'active' |
| **Currently Assigned** | 260 | Employees with active project or rental assignments |
| **Project Assignments** | 0 | Employees assigned to projects |
| **Rental Assignments** | 155 | Employees assigned to rental items/equipment |
| **Employees on Leave** | 22 | Employees with approved leave records active today |
| **External Employees** | 29 | Employees marked as external (from other companies) |

## Analysis

### 1. Total vs Active Employees (398 vs 352)
- **Difference: 46 employees** are NOT active
- These 46 employees might have status:
  - `inactive` - Not currently working
  - `terminated` - Employment ended
  - `on_leave` - Currently on leave
  - `left` - Left the company
  - Other statuses

### 2. Currently Assigned (260)
- This counts employees with ANY active assignment
- Includes both project and rental assignments
- **Important**: An employee can have both project AND rental assignments
- **Note**: The sum of Project (0) + Rental (155) = 155, not 260
  - This suggests there might be:
    - 105 employees with project assignments from `projectManpower` table
    - 155 employees with rental assignments from `employeeAssignments` table
    - Some overlap (employees with both types)

### 3. Project Assignments showing 0
- This is suspicious and likely indicates a data issue or query problem
- The query looks for:
  1. `employeeAssignments` with `type = 'project'`
  2. `projectManpower` with `status = 'active'`
- If Currently Assigned = 260 and Rental = 155, there should be project assignments
- **Possible causes**:
  - Project assignments are in `projectManpower` table only
  - The `employeeAssignments` table has type = 'rental' or 'rental_item' only
  - Query logic needs review

### 4. Category Overlaps

#### These categories are INDEPENDENT:
- **Total Employees (398)** = Everyone in the system
- **Active Employees (352)** = Subset of Total with status='active'
- **External Employees (29)** = Can be active or inactive (part of Total)

#### These categories are SUBSETS of Active Employees:
- **Currently Assigned (260)** = Active employees with assignments
- **Employees on Leave (22)** = Might be active or have status='on_leave'

#### These categories CAN OVERLAP:
- An employee can be in **both** Project and Rental assignments
- That's why Currently Assigned ≠ Project + Rental

## Expected Relationships

```
Total Employees (398)
├── Active Employees (352)
│   ├── Currently Assigned (260)
│   │   ├── Project Assignments (??)  <-- Should not be 0
│   │   ├── Rental Assignments (155)
│   │   └── Both Project & Rental (??)
│   ├── Not Assigned (92)  [352 - 260]
│   └── On Leave (22?)
├── Inactive/Other Status (46)  [398 - 352]
│   ├── terminated
│   ├── left
│   ├── on_leave
│   └── other statuses

External Employees (29) - Can be in any category above
```

## Recommendations

### 1. Fix Project Assignments Count
The fact that Project Assignments = 0 is clearly wrong. Investigate:
- Check if `projectManpower` table has data
- Check if assignments have `type = 'project'` in `employeeAssignments`
- Review the query logic for project counting

### 2. Add More Detailed Statistics
Consider adding:
- **Unassigned Active Employees**: Active employees with no assignments (352 - 260 = 92)
- **Inactive Employees**: Total - Active (398 - 352 = 46)
- **Internal Employees**: Total - External (398 - 29 = 369)

### 3. Status Breakdown
Add a breakdown showing:
- Active: 352
- Inactive: ?
- On Leave: 22
- Terminated: ?
- Left: ?

### 4. Verify Assignment Logic
The Currently Assigned (260) should equal:
```
UNION of (employees in projectManpower OR employees in employeeAssignments with active status)
```

Not the sum of project + rental, because some employees might have both.

## Query to Verify

Run this query to understand the breakdown:

```sql
-- Status breakdown
SELECT status, COUNT(*) FROM employees GROUP BY status;

-- Assignment types
SELECT type, COUNT(DISTINCT employee_id) 
FROM employee_assignments 
WHERE status = 'active' 
GROUP BY type;

-- Project manpower
SELECT COUNT(DISTINCT employee_id) 
FROM project_manpower 
WHERE status = 'active';

-- Overlapping assignments
SELECT COUNT(DISTINCT ea.employee_id)
FROM employee_assignments ea
INNER JOIN project_manpower pm ON ea.employee_id = pm.employee_id
WHERE ea.status = 'active' AND pm.status = 'active';
```

## Conclusion

The statistics are generally working correctly, but:
1. **Project Assignments = 0** is definitely wrong - needs investigation
2. The numbers make sense when you understand overlaps and subsets
3. Consider adding more granular statistics for better insights

