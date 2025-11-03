import { supabase, authHelpers, storageHelpers } from '../config/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache keys
const CACHE_KEYS = {
  USER_PROFILE: 'user_profile_',
  ISSUES: 'issues_',
  ISSUE_DETAILS: 'issue_details_',
  MY_ISSUES: 'my_issues_',
};

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

class ApiService {
  constructor() {
    this.cache = new Map();
  }

  // Cache helper methods
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  getCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Check if cache is expired
    if (Date.now() - cached.timestamp > CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  clearCache(pattern = null) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  // User Profile Services
  async getUserProfile(userId = null) {
    try {
      const targetUserId = userId || await this.getCurrentUserId();
      if (!targetUserId) throw new Error('User not authenticated');

      const cacheKey = CACHE_KEYS.USER_PROFILE + targetUserId;
      const cached = this.getCache(cacheKey);
      if (cached) return cached;

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', targetUserId)
        .single();

      if (error) throw error;

      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Get user profile error:', error);
      throw error;
    }
  }

  async updateUserProfile(updates) {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      // Clear cache
      this.clearCache(CACHE_KEYS.USER_PROFILE);

      return data;
    } catch (error) {
      console.error('Update user profile error:', error);
      throw error;
    }
  }

  // Issue Services
  async createIssue(issueData) {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('issues')
        .insert({
          ...issueData,
          reporter_id: userId,
          status: 'open',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Clear relevant caches
      this.clearCache(CACHE_KEYS.ISSUES);
      this.clearCache(CACHE_KEYS.MY_ISSUES);

      return data;
    } catch (error) {
      console.error('Create issue error:', error);
      throw error;
    }
  }

  async getIssues(filters = {}) {
    try {
      const cacheKey = CACHE_KEYS.ISSUES + JSON.stringify(filters);
      const cached = this.getCache(cacheKey);
      if (cached) return cached;

      let query = supabase
        .from('issues')
        .select(`
          *,
          reporter:users(id, name, phone, email),
          assigned_to:users(id, name, phone, email),
          issue_media(*),
          issue_messages(*)
        `);

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters.area) {
        query = query.eq('area', filters.area);
      }
      if (filters.latitude && filters.longitude && filters.radius) {
        // Geospatial query for issues within radius
        query = query.gte('latitude', filters.latitude - filters.radius)
                      .lte('latitude', filters.latitude + filters.radius)
                      .gte('longitude', filters.longitude - filters.radius)
                      .lte('longitude', filters.longitude + filters.radius);
      }

      // Ordering
      const orderBy = filters.orderBy || 'created_at';
      const orderDirection = filters.orderDirection || 'desc';
      query = query.order(orderBy, { ascending: orderDirection === 'asc' });

      // Limit
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Get issues error:', error);
      throw error;
    }
  }

  async getIssueDetails(issueId) {
    try {
      const cacheKey = CACHE_KEYS.ISSUE_DETAILS + issueId;
      const cached = this.getCache(cacheKey);
      if (cached) return cached;

      const { data, error } = await supabase
        .from('issues')
        .select(`
          *,
          reporter:users(id, name, phone, email, area, preferred_language),
          assigned_to:users(id, name, phone, email, area),
          issue_media(*),
          issue_messages(
            *,
            sender:users(id, name, role)
          )
        `)
        .eq('id', issueId)
        .single();

      if (error) throw error;

      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Get issue details error:', error);
      throw error;
    }
  }

  async updateIssueStatus(issueId, status, notes = null, governmentAssignedId = null) {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      const updates = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (governmentAssignedId) {
        updates.government_assigned_id = governmentAssignedId;
      }

      const { data, error } = await supabase
        .from('issues')
        .update(updates)
        .eq('id', issueId)
        .select()
        .single();

      if (error) throw error;

      // Create status update message
      if (notes) {
        await this.createIssueMessage(issueId, {
          message: notes,
          message_type: 'status_update',
          sender_id: userId,
        });
      }

      // Clear relevant caches
      this.clearCache(CACHE_KEYS.ISSUES);
      this.clearCache(CACHE_KEYS.MY_ISSUES);
      this.clearCache(CACHE_KEYS.ISSUE_DETAILS);

      return data;
    } catch (error) {
      console.error('Update issue status error:', error);
      throw error;
    }
  }

  async getMyIssues(filters = {}) {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      const cacheKey = CACHE_KEYS.MY_ISSUES + userId + JSON.stringify(filters);
      const cached = this.getCache(cacheKey);
      if (cached) return cached;

      let query = supabase
        .from('issues')
        .select(`
          *,
          issue_media(*),
          issue_messages(*)
        `)
        .eq('reporter_id', userId);

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      // Ordering
      const orderBy = filters.orderBy || 'created_at';
      const orderDirection = filters.orderDirection || 'desc';
      query = query.order(orderBy, { ascending: orderDirection === 'asc' });

      const { data, error } = await query;

      if (error) throw error;

      this.setCache(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Get my issues error:', error);
      throw error;
    }
  }

  // Media Services
  async uploadMedia(file, issueId, fileType = 'image') {
    try {
      const publicUrl = await storageHelpers.uploadImage(file, issueId);

      const { data, error } = await supabase
        .from('issue_media')
        .insert({
          issue_id: issueId,
          file_type: fileType,
          file_url: publicUrl,
          original_filename: file.name || `file_${Date.now()}`,
          file_size: file.size || 0,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Upload media error:', error);
      throw error;
    }
  }

  async deleteMedia(mediaId) {
    try {
      const { error } = await supabase
        .from('issue_media')
        .delete()
        .eq('id', mediaId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Delete media error:', error);
      throw error;
    }
  }

  // Message Services
  async createIssueMessage(issueId, messageData) {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('issue_messages')
        .insert({
          ...messageData,
          issue_id: issueId,
          sender_id: userId,
          created_at: new Date().toISOString(),
        })
        .select(`
          *,
          sender:users(id, name, role)
        `)
        .single();

      if (error) throw error;

      // Clear relevant caches
      this.clearCache(CACHE_KEYS.ISSUE_DETAILS);

      return data;
    } catch (error) {
      console.error('Create issue message error:', error);
      throw error;
    }
  }

  async getIssueMessages(issueId) {
    try {
      const { data, error } = await supabase
        .from('issue_messages')
        .select(`
          *,
          sender:users(id, name, role)
        `)
        .eq('issue_id', issueId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Get issue messages error:', error);
      throw error;
    }
  }

  // Statistics Services
  async getIssueStatistics(filters = {}) {
    try {
      let query = supabase
        .from('issues')
        .select('status, category, priority, created_at, updated_at');

      // Apply filters
      if (filters.area) {
        query = query.eq('area', filters.area);
      }
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calculate statistics
      const stats = {
        total: data.length,
        open: data.filter(issue => issue.status === 'open').length,
        in_progress: data.filter(issue => issue.status === 'in_progress').length,
        resolved: data.filter(issue => issue.status === 'resolved').length,
        closed: data.filter(issue => issue.status === 'closed').length,
        by_category: {},
        by_priority: {},
        average_resolution_time: 0,
      };

      // Calculate by category
      data.forEach(issue => {
        stats.by_category[issue.category] = (stats.by_category[issue.category] || 0) + 1;
      });

      // Calculate by priority
      data.forEach(issue => {
        stats.by_priority[issue.priority] = (stats.by_priority[issue.priority] || 0) + 1;
      });

      // Calculate average resolution time
      const resolvedIssues = data.filter(issue => issue.status === 'resolved');
      if (resolvedIssues.length > 0) {
        const totalTime = resolvedIssues.reduce((sum, issue) => {
          const created = new Date(issue.created_at);
          const updated = new Date(issue.updated_at);
          return sum + (updated - created);
        }, 0);
        stats.average_resolution_time = totalTime / resolvedIssues.length;
      }

      return stats;
    } catch (error) {
      console.error('Get issue statistics error:', error);
      throw error;
    }
  }

  // Helper method to get current user ID
  async getCurrentUserId() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user?.id;
    } catch (error) {
      console.error('Get current user ID error:', error);
      return null;
    }
  }

  // Real-time subscriptions
  subscribeToIssueUpdates(issueId, callback) {
    return supabase
      .channel(`issue_${issueId}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'issues',
          filter: `id=eq.${issueId}`
        },
        callback
      )
      .subscribe();
  }

  subscribeToIssueMessages(issueId, callback) {
    return supabase
      .channel(`messages_${issueId}`)
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'issue_messages',
          filter: `issue_id=eq.${issueId}`
        },
        callback
      )
      .subscribe();
  }

  unsubscribe(channel) {
    supabase.removeChannel(channel);
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;