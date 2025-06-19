/**
 * Cache Manager for Performance Optimization
 * Handles caching of test cases, questions, and computation results
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheManager {
  private cache = new Map<string, CacheItem<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Set item in cache with TTL
   */
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Get item from cache
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete item from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Clean expired items
   */
  cleanup(): number {
    let cleaned = 0;
    const now = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    return cleaned;
  }
}

// Create singleton instance
export const cacheManager = new CacheManager();

// Cache key generators
export const CacheKeys = {
  question: (id: string) => `question:${id}`,
  testCases: (problemId: string) => `testcases:${problemId}`,
  userSubmission: (userId: string, problemId: string) => `submission:${userId}:${problemId}`,
  marksCalculation: (assessmentId: string) => `marks:${assessmentId}`,
  domainQuestions: (domainId: string, type: string) => `domain:${domainId}:${type}`,
  codingProblems: (domainId: string, difficulty: string) => `coding:${domainId}:${difficulty}`
};

// Specialized cache functions
export const QuestionCache = {
  async getQuestions(domainId: string, type: string, fetcher: () => Promise<any[]>) {
    const key = CacheKeys.domainQuestions(domainId, type);
    let questions = cacheManager.get<any[]>(key);
    
    if (!questions) {
      questions = await fetcher();
      cacheManager.set(key, questions, 10 * 60 * 1000); // 10 minutes
    }
    
    return questions;
  },

  async getCodingProblems(domainId: string, difficulty: string, fetcher: () => Promise<any[]>) {
    const key = CacheKeys.codingProblems(domainId, difficulty);
    let problems = cacheManager.get<any[]>(key);
    
    if (!problems) {
      problems = await fetcher();
      cacheManager.set(key, problems, 15 * 60 * 1000); // 15 minutes
    }
    
    return problems;
  }
};

export const SubmissionCache = {
  setSubmission(userId: string, problemId: string, submission: any) {
    const key = CacheKeys.userSubmission(userId, problemId);
    cacheManager.set(key, submission, 30 * 60 * 1000); // 30 minutes
  },

  getSubmission(userId: string, problemId: string) {
    const key = CacheKeys.userSubmission(userId, problemId);
    return cacheManager.get(key);
  }
};

// Auto cleanup every 5 minutes
setInterval(() => {
  const cleaned = cacheManager.cleanup();
  if (cleaned > 0) {
    console.log(`Cache cleanup: removed ${cleaned} expired items`);
  }
}, 5 * 60 * 1000);