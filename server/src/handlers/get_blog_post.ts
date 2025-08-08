import { db } from '../db';
import { blogPostsTable } from '../db/schema';
import { type GetBlogPostInput, type BlogPost } from '../schema';
import { eq, or } from 'drizzle-orm';

export const getBlogPost = async (input: GetBlogPostInput): Promise<BlogPost | null> => {
  try {
    // Build query conditions - we need to handle either ID or slug
    const conditions = [];
    
    if (input.id !== undefined) {
      conditions.push(eq(blogPostsTable.id, input.id));
    }
    
    if (input.slug !== undefined) {
      conditions.push(eq(blogPostsTable.slug, input.slug));
    }
    
    // Query the database - use OR condition if both ID and slug are provided
    const query = db.select()
      .from(blogPostsTable)
      .where(conditions.length === 1 ? conditions[0] : or(...conditions));
    
    const results = await query.execute();
    
    // Return the first result or null if not found
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error('Blog post retrieval failed:', error);
    throw error;
  }
};