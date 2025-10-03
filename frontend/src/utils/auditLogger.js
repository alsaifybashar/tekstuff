const { pool } = require('../config/database');

const logAuditEvent = async (userId, action, resourceType, resourceId, ipAddress, userAgent, details = {}) => {
  try {
    const client = await pool.connect();
    
    await client.query(`
      INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address, user_agent, details)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [userId, action, resourceType, resourceId, ipAddress, userAgent, JSON.stringify(details)]);
    
    client.release();
  } catch (error) {
    console.error('Audit logging error:', error);
    // Don't throw error to avoid disrupting main flow
  }
};

const getAuditLogs = async (filters = {}) => {
  try {
    const client = await pool.connect();
    
    let query = `
      SELECT al.*, u.email, u.first_name, u.last_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
    `;
    
    const conditions = [];
    const params = [];
    let paramCount = 0;

    if (filters.userId) {
      conditions.push(`al.user_id = ${++paramCount}`);
      params.push(filters.userId);
    }

    if (filters.action) {
      conditions.push(`al.action = ${++paramCount}`);
      params.push(filters.action);
    }

    if (filters.resourceType) {
      conditions.push(`al.resource_type = ${++paramCount}`);
      params.push(filters.resourceType);
    }

    if (filters.dateFrom) {
      conditions.push(`al.created_at >= ${++paramCount}`);
      params.push(filters.dateFrom);
    }

    if (filters.dateTo) {
      conditions.push(`al.created_at <= ${++paramCount}`);
      params.push(filters.dateTo);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY al.created_at DESC LIMIT 1000';

    const result = await client.query(query, params);
    client.release();

    return result.rows;
  } catch (error) {
    console.error('Get audit logs error:', error);
    return [];
  }
};

module.exports = {
  logAuditEvent,
  getAuditLogs
};