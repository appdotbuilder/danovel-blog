import { db } from '../db';
import { blogPostsTable } from '../db/schema';
import { type GetBlogPostsInput, type BlogPost } from '../schema';
import { eq, desc, and, type SQL } from 'drizzle-orm';

export const getBlogPosts = async (input: GetBlogPostsInput): Promise<BlogPost[]> => {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    // Filter by published status if provided
    if (input.published !== undefined) {
      conditions.push(eq(blogPostsTable.published, input.published));
    }

    // Filter by author if provided
    if (input.author) {
      conditions.push(eq(blogPostsTable.author, input.author));
    }

    // Build and execute query directly without reassignment
    const results = conditions.length > 0
      ? await db.select()
          .from(blogPostsTable)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .orderBy(desc(blogPostsTable.created_at))
          .limit(input.limit)
          .offset(input.offset)
          .execute()
      : await db.select()
          .from(blogPostsTable)
          .orderBy(desc(blogPostsTable.created_at))
          .limit(input.limit)
          .offset(input.offset)
          .execute();

    return results;
  } catch (error) {
    console.error('Blog posts retrieval failed:', error);
    throw error;
  }
};