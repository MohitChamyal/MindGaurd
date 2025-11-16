"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, ExternalLink, Phone, MessageSquare } from "lucide-react";

export function CrisisResources() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-destructive/10 p-4">
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-destructive/20 p-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div className="space-y-1">
            <p className="font-medium">If you're experiencing a mental health emergency</p>
            <p className="text-sm">
              If you're in immediate danger or having thoughts of harming yourself or others, please call emergency services or a crisis hotline immediately.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="destructive" className="gap-2">
                <Phone className="h-4 w-4" />
                Call Emergency Services (911)
              </Button>
              <Button variant="outline" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Text Crisis Line
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="hotlines">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="hotlines">Crisis Hotlines</TabsTrigger>
          <TabsTrigger value="resources">Support Resources</TabsTrigger>
          <TabsTrigger value="safety">Safety Planning</TabsTrigger>
        </TabsList>
        <TabsContent value="hotlines" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">National Suicide Prevention Lifeline</h3>
                    <Badge variant="outline">24/7</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Free and confidential support for people in distress
                  </p>
                  <p className="text-lg font-bold mt-1">1-800-273-8255</p>
                </div>
                <Button variant="outline" size="sm" className="gap-1">
                  <Phone className="h-3 w-3" />
                  Call Now
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">Crisis Text Line</h3>
                    <Badge variant="outline">24/7</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Text-based crisis intervention service
                  </p>
                  <p className="text-lg font-bold mt-1">Text HOME to 741741</p>
                </div>
                <Button variant="outline" size="sm" className="gap-1">
                  <MessageSquare className="h-3 w-3" />
                  Text Now
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">Veterans Crisis Line</h3>
                    <Badge variant="outline">24/7</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Support for veterans and their loved ones
                  </p>
                  <p className="text-lg font-bold mt-1">1-800-273-8255 (Press 1)</p>
                </div>
                <Button variant="outline" size="sm" className="gap-1">
                  <Phone className="h-3 w-3" />
                  Call Now
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">SAMHSA's National Helpline</h3>
                    <Badge variant="outline">24/7</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Treatment referral and information service
                  </p>
                  <p className="text-lg font-bold mt-1">1-800-662-4357</p>
                </div>
                <Button variant="outline" size="sm" className="gap-1">
                  <Phone className="h-3 w-3" />
                  Call Now
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="resources" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">National Alliance on Mental Illness (NAMI)</h3>
                  <p className="text-sm text-muted-foreground">
                    Information, support groups, and education for individuals and families
                  </p>
                  <p className="text-sm mt-1">Helpline: 1-800-950-6264</p>
                </div>
                <Button variant="outline" size="sm" className="gap-1">
                  <ExternalLink className="h-3 w-3" />
                  Visit Website
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">Mental Health America</h3>
                  <p className="text-sm text-muted-foreground">
                    Resources, tools, and support for a variety of mental health concerns
                  </p>
                </div>
                <Button variant="outline" size="sm" className="gap-1">
                  <ExternalLink className="h-3 w-3" />
                  Visit Website
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">Psychology Today Therapist Finder</h3>
                  <p className="text-sm text-muted-foreground">
                    Search for therapists, psychiatrists, and treatment centers in your area
                  </p>
                </div>
                <Button variant="outline" size="sm" className="gap-1">
                  <ExternalLink className="h-3 w-3" />
                  Visit Website
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">7 Cups</h3>
                  <p className="text-sm text-muted-foreground">
                    Free emotional support from trained listeners and online therapy
                  </p>
                </div>
                <Button variant="outline" size="sm" className="gap-1">
                  <ExternalLink className="h-3 w-3" />
                  Visit Website
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="safety" className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium">Create a Safety Plan</h3>
              <p className="text-sm text-muted-foreground mt-1">
                A safety plan is a personalized, practical plan that can help you avoid dangerous situations and know the best way to react when you're in danger.
              </p>
              <div className="mt-4 space-y-3">
                <div className="rounded-md border p-3">
                  <p className="text-sm font-medium">1. Recognize warning signs</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Identify thoughts, images, moods, situations, and behaviors that may indicate a crisis is developing
                  </p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-sm font-medium">2. Use internal coping strategies</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    List activities you can do on your own to help distract from difficult thoughts or feelings
                  </p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-sm font-medium">3. Identify people who can provide support</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    List names, contact information, and locations of people you can contact during a crisis
                  </p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-sm font-medium">4. Contact professionals and agencies</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    List names, numbers, and locations of clinicians, local emergency rooms, and crisis hotlines
                  </p>
                </div>
                <div className="rounded-md border p-3">
                  <p className="text-sm font-medium">5. Make your environment safe</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Identify ways to make your environment safer by removing or securing items that could be used to harm yourself
                  </p>
                </div>
              </div>
              <Button className="w-full mt-4">Create Your Safety Plan</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}