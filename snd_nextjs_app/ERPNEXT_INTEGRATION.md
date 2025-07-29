# ERPNext Integration for Next.js App

This document describes the ERPNext integration implementation in the Next.js application.

## Overview

The ERPNext integration allows the Next.js app to communicate with ERPNext for data synchronization and management. It mirrors the Laravel ERPNext integration functionality.

## Architecture

### 1. ERPNext Client (`src/lib/erpnext-client.ts`)

The main client class that handles all ERPNext API communications:

- **Authentication**: Token-based authentication using API key and secret
- **Error Handling**: Comprehensive error handling with detailed logging
- **Data Mapping**: Functions to map ERPNext data to local format
- **CRUD Operations**: Full CRUD operations for customers, employees, and items

### 2. API Routes

The following API routes are available for ERPNext operations:

- `GET /api/erpnext/test-connection` - Test ERPNext connection
- `GET /api/erpnext/customers` - Fetch all customers from ERPNext
- `POST /api/erpnext/customers` - Create/update customer in ERPNext
- `GET /api/erpnext/employees` - Fetch all employees from ERPNext
- `POST /api/erpnext/employees` - Create/update employee in ERPNext
- `GET /api/erpnext/items` - Fetch all items from ERPNext
- `POST /api/erpnext/items` - Create/update item in ERPNext

### 3. React Hook (`src/hooks/use-erpnext.ts`)

A custom React hook that provides:

- Connection testing
- Data fetching and creation
- Loading states
- Error handling
- Type-safe operations

### 4. Management Interface (`src/app/modules/settings/erpnext-integration/page.tsx`)

A comprehensive settings page that provides:

- Connection status monitoring
- Configuration management
- Data synchronization controls
- Sync status tracking
- Detailed information and help

## Configuration

### Environment Variables

Create a `.env.local` file in the Next.js app root with the following variables:

```env
# ERPNext Integration
NEXT_PUBLIC_ERPNEXT_URL=https://erp.snd-ksa.online
NEXT_PUBLIC_ERPNEXT_API_KEY=your_api_key
NEXT_PUBLIC_ERPNEXT_API_SECRET=your_api_secret

# Laravel Backend
NEXT_PUBLIC_LARAVEL_URL=http://localhost:8000
```

### ERPNext Setup

1. **API Access**: Ensure ERPNext has API access enabled
2. **API Key**: Generate an API key in ERPNext
3. **API Secret**: Generate an API secret in ERPNext
4. **Permissions**: Ensure the API user has appropriate permissions

## Features

### 1. Customer Management

- Fetch all customers from ERPNext
- Create new customers in ERPNext
- Update existing customers
- Map customer data between systems

### 2. Employee Management

- Fetch all employees from ERPNext
- Create new employees in ERPNext
- Update existing employees
- Map employee data between systems

### 3. Item/Equipment Management

- Fetch all items from ERPNext
- Create new items in ERPNext
- Update existing items
- Map item data between systems

### 4. Invoice Management

- Create sales invoices in ERPNext
- Fetch invoice details
- Track invoice status
- Handle invoice amendments

## Usage Examples

### Testing Connection

```typescript
import { useERPNext } from '@/hooks/use-erpnext';

function MyComponent() {
  const { testConnection, connectionLoading } = useERPNext();

  const handleTestConnection = async () => {
    const isConnected = await testConnection();
    if (isConnected) {
      console.log('ERPNext connection successful');
    }
  };

  return (
    <button onClick={handleTestConnection} disabled={connectionLoading}>
      Test Connection
    </button>
  );
}
```

### Fetching Customers

```typescript
import { useERPNext } from '@/hooks/use-erpnext';

function CustomerList() {
  const { fetchCustomers, customersLoading, error } = useERPNext();
  const [customers, setCustomers] = useState([]);

  const loadCustomers = async () => {
    const data = await fetchCustomers();
    setCustomers(data);
  };

  return (
    <div>
      <button onClick={loadCustomers} disabled={customersLoading}>
        Load Customers
      </button>
      {error && <p>Error: {error}</p>}
      {/* Display customers */}
    </div>
  );
}
```

### Creating a Customer

```typescript
import { useERPNext } from '@/hooks/use-erpnext';

function CreateCustomer() {
  const { createCustomer, customersLoading } = useERPNext();

  const handleCreateCustomer = async () => {
    const customerData = {
      customer_name: 'New Customer',
      customer_group: 'Commercial',
      territory: 'All Territories',
      email_id: 'customer@example.com',
      mobile_no: '+1234567890'
    };

    const customer = await createCustomer(customerData);
    if (customer) {
      console.log('Customer created:', customer);
    }
  };

  return (
    <button onClick={handleCreateCustomer} disabled={customersLoading}>
      Create Customer
    </button>
  );
}
```

## Data Mapping

### Customer Mapping

```typescript
// ERPNext to Local
{
  erpnext_id: erpCustomer.name,
  company_name: erpCustomer.customer_name,
  name: erpCustomer.customer_name,
  email: erpCustomer.email_id,
  phone: erpCustomer.mobile_no,
  // ... other fields
}
```

### Employee Mapping

```typescript
// ERPNext to Local
{
  erpnext_id: erpEmployee.name,
  first_name: erpEmployee.employee_name?.split(' ')[0] || '',
  last_name: erpEmployee.employee_name?.split(' ').slice(1).join(' ') || '',
  employee_id: erpEmployee.employee_id,
  email: erpEmployee.email,
  // ... other fields
}
```

### Item Mapping

```typescript
// ERPNext to Local
{
  erpnext_id: erpItem.name,
  name: erpItem.item_name,
  model: erpItem.item_code,
  description: erpItem.description,
  category: erpItem.item_group,
  // ... other fields
}
```

## Error Handling

The integration includes comprehensive error handling:

1. **Network Errors**: Handles connection timeouts and network issues
2. **API Errors**: Handles ERPNext API errors and invalid responses
3. **Data Validation**: Validates required fields and data formats
4. **User Feedback**: Provides clear error messages to users

## Security Considerations

1. **API Credentials**: Store API credentials in environment variables
2. **HTTPS**: Always use HTTPS for production environments
3. **Token Expiration**: Handle token expiration gracefully
4. **Rate Limiting**: Implement rate limiting for API calls
5. **Data Validation**: Validate all data before sending to ERPNext

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check ERPNext URL and credentials
   - Verify network connectivity
   - Check ERPNext server status

2. **Authentication Failed**
   - Verify API key and secret
   - Check API user permissions
   - Ensure API access is enabled

3. **Data Sync Issues**
   - Check data format requirements
   - Verify required fields
   - Check ERPNext field mappings

### Debug Mode

Enable debug logging by setting the environment variable:

```env
NEXT_PUBLIC_DEBUG=true
```

This will log detailed information about API calls and responses.

## Future Enhancements

1. **Real-time Sync**: Implement real-time data synchronization
2. **Batch Operations**: Add support for batch operations
3. **Webhook Support**: Add webhook support for real-time updates
4. **Advanced Filtering**: Add advanced filtering and search capabilities
5. **Data Validation**: Enhanced data validation and error reporting
6. **Performance Optimization**: Implement caching and performance optimizations

## Support

For issues or questions about the ERPNext integration:

1. Check the ERPNext documentation
2. Review the error logs
3. Test the connection using the management interface
4. Verify environment variables and configuration 
