const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://rfvxnfsgohcnbgtziurc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmdnhuZnNnb2hjbmJndHppdXJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODAzMjUyNiwiZXhwIjoyMDczNjA4NTI2fQ.PZx3MtP-Xq8aHRIcAwceSlMLLg7tYUUFutswUENMiLk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { method, query } = req;

    switch (method) {
      case 'GET':
        if (query.id) {
          // Get specific customer with documents
          return await getCustomerWithDocuments(query.id, res);
        } else {
          // Get all customers with pagination
          const page = parseInt(query.page) || 1;
          const limit = parseInt(query.limit) || 20;
          return await getAllCustomers(page, limit, res);
        }

      case 'POST':
        // Create new customer
        return await createCustomer(req.body, res);

      case 'PUT':
        // Update customer
        return await updateCustomer(query.id, req.body, res);

      case 'DELETE':
        // Delete customer
        return await deleteCustomer(query.id, res);

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Customer API error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

async function getAllCustomers(page, limit, res) {
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .from('customers')
    .select(`
      *,
      documents (
        id,
        document_type,
        language,
        status,
        delivery_method,
        sent_at,
        signed_at,
        created_at
      )
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }

  res.status(200).json({
    success: true,
    customers: data,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  });
}

async function getCustomerWithDocuments(customerId, res) {
  const { data, error } = await supabase
    .from('customers')
    .select(`
      *,
      documents (
        id,
        document_type,
        language,
        status,
        delivery_method,
        sms_number,
        signnow_document_id,
        signnow_signature_url,
        sent_at,
        email_sent_at,
        sms_sent_at,
        signed_at,
        created_at,
        updated_at,
        additional_fields
      )
    `)
    .eq('id', customerId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }
    throw error;
  }

  // Get document statistics
  const { data: stats } = await supabase
    .rpc('get_customer_document_stats', { customer_uuid: customerId });

  res.status(200).json({
    success: true,
    customer: data,
    statistics: stats[0] || {
      total_documents: 0,
      pending_documents: 0,
      sent_documents: 0,
      signed_documents: 0,
      failed_documents: 0
    }
  });
}

async function createCustomer(customerData, res) {
  const { data, error } = await supabase
    .from('customers')
    .insert([customerData])
    .select()
    .single();

  if (error) {
    throw error;
  }

  res.status(201).json({
    success: true,
    customer: data
  });
}

async function updateCustomer(customerId, updateData, res) {
  if (!customerId) {
    return res.status(400).json({
      success: false,
      error: 'Customer ID is required'
    });
  }

  const { data, error } = await supabase
    .from('customers')
    .update(updateData)
    .eq('id', customerId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({
        success: false,
        error: 'Customer not found'
      });
    }
    throw error;
  }

  res.status(200).json({
    success: true,
    customer: data
  });
}

async function deleteCustomer(customerId, res) {
  if (!customerId) {
    return res.status(400).json({
      success: false,
      error: 'Customer ID is required'
    });
  }

  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', customerId);

  if (error) {
    throw error;
  }

  res.status(200).json({
    success: true,
    message: 'Customer deleted successfully'
  });
}