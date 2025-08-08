import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { CreateBlogPostInput } from '../../../server/src/schema';

interface BlogPostFormProps {
  formData: CreateBlogPostInput & { id?: number };
  onFormDataChange: (data: CreateBlogPostInput & { id?: number }) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isLoading: boolean;
  isEditing?: boolean;
}

export function BlogPostForm({ 
  formData, 
  onFormDataChange, 
  onSubmit, 
  onCancel, 
  isLoading, 
  isEditing = false 
}: BlogPostFormProps) {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isEditing ? '✏️ Edit Blog Post' : '✨ Create New Blog Post'}
        </CardTitle>
        <CardDescription>
          {isEditing ? 'Update your blog post details' : 'Fill in the details to create a new blog post'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium flex items-center gap-1">
              📝 Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onFormDataChange({ ...formData, title: e.target.value })
              }
              placeholder="Enter an engaging blog post title..."
              required
              className="focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="author" className="text-sm font-medium flex items-center gap-1">
              👤 Author <span className="text-red-500">*</span>
            </Label>
            <Input
              id="author"
              value={formData.author}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                onFormDataChange({ ...formData, author: e.target.value })
              }
              placeholder="Author name..."
              required
              className="focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content" className="text-sm font-medium flex items-center gap-1">
              📄 Content <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                onFormDataChange({ ...formData, content: e.target.value })
              }
              placeholder="Write your blog post content here... You can include multiple paragraphs, and format your text as needed."
              rows={12}
              required
              className="focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="text-right text-xs text-slate-500">
              {formData.content.length} characters
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-lg">
            <Switch
              id="published"
              checked={formData.published}
              onCheckedChange={(checked: boolean) =>
                onFormDataChange({ ...formData, published: checked })
              }
            />
            <div>
              <Label htmlFor="published" className="text-sm font-medium cursor-pointer">
                {formData.published ? '🚀 Publish immediately' : '💾 Save as draft'}
              </Label>
              <p className="text-xs text-slate-600 mt-1">
                {formData.published 
                  ? 'This post will be visible to readers' 
                  : 'This post will be saved as a draft and not visible to readers'
                }
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="hover:bg-slate-100"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !formData.title.trim() || !formData.content.trim() || !formData.author.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {isEditing ? 'Saving...' : 'Creating...'}
                </div>
              ) : (
                <>
                  {isEditing ? '💾 Save Changes' : '✨ Create Post'}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}