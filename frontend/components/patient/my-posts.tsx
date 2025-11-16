import { Card, CardContent } from "../ui/card"
import { Button } from "../ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { ThumbsUp, MessageSquare } from "lucide-react"
import { Badge } from "../ui/badge"

export default function MyPosts() {
  // Sample data for posts (missing in original)
  const myPosts = [
    {
      id: 1,
      title: "My First Post",
      forum: "General",
      author: "User123",
      time: "2 hours ago",
      likes: 5,
      comments: 3
    },
    {
      id: 2,
      title: "Question About Anxiety",
      forum: "Mental Health",
      author: "User123",
      time: "1 day ago",
      likes: 12,
      comments: 8
    }
  ]

  const savedPosts = [
    {
      id: 3,
      title: "Tips For Better Sleep",
      forum: "Wellness",
      author: "SleepExpert",
      time: "3 days ago",
      likes: 45,
      comments: 17
    },
    {
      id: 4,
      title: "Meditation Techniques",
      forum: "Mindfulness",
      author: "ZenMaster",
      time: "1 week ago",
      likes: 32,
      comments: 9
    }
  ]

  // For anonymous mode toggle (missing in original)
  const anonymousMode = false;

  return (
    <div>
      <Tabs defaultValue="all">
        <TabsList className="mb-4">
          <TabsTrigger value="all">My Posts</TabsTrigger>
          <TabsTrigger value="saved">Saved</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          {myPosts.map((post) => (
            <Card key={post.id}>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{post.title}</h3>
                    <Badge variant="outline">{post.forum}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    By {anonymousMode ? "Anonymous User" : post.author} • {post.time}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <ThumbsUp className="mr-1 h-3 w-3" />
                      {post.likes}
                    </div>
                    <div className="flex items-center">
                      <MessageSquare className="mr-1 h-3 w-3" />
                      {post.comments}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm">
                      View Thread
                    </Button>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        
        <TabsContent value="saved" className="space-y-4">
          {savedPosts.map((post) => (
            <Card key={post.id}>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{post.title}</h3>
                    <Badge variant="outline">{post.forum}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    By {anonymousMode ? "Anonymous User" : post.author} • {post.time}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <ThumbsUp className="mr-1 h-3 w-3" />
                      {post.likes}
                    </div>
                    <div className="flex items-center">
                      <MessageSquare className="mr-1 h-3 w-3" />
                      {post.comments}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm">
                      View Post
                    </Button>
                    <Button variant="outline" size="sm">
                      Unsave
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}