
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Info } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-[#F0F9FF] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-[#1E293B] mb-4">MedTrack</h1>
          <p className="text-lg text-[#64748B] max-w-3xl mx-auto">
            Medication adherence tracking platform with Supabase backend
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Card className="bg-white shadow-md border-[#E2E8F0] hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl text-[#3B82F6]">Authentication</CardTitle>
              <CardDescription>Email/password signup and login</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 list-disc pl-5 text-[#1E293B]">
                <li>Secure authentication with Supabase Auth</li>
                <li>User profile management</li>
                <li>Protected routes and data access</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-md border-[#E2E8F0] hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl text-[#3B82F6]">Database Schema</CardTitle>
              <CardDescription>Properly structured tables with relations</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 list-disc pl-5 text-[#1E293B]">
                <li>Profiles: Extended user information</li>
                <li>Categories: Medication grouping</li>
                <li>Medications: Detailed medication info</li>
                <li>Dose logs: Track medication consumption</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <Card className="bg-white shadow-md border-[#E2E8F0] hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl text-[#3B82F6]">Business Logic</CardTitle>
              <CardDescription>Smart medication tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 list-disc pl-5 text-[#1E293B]">
                <li>Accepts logs up to 4 hours after scheduled time</li>
                <li>Flags late doses automatically</li>
                <li>Reward points for consistent logging</li>
                <li>Adherence tracking and statistics</li>
              </ul>
            </CardContent>
          </Card>
          
          <Card className="bg-white shadow-md border-[#E2E8F0] hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl text-[#3B82F6]">Security</CardTitle>
              <CardDescription>Advanced row-level security</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 list-disc pl-5 text-[#1E293B]">
                <li>Row-level security policies for all tables</li>
                <li>Users can only access their own data</li>
                <li>Secure database functions</li>
                <li>Protected API endpoints</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="text-center p-6 bg-white rounded-lg shadow-md border border-[#E2E8F0] max-w-3xl mx-auto">
          <div className="flex items-center justify-center mb-4 text-[#0EA5E9]">
            <Info className="w-6 h-6 mr-2" />
            <h2 className="text-xl font-semibold">Next Steps</h2>
          </div>
          <p className="mb-6 text-[#64748B]">
            This backend is ready to be connected to Supabase. Click below to set up your Supabase project.
          </p>
          <Button className="bg-[#3B82F6] hover:bg-[#2563EB] text-white">
            Connect to Supabase
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
