const { query } = require('../config/database');

/**
 * Log audit events to the database
 * @param {number|null} userId - User ID (null for anonymous actions)
 * @param {string} action - Action performed
 * @param {string} resourceType - Type of resource affected
 * @param {string|number|null} resourceId - ID of the resource
 * @param {string} ipAddress - IP address of the request
 * @param {string} userAgent - User agent string
 * @param {object} details - Additional details about the action
 */
const logAuditEvent = async (userId, action, resourceType, resourceId, ipAddress, userAgent, details = {}) => {
  try {
    await query(`
      INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address, user_agent, details)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      userId,
      action,
      resourceType,
      resourceId ? resourceId.toString() : null,
      ipAddress,
      userAgent,
      JSON.stringify(details)
    ]);

    console.log(`Audit log: ${action} by user ${userId} on ${resourceType}:${resourceId}`);
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw error - audit logging failure shouldn't break the application
  }
};

/**
 * Get audit logs with filtering
 * @param {object} filters - Filter options
 * @returns {Promise<Array>} - Array of audit log entries
 */
const getAuditLogs = async (filters = {}) => {
  try {
    const {
      userId,
      action,
      resourceType,
      startDate,
      endDate,
      limit = 100,
      offset = 0
    } = filters;

    let whereConditions = [];
    let queryParams = [];
    let paramCount = 0;

    if (userId) {
      paramCount++;
      whereConditions.push(`user_id = $${paramCount}`);
      queryParams.push(userId);
    }

    if (action) {
      paramCount++;
      whereConditions.push(`action = $${paramCount}`);
      queryParams.push(action);
    }

    if (resourceType) {
      paramCount++;
      whereConditions.push(`resource_type = $${paramCount}`);
      queryParams.push(resourceType);
    }

    if (startDate) {
      paramCount++;
      whereConditions.push(`created_at >= $${paramCount}`);
      queryParams.push(startDate);
    }

    if (endDate) {
      paramCount++;
      whereConditions.push(`created_at <= $${paramCount}`);
      queryParams.push(endDate);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    paramCount++;
    queryParams.push(limit);
    paramCount++;
    queryParams.push(offset);

    const auditQuery = `
      SELECT 
        al.*,
        u.email as user_email,
        u.first_name,
        u.last_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `;

    const result = await query(auditQuery, queryParams);
    return result.rows;

  } catch (error) {
    console.error('Failed to retrieve audit logs:', error);
    throw error;
  }
};

/**
 * Clean up old audit logs
 * @param {number} daysToKeep - Number of days to keep logs
 */
const cleanupAuditLogs = async (daysToKeep = 365) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await query(
      'DELETE FROM audit_logs WHERE created_at < $1',
      [cutoffDate]
    );

    console.log(`Cleaned up ${result.rowCount} old audit log entries`);
    return result.rowCount;

  } catch (error) {
    console.error('Failed to cleanup audit logs:', error);
    throw error;
  }
};

module.exports = {
  logAuditEvent,
  getAuditLogs,
  cleanupAuditLogs
};