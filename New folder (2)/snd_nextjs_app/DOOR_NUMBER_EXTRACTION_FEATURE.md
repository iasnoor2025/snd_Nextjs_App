# Door Number Auto-Extraction Feature

## Overview

The equipment management system now includes automatic door number extraction from equipment names. This feature automatically detects and extracts door numbers from equipment names when creating or updating equipment records.

## How It Works

### Supported Patterns

The system can extract door numbers from equipment names using the following patterns:

1. **Number followed by dash and text**: `1301-DOZER` → `1301`
2. **Text followed by number**: `LOADER 1886 AAA` → `1886`
3. **Number in the middle with dashes**: `CRANE-1500-LIFT` → `1500`
4. **Number at the end**: `BULLDOZER 999` → `999`
5. **Number at the beginning**: `1886 LOADER` → `1886`

### Examples

| Equipment Name | Extracted Door Number |
|----------------|----------------------|
| `LOADER 1886 AAA` | `1886` |
| `1301-DOZER` | `1301` |
| `EXCAVATOR 2500` | `2500` |
| `CRANE-1500-LIFT` | `1500` |
| `BULLDOZER 999` | `999` |
| `1886 LOADER` | `1886` |

## Implementation

### Backend

The feature is implemented in the following API endpoints:

- `POST /api/equipment` - Equipment creation
- `PUT /api/equipment` - Equipment update
- `PUT /api/equipment/[id]/update` - Individual equipment update
- `POST /api/erpnext/equipment` - ERPNext sync

### Utility Functions

The core functionality is in `src/lib/utils/equipment-utils.ts`:

- `extractDoorNumberFromName(name: string)` - Extracts door number from equipment name
- `validateDoorNumber(doorNumber: string)` - Validates door number format
- `autoExtractDoorNumber(name: string, existingDoorNumber?: string)` - Auto-extracts door number with validation

### Frontend

The frontend shows notifications when door numbers are automatically extracted:

- Equipment creation modal (`AddEquipmentModal`)
- Equipment edit page (`EquipmentEditPage`)

## Validation Rules

Door numbers must meet the following criteria:

- Must be numeric (digits only)
- Must be 1-6 digits long
- Must not be all zeros (0, 00, 000, etc.)
- Must not contain letters or special characters

## Behavior

### When Creating Equipment

1. If a door number is provided and valid → Use the provided door number
2. If no door number is provided → Extract from equipment name
3. If door number is invalid → Extract from equipment name
4. If no door number can be extracted → Leave door number as null

### When Updating Equipment

1. If door number is being updated → Apply auto-extraction logic
2. If equipment name is being updated → Re-evaluate door number extraction
3. If both name and door number are updated → Use auto-extraction logic

### ERPNext Sync

During ERPNext synchronization, door numbers are automatically extracted from equipment names in ERPNext and stored in the local database.

## Testing

Run the test suite to verify functionality:

```bash
npx tsx src/lib/utils/equipment-utils.test.ts
```

This will run comprehensive tests covering:
- Door number extraction patterns
- Validation rules
- Auto-extraction logic
- Edge cases

## Benefits

1. **Reduced Manual Entry**: Automatically extracts door numbers from equipment names
2. **Consistency**: Ensures door numbers follow consistent format
3. **Data Quality**: Validates door numbers to prevent invalid entries
4. **User Experience**: Shows notifications when auto-extraction occurs
5. **Integration**: Works seamlessly with ERPNext sync

## Future Enhancements

Potential improvements for future versions:

- Support for more complex naming patterns
- Machine learning-based extraction for ambiguous cases
- Bulk door number extraction for existing equipment
- Custom validation rules per equipment category
- Door number conflict detection and resolution
