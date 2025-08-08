import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { blogPostsTable } from '../db/schema';
import { type PublishBlogPostInput } from '../schema';
import { publishBlogPost } from '../handlers/publish_blog_post';
import { eq } from 'drizzle-orm';

// Test input for publishing
const publishInput: PublishBlogPostInput = {
  id: 1,
  published: true
};

// Test input for unpublishing
const unpublishInput: PublishBlogPostInput = {
  id: 1,
  published: false
};

describe('publishBlogPost', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test blog post
  const createTestBlogPost = async (published = false, published_at: Date | null = null) => {
    const result = await db.insert(blogPostsTable)
      .values({
        title: 'Test Blog Post',
        content: 'This is test content for the blog post.',
        author: 'Test Author',
        slug: 'test-blog-post',
        published,
        published_at,
        created_at: new Date(),
        updated_at: new Date()
      })
      .returning()
      .execute();

    return result[0];
  };

  it('should publish an unpublished blog post', async () => {
    // Create an unpublished blog post
    await createTestBlogPost(false, null);

    const result = await publishBlogPost(publishInput);

    // Verify the result
    expect(result.id).toBe(1);
    expect(result.published).toBe(true);
    expect(result.published_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    
    // Verify other fields remain unchanged
    expect(result.title).toBe('Test Blog Post');
    expect(result.content).toBe('This is test content for the blog post.');
    expect(result.author).toBe('Test Author');
    expect(result.slug).toBe('test-blog-post');
  });

  it('should unpublish a published blog post', async () => {
    // Create a published blog post with published_at set
    const publishedAt = new Date('2024-01-01T10:00:00Z');
    await createTestBlogPost(true, publishedAt);

    const result = await publishBlogPost(unpublishInput);

    // Verify the result
    expect(result.id).toBe(1);
    expect(result.published).toBe(false);
    expect(result.published_at).toBeNull();
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should preserve published_at when re-publishing an already published post', async () => {
    // Create a published blog post with existing published_at
    const originalPublishedAt = new Date('2024-01-01T10:00:00Z');
    await createTestBlogPost(true, originalPublishedAt);

    const result = await publishBlogPost(publishInput);

    // Verify published_at is preserved
    expect(result.id).toBe(1);
    expect(result.published).toBe(true);
    expect(result.published_at).toEqual(originalPublishedAt);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update the blog post in database', async () => {
    // Create an unpublished blog post
    await createTestBlogPost(false, null);

    const result = await publishBlogPost(publishInput);

    // Verify database was updated
    const updatedPosts = await db.select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.id, result.id))
      .execute();

    expect(updatedPosts).toHaveLength(1);
    const updatedPost = updatedPosts[0];
    
    expect(updatedPost.published).toBe(true);
    expect(updatedPost.published_at).toBeInstanceOf(Date);
    expect(updatedPost.updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when blog post does not exist', async () => {
    const nonExistentInput: PublishBlogPostInput = {
      id: 999,
      published: true
    };

    await expect(publishBlogPost(nonExistentInput))
      .rejects
      .toThrow(/Blog post with ID 999 not found/i);
  });

  it('should set published_at when publishing for the first time', async () => {
    // Create unpublished post
    await createTestBlogPost(false, null);

    const beforePublish = new Date();
    const result = await publishBlogPost(publishInput);
    const afterPublish = new Date();

    // Verify published_at is set and within expected time range
    expect(result.published_at).toBeInstanceOf(Date);
    expect(result.published_at!.getTime()).toBeGreaterThanOrEqual(beforePublish.getTime());
    expect(result.published_at!.getTime()).toBeLessThanOrEqual(afterPublish.getTime());
  });

  it('should update updated_at timestamp on every operation', async () => {
    // Create a blog post with a specific updated_at in the past
    const pastDate = new Date('2024-01-01T10:00:00Z');
    await db.insert(blogPostsTable)
      .values({
        title: 'Test Blog Post',
        content: 'This is test content for the blog post.',
        author: 'Test Author',
        slug: 'test-blog-post',
        published: false,
        published_at: null,
        created_at: pastDate,
        updated_at: pastDate
      })
      .execute();

    const beforeUpdate = new Date();
    const result = await publishBlogPost(publishInput);
    const afterUpdate = new Date();

    // Verify updated_at is recent
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterUpdate.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThan(pastDate.getTime());
  });
});