import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { blogPostsTable } from '../db/schema';
import { type CreateBlogPostInput } from '../schema';
import { createBlogPost } from '../handlers/create_blog_post';
import { eq } from 'drizzle-orm';

// Test inputs
const testInput: CreateBlogPostInput = {
  title: 'My First Blog Post',
  content: 'This is the content of my first blog post. It contains some interesting information.',
  author: 'John Doe',
  published: false
};

const publishedTestInput: CreateBlogPostInput = {
  title: 'Published Blog Post',
  content: 'This is a published blog post with great content.',
  author: 'Jane Smith',
  published: true
};

describe('createBlogPost', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a draft blog post', async () => {
    const result = await createBlogPost(testInput);

    // Basic field validation
    expect(result.title).toEqual('My First Blog Post');
    expect(result.content).toEqual(testInput.content);
    expect(result.author).toEqual('John Doe');
    expect(result.published).toEqual(false);
    expect(result.published_at).toBeNull(); // Should be null for drafts
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Slug should be generated correctly
    expect(result.slug).toEqual('my-first-blog-post');
  });

  it('should create a published blog post with published_at timestamp', async () => {
    const result = await createBlogPost(publishedTestInput);

    // Verify published status and timestamp
    expect(result.published).toEqual(true);
    expect(result.published_at).toBeInstanceOf(Date);
    expect(result.published_at).not.toBeNull();

    // Verify other fields
    expect(result.title).toEqual('Published Blog Post');
    expect(result.slug).toEqual('published-blog-post');
    expect(result.author).toEqual('Jane Smith');
  });

  it('should save blog post to database', async () => {
    const result = await createBlogPost(testInput);

    // Query database to verify the post was saved
    const posts = await db.select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.id, result.id))
      .execute();

    expect(posts).toHaveLength(1);
    const savedPost = posts[0];
    
    expect(savedPost.title).toEqual('My First Blog Post');
    expect(savedPost.content).toEqual(testInput.content);
    expect(savedPost.author).toEqual('John Doe');
    expect(savedPost.slug).toEqual('my-first-blog-post');
    expect(savedPost.published).toEqual(false);
    expect(savedPost.published_at).toBeNull();
    expect(savedPost.created_at).toBeInstanceOf(Date);
    expect(savedPost.updated_at).toBeInstanceOf(Date);
  });

  it('should generate unique slugs for duplicate titles', async () => {
    const duplicateInput: CreateBlogPostInput = {
      title: 'Duplicate Title',
      content: 'First post content',
      author: 'Author One',
      published: false
    };

    const secondDuplicateInput: CreateBlogPostInput = {
      title: 'Duplicate Title',
      content: 'Second post content',
      author: 'Author Two',
      published: false
    };

    const thirdDuplicateInput: CreateBlogPostInput = {
      title: 'Duplicate Title',
      content: 'Third post content',
      author: 'Author Three',
      published: false
    };

    // Create three posts with the same title
    const firstPost = await createBlogPost(duplicateInput);
    const secondPost = await createBlogPost(secondDuplicateInput);
    const thirdPost = await createBlogPost(thirdDuplicateInput);

    // Verify unique slugs were generated
    expect(firstPost.slug).toEqual('duplicate-title');
    expect(secondPost.slug).toEqual('duplicate-title-1');
    expect(thirdPost.slug).toEqual('duplicate-title-2');

    // Verify all posts are in the database with unique slugs
    const allPosts = await db.select()
      .from(blogPostsTable)
      .execute();

    expect(allPosts).toHaveLength(3);
    const slugs = allPosts.map(post => post.slug);
    expect(slugs).toContain('duplicate-title');
    expect(slugs).toContain('duplicate-title-1');
    expect(slugs).toContain('duplicate-title-2');
  });

  it('should handle special characters in title when generating slug', async () => {
    const specialCharInput: CreateBlogPostInput = {
      title: 'Hello World! @#$%^&*() - How Are You?',
      content: 'Content with special char title',
      author: 'Special Author',
      published: false
    };

    const result = await createBlogPost(specialCharInput);

    // Special characters should be removed, spaces converted to hyphens
    expect(result.slug).toEqual('hello-world-how-are-you');
  });

  it('should handle titles with multiple spaces and hyphens', async () => {
    const messyTitleInput: CreateBlogPostInput = {
      title: '   Multiple   Spaces   and---Hyphens   ',
      content: 'Content with messy title',
      author: 'Messy Author',
      published: false
    };

    const result = await createBlogPost(messyTitleInput);

    // Multiple spaces and hyphens should be normalized
    expect(result.slug).toEqual('multiple-spaces-and-hyphens');
  });

  it('should use default value for published field when not provided', async () => {
    // Create input without published field to test Zod default
    const inputWithoutPublished = {
      title: 'Default Published Test',
      content: 'Testing default published value',
      author: 'Default Author'
    } as CreateBlogPostInput;

    const result = await createBlogPost(inputWithoutPublished);

    // Should default to false (draft)
    expect(result.published).toEqual(false);
    expect(result.published_at).toBeNull();
  });

  it('should handle empty slug generation gracefully', async () => {
    const symbolOnlyInput: CreateBlogPostInput = {
      title: '@#$%^&*()',
      content: 'Content with symbol-only title',
      author: 'Symbol Author',
      published: false
    };

    const result = await createBlogPost(symbolOnlyInput);

    // Should generate some fallback or minimal slug
    expect(result.slug).toBeDefined();
    expect(typeof result.slug).toBe('string');
  });
});