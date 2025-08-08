import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { BlogPostCard } from '@/components/BlogPostCard';
import { BlogPostForm } from '@/components/BlogPostForm';
import { BlogPostReader } from '@/components/BlogPostReader';
import { BlogStats } from '@/components/BlogStats';
import { ErrorToast } from '@/components/ErrorToast';
import { trpc } from '@/utils/trpc';
import type { BlogPost, CreateBlogPostInput } from '../../server/src/schema';

function App() {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'published' | 'drafts'>('all');
  const [error, setError] = useState<string | null>(null);

  // Form state for creating/editing posts
  const [formData, setFormData] = useState<CreateBlogPostInput & { id?: number }>({
    title: '',
    content: '',
    author: '',
    published: false
  });

  const loadBlogPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      const publishedFilter = filter === 'all' ? undefined : filter === 'published';
      const result = await trpc.getBlogPosts.query({
        published: publishedFilter,
        limit: 50
      });
      setBlogPosts(result);
    } catch (error) {
      console.error('Failed to load blog posts:', error);
      setError('Failed to load blog posts. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadBlogPosts();
  }, [loadBlogPosts]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newPost = await trpc.createBlogPost.mutate({
        title: formData.title,
        content: formData.content,
        author: formData.author,
        published: formData.published
      });
      setBlogPosts((prev: BlogPost[]) => [newPost, ...prev]);
      setFormData({ title: '', content: '', author: '', published: false });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create blog post:', error);
      setError('Failed to create blog post. Please check your input and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id) return;
    
    setIsLoading(true);
    try {
      const updatedPost = await trpc.updateBlogPost.mutate({
        id: formData.id,
        title: formData.title,
        content: formData.content,
        author: formData.author,
        published: formData.published
      });
      setBlogPosts((prev: BlogPost[]) => 
        prev.map((post: BlogPost) => post.id === updatedPost.id ? updatedPost : post)
      );
      setIsEditDialogOpen(false);
      setSelectedPost(updatedPost);
    } catch (error) {
      console.error('Failed to update blog post:', error);
      setError('Failed to update blog post. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePost = async (id: number) => {
    try {
      await trpc.deleteBlogPost.mutate({ id });
      setBlogPosts((prev: BlogPost[]) => prev.filter((post: BlogPost) => post.id !== id));
      setSelectedPost(null);
    } catch (error) {
      console.error('Failed to delete blog post:', error);
      setError('Failed to delete blog post. Please try again.');
    }
  };

  const handleTogglePublish = async (post: BlogPost) => {
    try {
      const updatedPost = await trpc.publishBlogPost.mutate({
        id: post.id,
        published: !post.published
      });
      setBlogPosts((prev: BlogPost[]) => 
        prev.map((p: BlogPost) => p.id === updatedPost.id ? updatedPost : p)
      );
      if (selectedPost?.id === post.id) {
        setSelectedPost(updatedPost);
      }
    } catch (error) {
      console.error('Failed to toggle publish status:', error);
      setError('Failed to update publish status. Please try again.');
    }
  };

  const openEditDialog = (post: BlogPost) => {
    setFormData({
      id: post.id,
      title: post.title,
      content: post.content,
      author: post.author,
      published: post.published
    });
    setIsEditDialogOpen(true);
  };

  const filteredPosts = blogPosts.filter((post: BlogPost) => {
    if (filter === 'published') return post.published;
    if (filter === 'drafts') return !post.published;
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                DANOVEL <span className="text-blue-600">Blog</span>
              </h1>
              <p className="text-slate-600 mt-1">Create and manage your blog posts</p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  ✨ New Post
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <BlogPostForm
                  formData={formData}
                  onFormDataChange={setFormData}
                  onSubmit={handleCreatePost}
                  onCancel={() => setIsCreateDialogOpen(false)}
                  isLoading={isLoading}
                  isEditing={false}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={selectedPost ? 'read' : 'manage'} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manage" onClick={() => setSelectedPost(null)}>
              📝 Manage Posts
            </TabsTrigger>
            <TabsTrigger value="read" disabled={!selectedPost}>
              📖 Read Post
            </TabsTrigger>
          </TabsList>

          <TabsContent value="manage" className="space-y-6">
            {/* Stats */}
            <BlogStats posts={blogPosts} />

            {/* Filter tabs */}
            <div className="flex space-x-1 bg-white p-1 rounded-lg border shadow-sm">
              {(['all', 'published', 'drafts'] as const).map((filterOption) => (
                <button
                  key={filterOption}
                  onClick={() => setFilter(filterOption)}
                  className={`px-4 py-2 rounded-md text-sm font-medium capitalize transition-all ${
                    filter === filterOption
                      ? 'bg-blue-100 text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {filterOption === 'all' ? 'All Posts' : filterOption}
                  {filterOption !== 'all' && (
                    <span className="ml-1 text-xs opacity-60">
                      ({filterOption === 'published' 
                        ? blogPosts.filter((p: BlogPost) => p.published).length
                        : blogPosts.filter((p: BlogPost) => !p.published).length
                      })
                    </span>
                  )}
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-slate-600 mt-2">Loading posts...</p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">
                  {filter === 'all' ? '📝' : filter === 'published' ? '🚀' : '📄'}
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">
                  {filter === 'all' ? 'No blog posts yet' : `No ${filter} posts found`}
                </h3>
                <p className="text-slate-600 mb-6 max-w-md mx-auto">
                  {filter === 'all' 
                    ? 'Start sharing your thoughts and ideas by creating your first blog post!'
                    : filter === 'published'
                    ? 'You have posts, but none are published yet. Publish a draft to see it here.'
                    : 'All your posts are published. Create a new draft to work on your next article.'
                  }
                </p>
                {filter === 'all' && (
                  <Button 
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    ✨ Create Your First Post
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid gap-6">
                {filteredPosts.map((post: BlogPost) => (
                  <BlogPostCard
                    key={post.id}
                    post={post}
                    onRead={setSelectedPost}
                    onEdit={openEditDialog}
                    onTogglePublish={handleTogglePublish}
                    onDelete={handleDeletePost}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="read">
            {selectedPost && (
              <BlogPostReader
                post={selectedPost}
                onBack={() => setSelectedPost(null)}
                onEdit={openEditDialog}
                onTogglePublish={handleTogglePublish}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <BlogPostForm
            formData={formData}
            onFormDataChange={setFormData}
            onSubmit={handleEditPost}
            onCancel={() => setIsEditDialogOpen(false)}
            isLoading={isLoading}
            isEditing={true}
          />
        </DialogContent>
      </Dialog>

      {/* Error Toast */}
      <ErrorToast error={error} onClose={() => setError(null)} />
    </div>
  );
}

export default App;