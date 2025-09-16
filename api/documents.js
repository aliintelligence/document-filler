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
    const { method, query, body } = req;

    switch (method) {
      case 'GET':
        if (query.id) {
          // Get specific document
          return await getDocument(query.id, res);
        } else if (query.status) {
          // Get documents by status
          const page = parseInt(query.page) || 1;
          const limit = parseInt(query.limit) || 20;
          return await getDocumentsByStatus(query.status, page, limit, res);
        } else {
          // Get all documents with pagination
          const page = parseInt(query.page) || 1;
          const limit = parseInt(query.limit) || 20;
          return await getAllDocuments(page, limit, res);
        }

      case 'PUT':
        if (query.action === 'status') {
          // Update document status
          return await updateDocumentStatus(query.id, body, res);
        } else {
          // Update document
          return await updateDocument(query.id, body, res);
        }

      case 'DELETE':
        // Delete document
        return await deleteDocument(query.id, res);

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Document API error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

async function getAllDocuments(page, limit, res) {
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabase
    .rpc('get_documents_by_status', {
      doc_status: null,
      page_size: limit,
      page_offset: offset
    });

  if (error) {
    throw error;
  }

  // Get total count for pagination
  const { count: totalCount } = await supabase
    .from('customer_documents_view')
    .select('*', { count: 'exact', head: true })
    .not('document_id', 'is', null);

  res.status(200).json({
    success: true,
    documents: data,
    pagination: {
      page,
      limit,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limit)
    }
  });
}

async function getDocumentsByStatus(status, page, limit, res) {
  const offset = (page - 1) * limit;

  const { data, error } = await supabase
    .rpc('get_documents_by_status', {
      doc_status: status,
      page_size: limit,
      page_offset: offset
    });

  if (error) {
    throw error;
  }

  // Get count for this status
  const { count } = await supabase
    .from('customer_documents_view')
    .select('*', { count: 'exact', head: true })
    .eq('status', status);

  res.status(200).json({
    success: true,
    documents: data,
    status: status,
    pagination: {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit)
    }
  });
}

async function getDocument(documentId, res) {
  const { data, error } = await supabase
    .from('customer_documents_view')
    .select('*')
    .eq('document_id', documentId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }
    throw error;
  }

  // Get signature events for this document
  const { data: events } = await supabase
    .from('signature_events')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: false });

  res.status(200).json({
    success: true,
    document: data,
    events: events || []
  });
}

async function updateDocumentStatus(documentId, statusData, res) {
  if (!documentId) {
    return res.status(400).json({
      success: false,
      error: 'Document ID is required'
    });
  }

  const { status, signed_at } = statusData;

  if (!status) {
    return res.status(400).json({
      success: false,
      error: 'Status is required'
    });
  }

  const { data, error } = await supabase
    .rpc('update_document_status', {
      doc_id: documentId,
      new_status: status,
      set_signed_at: status === 'signed' || !!signed_at
    });

  if (error) {
    throw error;
  }

  if (!data) {
    return res.status(404).json({
      success: false,
      error: 'Document not found'
    });
  }

  // Log the status change as an event
  await supabase
    .from('signature_events')
    .insert([{
      document_id: documentId,
      event_type: `status.${status}`,
      event_data: {
        new_status: status,
        updated_at: new Date().toISOString(),
        updated_via: 'api'
      }
    }]);

  res.status(200).json({
    success: true,
    message: 'Document status updated successfully',
    status: status
  });
}

async function updateDocument(documentId, updateData, res) {
  if (!documentId) {
    return res.status(400).json({
      success: false,
      error: 'Document ID is required'
    });
  }

  const { data, error } = await supabase
    .from('documents')
    .update(updateData)
    .eq('id', documentId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }
    throw error;
  }

  res.status(200).json({
    success: true,
    document: data
  });
}

async function deleteDocument(documentId, res) {
  if (!documentId) {
    return res.status(400).json({
      success: false,
      error: 'Document ID is required'
    });
  }

  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId);

  if (error) {
    throw error;
  }

  res.status(200).json({
    success: true,
    message: 'Document deleted successfully'
  });
}