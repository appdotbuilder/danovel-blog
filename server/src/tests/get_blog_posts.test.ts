import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { blogPostsTable } from '../db/schema';
import { type GetBlogPostsInput } from '../schema';
import { getBlogPosts } from '../handlers/get_blog_posts';

// Helper function to create test blog posts
const createTestBlogPost = async (overrides: Partial<any> = {}) => {
  const defaultPost = {
    title: 'Test Blog Post',
    content: 'This is test content',
    author: 'Test Author',
    slug: `test-slug-${Date.now()}`, // Unique slug
    published: false,
    published_at: null,
    ...overrides
  };

  const result = await db.insert(blogPostsTable)
    .values(defaultPost)
    .returning()
    .execute();

  return result[0];
};

describe('getBlogPosts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all blog posts with default pagination', async () => {
    // Create test posts
    await createTestBlogPost({ title: 'Post 1', author: 'Author 1' });
    await createTestBlogPost({ title: 'Post 2', author: 'Author 2' });
    await createTestBlogPost({ title: 'Post 3', author: 'Author 1' });

    const input: GetBlogPostsInput = {
      limit: 10,
      offset: 0
    };

    const result = await getBlogPosts(input);

    expect(result).toHaveLength(3);
    expect(result[0].title).toBeDefined();
    expect(result[0].content).toBeDefined();
    expect(result[0].author).toBeDefined();
    expect(result[0].slug).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should filter by published status', async () => {
    // Create published and unpublished posts
    await createTestBlogPost({ 
      title: 'Published Post', 
      published: true, 
      published_at: new Date() 
    });
    await createTestBlogPost({ 
      title: 'Draft Post', 
      published: false, 
      published_at: null 
    });

    // Test filtering for published posts
    const publishedInput: GetBlogPostsInput = {
      published: true,
      limit: 10,
      offset: 0
    };

    const publishedResult = await getBlogPosts(publishedInput);
    expect(publishedResult).toHaveLength(1);
    expect(publishedResult[0].published).toBe(true);
    expect(publishedResult[0].title).toEqual('Published Post');

    // Test filtering for draft posts
    const draftInput: GetBlogPostsInput = {
      published: false,
      limit: 10,
      offset: 0
    };

    const draftResult = await getBlogPosts(draftInput);
    expect(draftResult).toHaveLength(1);
    expect(draftResult[0].published).toBe(false);
    expect(draftResult[0].title).toEqual('Draft Post');
  });

  it('should filter by author', async () => {
    // Create posts with different authors
    await createTestBlogPost({ title: 'Post by Alice', author: 'Alice' });
    await createTestBlogPost({ title: 'Post by Bob', author: 'Bob' });
    await createTestBlogPost({ title: 'Another Post by Alice', author: 'Alice' });

    const input: GetBlogPostsInput = {
      author: 'Alice',
      limit: 10,
      offset: 0
    };

    const result = await getBlogPosts(input);

    expect(result).toHaveLength(2);
    result.forEach(post => {
      expect(post.author).toEqual('Alice');
    });
  });

  it('should filter by both published status and author', async () => {
    // Create various combinations
    await createTestBlogPost({ 
      title: 'Published by Alice', 
      author: 'Alice', 
      published: true, 
      published_at: new Date() 
    });
    await createTestBlogPost({ 
      title: 'Draft by Alice', 
      author: 'Alice', 
      published: false, 
      published_at: null 
    });
    await createTestBlogPost({ 
      title: 'Published by Bob', 
      author: 'Bob', 
      published: true, 
      published_at: new Date() 
    });

    const input: GetBlogPostsInput = {
      published: true,
      author: 'Alice',
      limit: 10,
      offset: 0
    };

    const result = await getBlogPosts(input);

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Published by Alice');
    expect(result[0].author).toEqual('Alice');
    expect(result[0].published).toBe(true);
  });

  it('should apply pagination correctly', async () => {
    // Create 5 test posts
    for (let i = 1; i <= 5; i++) {
      await createTestBlogPost({ 
        title: `Post ${i}`, 
        slug: `post-${i}` 
      });
      // Small delay to ensure different created_at times
      await new Promise(resolve => setTimeout(resolve, 1));
    }

    // Test first page
    const firstPageInput: GetBlogPostsInput = {
      limit: 2,
      offset: 0
    };

    const firstPageResult = await getBlogPosts(firstPageInput);
    expect(firstPageResult).toHaveLength(2);

    // Test second page
    const secondPageInput: GetBlogPostsInput = {
      limit: 2,
      offset: 2
    };

    const secondPageResult = await getBlogPosts(secondPageInput);
    expect(secondPageResult).toHaveLength(2);

    // Test third page (should have 1 item)
    const thirdPageInput: GetBlogPostsInput = {
      limit: 2,
      offset: 4
    };

    const thirdPageResult = await getBlogPosts(thirdPageInput);
    expect(thirdPageResult).toHaveLength(1);

    // Ensure no overlap between pages
    const allIds = [
      ...firstPageResult.map(p => p.id),
      ...secondPageResult.map(p => p.id),
      ...thirdPageResult.map(p => p.id)
    ];
    const uniqueIds = new Set(allIds);
    expect(uniqueIds.size).toEqual(5);
  });

  it('should order posts by created_at descending (newest first)', async () => {
    // Create posts with specific timing
    const firstPost = await createTestBlogPost({ 
      title: 'First Post', 
      slug: 'first-post' 
    });
    
    // Wait a bit to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const secondPost = await createTestBlogPost({ 
      title: 'Second Post', 
      slug: 'second-post' 
    });

    await new Promise(resolve => setTimeout(resolve, 10));
    
    const thirdPost = await createTestBlogPost({ 
      title: 'Third Post', 
      slug: 'third-post' 
    });

    const input: GetBlogPostsInput = {
      limit: 10,
      offset: 0
    };

    const result = await getBlogPosts(input);

    expect(result).toHaveLength(3);
    // Should be ordered newest first
    expect(result[0].title).toEqual('Third Post');
    expect(result[1].title).toEqual('Second Post');
    expect(result[2].title).toEqual('First Post');

    // Verify timestamps are in descending order
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
  });

  it('should return empty array when no posts match filters', async () => {
    // Create only unpublished posts
    await createTestBlogPost({ published: false });
    await createTestBlogPost({ published: false });

    // Search for published posts
    const input: GetBlogPostsInput = {
      published: true,
      limit: 10,
      offset: 0
    };

    const result = await getBlogPosts(input);
    expect(result).toHaveLength(0);
  });

  it('should handle empty database', async () => {
    const input: GetBlogPostsInput = {
      limit: 10,
      offset: 0
    };

    const result = await getBlogPosts(input);
    expect(result).toHaveLength(0);
  });

  it('should respect limit parameter', async () => {
    // Create 10 posts
    for (let i = 1; i <= 10; i++) {
      await createTestBlogPost({ 
        title: `Post ${i}`, 
        slug: `post-${i}` 
      });
    }

    const input: GetBlogPostsInput = {
      limit: 3,
      offset: 0
    };

    const result = await getBlogPosts(input);
    expect(result).toHaveLength(3);
  });
});