import { NextRequest, NextResponse } from 'next/server';

// ERPNext configuration
const ERPNEXT_URL = process.env.NEXT_PUBLIC_ERPNEXT_URL;
const ERPNEXT_API_KEY = process.env.NEXT_PUBLIC_ERPNEXT_API_KEY;
const ERPNEXT_API_SECRET = process.env.NEXT_PUBLIC_ERPNEXT_API_SECRET;

async function makeERPNextRequest(endpoint: string, options: RequestInit = {}) {
  if (!ERPNEXT_URL || !ERPNEXT_API_KEY || !ERPNEXT_API_SECRET) {
    throw new Error('ERPNext configuration is missing');
  }

  const url = `${ERPNEXT_URL}${endpoint}`;
  const defaultHeaders = {
    Authorization: `token ${ERPNEXT_API_KEY}:${ERPNEXT_API_SECRET}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`ERPNext API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, webhookUrl } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, message: 'Action is required' },
        { status: 400 }
      );
    }

    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const customerWebhookUrl = `${appUrl}/api/webhooks/erpnext/customers`;

    switch (action) {
      case 'setup_customer_webhook':
        try {
          // Create webhook in ERPNext for Customer doctype
          const webhookData = {
            webhook_doctype: 'Customer',
            webhook_url: customerWebhookUrl,
            webhook_headers: [
              {
                key: 'Content-Type',
                value: 'application/json'
              }
            ],
            webhook_events: [
              'after_insert',
              'after_update',
              'after_delete'
            ],
            webhook_data: 'All',
            request_structure: 'Form URL-Encoded',
            enable_security: 0,
            webhook_docevent: 'after_insert',
            webhook_doctype: 'Customer',
            webhook_url: customerWebhookUrl,
            webhook_headers: [
              {
                key: 'Content-Type',
                value: 'application/json'
              }
            ],
            webhook_events: [
              'after_insert',
              'after_update',
              'after_delete'
            ],
            webhook_data: 'All',
            request_structure: 'Form URL-Encoded',
            enable_security: 0,
            webhook_docevent: 'after_insert'
          };

          const response = await makeERPNextRequest('/api/resource/Webhook', {
            method: 'POST',
            body: JSON.stringify(webhookData),
          });

          return NextResponse.json({
            success: true,
            message: 'Customer webhook setup successfully',
            data: {
              webhookUrl: customerWebhookUrl,
              erpnextResponse: response,
              setupInstructions: [
                '1. Webhook endpoint created at: ' + customerWebhookUrl,
                '2. ERPNext will send customer changes to this endpoint',
                '3. The system will automatically sync changes',
                '4. You can test by creating/updating a customer in ERPNext'
              ]
            },
          });
        } catch (error) {
          return NextResponse.json(
            {
              success: false,
              message: 'Failed to setup webhook in ERPNext',
              error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
          );
        }

      case 'test_webhook':
        try {
          // Test the webhook endpoint
          const testResponse = await fetch(customerWebhookUrl, {
            method: 'GET',
          });

          if (testResponse.ok) {
            return NextResponse.json({
              success: true,
              message: 'Webhook endpoint is working',
              data: {
                webhookUrl: customerWebhookUrl,
                status: 'active',
                testResult: 'success'
              },
            });
          } else {
            return NextResponse.json(
              {
                success: false,
                message: 'Webhook endpoint test failed',
                data: {
                  webhookUrl: customerWebhookUrl,
                  status: 'error',
                  testResult: 'failed',
                  statusCode: testResponse.status
                },
              },
              { status: 400 }
            );
          }
        } catch (error) {
          return NextResponse.json(
            {
              success: false,
              message: 'Failed to test webhook endpoint',
              error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
          );
        }

      case 'get_webhook_info':
        return NextResponse.json({
          success: true,
          message: 'Webhook information retrieved',
          data: {
            webhookUrl: customerWebhookUrl,
            supportedEvents: ['after_insert', 'after_update', 'after_delete'],
            supportedDoctypes: ['Customer'],
            setupInstructions: [
              '1. In ERPNext, go to Setup > Integrations > Webhooks',
              '2. Create a new webhook with the following settings:',
              '   - Webhook DocType: Customer',
              '   - Webhook URL: ' + customerWebhookUrl,
              '   - Webhook Events: after_insert, after_update, after_delete',
              '   - Webhook Data: All',
              '   - Request Structure: Form URL-Encoded',
              '3. Save the webhook',
              '4. Test by creating/updating a customer in ERPNext'
            ]
          },
        });

      default:
        return NextResponse.json(
          { success: false, message: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to process request',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  const customerWebhookUrl = `${appUrl}/api/webhooks/erpnext/customers`;

  return NextResponse.json({
    success: true,
    message: 'ERPNext Webhook Setup Guide',
    data: {
      webhookUrl: customerWebhookUrl,
      availableActions: [
        'setup_customer_webhook',
        'test_webhook',
        'get_webhook_info'
      ],
      setupInstructions: [
        '1. In ERPNext, go to Setup > Integrations > Webhooks',
        '2. Create a new webhook with the following settings:',
        '   - Webhook DocType: Customer',
        '   - Webhook URL: ' + customerWebhookUrl,
        '   - Webhook Events: after_insert, after_update, after_delete',
        '   - Webhook Data: All',
        '   - Request Structure: Form URL-Encoded',
        '3. Save the webhook',
        '4. Test by creating/updating a customer in ERPNext'
      ]
    },
  });
}
