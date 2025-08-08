import { db } from '../db';
import { blogPostsTable } from '../db/schema';
import { type CreateBlogPostInput, type BlogPost } from '../schema';
import { eq } from 'drizzle-orm';

// Function to generate a URL-friendly slug from title
function generateSlugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens and spaces
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

// Function to ensure slug uniqueness by appending numbers if necessary
async function generateUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  // Keep checking if slug exists and increment counter until we find a unique one
  while (true) {
    const existingPost = await db.select()
      .from(blogPostsTable)
      .where(eq(blogPostsTable.slug, slug))
      .limit(1)
      .execute();

    if (existingPost.length === 0) {
      return slug; // Slug is unique
    }

    // Slug exists, try with counter
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

export async function createBlogPost(input: CreateBlogPostInput): Promise<BlogPost> {
  try {
    // Generate base slug from title
    const baseSlug = generateSlugFromTitle(input.title);
    
    // Ensure slug is unique
    const uniqueSlug = await generateUniqueSlug(baseSlug);

    // Determine published_at timestamp
    const publishedAt = input.published ? new Date() : null;

    // Insert blog post into database
    const result = await db.insert(blogPostsTable)
      .values({
        title: input.title,
        content: input.content,
        author: input.author,
        slug: uniqueSlug,
        published: input.published,
        published_at: publishedAt
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Blog post creation failed:', error);
    throw error;
  }
}